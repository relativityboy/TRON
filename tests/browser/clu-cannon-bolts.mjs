import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5190/reference.html?maze=blueprint&shot=details');await page.waitForFunction(()=>window.__reference,{},{timeout:120000});
 const report=await page.evaluate(async()=>{
  const {GameSession}=await import('/src/simulation/game-session.js');
  const {CLU_WEAPON}=await import('/src/game/config.js');
  const v=__reference.view,session=new GameSession({world:v.map}),r=session.run;
  r.projectiles=[{x:r.x,y:3,s:r.s+20,vx:0,vy:0,vs:165,life:CLU_WEAPON.lifetime-.2},{x:r.x+14,y:3,s:r.s+35,vx:0,vy:0,vs:165,life:2,faction:'enemy'}];
  v.render(r,r,1,0,'paused');v.camera.position.set(r.x+17,13,-r.s+24);v.camera.lookAt(r.x,4,-r.s-16);v.camera.updateProjectionMatrix();v.cluCannonBolts.update(r.projectiles,v.camera);v.composer.render(0);
  window.boltInspection={v,r,session};
  return {heads:v.cluCannonBolts.heads.count,trails:v.cluCannonBolts.trails.count,enemyShots:v.shots.count,trailVertices:v.cluCannonBolts.trails.geometry.attributes.position.count};
 });
 assert.equal(report.heads,1);assert.equal(report.trails,1);assert.equal(report.enemyShots,1);assert(report.trailVertices>=30);
 await mkdir('test-results/clu-cannon-bolts',{recursive:true});await page.locator('#viewport').screenshot({path:'test-results/clu-cannon-bolts/tank.png'});
 await page.evaluate(()=>{const {v,r}=boltInspection;v.camera.position.set(r.x+7,5,-r.s-13);v.camera.lookAt(r.x,3,-r.s-21);v.cluCannonBolts.update(r.projectiles,v.camera);v.composer.render(0);});
 await page.locator('#viewport').screenshot({path:'test-results/clu-cannon-bolts/close.png'});
 const reset=await page.evaluate(()=>{const {v,session}=boltInspection;v.cluCannonBolts.update([],v.camera);session.dispose();return v.cluCannonBolts.heads.count+v.cluCannonBolts.trails.count;});assert.equal(reset,0);assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,reset,errors}));
}finally{await browser.close();}
