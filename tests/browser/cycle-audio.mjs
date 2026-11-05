import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/cycle-audio-fixture',r=>r.fulfill({contentType:'text/html',body:'<button>Start</button>'}));
 await page.goto(`${process.env.TRON_TEST_URL??'http://127.0.0.1:5190'}/cycle-audio-fixture`);await page.click('button');
 const result=await page.evaluate(async()=>{
  const {Sound}=await import('/src/audio/sound.js');const s=new Sound();await s.unlock();await s.loadCycleSamples();
  const sounds=s.cycleVoices,played=[],original=sounds.voice.bind(sounds);
  sounds.voice=(name,...args)=>{played.push(name);return original(name,...args);};
  const r={round:1,phase:'countdown',time:0,site:{x:0,s:0},crashes:[],cycles:[{id:0,x:0,z:0,previousX:0,previousZ:0,alive:true,turns:0,progress:0}]};
  sounds.update(r,true);sounds.update(r,true);
  r.phase='racing';sounds.update(r,true);sounds.update(r,true);
  r.cycles[0].turns++;sounds.update(r,true);sounds.update(r,true);
  const engines=sounds.engines.size;sounds.update(r,false);const paused=sounds.voices.size;
  sounds.update(r,true);const resumed=sounds.engines.size;
  r.cycles[0].alive=false;r.crashes=[{id:0,x:0,z:0,time:0}];sounds.update(r,true);sounds.update(r,true);
  r.time=3.1;sounds.update(r,true);sounds.update(r,true);r.time=4;sounds.update(r,true);
  s.startMusic();s.musicDirector.requestMusic('enter',0);
  s.effect('cycleArrival',{});s.musicDirector.nextMusic();s.resumeMusic();
  await new Promise(resolve=>setTimeout(resolve,60));
  const music={paused:s.musicDirector.music.paused,started:s.musicDirector.musicStarted,transition:s.musicDirector.musicTransition};
  sounds.reset();const reset=sounds.voices.size;
  const samples=Object.entries(s.samples).filter(([k])=>k.startsWith('cycle-')).map(([name,b])=>({name,duration:b.duration,channels:b.numberOfChannels}));
  const events=[...played];
  r.round++;r.playerId=0;r.phase='racing';r.cycles[0].alive=true;r.crashes=[];
  sounds.update(r,true,{x:0,y:1,s:0,vx:0,vs:0,vy:0});
  const cabin=sounds.engines.get(0).source.buffer===s.samples['cycle-drive-cabin'];
  const stereo=sounds.engines.get(0).emitter.panners.length;
  const buffer=s.samples['cycle-drive-cabin'],channels=[buffer.getChannelData(0),buffer.getChannelData(1)],window=Math.round(buffer.sampleRate*.1),levels=[];
  for(let start=0;start+window<=buffer.length;start+=window){
    let energy=0;for(let i=start;i<start+window;i++)for(const channel of channels)energy+=channel[i]**2;
    levels.push(10*Math.log10(energy/(window*2)));
  }
  const cabinLevelSpreadDb=Math.max(...levels)-Math.min(...levels);
  const rates=[],param=sounds.engines.get(0).source.playbackRate,originalPitch=param.setTargetAtTime.bind(param);
  param.setTargetAtTime=(value,...args)=>{rates.push(value);return originalPitch(value,...args);};
  r.cycles[0].speedMultiplier=1;
  for(let i=0;i<120;i++){r.time+=1/60;sounds.update(r,true,{x:i,y:1,s:0,vx:60,vs:0,vy:0});}
  const speedRates=[];for(const speed of [.5,1,2.5,2]){r.cycles[0].speedMultiplier=speed;sounds.update(r,true,{x:0,y:1,s:0,vx:0,vs:0,vy:0});speedRates.push(rates.pop());}
  const sampleErrors=[...s.sampleErrors];s.dispose();return{speedRates,cabin,cabinLevelSpreadDb,rates,stereo,played:events,engines,paused,resumed,music,reset,samples,sampleErrors};
 });
 assert(result.cabin);assert.equal(result.stereo,2);
 for(const name of ['materialize','startup','launch','drive','drive-cabin','turn','explosion','wall-down'])assert(result.samples.some(s=>s.name==='cycle-'+name),name);assert.deepEqual(result.sampleErrors,[]);
 assert(result.samples.find(s=>s.name==='cycle-drive').duration>.6 && result.samples.find(s=>s.name==='cycle-drive').duration<1.1);
 assert(Math.abs(result.samples.find(s=>s.name==='cycle-drive-cabin').duration-result.samples.find(s=>s.name==='cycle-drive').duration)<.001);
 assert.deepEqual(result.speedRates,[.85,1,1.28,1+(1.28-1)/1.5]);
 assert(result.rates.length===120&&result.rates.every(r=>r===1),'Constant player speed must keep playback pitch fixed, independent of listener motion');
 assert(result.cabinLevelSpreadDb<2,'Cabin drone should not repeat a pronounced level swell');
 assert.equal(result.samples.find(s=>s.name==='cycle-turn').duration,1);
 assert.equal(result.samples.find(s=>s.name==='cycle-explosion').duration,2);
 for(const name of ['materialize','launch','turn','explosion','wall-down'])assert.equal(result.played.filter(n=>n===name).length,1,name);
 assert.equal(result.engines,1);assert.equal(result.paused,0);assert.equal(result.resumed,1);assert.equal(result.reset,0);
 assert.deepEqual(result.music,{paused:true,started:false,transition:null});assert.deepEqual(errors,[]);
 console.log(JSON.stringify({...result,rates:[...new Set(result.rates)]},null,2));
}finally{await browser.close();}
