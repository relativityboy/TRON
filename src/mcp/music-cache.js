import {openCacheDatabase} from '../storage/optional-indexeddb.js';
// Music is kept separately from generated speech and legacy model caches.
// Vite's content-hashed URL is the version key for production assets.
export async function cachedMusicUrl(url){
 let db;
 try{
  db=await openCacheDatabase('tron-mcp-music',1,db=>db.createObjectStore('tracks'));
  if(!db)return url;
  const cached=await new Promise((resolve,reject)=>{const r=db.transaction('tracks').objectStore('tracks').get(url);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  if(cached instanceof Blob&&cached.size)return URL.createObjectURL(cached);
  const response=await fetch(url);if(!response.ok)throw Error('Music unavailable');
  const blob=await response.blob();
  try{await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite');tx.objectStore('tracks').clear();tx.objectStore('tracks').put(blob,url);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}catch{/* Playback still works when storage is full. */}
  return URL.createObjectURL(blob);
 }catch{return url;}finally{db?.close();}
}
