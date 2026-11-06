import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1000,height:650}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/shadow-sharpness',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));await page.goto('http://127.0.0.1:5190/shadow-sharpness');
 const report=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{MazeShadows}=await import('/src/rendering/maze-shadows.js');
  const map={MAZE_INSTANCES:[{x:0,s:0}],MAZE_LENGTH:2000,WALL_HEIGHT:54};
  const scene=new T.Scene(),slabs=new T.Mesh(new T.BoxGeometry(20,54,20),new T.MeshBasicMaterial());slabs.position.y=27;scene.add(slabs);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshBasicMaterial()),seams=new T.LineSegments(new T.BufferGeometry(),new T.LineBasicMaterial());scene.add(floor,seams);
  const receiver=new T.Mesh(new T.PlaneGeometry(12,12),new T.MeshBasicMaterial({color:0xffffff}));receiver.rotation.x=-Math.PI/2;receiver.position.set(36,2,30);scene.add(receiver);
  const camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);camera.position.set(36,40,30);camera.up.set(0,0,-1);camera.lookAt(receiver.position);
  const renderer=new T.WebGLRenderer();renderer.setSize(512,512);document.body.append(renderer.domElement);const target=new T.WebGLRenderTarget(512,512);
  async function measure(sharp){
   slabs.visible=true;const shadows=new MazeShadows({slabs,floor,seams},[receiver],map,sharp?{sharpReceiver:receiver}:{});shadows.setGroundShadowMode('sharp');shadows.update(renderer);
   slabs.visible=floor.visible=seams.visible=shadows.floorShadow.visible=shadows.wallShadow.visible=false;
   renderer.setRenderTarget(target);renderer.render(scene,camera);const bytes=new Uint8Array(512*512*4);renderer.readRenderTargetPixels(target,0,0,512,512,bytes);renderer.setRenderTarget(null);
   const row=[];for(let x=0;x<512;x++)row.push(bytes[(256*512+x)*4]);
   const low=Math.min(...row),high=Math.max(...row),transition=row.filter(v=>v>low+8&&v<high-8).length;
   let follows=true;if(sharp){receiver.position.x+=1;shadows.update(renderer);follows=shadows.sharpLastPosition.x===37;receiver.position.x-=1;shadows.update(renderer);}
   shadows.dispose();return {low,high,transition,follows};
  }
  const coarse=await measure(false),focused=await measure(true);target.dispose();renderer.dispose();return {coarse,focused};
 });
 assert(report.coarse.high-report.coarse.low>50);assert(report.focused.high-report.focused.low>50);assert(report.focused.transition<report.coarse.transition/4);assert(report.focused.transition<8);assert(report.focused.follows);assert.deepEqual(errors,[]);
 await mkdir('test-results/clu-wall-shadows',{recursive:true});console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();}
