import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-film-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/reference.html?maze=blueprint&shot=details`);
 await page.waitForFunction(()=>window.__reference,{},{timeout:180000});
 const report=await page.evaluate(async()=>{
  const {GameSession}=await import('/src/simulation/game-session.js');
  const {mazeEnclosure}=await import('/src/rendering/clu-haze.js');
  const v=__reference.view,session=new GameSession({world:v.map}),r=session.run;
  v.cameraRig.referenceCamera=null;v.cameraRig.opening=null;v.cameraRig.aerial=false;
  const sample=enclosure=>{v.cluHaze.enclosure=enclosure;v.render(r,r,1,0,'paused');return {density:v.scene.fog.density,color:v.scene.fog.color.getHex(),wallLiftSuppression:v.world.canyonEnclosure.value};};
  const open=sample(0),closed=sample(1);
  const possible=v.map.OPEN_CELLS.slice(0,300).map(p=>mazeEnclosure(v.map,p.x,p.s));
  const {createScenario}=await import('/src/levels/scenario.js');const cycleSession=new GameSession({world:createScenario({layout:'blueprint',siteCount:4,centralLabyrinth:true,outerMazes:false}).world});r.cycleRace=cycleSession.run.cycleRace;r.cycleRace.playerId=0;r.playerVehicle='cycle';const cycleAfter=sample(1),cycleBefore=sample(0);
  cycleSession.dispose();session.dispose();return {open,closed,cycleAfter,cycleBefore,maxEnclosure:Math.max(...possible)};
 });
 assert(report.closed.density>report.open.density*3);assert(report.closed.color<report.open.color);assert.equal(report.closed.wallLiftSuppression,1);
 assert.deepEqual(report.cycleAfter,report.cycleBefore);assert(report.maxEnclosure>.5);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
