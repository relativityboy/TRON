import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
const cacheDir=await mkdtemp(join(tmpdir(),'tron-arena-occlusion-'));
const server=await createServer({cacheDir,server:{host:'127.0.0.1',port:0,hmr:false}});await server.listen();
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:800,height:600}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.route('**/arena-aircraft-fixture',r=>r.fulfill({contentType:'text/html',body:'<body style="margin:0"></body>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/arena-aircraft-fixture`);
 const result=await page.evaluate(async()=>{
  const T=await import('/node_modules/three/build/three.module.js'),{RecognizerShadows}=await import('/src/rendering/recognizer-shadows.js'),{ArenaWallShadows}=await import('/src/rendering/arena-wall-shadows.js');
  const renderer=new T.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(800,600);document.body.append(renderer.domElement);
  const results={};
  for(const kind of ['far-side','overhang']){
   const scene=new T.Scene(),architecture=new T.Group();architecture.position.x=6000;scene.add(architecture);
   const material=new T.MeshBasicMaterial({color:0x387a48,side:T.DoubleSide});
   const wall=new T.Mesh(kind==='far-side'?new T.BoxGeometry(4,50,60):new T.PlaneGeometry(28,28),material);wall.position.y=kind==='far-side'?25:15;if(kind==='overhang')wall.rotation.y=Math.PI;architecture.add(wall);
   const roof=new T.Mesh(new T.BoxGeometry(30,2,20),new T.MeshBasicMaterial());roof.position.set(-5,25,-5);roof.layers.set(1);if(kind==='overhang')architecture.add(roof);
   const caster=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial());caster.position.set(6000+(kind==='far-side'?-5:-10),kind==='far-side'?29:35,kind==='far-side'?-5:-10);
   const craft={root:caster,casters:[caster],radius:35,distance:100};
   const receiver={material,geometry:wall.geometry,userData:{arenaAircraftShadow:true},isMesh:true};
   const walls=new ArenaWallShadows(architecture,[]);walls.update(renderer);
   let shadows=new RecognizerShadows([craft],[receiver],0);shadows.update(renderer);
   const camera=new T.PerspectiveCamera(40,800/600,.1,200);camera.position.set(6000+(kind==='far-side'?30:0),15,kind==='far-side'?3:-38);camera.lookAt(6000+(kind==='far-side'?2:0),15,0);
   const capture=strength=>{shadows.strengths[0]=strength;renderer.render(scene,camera);const bytes=new Uint8Array(800*600*4),gl=renderer.getContext();gl.readPixels(0,0,800,600,gl.RGBA,gl.UNSIGNED_BYTE,bytes);let sum=0;for(let i=0;i<bytes.length;i+=4)sum+=bytes[i]+bytes[i+1]+bytes[i+2];return sum;};
   const lit=capture(0),unmasked=capture(1);shadows.dispose();receiver.userData.arenaShadowOcclusion=walls;
   shadows=new RecognizerShadows([craft],[receiver],0);shadows.update(renderer);const protectedFace=capture(1);
   if(kind==='far-side'){
    camera.position.set(5970,23,3);camera.lookAt(5998,23,-2);const exteriorLit=capture(0),exteriorShadow=capture(1);results[kind]={lit,unmasked,protectedFace,exteriorLit,exteriorShadow};
   }else{
    roof.visible=false;walls.update(renderer);const roofRemoved=capture(1);roof.visible=true;walls.update(renderer);const roofRestored=capture(1);results[kind]={lit,unmasked,protectedFace,roofRemoved,roofRestored};
   }
   shadows.dispose();walls.dispose();wall.geometry.dispose();material.dispose();roof.geometry.dispose();roof.material.dispose();caster.geometry.dispose();caster.material.dispose();
  }
  renderer.dispose();return results;
 });
 for(const value of Object.values(result)){assert(value.unmasked<value.lit*.995,'fixture reproduces shadow leaking through architecture');assert.equal(value.protectedFace,value.lit,'occluded wall face must not receive moving aircraft shadow');}
 assert(result['far-side'].exteriorShadow<result['far-side'].exteriorLit*.995,'directly lit exterior face still receives aircraft shadow');
 assert(result.overhang.roofRemoved<result.overhang.lit*.995,'removing roof exposes receiver to aircraft shadow');assert.equal(result.overhang.roofRestored,result.overhang.lit);
 assert.deepEqual(errors,[]);await mkdir('test-results/arena-aircraft-occlusion',{recursive:true});await writeFile('test-results/arena-aircraft-occlusion/report.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await server.close();await rm(cacheDir,{recursive:true,force:true});}
