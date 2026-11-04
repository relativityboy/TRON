export const PHYSICS_INITIALIZATION_TIMEOUT_MS=3000;
// Restricted browsers may remove WebAssembly, throw on access, or expose it
// while refusing compilation. Test a minimal module before loading the backend.
export function canUseWebAssembly(getAPI=()=>globalThis.WebAssembly){
 try{const api=getAPI();if(typeof api?.Module!=='function')return false;new api.Module(new Uint8Array([0,97,115,109,1,0,0,0]));return true;}catch{return false;}
}
export async function optionalPhysicsBackend({getAPI=()=>globalThis.WebAssembly,load=()=>import('@dimforge/rapier3d-compat'),timeoutMs=PHYSICS_INITIALIZATION_TIMEOUT_MS}={}){
 if(!canUseWebAssembly(getAPI))return null;
 let timer;
 try{
  return await Promise.race([
   (async()=>{const module=await load(),backend=module.default;await backend.init();return backend;})(),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(null),timeoutMs);}),
  ]);
 }catch{return null;}finally{clearTimeout(timer);}
}
