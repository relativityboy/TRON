import {chromium} from '@playwright/test';
import {mkdir,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-pattern-vite-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const base=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1800,height:1100},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const started=Date.now();await page.goto(`${base}/reference.html?maze=blueprint&shot=details`);
 await page.waitForFunction(()=>window.__reference,{},{timeout:180000});
 const report=await page.evaluate(async()=>{
  const {browserScenario}=await import('/src/game/browser-scenario.js'),{MazeWallDamage}=await import('/src/rendering/maze-wall-damage.js'),{Vector3,Raycaster}=await import('/node_modules/three/build/three.module.js');
  const map=browserScenario(location).world,v=__reference.view,slabs=v.world.slabs;
  const face=slabs.userData.damageFaces.filter(f=>f.length>=108&&f.reliefBoxes?.length).find(f=>{const x=f.a.x+f.ux*f.length/2+f.nx*60,s=f.a.s-f.uz*f.length/2+f.ns*60;return map.freePosition(x,s,8);})??slabs.userData.damageFaces.find(f=>f.length>=108&&f.reliefBoxes?.length);
  const x=face.a.x+face.ux*face.length/2,z=-face.a.s+face.uz*face.length/2;
  window.wallPatternFrame={face,x,z};
  v.camera.position.set(x+face.nx*65-face.ux*24,30,z-face.ns*65-face.uz*24);v.camera.lookAt(x,23,z);v.camera.updateProjectionMatrix();v.composer.render(0);
  const patches=slabs.userData.reliefPatches.filter(p=>p.face===face);if(!patches.length)throw Error('Selected wall has no revision 7 relief');
  const rib=face.reliefBoxes.find(b=>b.out===1.125);if(!rib)throw Error('Vertical rib missing');
  const distance=(rib.left+rib.right)/2,px=face.a.x+face.ux*distance,pz=-face.a.s+face.uz*distance;
  const ray=new Raycaster(new Vector3(px+face.nx*10,15,pz-face.ns*10),new Vector3(-face.nx,0,face.ns));slabs.updateMatrixWorld();
  const before=ray.intersectObject(slabs)[0];
  window.wallPatternDamage={damage:new MazeWallDamage(v.scene,slabs,v.world.seams),face,px,pz,ray};
  return {wallCount:map.WALLS.length,vertices:slabs.geometry.attributes.position.count,reliefQuads:slabs.userData.reliefPatches.length,selectedFaceLength:face.length,beforeDistance:before.distance};
 });
 await page.waitForTimeout(200);await mkdir('test-results/maze-wall-pattern',{recursive:true});await page.locator('#viewport').screenshot({path:'test-results/maze-wall-pattern/close.png'});
 await page.evaluate(()=>{const v=__reference.view,{face,x,z}=wallPatternFrame;v.camera.position.set(x+face.nx*105-face.ux*50,87,z-face.ns*105-face.uz*50);v.camera.lookAt(x,20,z);v.composer.render(0);});
 await page.locator('#viewport').screenshot({path:'test-results/maze-wall-pattern/overview.png'});
 await page.evaluate(()=>{
  const v=__reference.view,face=v.world.slabs.userData.damageFaces.find(f=>f.length>=108&&!f.reliefBoxes?.length);
  if(!face)throw Error('No bare exterior face found');
  const x=face.a.x+face.ux*face.length/2,z=-face.a.s+face.uz*face.length/2;
  v.camera.position.set(x+face.nx*65-face.ux*24,30,z-face.ns*65-face.uz*24);v.camera.lookAt(x,23,z);v.composer.render(0);
 });
 await page.locator('#viewport').screenshot({path:'test-results/maze-wall-pattern/exterior.png'});
 const impact=await page.evaluate(()=>{
  const {damage,face,px,pz,ray}=wallPatternDamage,v=__reference.view;
  if(!damage.hit({subject:'surface',x:px,y:15,s:-pz,normal:{x:face.nx,y:0,z:-face.ns}}))throw Error('Wall impact rejected');damage.update(0);v.world.slabs.updateMatrixWorld();const hit=ray.intersectObject(v.world.slabs)[0];
  const result={afterDistance:hit.distance,cavities:damage.cavities.length};damage.clear();result.resetDistance=ray.intersectObject(v.world.slabs)[0].distance;damage.dispose();return result;
 });
 assert(Math.abs(report.beforeDistance-8.875)<.01);assert(impact.afterDistance>10.5);assert.equal(impact.cavities,1);assert(Math.abs(impact.resetDistance-8.875)<.01);assert.deepEqual(errors,[]);
 await writeFile('test-results/maze-wall-pattern/report.json',JSON.stringify({...report,...impact,loadMilliseconds:Date.now()-started,errors},null,2));console.log(JSON.stringify({...report,...impact,errors}));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
