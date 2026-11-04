import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:process.env.TRON_BROWSER_CHANNEL||'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1200,height:800},reducedMotion:'reduce'}),errors=[];let requests=0;
 page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('/api/jev/decision'))requests++;});
 // Match the authored geometry used by this wall-side fixture.
 const url=new URL(process.env.TRON_URL||'http://127.0.0.1:5173');url.searchParams.set('tuning','1');url.searchParams.set('maze','authored');url.searchParams.set('layoutSeed','1982');url.searchParams.set('runSeed','1982');
 await page.goto(url.href);await page.waitForFunction(()=>window.__tron&&!document.querySelector('#start').disabled);await page.locator('#start').focus();
 const status=await page.request.get(new URL('/api/jev/status',page.url()).href);assert.equal(status.status(),200);assert.equal(typeof (await status.json()).configured,'boolean');
 await page.route('**/api/jev/decision',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'No key (test fallback)'})}));
 assert.equal(await page.evaluate(()=>__tron.state.aiMode),'jev');
 await page.keyboard.press('Shift+T');await page.selectOption('#enemy-ai','classic');await page.click('#apply-ai');
 await page.keyboard.press('Shift+T');
 await page.keyboard.press('Enter');await page.waitForFunction(()=>__tron.state.mode==='running');
 assert.equal(await page.evaluate(()=>__tron.state.aiMode),'classic');
 await page.keyboard.press('Shift+T');await page.selectOption('#enemy-ai','local');await page.check('#ai-small-encounter');await page.click('#apply-ai');
 await page.waitForFunction(()=>__tron.state.aiMode==='local'&&__tron.state.recognizers.length===2&&__tron.state.enemyTanks.length===1);
 await page.waitForFunction(()=>__tron.state.recognizers.every(e=>e.tactical?.plan));assert.equal(requests,0);
 await page.screenshot({path:'test-results/tactical-controls.png'});
 // Put a real aircraft over a wall-side target that fails the old circular test.
 await page.evaluate(async()=>{
  const {WALLS,freePosition}=await import('/src/levels/maze.js'),{aircraftPoseClear,SAFE_ALTITUDE,AIR_HULL}=await import('/src/simulation/maneuver-geometry.js');let site;
  outer:for(const w of WALLS)for(const edge of w.edges){const x=(edge.a.x+edge.b.x)/2+edge.nx*6,s=(edge.a.s+edge.b.s)/2+edge.ns*6;for(let i=0;i<8;i++){const p={x,s,y:AIR_HULL.bottom,yaw:i*Math.PI/4};if(freePosition(x,s,3.5)&&!freePosition(x,s,14)&&aircraftPoseClear(p)){site=p;break outer;}}}
  if(!site)throw new Error('No wall-side fixture');
  const r=__tron.state,e=r.recognizers[0];Object.assign(e,{x:site.x,s:site.s,y:SAFE_ALTITUDE,yaw:site.yaw+Math.PI/2,vx:0,vs:0,vy:0,yawVelocity:0,nextSense:0,tactical:null,memory:{x:site.x,s:site.s,vx:0,vs:0,seenAt:r.time,source:e.id},canSee:true});
  __tron.place({x:site.x,s:site.s,yaw:site.yaw,speed:0,cruiseThrottle:false,recognizers:[e],enemyTanks:[],dataBeams:[]});
 });
 await page.keyboard.press('Shift+T');await page.keyboard.press('KeyV');await page.waitForFunction(()=>__tron.state.recognizers[0].attack?.phase==='drop');await page.screenshot({path:'test-results/tactical-wall-descent.png'});
 await page.waitForFunction(()=>__tron.state.crushed);assert.equal(requests,0);
 // Switch to Jev without a key: the planner remains active and explicitly labels fallback.
 await page.keyboard.press('Shift+T');await page.selectOption('#enemy-ai','jev');await page.click('#apply-ai');
 await page.waitForFunction(()=>__tron.state.aiStatus.includes('Local fallback'));assert.ok(requests>0);
 await page.screenshot({path:'test-results/tactical-no-key.png'});
 await page.keyboard.press('Escape');const paused=await page.evaluate(()=>__tron.state.time);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>__tron.state.time),paused);
 if(process.argv.includes('--live')){
  await page.unroute('**/api/jev/decision');let liveCalls=0;
  await page.route('**/api/jev/decision',route=>++liveCalls===1?route.continue():route.fulfill({status:503,contentType:'application/json',body:'{"error":"Live smoke budget reached"}'}));
  await page.click('#apply-ai');await page.waitForFunction(()=>__tron.state.aiHistory.length>0);
  const result=await page.evaluate(()=>{const h=__tron.state.aiHistory[0];return {accepted:h.accepted,latencyMs:h.latencyMs,response:h.response};});console.log('Live Jev browser result:',result);
  await page.locator('#tuning details').evaluate(e=>e.open=true);await page.screenshot({path:'test-results/tactical-live-jev.png'});
  assert.equal((await page.request.get(new URL('/credentials/Typesafe.txt',page.url()).href)).status(),403);
 }
 // Return through the visible switch. No more requests may be scheduled.
 await page.selectOption('#enemy-ai','classic');await page.click('#apply-ai');await page.waitForFunction(()=>__tron.state.aiMode==='classic');const after=requests;
 await page.waitForTimeout(900);assert.equal(requests,after);assert.ok(await page.evaluate(()=>__tron.state.recognizers.length>2));assert.deepEqual(errors,[]);
 console.log('Mode switches, small roster, real wall-side drop, no-key fallback, pause, reset and Classic isolation passed.');
}finally{await browser.close();}
