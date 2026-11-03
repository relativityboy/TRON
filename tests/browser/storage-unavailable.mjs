import {chromium,webkit} from '@playwright/test';
import assert from 'node:assert/strict';
const engine=process.env.TRON_TEST_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch(engine===chromium?{channel:'chrome',headless:true}:{headless:true});
try{
 for(const mode of ['missing','denied']){
  const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{
   for(const key of ['indexedDB','caches'])Object.defineProperty(window,key,{configurable:true,get(){if(mode==='denied')throw new DOMException('Storage denied','SecurityError');return undefined;}});
  },mode);
  await page.goto(process.env.TRON_URL??'http://127.0.0.1:5188/');
  await page.waitForFunction(()=>window.tronLoadingReport?.().includes('Opening terminal ready'),{},{timeout:120000});
  assert(await page.locator('#loading').isHidden());
  assert.equal(await page.evaluate(async()=>{
   const {cachedMusicUrl}=await import('/src/mcp/music-cache.js');
   const {McpSpeechCache}=await import('/src/mcp/speech-cache.js');
   const speech=new McpSpeechCache();
   if(await speech.get('hello')!==null)throw Error('Expected cache miss');
   await speech.put('hello',{});await speech.close();
   return cachedMusicUrl('/uncached-music.mp3');
  }),'/uncached-music.mp3');
  assert.deepEqual(errors,[]);
  console.log(`${mode} storage: opening terminal ready, music URL fallback, speech cache miss, no page errors`);
  await page.close();
 }
}finally{await browser.close();}
