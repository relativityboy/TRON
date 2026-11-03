import {optionalIndexedDB} from '../storage/optional-indexeddb.js';
// Remove only retired MCP model data, preserving game assets and other models.
export async function clearLegacyMcpCache(){
 const tasks=[];
 const database=optionalIndexedDB();
 if(database)tasks.push(new Promise((resolve,reject)=>{
  const request=database.deleteDatabase('tron-mcp-voice-models');
  request.onsuccess=()=>resolve();
  request.onerror=()=>reject(request.error);
  request.onblocked=()=>{console.info('Old MCP voice cache will be removed when older tabs close.');resolve();};
 }));
 tasks.push((async()=>{
  const cacheStorage=globalThis.caches;if(!cacheStorage)return;
  for(const name of await cacheStorage.keys()){
   const cache=await cacheStorage.open(name);
   for(const request of await cache.keys()){
    if(/chatterbox-ONNX|ort-wasm-simd-threaded\.asyncify|voice\.worker-/i.test(request.url))await cache.delete(request);
   }
  }
 })());
 const results=await Promise.allSettled(tasks);
 for(const result of results)if(result.status==='rejected')console.warn('Old MCP cache cleanup will retry on next visit.');
}
