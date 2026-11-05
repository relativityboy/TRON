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
  const view=__reference.view,session=new GameSession({world:view.map});
  const run=session.run,e=run.recognizers[0];
  view.render(run,run,1,0,'paused');
  const before={...run,recognizers:run.recognizers.map(p=>({...p}))};
  e.x+=4;e.y+=2;e.s+=6;e.yaw+=.1;
  const samples=[];
  for(const alpha of [0,.25,.5,.75,1]){view.render(run,before,alpha,0,'paused');const root=view.recognizers[0].root;samples.push({x:root.position.x,yaw:root.rotation.y});}
  for(let i=1;i<samples.length;i++){
   if(Math.abs(samples[i].x-samples[i-1].x-1)>1e-6)throw Error('Position was not interpolated');
   if(Math.abs(samples[i].yaw-samples[i-1].yaw-.025)>1e-6)throw Error('Turn was not interpolated');
  }
  session.dispose();return {samples};
 });
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
