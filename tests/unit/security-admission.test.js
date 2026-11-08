import test from 'node:test';
import assert from 'node:assert/strict';
import {MultiplayerAdmission} from '../../shared/multiplayer/admission.js';
import {MP} from '../../shared/multiplayer/config.js';
import {MultiplayerArena} from '../../workers/jev/multiplayer.js';

test('three concurrent connections per IP, independent IPs and idempotent release',()=>{
 const admission=new MultiplayerAdmission();
 const permits=Array.from({length:3},()=>admission.reserve('192.0.2.1'));
 assert(permits.every(p=>p.ok));assert.equal(admission.reserve('::ffff:192.0.2.1').status,429);
 assert(admission.reserve('192.0.2.2').ok);
 permits[0].release();permits[0].release();assert(admission.reserve('192.0.2.1').ok);
 assert.equal(admission.reserve('192.0.2.1').status,429);
 assert.equal(admission.reserve(null).status,403);
});

test('rapid reconnects stay capped after disconnect, recover after a rolling minute and prune idle IPs',()=>{
 let now=0;const admission=new MultiplayerAdmission({clock:()=>now});
 for(let i=0;i<MP.maxConnectionsPerIpPerWindow;i++){const p=admission.reserve('192.0.2.1');assert(p.ok);p.release();}
 assert.equal(admission.reserve('192.0.2.1').status,429);
 now=MP.connectionWindowMs-1;assert.equal(admission.reserve('192.0.2.1').status,429);
 now++;assert(admission.reserve('192.0.2.1').ok);
 admission.reserve('192.0.2.2').release();now+=MP.connectionWindowMs;
 admission.reserve('192.0.2.3');assert(!admission.clients.has('192.0.2.2'));
 assert.equal(admission.reserve('192.0.2.1').ok,true,'an active IP survives cleanup');
});

test('only server-selected development mode bypasses connection and reconnect caps',()=>{
 const admission=new MultiplayerAdmission({development:true});
 for(let i=0;i<100;i++)assert(admission.reserve('127.0.0.1').ok);
 assert.equal(admission.clients.size,0);
 const production=new MultiplayerAdmission();
 for(let i=0;i<3;i++)assert(production.reserve('127.0.0.1').ok);
 assert.equal(production.reserve('127.0.0.1').status,429);
});

test('Worker rejects missing trusted IPs and excess connections before accepting a WebSocket',async()=>{
 const arena=new MultiplayerArena();
 const request=headers=>new Request(`https://worker.test/api/multiplayer?v=${MP.protocol}&dev=1`,{headers:{Upgrade:'websocket',...headers}});
 assert.equal((await arena.fetch(request({'X-Forwarded-For':'192.0.2.1'}))).status,403);
 for(let i=0;i<3;i++)assert(arena.admission.reserve('192.0.2.1').ok);
 const blocked=await arena.fetch(request({'CF-Connecting-IP':'192.0.2.1','X-Forwarded-For':'192.0.2.2'}));
 assert.equal(blocked.status,429);assert.equal(blocked.headers.get('Retry-After'),'1');
});

test('Worker releases disconnected and errored WebSocket slots exactly once',async t=>{
 const ResponseClass=globalThis.Response,pairs=[];
 class Socket extends EventTarget{accept(){}send(){}close(){this.dispatchEvent(new Event('close'));}}
 t.mock.method(globalThis,'Response',function(body,init){
  if(init?.status!==101)return new ResponseClass(body,init);
  return {status:101,webSocket:init.webSocket};
 });
 // Only Workers support the native 101 Response constructor.
 globalThis.Response.json=ResponseClass.json.bind(ResponseClass);
 const originalPair=globalThis.WebSocketPair;
 globalThis.WebSocketPair=class{constructor(){this[0]=new Socket();this[1]=new Socket();pairs.push(this);}};
 t.after(()=>{if(originalPair===undefined)delete globalThis.WebSocketPair;else globalThis.WebSocketPair=originalPair;});
 const arena=new MultiplayerArena();t.after(()=>arena.hub.dispose());
 const request=()=>new Request(`https://worker.test/api/multiplayer?v=${MP.protocol}`,{headers:{Upgrade:'websocket','CF-Connecting-IP':'192.0.2.1'}});
 for(let i=0;i<3;i++)assert.equal((await arena.fetch(request())).status,101);
 assert.equal((await arena.fetch(request())).status,429);
 pairs[0][1].dispatchEvent(new Event('error'));pairs[0][1].close();
 assert.equal((await arena.fetch(request())).status,101);
 assert.equal((await arena.fetch(request())).status,429,'duplicate close/error cannot free a second slot');
});
