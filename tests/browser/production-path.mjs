import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const url=process.env.TRON_URL||'http://127.0.0.1:4187/fun/TRON/';
const browser=await chromium.launch({channel:process.env.TRON_BROWSER_CHANNEL||'chrome',headless:true});
try {
 const page=await browser.newPage(),errors=[],assets=[];
 if(new URL(url).hostname==='127.0.0.1')await page.route('**/api/jev/decision',r=>r.fulfill({json:{actions:[]}}));
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);if(/\.(glb|wav|mp3)(\?|$)/.test(r.url()))assets.push(r.url());});
 await page.goto(url);
 await page.waitForFunction(()=>!document.querySelector('#start').disabled);
 await page.locator('#start').click(); // Exercise CLU explicitly; Light Cycles is the default.
 await page.waitForFunction(()=>document.body.classList.contains('playing'));
 await page.waitForTimeout(3000);
 assert(assets.filter(x=>x.includes('.glb')).length>=3,'All vehicle models load');
 assert(assets.some(x=>/recognizer-explosion(?:-[a-f0-9]+)?\.wav/.test(x)),'Game audio loads');
 assert(assets.every(x=>new URL(x).pathname.startsWith('/fun/TRON/')),'Assets stay inside game subdirectory');
 assert.deepEqual(errors,[]);
 await page.goto(new URL('audio.html',url).href);
 await page.locator('audio').first().evaluate(async a=>{await a.play();a.pause();});
 assert.deepEqual(errors,[]);
 console.log('Production subdirectory: game starts, models/audio load, audio studio plays, no HTTP/JS errors.');
} finally {await browser.close();}
