import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-menu-tuning-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();const base=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({reducedMotion:'reduce',viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/jev/**',r=>r.fulfill({status:503,body:'{}'}));
 const home=async(query='')=>{await page.goto(base+'/'+query);await page.waitForFunction(()=>window.__tron&&!document.querySelector('#start-cycles').disabled,{},{timeout:120000});};
 await home();
 assert.deepEqual(await page.locator('#game-menu button').allTextContents(),['LIGHT CYCLES SOLO','LIGHT CYCLES MULTIPLAYER','CLU (UNAVAILABLE ON MOBILE)','BIT','MCP','CREDITS']);
 assert.equal(await page.locator('#game-menu button').first().getAttribute('aria-pressed'),'true');
 await page.keyboard.press('Shift+KeyT');assert(await page.locator('#tuning').isHidden());
 await page.keyboard.press('ArrowDown');assert.equal(await page.locator('#start-multiplayer').getAttribute('aria-pressed'),'true');await page.keyboard.press('ArrowUp');
 await page.keyboard.press('Enter');await page.waitForFunction(()=>__tron.state.mode==='running'&&__tron.state.playerVehicle==='cycle',{},{timeout:60000});
 await page.keyboard.press('Shift+KeyT');assert(await page.locator('#tuning').isHidden());
 await home();await page.locator('#start').click();await page.keyboard.press('Enter');await page.waitForFunction(()=>__tron.state.mode==='running'&&!document.body.classList.contains('home-opening'),{},{timeout:60000});
 await page.keyboard.press('Shift+KeyT');assert(await page.locator('#tuning').isHidden());assert((await page.evaluate(()=>__tron.state.turboRemaining))>0,'Shift+T remains turbo during normal CLU play');
 await home('?tuning=1');await page.locator('#start').click();await page.keyboard.press('Enter');await page.waitForFunction(()=>__tron.state.mode==='running'&&!document.body.classList.contains('home-opening'),{},{timeout:60000});
 await page.keyboard.press('Shift+KeyT');assert(await page.locator('#tuning').isVisible());
 await page.evaluate(()=>window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyT',shiftKey:true,repeat:true,bubbles:true})));assert(await page.locator('#tuning').isVisible(),'held shortcut cannot repeatedly toggle');
 await page.locator('#close-tuning').click();assert(await page.locator('#tuning').isHidden());
 await page.keyboard.press('Shift+KeyT');assert(await page.locator('#tuning').isVisible());await page.keyboard.press('Escape');assert(await page.locator('#tuning').isHidden());assert.equal(await page.evaluate(()=>__tron.state.mode),'running','Escape closes tuning without opening exit confirmation');
 assert.deepEqual(errors,[]);console.log('Solo first/default menu and Enter launch; tuning hidden during normal play, explicit opt-in, held shortcut, Close and Escape verified.');
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
