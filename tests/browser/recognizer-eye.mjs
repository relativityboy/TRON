import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:1200,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('**/eye-inspection',r=>r.fulfill({contentType:'text/html',body:'<body></body>'}));await page.goto('http://127.0.0.1:5190/eye-inspection');
const result=await page.evaluate(async()=>{
 const T=await import('/node_modules/three/build/three.module.js'),{loadRecognizer,createRecognizer}=await import('/src/rendering/models.js');
 const template=await loadRecognizer(),craft=createRecognizer(template),other=createRecognizer(template),blocks={};
 const oldOtherEye=other.eyeColor.getHex();craft.setEyeColor(0xffd92e);if(other.eyeColor.getHex()!==oldOtherEye)throw Error('Shared eye color');
 if(template.userData.eyeTriangles!==4)throw Error('Missing lower crown rectangle triangles');
 template.traverse(m=>{if(!m.isMesh||m.material.name!=='Base')return;const p=m.geometry.attributes.position,b=m.geometry.attributes.breakupBlock;for(let i=0;i<p.count;i++){const id=b.getX(i);const v=blocks[id]??={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity],vertices:0};for(let k=0;k<3;k++){const n=p.array[i*3+k];v.min[k]=Math.min(v.min[k],n);v.max[k]=Math.max(v.max[k],n);}v.vertices++;}});
 const scene=new T.Scene();scene.background=new T.Color(0x03050c);scene.add(craft.root,new T.HemisphereLight(0xffffff,0x444444,3));
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1200,900);document.body.replaceChildren(renderer.domElement);
 const camera=new T.PerspectiveCamera(40,1200/900,.1,300);camera.position.set(0,-4,-68);camera.lookAt(0,-5,0);renderer.render(scene,camera);
 window.eyeInspection={craft,other,scene,camera,renderer};
 const eyeVertices=[];template.traverse(m=>{const p=m.geometry?.attributes.position,a=m.geometry?.attributes.recognizerEye;if(a)for(let i=0;i<a.count;i++)if(a.getX(i))eyeVertices.push([p.getX(i),p.getY(i),p.getZ(i)]);});return {eyeVertices,blocks,eyeTriangles:template.userData.eyeTriangles,independent:craft.eyeColor!==other.eyeColor};
});await mkdir('test-results/recognizer-eye',{recursive:true});await page.screenshot({path:'test-results/recognizer-eye/default.png'});
 await page.evaluate(()=>{const {craft,other,scene,camera,renderer}=eyeInspection;craft.setEyeColor(0x9d3030);if(other.eyeColor.getHex()!==0xffd92e)throw Error('Context override leaked');craft.setTintColor(0x003600);if(craft.eyeColor.getHex()!==0x9d3030)throw Error('Body tint replaced eye');renderer.render(scene,camera);});
 await page.screenshot({path:'test-results/recognizer-eye/override.png'});assert(result.independent);assert(result.eyeVertices.every(p=>p[1]>=7.35&&p[1]<=7.61),'Only the lower crown rectangle is yellow');assert.deepEqual(errors,[]);console.log(JSON.stringify({eyeVertices:result.eyeVertices,eyeTriangles:result.eyeTriangles,independent:result.independent}));}finally{await browser.close();}
