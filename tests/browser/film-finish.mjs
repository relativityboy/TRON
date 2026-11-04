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
  const T=await import('/node_modules/three/build/three.module.js');
  const {createFilmFinishPass}=await import('/src/rendering/film-finish.js');
  const renderer=new T.WebGLRenderer(),input=new T.WebGLRenderTarget(192,64),output=new T.WebGLRenderTarget(192,64);
  renderer.setSize(192,64);renderer.setRenderTarget(input);
  for(let i=0;i<3;i++){renderer.setScissorTest(true);renderer.setScissor(i*64,0,64,64);renderer.setClearColor(new T.Color().setRGB(...[[0,0,0],[.12,.22,.4],[1,1,1]][i]));renderer.clear();}
  renderer.setScissorTest(false);
  const pass=createFilmFinishPass({vignetteStrength:0});
  function capture(time){pass.uniforms.time.value=time;pass.render(renderer,output,input);const a=new Uint8Array(192*64*4);renderer.readRenderTargetPixels(output,0,0,192,64,a);return a;}
  const a=capture(0),b=capture(.01),c=capture(.05);
  let changed=0,sum=0,squares=0,n=0;
  for(let y=0;y<64;y++)for(let x=0;x<192;x++)for(let k=0;k<3;k++){
   const i=(y*192+x)*4+k;if(a[i]!==b[i])throw Error('Noise changed inside a film frame');
   if(x<64&&a[i]!==0)throw Error('Lifted black');if(x>=128&&a[i]!==255)throw Error('Noisy white');
   if(x>=64&&x<128){changed+=a[i]!==c[i];if(k===0){sum+=a[i];squares+=a[i]*a[i];n++;}}
  }
  pass.dispose();input.dispose();output.dispose();renderer.dispose();
  return {changed,blueRedMean:sum/n,blueRedDeviation:Math.sqrt(squares/n-(sum/n)**2)};
 });
 assert(report.changed>1000);assert(report.blueRedDeviation>.3);assert(report.blueRedDeviation<5);
 await page.evaluate(()=>{const v=__reference.view,f=v.world.slabs.userData.damageFaces.find(f=>f.length>=108&&f.reliefBoxes?.length),x=f.a.x+f.ux*f.length/2,z=-f.a.s+f.uz*f.length/2;v.camera.position.set(x+f.nx*105-f.ux*50,87,z-f.ns*105-f.uz*50);v.camera.lookAt(x,20,z);v.composer.render(0);});
 await mkdir('test-results/film-finish',{recursive:true});
 await page.locator('#viewport').screenshot({path:'test-results/film-finish/with-finish.png'});
 await page.evaluate(()=>{const v=__reference.view;v.film.uniforms.grainStrength.value=0;v.film.uniforms.mottleStrength.value=0;v.composer.render(0);});
 await page.locator('#viewport').screenshot({path:'test-results/film-finish/without-finish.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
