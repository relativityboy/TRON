import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/self-shadow-test',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));await page.goto('http://127.0.0.1:5190/self-shadow-test');
 const report=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{MazeShadows}=await import('/src/rendering/maze-shadows.js'),{createStaticWallShadowGeometry}=await import('/src/rendering/static-wall-shadows.js');
  const scene=new T.Scene(),geometry=new T.BoxGeometry(20,54,20).toNonIndexed();geometry.translate(0,27,0);geometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1),1));
  const slabs=new T.Mesh(geometry,new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}));scene.add(slabs);
  const floor=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial()),world={slabs,floor};scene.add(floor);
  const shadows=new MazeShadows(world,[],{MAZE_INSTANCES:[{x:0,s:0}],MAZE_LENGTH:200,WALL_HEIGHT:54});floor.visible=shadows.floorShadow.visible=false;
  const renderer=new T.WebGLRenderer({stencil:true});renderer.setSize(200,200);const target=new T.WebGLRenderTarget(200,200,{stencilBuffer:true}),camera=new T.OrthographicCamera(-5,5,5,-5,.1,200);
  const pixel=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(4);renderer.readRenderTargetPixels(target,100,100,1,1,p);return p[0];};
  const samples={};
  for(const [name,position,up] of [['away',[80,27,0],[0,1,0]],['toward',[-80,27,0],[0,1,0]],['roof',[0,100,0],[0,0,-1]]]){
   camera.position.set(...position);camera.up.set(...up);camera.lookAt(0,27,0);shadows.wallShadow.visible=false;const lit=pixel();shadows.wallShadow.visible=true;const shaded=pixel();samples[name]={lit,shaded};
  }
  const cap=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2).translate(11,9,-13);
  cap.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(cap.attributes.position.count).fill(1),1));
  cap.setAttribute('shadowSelfShadeNormal',new T.Float32BufferAttribute(Array.from({length:cap.attributes.position.count},()=>[1,0,0]).flat(),3));
  const ledge=new T.Mesh(cap,slabs.material);scene.add(ledge);
  const ledgeShadow=new T.Mesh(createStaticWallShadowGeometry(ledge,geometry,{selfShade:true}),shadows.wallShadow.material);ledgeShadow.renderOrder=.5;scene.add(ledgeShadow);
  camera.position.set(11,89,-13);camera.up.set(0,0,-1);camera.lookAt(11,9,-13);
  ledgeShadow.visible=false;const ledgeLit=pixel();ledgeShadow.visible=true;samples.ledge={lit:ledgeLit,shaded:pixel()};
  ledgeShadow.geometry.dispose();cap.dispose();
  target.dispose();shadows.dispose();renderer.dispose();return samples;
 });
 assert(Math.abs(report.away.shaded/report.away.lit-.4)<.02);assert(Math.abs(report.ledge.shaded/report.ledge.lit-.4)<.02);assert.equal(report.toward.shaded,report.toward.lit);assert.equal(report.roof.shaded,report.roof.lit);assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();}
