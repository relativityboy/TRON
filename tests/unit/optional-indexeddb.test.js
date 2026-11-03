import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openCacheDatabase} from '../../src/storage/optional-indexeddb.js';
import {McpSpeechCache} from '../../src/mcp/speech-cache.js';
import {cachedMusicUrl} from '../../src/mcp/music-cache.js';
import {clearLegacyMcpCache} from '../../src/mcp/clear-legacy-cache.js';

test('optional caches tolerate missing, denied and rejected storage',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
 const caches=Object.getOwnPropertyDescriptor(globalThis,'caches');
 try{
  for(const descriptor of [
   {value:undefined},
   {get(){throw new DOMException('Denied','SecurityError');}},
   {value:{open(){throw new DOMException('Denied','SecurityError');},deleteDatabase(){throw Error('Denied');}}},
   {value:{open(){const r={};queueMicrotask(()=>r.onerror());return r;},deleteDatabase(){throw Error('Denied');}}},
  ]){
   Object.defineProperty(globalThis,'indexedDB',{...descriptor,configurable:true});
   Object.defineProperty(globalThis,'caches',{configurable:true,get(){throw Error('Denied');}});
   const speech=new McpSpeechCache();
   assert.equal(await speech.get('hello'),null);
   await speech.put('hello',{samples:new Float32Array([1]),sampleRate:24000});
   await speech.close();
   assert.equal(await cachedMusicUrl('/music.mp3'),'/music.mp3');
   await clearLegacyMcpCache();
  }
 }finally{
  if(original)Object.defineProperty(globalThis,'indexedDB',original);else delete globalThis.indexedDB;
  if(caches)Object.defineProperty(globalThis,'caches',caches);else delete globalThis.caches;
 }
});

test('blocked and stalled cache opens fall back and close late connections',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
 try{
  for(const blocked of [false,true]){
   const request={};let closed=0;
   Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{open:()=>request}});
   const opening=openCacheDatabase('test',1,()=>{},{timeoutMs:10});
   if(blocked)request.onblocked();
   assert.equal(await opening,null);
   request.result={close(){closed++;}};request.onsuccess();
   assert.equal(closed,1);
  }
  const request={},db={close(){}};let upgraded=false;
  Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{open:()=>request}});
  const opening=openCacheDatabase('test',1,()=>{upgraded=true;});
  request.result=db;request.onupgradeneeded();request.onsuccess();
  assert.equal(await opening,db);assert.equal(upgraded,true);
 }finally{if(original)Object.defineProperty(globalThis,'indexedDB',original);else delete globalThis.indexedDB;}
});
