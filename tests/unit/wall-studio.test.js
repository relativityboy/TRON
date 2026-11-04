import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {createWallStudioMiddleware} from '../../server/wall-studio.js';
import {validateModel} from '../../studies/maze-wall/design-schema.js';
import {buildModel,disposeModel} from '../../studies/maze-wall/build-model.js';
const initial=JSON.parse(await readFile(new URL('../../studies/maze-wall/design.json',import.meta.url),'utf8'));
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=';
const changed=()=>{const model=structuredClone(initial);model.parts[0].position[0]=3;return {summary:'Moved the main slab three metres to the right.',model};};
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function fixture(t,runner,options={}){
 const storeDir=await mkdtemp(join(tmpdir(),'tron-wall-studio-'));
 let middleware=createWallStudioMiddleware({storeDir,runner,...options});
 t.after(async()=>{await middleware.close();await rm(storeDir,{recursive:true,force:true});});
 async function request(path,body,{token,origin='http://localhost:5190',host='localhost:5190',method=body===undefined?'GET':'POST'}={}){
  const req=Readable.from(body===undefined?[]:[Buffer.from(JSON.stringify(body))]);req.method=method;req.url='/api/wall-studio/'+path;req.headers={host,origin,'content-type':'application/json',...(token?{'x-wall-studio-token':token}:{})};
  let status,data,headers;const res={writableEnded:false,writeHead(code,h){status=code;headers=h;},end(bytes){this.writableEnded=true;data=bytes;}};
  await middleware(req,res,()=>{throw Error('Unexpected fallthrough');});
  return {status,headers,data:typeof data==='string'?JSON.parse(data):data};
 }
 const get=async()=>(await request('state')).data;
 const state=await get();
 const reviseBody={text:'Move the main slab three metres right.',baseRevision:0,referenceIds:[state.references[0].id],view:{camera:[10,30,100],target:[0,20,0],mode:'whole',selectedPartId:'slab'},screenshot:image};
 const post=(path,body,options={})=>request(path,body,{token:state.token,...options});
 async function waitForJob(){for(let i=0;i<100;i++){const s=await get();if(s.job?.status!=='working')return s;await new Promise(resolve=>setTimeout(resolve,5));}throw Error('Job did not settle');}
 return {get,post,request,state,reviseBody,waitForJob,async reopen(){await middleware.close();middleware=createWallStudioMiddleware({storeDir,runner,...options});return get();}};
}
test('wall revisions include selected references and view, persist, and restore without losing later history',async t=>{
 let input;const f=await fixture(t,async context=>{input=context;return changed();});
 assert.equal((await f.post('revise',f.reviseBody)).status,202);
 const result=await f.waitForJob();assert.equal(result.job.status,'ready');assert.equal(result.current.id,1);assert.equal(result.current.model.parts[0].position[0],3);
 assert.equal(input.imagePaths.length,2);assert.match(input.prompt,/selectedPartId/);assert.match(input.prompt,/USER REQUEST: Move/);
 assert.equal((await f.post('revise',f.reviseBody)).status,409,'stale edit cannot overwrite a newer model');
 const restored=await f.post('restore',{baseRevision:1,revisionId:0});assert.equal(restored.data.current.id,2);assert.deepEqual(restored.data.current.model,initial);assert.equal(restored.data.revisions.length,3);
 const reopened=await f.reopen();assert.equal(reopened.current.id,2);assert.equal(reopened.revisions.length,3);
});
test('invalid agent geometry and service failure leave the previous model unchanged',async t=>{
 for(const response of [{summary:'Invalid',model:{name:'bad'}},null]){
  const f=await fixture(t,async()=>{if(response===null)throw Error('Usage limit reached');return response;});
  await f.post('revise',f.reviseBody);const result=await f.waitForJob();assert.equal(result.job.status,'failed');assert.equal(result.current.id,0);assert.deepEqual(result.current.model,initial);
 }
});
test('duplicate submits and restores are blocked during revision, cancellation preserves the model',async t=>{
 const started=deferred();
 const f=await fixture(t,({signal})=>{started.resolve();return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('Cancelled')),{once:true}));});
 await f.post('revise',f.reviseBody);await started.promise;
 assert.equal((await f.post('revise',f.reviseBody)).status,409);
 assert.equal((await f.post('restore',{baseRevision:0,revisionId:0})).status,409);
 await f.post('cancel',{});const result=await f.waitForJob();assert.equal(result.job.status,'cancelled');assert.equal(result.current.id,0);
});
test('timed-out requests are stopped and preserve the last good model',async t=>{
 const f=await fixture(t,({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')))),{timeoutMs:15});
 await f.post('revise',f.reviseBody);const result=await f.waitForJob();assert.equal(result.job.status,'cancelled');assert.match(result.job.message,/timed out/);assert.equal(result.current.id,0);
});
test('local mutation routes require same origin and an unguessable token',async t=>{
 let runs=0;const f=await fixture(t,async()=>{runs++;return changed();});
 assert.equal((await f.request('revise',f.reviseBody)).status,403);
 assert.equal((await f.post('revise',f.reviseBody,{origin:'https://attacker.example'})).status,403);
 assert.equal((await f.post('revise',f.reviseBody,{host:'attacker.example',origin:'http://attacker.example'})).status,403);
 assert.equal(runs,0);
});
test('reference uploads are bounded images, persist, and cannot select arbitrary filesystem paths',async t=>{
 const f=await fixture(t,async()=>changed());
 assert.equal((await f.post('references',{name:'bad.svg',dataUrl:'data:image/svg+xml;base64,PHN2Zz4='})).status,400);
 assert.equal((await f.post('references',{name:'wrong.png',dataUrl:'data:image/png;base64,SGVsbG8='})).status,400);
 const uploaded=await f.post('references',{name:'My reference.png',dataUrl:image});assert.equal(uploaded.status,201);assert.equal(uploaded.data.references.length,3);
 const ref=uploaded.data.references.at(-1),read=await f.request('references/'+ref.id);assert.equal(read.status,200);assert.equal(read.headers['Content-Type'],'image/png');
 assert.equal((await f.post('revise',{...f.reviseBody,referenceIds:['../../credentials/Gemini.txt']})).status,400);
 assert.equal((await f.request('references/../../credentials/Gemini.txt')).status,404);
});
test('model validation rejects complex or crossing profiles; all accepted triangles remain finite',()=>{
 const invalid=structuredClone(initial);invalid.parts[0].points=[[0,0],[4,0],[0,3],[4,3],[2,-1]];assert.throws(()=>validateModel(invalid),/crosses/);
 const huge=structuredClone(initial);huge.parts=Array.from({length:49},(_,i)=>({...huge.parts[0],id:String(i)}));assert.throws(()=>validateModel(huge),/1–48/);
 const model=buildModel(initial);let triangles=0;model.traverse(o=>{if(o.isMesh){for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n));triangles+=o.geometry.attributes.position.count/3;}});assert(triangles<1500);disposeModel(model);
});
