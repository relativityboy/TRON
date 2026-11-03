// Storage is optional: even reading the API can throw in restricted browsers.
export function optionalIndexedDB(){
 try{return globalThis.indexedDB??null;}catch{return null;}
}

export const CACHE_OPEN_TIMEOUT_MS=1500;
export function openCacheDatabase(name,version,upgrade,{timeoutMs=CACHE_OPEN_TIMEOUT_MS}={}){
 return new Promise(resolve=>{
  let request,settled=false;
  const finish=db=>{
   if(settled){db?.close();return;}
   settled=true;clearTimeout(timer);resolve(db);
  };
  const timer=setTimeout(()=>finish(null),timeoutMs);
  try{
   const api=optionalIndexedDB();
   if(!api){finish(null);return;}
   request=api.open(name,version);
   request.onupgradeneeded=()=>{
    if(settled){request.transaction?.abort();return;}
    try{upgrade(request.result);}catch{request.transaction?.abort();finish(null);}
   };
   request.onsuccess=()=>finish(request.result);
   request.onerror=request.onblocked=()=>finish(null);
  }catch{finish(null);}
 });
}
