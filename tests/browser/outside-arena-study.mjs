import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-outside-arena-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/outside-arena-study.html`);await page.waitForFunction(()=>window.__outsideArena);
 await mkdir('test-results/outside-arena',{recursive:true});
 for(const name of ['film','oblique','overview','detail']){await page.locator(`[data-view="${name}"]`).click();await page.waitForTimeout(200);await page.screenshot({path:`test-results/outside-arena/${name}.png`});}
 const report=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');const {model}=__outsideArena;model.updateMatrixWorld(true);
  const down=(x,z)=>new T.Raycaster(new T.Vector3(x,10,z),new T.Vector3(0,-1,0)).intersectObject(model)[0]?.point.y;
  const doorway=new T.Raycaster(new T.Vector3(0,5,-150),new T.Vector3(0,0,-1),0,70).intersectObject(model).length;
  for(const o of model.children)if(o.isMesh)for(const n of o.geometry.attributes.position.array)if(!Number.isFinite(n))throw Error('Invalid geometry');
  return {triangles:model.userData.triangles,well:down(60,-120),walkway:down(0,-120),doorway};
 });
 assert.equal(report.well,-2.5);assert(report.walkway>=0);assert.equal(report.doorway,0);assert(report.triangles<5000);
 await page.locator('#wire').check();await page.waitForTimeout(100);assert(await page.evaluate(()=>__outsideArena.model.children.every(o=>!o.material||o.material.wireframe)));
 const download=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await download).suggestedFilename(),'outside-arena-floor.glb');
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/outside-arena-scene.html`);await page.waitForFunction(()=>window.__outsideArena);
 await page.waitForTimeout(200);await page.screenshot({path:'test-results/outside-arena/scene.png'});
 const sceneReport=await page.evaluate(async()=>{
  const {createOutsideArenaFloor,disposeOutsideArenaFloor}=await import('/studies/outside-arena/floor.js');
  const approved=createOutsideArenaFloor(),model=__outsideArena.model,floor=model.children[0];
  // UUIDs differ for rebuilt resources, so compare the geometry itself.
  const a=floor.children[0].geometry.attributes.position.array,b=approved.children[0].geometry.attributes.position.array;
  const materials=new Set();model.children[1].traverse(o=>{if(o.isMesh)materials.add(o.material);});if(materials.size!==1)throw Error('Walls must share one surface material');
  const floorUnchanged=a.length===b.length&&a.every((v,i)=>v===b[i])&&floor.children.length===approved.children.length;
  disposeOutsideArenaFloor(approved);
  return {floorUnchanged,groups:model.children.map(o=>o.name),triangles:model.userData.triangles};
 });assert(sceneReport.floorUnchanged);assert.equal(sceneReport.groups.length,2);assert(sceneReport.triangles<5000);
 const sceneDownload=page.waitForEvent('download');await page.locator('#export').click();assert.equal((await sceneDownload).suggestedFilename(),'outside-arena-scene.glb');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,sceneReport,errors}));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
