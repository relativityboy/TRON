import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/diffuse-shadow-test',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
 await page.goto('http://127.0.0.1:5190/diffuse-shadow-test');
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js');
  const {DiffuseGroundShadows}=await import('/src/rendering/diffuse-ground-shadows.js');
  const scene=new T.Scene(),slabs=new T.Mesh();scene.add(slabs);
  const floor=new T.Mesh(new T.PlaneGeometry(250,250),new T.MeshBasicMaterial({color:0xffffff}));floor.rotation.x=-Math.PI/2;floor.position.y=-.1;scene.add(floor);
  const map={MAZE_INSTANCES:[{id:'a'}],WALL_HEIGHT:20,WALLS:[{mazeId:'a',points:[{x:-20,s:-20},{x:20,s:-20},{x:20,s:20},{x:-20,s:20}]}]};
  const renderer=new T.WebGLRenderer();renderer.setSize(600,600);document.body.append(renderer.domElement);
  const shadows=new DiffuseGroundShadows({slabs},map,.6);shadows.update(renderer);shadows.visible=true;
  const camera=new T.OrthographicCamera(-65,65,65,-65,.1,200);camera.position.set(0,100,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
  const target=new T.WebGLRenderTarget(600,600);renderer.setRenderTarget(target);renderer.render(scene,camera);
  const pixels=new Uint8Array(600*600*4);renderer.readRenderTargetPixels(target,0,0,600,600,pixels);renderer.setRenderTarget(null);renderer.render(scene,camera);
  const row=Array.from({length:600},(_,x)=>pixels[(300*600+x)*4]),unique=new Set(row);
  const report={min:Math.min(...row),max:Math.max(...row),levels:unique.size,transitionPixels:row.filter(x=>x>110&&x<245).length,ready:shadows.ready,textureSize:shadows.tiles[0].target.width};
  window.shadowTest={shadows,renderer,target};return report;
 });
 assert(result.ready);assert(result.min<120);assert(result.max>245);assert(result.levels>80);assert(result.transitionPixels>50);assert.deepEqual(errors,[]);
 await mkdir('test-results/diffuse-ground-shadows',{recursive:true});await page.screenshot({path:'test-results/diffuse-ground-shadows/soft.png'});
 await page.evaluate(()=>{const {shadows,renderer,target}=window.shadowTest;shadows.dispose();target.dispose();renderer.dispose();});
 console.log(JSON.stringify({...result,errors}));
}finally{await browser.close();}
