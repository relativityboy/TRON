import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/diffuse-vehicle-test',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
 await page.goto('http://127.0.0.1:5190/diffuse-vehicle-test');
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{MazeShadows}=await import('/src/rendering/maze-shadows.js');
  const scene=new T.Scene(),slabs=new T.Mesh(new T.BoxGeometry(20,54,20),new T.MeshBasicMaterial());slabs.position.y=27;scene.add(slabs);
  const receiver=new T.Mesh(new T.PlaneGeometry(80,80),new T.MeshBasicMaterial({color:0xffffff}));receiver.rotation.x=-Math.PI/2;receiver.position.set(36,2,30);scene.add(receiver);
  const camera=new T.OrthographicCamera(-40,40,40,-40,.1,150);camera.position.set(36,100,30);camera.up.set(0,0,-1);camera.lookAt(receiver.position);
  const renderer=new T.WebGLRenderer();renderer.setSize(600,600);document.body.append(renderer.domElement);const target=new T.WebGLRenderTarget(600,600);
  const map={MAZE_INSTANCES:[{x:0,s:0}],MAZE_LENGTH:200,WALL_HEIGHT:54};
  const shadows=new MazeShadows({slabs},[receiver],map,{sharpReceiver:receiver});
  const measure=mode=>{
   shadows.setGroundShadowMode(mode);slabs.visible=true;shadows.update(renderer);
   slabs.visible=shadows.floorShadow.visible=shadows.wallShadow.visible=false;
   renderer.setRenderTarget(target);renderer.render(scene,camera);const pixels=new Uint8Array(600*600*4);renderer.readRenderTargetPixels(target,0,0,600,600,pixels);renderer.setRenderTarget(null);renderer.render(scene,camera);
   const row=Array.from({length:600},(_,x)=>pixels[(300*600+x)*4]);const min=Math.min(...row),max=Math.max(...row);
   return {min,max,transition:row.filter(v=>v>min+8&&v<max-8).length};
  };
  const sharp=measure('sharp'),diffuse=measure('diffuse'),restored=measure('sharp');measure('diffuse');
  window.vehicleShadowTest={shadows,renderer,target};return {sharp,diffuse,restored};
 });
 assert(result.sharp.max-result.sharp.min>50);assert(result.diffuse.transition>result.sharp.transition*4);assert(result.diffuse.transition>20);assert.deepEqual(result.restored,result.sharp);assert.deepEqual(errors,[]);
 await mkdir('test-results/diffuse-vehicle-shadows',{recursive:true});await page.screenshot({path:'test-results/diffuse-vehicle-shadows/soft.png'});
 await page.evaluate(()=>{const {shadows,renderer,target}=window.vehicleShadowTest;shadows.dispose();target.dispose();renderer.dispose();});
 console.log(JSON.stringify({...result,errors}));
}finally{await browser.close();}
