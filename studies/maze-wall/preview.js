import {configureArenaStudyShadows,fitArenaStudyShadow} from '../outside-arena/lighting.js';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {buildModel as buildWallModel,disposeModel} from './build-model.js';
import {buildSceneWorkshopModel} from '../outside-arena/workshop-model.js';
const sceneWorkspace=document.body.dataset.workspace==='outside-arena';
const buildModel=sceneWorkspace?buildSceneWorkshopModel:buildWallModel;
const apiRoot=sceneWorkspace?'/api/scene-studio':'/api/wall-studio';
const seedUrl=sceneWorkspace?'/studies/outside-arena/workshop-design.json':'/studies/maze-wall/design.json';
const materialList=o=>o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
const $=id=>document.getElementById(id),host=$('viewport');
let state,online=false,model,design,selection,selectedPartId='',mode=sceneWorkspace?'front':'whole',pollTimer,disposed=false,uploading=false,submitting=false,lastRequest='';
const included=new Set();
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));host.prepend(renderer.domElement);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x121a28);
const camera=new THREE.PerspectiveCamera(40,1,.1,6000),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
const ambient=new THREE.HemisphereLight(0xc6d0e2,0x20243a,1.2);scene.add(ambient);
const key=new THREE.DirectionalLight(0xe5ecff,2.1);key.position.set(-50,130,65);scene.add(key);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshStandardMaterial({color:0x243859,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;scene.add(floor);
const others=new THREE.Group();scene.add(others);
if(sceneWorkspace){
 renderer.toneMapping=THREE.NoToneMapping;floor.visible=false;
 scene.background.set(0x05060b);ambient.color.set(0xc0d0ef);ambient.groundColor.set(0x03050a);key.color.set(0xe8efff);scene.add(key.target);key.target.position.set(0,60,-180);
 configureArenaStudyShadows(renderer,key);
}
function applyLighting(){
 if(!sceneWorkspace)return;const light=design.lighting,a=light.angleDegrees*Math.PI/180;
 key.position.set(Math.sin(a)*340,light.heightMeters,-180+Math.cos(a)*340);
 ambient.intensity=$('inspect').checked?Math.max(1,light.ambientIntensity):light.ambientIntensity;key.intensity=$('inspect').checked?Math.max(3.5,light.intensity):light.intensity;
 fitArenaStudyShadow(renderer,key,model);
}

const working=()=>state?.job?.status==='working';
function status(message,kind='ready'){$('status').textContent=message;$('status').dataset.state=kind;}
async function api(path,body){
 const response=await fetch(`${apiRoot}/${path}`,body===undefined?{cache:'no-store'}:{method:'POST',headers:{'Content-Type':'application/json','X-Wall-Studio-Token':state?.token??''},body:JSON.stringify(body)});
 let result;try{result=await response.json();}catch{throw Error(`The server at ${location.host} served a page instead of the editor API. Restart that dev server, or run npm run workshop and open http://127.0.0.1:5190${sceneWorkspace?'/scene-workshop.html':'/wall-study.html'}. Reconnecting automatically…`);}
 if(!response.ok)throw Error(result.error||`Workspace request failed (${response.status})`);return result;
}
function buttons(){
 const busy=working()||submitting;
 $('submit').disabled=!online||busy||uploading;$('feedback').disabled=busy;$('cancel').hidden=!working();$('cancel').disabled=false;
 $('reference-files').disabled=!online||uploading;$('download').disabled=!model;
 document.querySelectorAll('[data-restore]').forEach(b=>b.disabled=busy);
 $('attachment-note').textContent=`Current view + ${included.size} reference${included.size===1?'':'s'} included`;
 $('reference-count').textContent=state?.references.length??0;
}
function setSelection(id){
 selectedPartId=design?.parts.some(p=>p.id===id)?id:'';
 if(selection){scene.remove(selection);selection.geometry.dispose();selection.material.dispose();selection=null;}
 const mesh=model?.children.find(o=>o.userData.partId===selectedPartId);
 if(mesh){selection=new THREE.BoxHelper(mesh,0xb5d4fc);scene.add(selection);}
 $('parts').value=selectedPartId;
 $('selection-hint').textContent=sceneWorkspace?'Edit walls or lighting; the approved floor stays fixed.':mesh?'Your next correction will identify this part.':'Choose a part, or describe the whole wall.';
}
function cloneCanyon(){
 others.clear();if(!model||sceneWorkspace)return;
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 const gap=Math.max(18,size.z),opposite=model.clone(true);opposite.position.z=size.z+gap;others.add(opposite);
 const end=model.clone(true);end.rotation.y=Math.PI/2;end.position.set(bounds.max.x+size.z/2-center.z,0,center.x+(size.z+gap)/2);others.add(end);
 others.visible=mode==='canyon';
}
function applyModel(next,fit=false){
 const replacement=buildModel(next); // Preserve the current render if validation fails.
 setSelection('');others.clear();if(model){scene.remove(model);disposeModel(model);}
 design=next;model=replacement;scene.add(model);cloneCanyon();applyLighting();
 const options=[new Option(sceneWorkspace?'Walls + lighting':'Whole model',''),...design.parts.map(p=>new Option(p.name,p.id))];$('parts').replaceChildren(...options);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());let triangles=0;
 model.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;for(const m of materialList(o))m.wireframe=$('wire').checked;}});
 $('model-stats').textContent=`${design.parts.length} ${sceneWorkspace?'editable wall group':'parts'} · ${triangles.toLocaleString()} triangles · ${size.x.toFixed(1)} × ${size.y.toFixed(1)} × ${size.z.toFixed(1)} m`;
 floor.position.y=Math.min(0,bounds.min.y)-.04;
 if(fit)preset(mode);$('model-loading').hidden=true;buttons();
}
function preset(name){
 mode=name;others.visible=!sceneWorkspace&&name==='canyon';
 if(sceneWorkspace&&name==='front'){
  controls.target.set(0,40,-180);camera.position.set(0,14,0);camera.up.set(0,1,0);camera.fov=58;camera.updateProjectionMatrix();controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));return;
 }

 const bounds=new THREE.Box3().setFromObject(model);if(others.visible)bounds.union(new THREE.Box3().setFromObject(others));
 const sphere=bounds.getBoundingSphere(new THREE.Sphere()),size=bounds.getSize(new THREE.Vector3());
 const distance=sphere.radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.08/Math.min(1,camera.aspect);
 const direction={whole:[1,.6,1.4],detail:[.6,.08,1],front:[0,0,1],side:[1,0,0],top:[0,1,.0001],canyon:[-1,1.05,.04]}[name];
 controls.target.copy(sphere.center);camera.up.set(0,1,0);camera.position.copy(sphere.center).add(new THREE.Vector3(...direction).normalize().multiplyScalar(distance*(name==='detail'?.6:1)));
 if(name==='detail')controls.target.y=bounds.min.y+size.y*.33;
 controls.minDistance=.2;controls.maxDistance=distance*8;camera.far=Math.max(6000,distance*12);camera.updateProjectionMatrix();controls.update();
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===mode)));
}
function renderReferences(){
 const gallery=$('references');gallery.replaceChildren();
 for(const ref of state.references){
  const card=document.createElement('article');card.className=`reference-card${included.has(ref.id)?' selected':''}`;
  const button=document.createElement('button');button.type='button';button.title=`Inspect ${ref.name}`;
  const image=new Image();image.src=ref.url;image.alt=ref.name;image.loading='lazy';button.append(image);button.onclick=()=>{$('reference-title').textContent=ref.name;$('reference-image').src=ref.url;$('reference-image').alt=ref.name;$('reference-dialog').showModal();};
  const label=document.createElement('label'),check=document.createElement('input'),name=document.createElement('span');check.type='checkbox';check.checked=included.has(ref.id);check.setAttribute('aria-label',`Include ${ref.name}`);name.textContent=ref.name;
  check.onchange=()=>{if(check.checked&&included.size>=6){check.checked=false;status('Choose up to six references per revision. Uncheck one to include another.','failed');return;}if(check.checked)included.add(ref.id);else included.delete(ref.id);card.classList.toggle('selected',check.checked);buttons();};
  label.append(check,name);card.append(button,label);gallery.append(card);
 }
}
function renderHistory(){
 $('revision-label').textContent=`Revision ${state.current.id}`;$('history').replaceChildren();
 for(const revision of [...state.revisions].reverse()){
  const item=document.createElement('li');if(revision.id===state.current.id)item.className='current';
  const title=document.createElement('strong');title.textContent=`Revision ${revision.id}${revision.id===state.current.id?' · current':''}`;
  const request=document.createElement('p');request.className='request';request.textContent=revision.request;
  const summary=document.createElement('p');summary.textContent=revision.summary;
  item.append(title,request,summary);
  if(revision.id!==state.current.id){const button=document.createElement('button');button.type='button';button.dataset.restore=revision.id;button.textContent='Restore this version';button.onclick=async()=>{
   submitting=true;buttons();try{acceptState(await api('restore',{baseRevision:state.current.id,revisionId:revision.id}));status(`Restored revision ${revision.id}. You can continue editing.`);}catch(error){status(error.message,'failed');}finally{submitting=false;buttons();}
  };item.append(button);}
  $('history').append(item);
 }
}
function acceptState(next){
 const old=state;state=next;online=true;
 if(!old||!model||old.current.id!==next.current.id){const chosen=selectedPartId;applyModel(next.current.model,!model);setSelection(chosen);renderHistory();}
 if(!old||JSON.stringify(old.references)!==JSON.stringify(next.references)){if(!old)next.references.slice(0,6).forEach(r=>included.add(r.id));renderReferences();}
 const job=next.job;
 if(job?.status==='working')status(job.message,'working');
 else if(job&&(job.id!==old?.job?.id||job.status!==old?.job?.status)){
  status([job.message,job.error].filter(Boolean).join('\n'),job.status==='failed'?'failed':'ready');
  if(job.status==='ready'&&$('feedback').value===lastRequest)$('feedback').value='';
 }else if(!old)status(next.current.summary);
 buttons();
}
async function poll(){
 if(disposed)return;
 try{acceptState(await api('state'));}catch(error){status(`Connection lost. Your last model is still shown. ${error.message}`,'failed');online=false;buttons();}
 if(!disposed)pollTimer=setTimeout(poll,1500);
}
function viewportCapture(){
 controls.update();renderer.render(scene,camera);
 const canvas=document.createElement('canvas'),scale=Math.min(1,1280/renderer.domElement.width);canvas.width=Math.round(renderer.domElement.width*scale);canvas.height=Math.round(renderer.domElement.height*scale);
 canvas.getContext('2d').drawImage(renderer.domElement,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/png');
}
$('feedback-form').onsubmit=async event=>{
 event.preventDefault();if(!online||working()||submitting||uploading)return;
 const text=$('feedback').value.trim();if(!text){$('feedback').focus();return;}
 submitting=true;lastRequest=$('feedback').value;buttons();status('Capturing your current view…','working');
 try{
  const response=await api('revise',{text,baseRevision:state.current.id,referenceIds:[...included],view:{camera:camera.position.toArray(),target:controls.target.toArray(),mode,selectedPartId},screenshot:viewportCapture()});
  state.job=response.job;status(response.job.message,'working');
 }catch(error){status(error.message,'failed');}finally{submitting=false;buttons();}
};
$('feedback').onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('feedback-form').requestSubmit();}};
$('cancel').onclick=async()=>{try{$('cancel').disabled=true;await api('cancel',{});status('Cancelling this revision…','working');}catch(error){status(error.message,'failed');$('cancel').disabled=false;}};
$('parts').onchange=()=>setSelection($('parts').value);
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>preset(button.dataset.view);
$('reset-view').onclick=()=>preset(mode);
$('inspect').onchange=()=>{if(sceneWorkspace){applyLighting();return;}ambient.intensity=$('inspect').checked?3:1.2;key.intensity=$('inspect').checked?3.5:2.1;};
$('wire').onchange=()=>model?.traverse(o=>{if(o.isMesh)for(const material of materialList(o))material.wireframe=$('wire').checked;});
$('close-reference').onclick=()=>$('reference-dialog').close();
$('reference-dialog').onclick=event=>{if(event.target===$('reference-dialog'))$('reference-dialog').close();};
async function addFiles(files){
 if(!online||uploading)return;uploading=true;buttons();
 try{
  for(const file of files){
   if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose PNG, JPEG or WebP images.');
   if(file.size>25*1024*1024)throw Error('Please choose images smaller than 25 MB.');
   const bitmap=await createImageBitmap(file);
   const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   const dataUrl=canvas.toDataURL('image/jpeg',.92);
   const next=await api('references',{name:file.name.slice(0,150),dataUrl}),ref=next.references.at(-1);if(included.size<6)included.add(ref.id);acceptState(next);status(`Added ${file.name}.`);
  }
 }catch(error){status(error.message,'failed');}finally{uploading=false;$('reference-files').value='';buttons();}
}
$('reference-files').onchange=event=>addFiles([...event.target.files]);
const dropzone=$('dropzone');dropzone.onclick=()=>$('reference-files').click();dropzone.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();$('reference-files').click();}};
for(const name of ['dragenter','dragover'])dropzone.addEventListener(name,event=>{event.preventDefault();dropzone.classList.add('dragging');});
for(const name of ['dragleave','drop'])dropzone.addEventListener(name,event=>{event.preventDefault();dropzone.classList.remove('dragging');});
dropzone.addEventListener('drop',event=>addFiles([...event.dataTransfer.files]));
// Prevent dropped reference files from navigating away from the workspace.
function preventFileNavigation(event){if(event.dataTransfer.types.includes('Files'))event.preventDefault();}
function dropFiles(event){if(event.dataTransfer.types.includes('Files')){event.preventDefault();if(!dropzone.contains(event.target))void addFiles([...event.dataTransfer.files]);}}
window.addEventListener('dragover',preventFileNavigation);window.addEventListener('drop',dropFiles);
$('download').onclick=async()=>{
 const exportModel=buildModel(design);$('download').disabled=true;
 try{const bytes=await new GLTFExporter().parseAsync(exportModel,{binary:true}),url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'})),link=document.createElement('a');link.href=url;link.download=`${sceneWorkspace?'outside-arena':'maze-wall'}-revision-${state?.current.id??0}.glb`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 catch(error){status(`Export failed: ${error.message}`,'failed');}finally{disposeModel(exportModel);buttons();}
};
let pointerDown;
renderer.domElement.addEventListener('pointerdown',event=>{pointerDown={x:event.clientX,y:event.clientY};});
renderer.domElement.addEventListener('pointerup',event=>{
 if(!pointerDown||Math.hypot(event.clientX-pointerDown.x,event.clientY-pointerDown.y)>5||event.button!==0||!model)return;
 const rect=renderer.domElement.getBoundingClientRect(),point=new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(point,camera);
 const hit=ray.intersectObjects(model.children,true)[0];setSelection(hit?.object.userData.partId??'');
});
const resize=()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();};
const observer=new ResizeObserver(resize);observer.observe(host);resize();
const renderFrame=()=>{controls.update();renderer.render(scene,camera);};
renderer.setAnimationLoop(renderFrame);
window.wallStudy={scene,camera,preset,get model(){return model;},get design(){return design;},get state(){return state;},get selectedPartId(){return selectedPartId;}};
async function boot(){
 try{acceptState(await api('state'));void poll();}
 catch(error){
  online=false;
  try{applyModel(await (await fetch(seedUrl)).json(),true);}catch(failure){$('model-loading').textContent=`Model could not load: ${failure.message}`;}
  status(error.message,'failed');buttons();
  // A stale or restarting Vite process must not leave this page offline forever.
  if(!disposed)pollTimer=setTimeout(poll,1500);
 }
}
void boot();
function cleanup(){disposed=true;window.removeEventListener('dragover',preventFileNavigation);window.removeEventListener('drop',dropFiles);removeEventListener('pagehide',onPageHide);removeEventListener('pageshow',onPageShow);clearTimeout(pollTimer);observer.disconnect();renderer.setAnimationLoop(null);controls.dispose();if(selection){selection.geometry.dispose();selection.material.dispose();}if(model)disposeModel(model);floor.geometry.dispose();floor.material.dispose();key.shadow?.dispose();renderer.dispose();}
function onPageHide(event){if(event.persisted){clearTimeout(pollTimer);renderer.setAnimationLoop(null);}else cleanup();}
function onPageShow(event){if(event.persisted&&!disposed){renderer.setAnimationLoop(renderFrame);void poll();}}
addEventListener('pagehide',onPageHide);addEventListener('pageshow',onPageShow);
if(import.meta.hot)import.meta.hot.dispose(cleanup);
