import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {JevBudget,PUBLIC_LIMITS} from '../../workers/jev/budget.js';
import {withBudgetLease} from '../../workers/jev/lease.js';
import {createWorker} from '../../workers/jev/index.js';
import {readFile} from 'node:fs/promises';
const flush=()=>new Promise(setImmediate);
function fixture(t){
 const db=new DatabaseSync(':memory:');t.after(()=>db.close());
 const storage={sql:{exec(q,...args){if(q.includes('CREATE TABLE')){db.exec(q);return [];}return db.prepare(q).all(...args);}},transactionSync(fn){db.exec('BEGIN');try{const r=fn();db.exec('COMMIT');return r;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const budget=new JevBudget({storage},{}),paths=[];
 const stub={fetch(url,init){paths.push(new URL(url).pathname);return budget.fetch(new Request(url,init));}};
 return {budget,stub,paths,db};
}
test('production configuration restores finite global and IP request quotas',async()=>{
 const {vars}=JSON.parse(await readFile(new URL('../../wrangler.jsonc',import.meta.url),'utf8'));
 for(const key of ['DAILY_REQUESTS','DAILY_INPUT_BYTES','IP_DAILY_REQUESTS','IP_MINUTE_REQUESTS'])assert(Number.isSafeInteger(Number(vars[key]))&&Number(vars[key])>0,key);
 assert.equal(Number(vars.DAILY_REQUESTS),PUBLIC_LIMITS.dailyRequests);
 assert.equal(Number(vars.DAILY_INPUT_BYTES),PUBLIC_LIMITS.dailyInputBytes);
});
test('renewed leases keep four slots occupied without consuming more quota and cannot be resurrected',async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:100000});
 const {budget,stub,db}=fixture(t),leases=[];
 for(let i=0;i<4;i++)leases.push(budget.reserve(String(i),1).lease);
 let complete;const work=new Promise(resolve=>{complete=resolve;});
 const calls=leases.map(lease=>withBudgetLease(stub,lease,()=>work));
 for(let i=0;i<12;i++){t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs);await flush();assert.equal(budget.reserve('fifth',1).ok,false);}
 assert.equal([...db.prepare('SELECT requests FROM days').all()][0].requests,4);
 complete('done');assert.deepEqual(await Promise.all(calls),['done','done','done','done']);
 for(const lease of leases)await stub.fetch('https://budget/release',{method:'POST',body:JSON.stringify({lease})});
 assert.equal(budget.renew(leases[0]).ok,false);
 const extra=budget.reserve('fifth',1);assert(extra.ok);
 t.mock.timers.tick(PUBLIC_LIMITS.leaseMs);assert.equal(budget.renew(extra.lease).ok,false);
});
test('a failed heartbeat aborts pending work and completion/failure stop renewal timers',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let calls=0,signal;
 const stub={fetch:async()=>{calls++;throw Error('Budget unavailable');}};
 const work=withBudgetLease(stub,'lease',s=>{signal=s;return new Promise((_,reject)=>s.addEventListener('abort',()=>reject(s.reason),{once:true}));});
 const rejected=assert.rejects(work,{name:'AbortError'});
 t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs);await rejected;assert(signal.aborted);
 t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs*5);assert.equal(calls,1);
 assert.equal(await withBudgetLease(stub,'lease',async()=>42),42);
 await assert.rejects(withBudgetLease(stub,'lease',async()=>{throw Error('Provider failure');}),/Provider failure/);
 t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs*5);assert.equal(calls,1);
});
for(const speech of [false,true])test(`Worker renews slow ${speech?'speech':'chat'} calls and releases the lease after the response body`,async t=>{
 t.mock.timers.enable({apis:['Date','setTimeout'],now:100000});
 const {budget,stub,paths,db}=fixture(t),pending=[];let started,finishBody;
 const began=new Promise(resolve=>{started=resolve;});
 const worker=createWorker(async()=>{started();return {ok:true,json:()=>new Promise(resolve=>{finishBody=resolve;})};});
 const env={ALLOWED_ORIGINS:'https://game.test',MCP_ENABLED:'true',MCP_API_KEY:'test',FAL_KEY:'test',JEV_BUDGET:{idFromName:()=>0,get:()=>stub}};
 const response=worker.fetch(new Request(`https://worker.test/api/mcp/${speech?'speech':'chat'}`,{method:'POST',headers:{Origin:'https://game.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(speech?{text:'Hello.'}:{messages:[{role:'user',content:'Hello.'}]})}),env,{waitUntil:p=>pending.push(p)});
 await began;await flush();
 for(let i=0;i<5;i++){t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs);await flush();}
 assert(paths.includes('/renew'));assert.equal([...db.prepare('SELECT count(*) AS n FROM leases WHERE expires > ?').all(Date.now())][0].n,1);
 finishBody(speech?{audio:{url:'https://v3.fal.media/test.wav'}}:{candidates:[{content:{parts:[{text:'Hello, program.'}]}}]});
 assert.equal((await response).status,200);await Promise.all(pending);
 assert.equal([...db.prepare('SELECT count(*) AS n FROM leases').all()][0].n,0);
 const count=paths.length;t.mock.timers.tick(PUBLIC_LIMITS.leaseRenewIntervalMs*3);await flush();assert.equal(paths.length,count);
});
