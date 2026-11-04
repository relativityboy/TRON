import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-optional-wasm-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const mode of ['missing','denied','compile-blocked','init-failed']){
  const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1280,height:900}}),errors=[],backendRequests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/rapier3d/.test(r.url()))backendRequests.push(r.url());});
  await page.addInitScript(mode=>{
   const original=globalThis.WebAssembly;
   if(mode==='missing')Object.defineProperty(globalThis,'WebAssembly',{configurable:true,value:undefined});
   if(mode==='denied')Object.defineProperty(globalThis,'WebAssembly',{configurable:true,get(){throw Error('WebAssembly denied');}});
   if(mode==='compile-blocked')Object.defineProperty(globalThis,'WebAssembly',{configurable:true,value:{Module:class{constructor(){throw Error('Compilation blocked');}}}});
   if(mode==='init-failed'){
    const blocked=Object.create(original);blocked.instantiate=async()=>{throw Error('Instantiation blocked');};blocked.instantiateStreaming=blocked.instantiate;
    Object.defineProperty(globalThis,'WebAssembly',{configurable:true,value:blocked});
   }
   for(const key of ['indexedDB','caches'])Object.defineProperty(globalThis,key,{configurable:true,get(){throw new DOMException('Storage unavailable','SecurityError');}});
  },mode);
  await page.route('**/api/jev/**',route=>route.fulfill({status:503,body:'{}'}));
  await page.goto(base);await page.waitForFunction(()=>window.tronLoadingReport?.().includes('Opening terminal ready'),{},{timeout:120000});assert(await page.locator('#loading').isHidden());
  const probe=await page.evaluate(async()=>{
   const {DebrisPhysics,debrisPhysicsReady}=await import('/src/simulation/debris-physics.js');await debrisPhysicsReady;
   const physics=new DebrisPhysics(),result={backend:physics.backend};physics.dispose();return result;
  });assert.equal(probe.backend,'javascript');
  if(mode!=='init-failed')assert.equal(backendRequests.length,0,'unsupported WebAssembly must not import Rapier');
  await page.locator('#start').click();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>window.__tron?.state.mode==='running',{},{timeout:60000});
  const start=await page.evaluate(()=>__tron.state.time);await page.waitForTimeout(250);assert((await page.evaluate(()=>__tron.state.time))>start,'simulation keeps running');
  const effects=await page.evaluate(async()=>{
   const {Breakups}=await import('/src/rendering/breakup.js'),T=await import('/node_modules/three/build/three.module.js');
   const root=new T.Group();root.add(new T.Mesh(new T.BoxGeometry(2,2,2),new T.MeshStandardMaterial()));
   const scene=new T.Scene(),fx=new Breakups(scene,{nearbyWalls:()=>[]});fx.spawn({root},{subject:'tank',x:0,y:10,s:0,yaw:0});
   const count=fx.physics.pieces.size;for(let i=0;i<120;i++)fx.update(1/120);
   const observations=fx.physics.observations(),valid=observations.every(o=>[o.x,o.y,o.s,o.vx,o.vy,o.vs].every(Number.isFinite)&&o.y>=0);
   fx.clear();const remaining=fx.physics.pieces.size;fx.dispose();root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});return {count,valid,remaining};
  });assert(effects.count>0);assert(effects.valid);assert.equal(effects.remaining,0);assert.deepEqual(errors,[]);
  console.log(`${mode}: opening menu and CLU simulation run with JavaScript debris, storage denied, no page errors.`);await page.close();
 }
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
