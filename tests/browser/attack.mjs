import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:process.env.TRON_BROWSER_CHANNEL||'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:5173/');await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 assert.equal(await page.title(),'ENCOM TERMINAL');
 await page.waitForFunction(()=>document.querySelector('.terminal-copy.complete'));await page.keyboard.press('Enter');await page.waitForFunction(()=>document.body.classList.contains('playing'));
 const place=()=>page.evaluate(()=>{
   const r=window.__tron.state;
   const recognizers=r.recognizers.map((e,i)=>({...e,x:-1800,s:-1800,y:65,state:i?'destroyed':'wander',attack:null,fold:0,nextAttack:0,nextSense:0,memory:null,goal:null,vx:0,vs:0}));
   window.__tron.place({x:-1800,s:-1800,speed:0,yaw:0,crushed:false,recognizers});
 });
 await place();
 await page.waitForFunction(()=>window.__tron.state.recognizers[0].state==='fold');
 await page.waitForTimeout(650);
 await page.screenshot({path:'test-results/attack-fold.png'});
 await page.waitForFunction(()=>window.__tron.state.crushed,{},{timeout:8000});
 await page.screenshot({path:'test-results/attack-impact.png'});
 await page.keyboard.down('KeyW');await page.waitForTimeout(500);await page.keyboard.up('KeyW');
 assert.equal(await page.evaluate(()=>window.__tron.state.speed),0);
 await page.evaluate(()=>__tron.reset());
 assert.equal(await page.evaluate(()=>window.__tron.state.crushed),false);
 await place();
 await page.waitForFunction(()=>window.__tron.state.recognizers[0].state==='fold');
 await page.keyboard.down('KeyW');await page.waitForTimeout(4000);await page.keyboard.up('KeyW');
 assert.equal(await page.evaluate(()=>window.__tron.state.crushed),false);
 assert.equal(await page.evaluate(()=>window.__tron.state.recognizers[0].x),-1800);
 const crowd=await page.evaluate(async()=>{
   const {createRun,step}=await import('/src/simulation/run.js');
   const r=createRun();Object.assign(r,{x:-1800,s:-1800});
   r.recognizers.forEach((e,i)=>Object.assign(e,{x:r.x+Math.cos(i*1.256)*35,s:r.s+Math.sin(i*1.256)*35,y:80,yaw:i,vx:0,vs:0}));
   const turns=r.recognizers.map(()=>0);
   for(let i=0;i<1200&&!r.crushed;i++){
     const before=r.recognizers.map(e=>e.yaw);step(r,{},1/60);
     r.recognizers.forEach((e,j)=>turns[j]+=Math.abs(e.yaw-before[j]));
     r.events=[];
   }
   window.__tron.place(r);return {crushed:r.crushed,turns};
 });
 assert.ok(crowd.crushed);assert.ok(crowd.turns.every(angle=>angle<2*Math.PI));
 await page.keyboard.press('KeyV');await page.waitForTimeout(300);
 await page.screenshot({path:'test-results/attack-crowd.png'});
 console.log('Five-craft close approach and ENCOM TERMINAL title verified.');
 assert.deepEqual(errors,[]);console.log('Crush, escape after commitment, disabled wreck and reset passed in Chrome.');
}finally{await browser.close();}
