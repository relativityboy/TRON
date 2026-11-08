export const PUBLIC_LIMITS=Object.freeze({bodyBytes:32768,upstreamBytes:65536,timeoutMs:2200,
 dailyRequests:1000,dailyInputBytes:16000000,ipDailyRequests:300,ipMinuteRequests:60,ipIntervalMs:750,concurrentRequests:4,leaseMs:10000,leaseRenewIntervalMs:3000,leaseRenewTimeoutMs:2000});
export function limitsFor(env){
 const limits={...PUBLIC_LIMITS};
 for(const [name,key] of [['DAILY_REQUESTS','dailyRequests'],['DAILY_INPUT_BYTES','dailyInputBytes'],['IP_DAILY_REQUESTS','ipDailyRequests'],['IP_MINUTE_REQUESTS','ipMinuteRequests']]){
  if(env[name]==='unlimited'){limits[key]=Infinity;continue;}
  if(env[name]!==undefined){const value=Number(env[name]);if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid quota configuration');limits[key]=value;}
 }
 return limits;
}
// One globally named SQLite Durable Object serializes every reservation.
// A reservation is charged before contacting Jev, including failed calls.
export class JevBudget{
 constructor(ctx,env){this.ctx=ctx;this.limits=limitsFor(env);ctx.storage.sql.exec(`
 CREATE TABLE IF NOT EXISTS days(day INTEGER PRIMARY KEY,requests INTEGER NOT NULL,bytes INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS clients(day INTEGER NOT NULL,client TEXT NOT NULL,requests INTEGER NOT NULL,minute INTEGER NOT NULL,minute_requests INTEGER NOT NULL,last_ms INTEGER NOT NULL,PRIMARY KEY(day,client));
 CREATE TABLE IF NOT EXISTS leases(id TEXT PRIMARY KEY,client TEXT NOT NULL,expires INTEGER NOT NULL);`);}
 reserve(client,bytes,now=Date.now()){
  const sql=this.ctx.storage.sql,L=this.limits,day=Math.floor(now/86400000),minute=Math.floor(now/60000);
  return this.ctx.storage.transactionSync(()=>{
   sql.exec('DELETE FROM days WHERE day < ?',day);sql.exec('DELETE FROM clients WHERE day < ?',day);sql.exec('DELETE FROM leases WHERE expires <= ?',now);
   const global=[...sql.exec('SELECT requests,bytes FROM days WHERE day = ?',day)][0]||{requests:0,bytes:0};
   const ip=[...sql.exec('SELECT * FROM clients WHERE day = ? AND client = ?',day,client)][0]||{requests:0,minute,minute_requests:0,last_ms:-Infinity};
   const deny=(error,retryAfter)=>({ok:false,error,retryAfter:Math.max(1,Math.ceil(retryAfter))});
   const tomorrow=((day+1)*86400000-now)/1000;
   if(global.requests>=L.dailyRequests||global.bytes+bytes>L.dailyInputBytes)return deny('Daily AI budget reached; using local tactics',tomorrow);
   if(ip.requests>=L.ipDailyRequests)return deny('Daily player AI allowance reached; using local tactics',tomorrow);
   if(ip.minute===minute&&ip.minute_requests>=L.ipMinuteRequests)return deny('Player AI rate limit reached; using local tactics',((minute+1)*60000-now)/1000);
   if(now-ip.last_ms<L.ipIntervalMs)return deny('Please slow down; using local tactics',(L.ipIntervalMs-now+ip.last_ms)/1000);
   if([...sql.exec('SELECT id FROM leases WHERE client = ?',client)].length)return deny('Player AI request already running',2);
   if([...sql.exec('SELECT id FROM leases')].length>=L.concurrentRequests)return deny('AI service busy; using local tactics',2);
   const lease=crypto.randomUUID();
   sql.exec('INSERT INTO days VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET requests=excluded.requests,bytes=excluded.bytes',day,global.requests+1,global.bytes+bytes);
   sql.exec('INSERT INTO clients VALUES(?,?,?,?,?,?) ON CONFLICT(day,client) DO UPDATE SET requests=excluded.requests,minute=excluded.minute,minute_requests=excluded.minute_requests,last_ms=excluded.last_ms',day,client,ip.requests+1,minute,(ip.minute===minute?ip.minute_requests:0)+1,now);
   sql.exec('INSERT INTO leases VALUES(?,?,?)',lease,client,now+L.leaseMs);
   return {ok:true,lease};
  });
 }
 renew(lease,now=Date.now()){
  // Never recreate a released or expired lease, or charge quota for a heartbeat.
  return {ok:[...this.ctx.storage.sql.exec('UPDATE leases SET expires = ? WHERE id = ? AND expires > ? RETURNING id',now+this.limits.leaseMs,lease,now)].length===1};
 }
 async fetch(request){
  if(request.method!=='POST')return new Response(null,{status:405});
  const body=await request.json();
  if(new URL(request.url).pathname==='/renew'){
   if(typeof body.lease!=='string')return new Response(null,{status:400});
   return Response.json(this.renew(body.lease));
  }
  if(new URL(request.url).pathname==='/release'){
   if(typeof body.lease!=='string')return new Response(null,{status:400});
   this.ctx.storage.sql.exec('DELETE FROM leases WHERE id = ?',body.lease);return new Response(null,{status:204});
  }
  if(!/^[a-f0-9]{64}$/.test(body.client)||!Number.isSafeInteger(body.bytes)||body.bytes<1||body.bytes>PUBLIC_LIMITS.upstreamBytes)return new Response(null,{status:400});
  return Response.json(this.reserve(body.client,body.bytes));
 }
}
