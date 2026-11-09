import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800},hasTouch:true,reducedMotion:'reduce'}),errors=[];
 page.setDefaultTimeout(45000);
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.TRON_URL??'http://127.0.0.1:5188/');
 await page.waitForFunction(()=>window.__tron&&!document.querySelector('#start-credits').disabled,null,{timeout:90000});
 const ready=()=>page.waitForFunction(()=>__tron.state.mode==='ready'&&!document.body.classList.contains('home-opening'));
 await ready();
 assert.equal(await page.locator('#game-menu button').first().getAttribute('id'),'start-multiplayer');
 assert.equal(await page.locator('#start-multiplayer').getAttribute('aria-pressed'),'true');
 for(const id of ['start-cycles','start-multiplayer','start','start-bit','start-mcp','start-credits','start-feedback']){
  await page.locator('#'+id).hover();assert.equal(await page.locator('#'+id).getAttribute('aria-pressed'),'true');
 }
 const rows=await page.locator('#game-menu button').evaluateAll(buttons=>buttons.map(b=>({width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})));
 assert(rows.every(r=>r.width===rows[0].width),'full rows share a common hit area');
 assert(rows.every(r=>r.height>=44),'coarse-pointer targets are at least 44px tall');
 const credits=page.locator('#start-credits'),bounds=await credits.boundingBox();
 await page.mouse.click(bounds.x+bounds.width-5,bounds.y+bounds.height/2);
 await page.waitForFunction(()=>document.body.classList.contains('victory-credits')&&!document.body.classList.contains('home-opening'));
 await page.touchscreen.tap(30,30);await ready();
 await credits.tap();await page.waitForFunction(()=>document.body.classList.contains('victory-credits')&&!document.body.classList.contains('home-opening'));
 await page.mouse.click(30,30);await ready();
 await page.keyboard.press('ArrowUp');assert.equal(await page.locator('#start-mcp').getAttribute('aria-pressed'),'true');
 await page.keyboard.press('ArrowDown');assert.equal(await credits.getAttribute('aria-pressed'),'true');
 await page.locator('#start').tap();await page.waitForFunction(()=>__tron.state.mode==='running'&&__tron.state.playerVehicle!=='cycle',null,{timeout:30000});

 assert.deepEqual(errors,[]);console.log('All six rows track mouse hover; blank-row clicks, single taps, credits return, keyboard selection and CLU tap launch passed.');
}finally{await browser.close();}
