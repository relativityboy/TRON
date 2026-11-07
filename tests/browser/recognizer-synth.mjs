// Regression: rejected experimental synthesis must not enter gameplay or the study.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
try{
 const page=await browser.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:5173/audio.html');
 assert.equal(await page.locator('#synth-flight,#synth-approach,#synth-ambience').count(),0);
 const result=await page.evaluate(async()=>{
  const {Sound}=await import('/src/audio/sound.js');const s=new Sound();s.init();
  const silentUntilLoaded=s.recognizerVoices.voices.every(v=>!v.flight&&!v.attack&&!v.rotor);
  await s.loading;
  const recorded=s.recognizerVoices.voices.every(v=>v.flight.buffer===s.samples['recognizer-flight']&&v.attack.buffer===s.samples['recognizer-approach']);
  const count=s.sources.size;s.recognizerVoices.loadSamples();
  const unchanged=s.sources.size===count,ambience=!!s.gridAmbience;
  const sampleErrors=[...s.sampleErrors];s.dispose();return {silentUntilLoaded,recorded,unchanged,ambience,sampleErrors,remaining:s.sources.size};
 });
 assert(result.silentUntilLoaded);assert(result.recorded);assert(result.unchanged);assert.equal(result.ambience,false);
 assert.equal(result.remaining,0);assert.deepEqual(result.sampleErrors,[]);
 await page.click('#play');await page.waitForTimeout(250);await page.click('#stop');
 assert(!requests.some(url=>url.includes('recognizer-synth.js')),'Experimental synth is not imported');
 assert.deepEqual(errors,[]);console.log(result);
}finally{await browser.close();}
