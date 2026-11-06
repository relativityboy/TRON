import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/self-shadow-test',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));await page.goto('http://127.0.0.1:5190/self-shadow-test');
 const report=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{MazeShadows}=await import('/src/rendering/maze-shadows.js'),{createStaticWallShadowGeometry}=await import('/src/rendering/static-wall-shadows.js'),{applyWallSelfShade,patchWallSelfShadeShader}=await import('/src/rendering/wall-self-shade.js');
  const scene=new T.Scene(),geometry=new T.BoxGeometry(20,54,20).toNonIndexed();geometry.translate(0,27,0);geometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1),1));
  applyWallSelfShade(geometry);
  const bareMaterial=new T.MeshBasicMaterial({color:0xffffff,toneMapped:false}),shadedMaterial=bareMaterial.clone();shadedMaterial.onBeforeCompile=patchWallSelfShadeShader;
  const slabs=new T.Mesh(geometry,shadedMaterial);scene.add(slabs);
  const floor=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial()),world={slabs,floor};scene.add(floor);
  const shadows=new MazeShadows(world,[],{MAZE_INSTANCES:[{x:0,s:0}],MAZE_LENGTH:200,WALL_HEIGHT:54});floor.visible=shadows.floorShadow.visible=false;
  const renderer=new T.WebGLRenderer({stencil:true});renderer.setSize(200,200);const target=new T.WebGLRenderTarget(200,200,{stencilBuffer:true}),camera=new T.OrthographicCamera(-5,5,5,-5,.1,200);
  target.texture.colorSpace=T.LinearSRGBColorSpace;
  const pixel=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);const p=new Uint8Array(4);renderer.readRenderTargetPixels(target,100,100,1,1,p);return p[0];};
  const samples={};
  for(const [name,position,up] of [['away',[80,27,0],[0,1,0]],['toward',[-80,27,0],[0,1,0]],['roof',[0,100,0],[0,0,-1]]]){
   camera.position.set(...position);camera.up.set(...up);camera.lookAt(0,27,0);slabs.material=bareMaterial;shadows.wallShadow.visible=false;const lit=pixel();slabs.material=shadedMaterial;shadows.wallShadow.visible=true;const shaded=pixel();shadows.wallShadow.visible=false;const withoutOverlay=pixel();shadows.wallShadow.visible=true;samples[name]={lit,shaded,withoutOverlay};
  }
  const cap=new T.PlaneGeometry(2,2).rotateX(-Math.PI/2).translate(11,9,-13);
  cap.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(cap.attributes.position.count).fill(1),1));
  cap.setAttribute('shadowSelfShadeNormal',new T.Float32BufferAttribute(Array.from({length:cap.attributes.position.count},()=>[1,0,0]).flat(),3));
  applyWallSelfShade(cap);
  const ledge=new T.Mesh(cap,shadedMaterial);scene.add(ledge);
  const ledgeShadow=new T.Mesh(createStaticWallShadowGeometry(ledge,geometry,{selfShade:true,bakedSelfShade:true}),shadows.wallShadow.material);ledgeShadow.renderOrder=.5;scene.add(ledgeShadow);
  camera.position.set(11,89,-13);camera.up.set(0,0,-1);camera.lookAt(11,9,-13);
  ledge.material=bareMaterial;ledgeShadow.visible=false;const ledgeLit=pixel();ledge.material=shadedMaterial;ledgeShadow.visible=true;samples.ledge={lit:ledgeLit,shaded:pixel()};
  const stability=[];for(const offset of [0,7000,12000])for(const jitter of [0,.001,.01,.1]){slabs.position.set(offset,0,-offset);slabs.updateMatrixWorld();camera.position.set(offset+80+jitter,27,-offset+jitter);camera.up.set(0,1,0);camera.lookAt(offset,27,-offset);stability.push(pixel());}
  samples.stability=stability;
  // Exercise the production shadow wrapper as well: aircraft and baked
  // self-shade occlude the same light, so weaker overlap cannot darken twice.
  slabs.position.set(0,0,0);camera.position.set(80,27,0);camera.up.set(0,1,0);camera.lookAt(0,27,0);
  const {RecognizerShadows}=await import('/src/rendering/recognizer-shadows.js');
  const craft=new T.Group(),blocker=new T.Mesh(new T.BoxGeometry(80,20,80));craft.position.set(-20,80,-20);craft.add(blocker);
  samples.aircraft=[];
  for(const darkness of [.2,.65]){
   const moving=new RecognizerShadows([{root:craft,casters:[blocker],radius:100}], [slabs],0,{prefix:'carrierShadow',size:256,darkness});
   moving.update(renderer);samples.aircraft.push({darkness,brightness:pixel()});moving.dispose();
  }
  blocker.geometry.dispose();blocker.material.dispose();
  ledgeShadow.geometry.dispose();cap.dispose();
  bareMaterial.dispose();shadedMaterial.dispose();target.dispose();shadows.dispose();renderer.dispose();return samples;
 });
 assert(Math.abs(report.away.shaded/report.away.lit-.4)<.02);assert(Math.abs(report.ledge.shaded/report.ledge.lit-.4)<.02);assert(report.stability.every(v=>Math.abs(v-102)<=1),'self-shade must stay constant under camera jitter at distant offsets');for(const sample of report.aircraft)assert(Math.abs(sample.brightness/255-Math.min(.4,1-sample.darkness))<.02,'aircraft shade must compose as a union');assert.equal(report.away.withoutOverlay,report.away.shaded);assert.equal(report.toward.shaded,report.toward.lit);assert.equal(report.roof.shaded,report.roof.lit);assert.deepEqual(errors,[]);console.log(JSON.stringify({...report,errors}));
}finally{await browser.close();}
