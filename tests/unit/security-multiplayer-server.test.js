import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {multiplayerPlugin} from '../../server/multiplayer.js';
import {MP} from '../../shared/multiplayer/config.js';

for(const development of [false,true])test(`real WebSockets enforce IP admission in ${development?'development (exempt)':'preview'}`,async t=>{
 const httpServer=createServer(),clients=[];
 const plugin=multiplayerPlugin();
 plugin[development?'configureServer':'configurePreviewServer']({httpServer});
 t.after(async()=>{for(const client of clients)client.terminate();await new Promise(resolve=>httpServer.close(resolve));});
 httpServer.listen(0,'127.0.0.1');await once(httpServer,'listening');
 const origin=`http://127.0.0.1:${httpServer.address().port}`,url=origin.replace('http:','ws:')+`/api/multiplayer?v=${MP.protocol}`;
 function connect(){return new Promise((resolve,reject)=>{
  const client=new WebSocket(url,{origin,headers:{'X-Forwarded-For':`192.0.2.${clients.length+1}`}});clients.push(client);
  client.once('open',()=>resolve({client,status:101}));client.once('error',reject);
  client.once('unexpected-response',(_req,res)=>{res.resume();client.terminate();resolve({status:res.statusCode});});
 });}
 const peers=[];
 for(let i=0;i<3;i++){const result=await connect();assert.equal(result.status,101);peers.push(result.client);}
 const fourth=await connect();assert.equal(fourth.status,development?101:429);
 const closed=once(peers[0],'close');peers[0].close();await closed;
 assert.equal((await connect()).status,101,'disconnect frees exactly one active slot');
 for(const client of clients){if(client.readyState===WebSocket.OPEN){const done=once(client,'close');client.close();await done;}}
 let successes=development?5:4;
 while(successes<MP.maxConnectionsPerIpPerWindow){const {client,status}=await connect();assert.equal(status,101);const done=once(client,'close');client.close();await done;successes++;}
 const reconnect=await connect();assert.equal(reconnect.status,development?101:429);
});
