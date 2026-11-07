import {configureArenaStudyShadows,fitArenaStudyShadow} from './lighting.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createOutsideArena,disposeOutsideArena} from './model.js';
import {createOutsideArenaScene} from './scene.js';
const fullScene=document.body.dataset.study==='scene';
const container=document.querySelector('#viewport'),renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.prepend(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x05060b);const model=fullScene?createOutsideArenaScene():createOutsideArena();scene.add(model);
if(fullScene){

 const ambient=new T.HemisphereLight(0xc0d0ef,0x03050a,.22);scene.add(ambient);
 const key=new T.DirectionalLight(0xe8efff,2.6);key.position.set(-250,230,50);key.target.position.set(0,60,-180);scene.add(key,key.target);
 configureArenaStudyShadows(renderer,key);fitArenaStudyShadow(renderer,key,model);
 const angle=document.querySelector('#light-angle');
 angle?.addEventListener('input',()=>{const a=Number(angle.value)*Math.PI/180;key.position.set(Math.sin(a)*340,230,-180+Math.cos(a)*340);fitArenaStudyShadow(renderer,key,model);});
}
const camera=new T.PerspectiveCamera(58,1,.1,4000),controls=new OrbitControls(camera,renderer.domElement);controls.maxPolarAngle=Math.PI*.51;controls.minDistance=2;controls.maxDistance=1600;controls.enableDamping=true;
const views={film:{eye:[0,16,65],target:[0,0,-95]},oblique:{eye:[100,65,100],target:[0,0,-45]},overview:{eye:[430,360,450],target:[0,0,60]},detail:{eye:[62,18,24],target:[38,-1,-32]}};
function select(name){const v=fullScene&&name==='film'?{eye:[0,14,0],target:[0,40,-180]}:views[name];camera.position.set(...v.eye);controls.target.set(...v.target);controls.update();for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===name));}
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>select(b.dataset.view);select(fullScene?'film':'oblique');
const observer=new ResizeObserver(()=>{const {width,height}=container.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(container);
document.querySelector('#wire').onchange=e=>model.traverse(o=>{if(o.material)o.material.wireframe=e.target.checked;});
document.querySelector('#export').onclick=async()=>{const button=document.querySelector('#export');button.disabled=true;try{const data=await new GLTFExporter().parseAsync(model,{binary:true});const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=fullScene?'outside-arena-scene.glb':'outside-arena-floor.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}finally{button.disabled=false;}};
document.querySelector('#stats').textContent=`${model.userData.triangles.toLocaleString()} triangles · ${fullScene?'approved floor + wall study':'approved standalone floor'} · estimated scale`;
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
window.__outsideArena={model,scene,camera,renderer,select};
window.addEventListener('pagehide',()=>{renderer.setAnimationLoop(null);observer.disconnect();controls.dispose();disposeOutsideArena(model);scene.traverse(o=>o.shadow?.dispose());renderer.dispose();delete window.__outsideArena;},{once:true});
