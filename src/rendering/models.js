import {tagRecognizerEye,configureRecognizerEye,RECOGNIZER_EYE} from './recognizer-eye.js';
import {yieldToBrowser} from '../loading/yield-to-browser.js';
import {createBossTank} from './boss-tank.js';
import {RECOGNIZER_TINTS} from '../game/recognizer-appearance.js';
import * as THREE from 'three';
import {tagRecognizerBlocks} from './recognizer-blocks.js';
import { TANK } from '../game/tank.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const glow = (color) => new THREE.MeshBasicMaterial({ color });

// The downloaded source remains unmodified; Vite emits it as a local build asset.
const tankUrl = new URL('../../assets/runtime/models/tank_-_tron_1982.glb', import.meta.url).href;

export async function createTank() {
  const {scene} = await new GLTFLoader().loadAsync(tankUrl);
  await yieldToBrowser();
  scene.updateMatrixWorld(true);
  const root = new THREE.Group(), turret = new THREE.Group(), barrel = new THREE.Group();
  root.name = 'Tank - Tron (1982) by arabinowitz';
  turret.position.set(...TANK.pivot); root.add(turret); turret.add(barrel);
  // FBX export faces +Z. Bake its nested transforms, center the hull, turn it
  // toward -Z and scale uniformly; keep the original silhouette and proportions.
  const normalize = new THREE.Matrix4().makeScale(-TANK.scale,TANK.scale,-TANK.scale)
    .multiply(new THREE.Matrix4().makeTranslation(-TANK.sourceCenter[0],-TANK.sourceFloor,-TANK.sourceCenter[1]));
  const parts = [...scene.getObjectByName('RootNode').children];
  for (const part of parts) {
    const number = Number(part.name.replace('polySurface',''));
    const moving = number <= 13;
    part.traverse(mesh => {
      if (!mesh.isMesh) return;
      mesh.geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(normalize,mesh.matrixWorld));
      if (moving) mesh.geometry.translate(-TANK.pivot[0],-TANK.pivot[1],-TANK.pivot[2]);
    });
  }
  const meshes = [];
  scene.traverse(o => { if (o.isMesh) meshes.push(o); });
  for (const mesh of meshes) {
    const moving = Number(mesh.parent.name.replace('polySurface','')) <= 13;
    mesh.position.set(0,0,0); mesh.quaternion.identity(); mesh.scale.setScalar(1);
    (moving ? barrel : root).add(mesh);
  }
  const materials = new Set(meshes.map(m=>m.material));
  for (const material of materials) {
    // Tank trim is painted red in the reference, not luminous like the aircraft.
    if (material.name.includes('Red_Emission')) {
      material.color.setHex(material.name==='Gun_Red_Emission' ? 0x681819 : 0xa32619); material.emissive.setHex(0x000000); material.emissiveIntensity=0;
      material.roughness=.7;
    } else if (material.name==='White_Emission') {
      material.color.setHex(0xa5d8eb); material.emissive.setHex(0x89dcff); material.emissiveIntensity=.05;
    } else if (material.name==='Wheels') {
      material.color.setHex(0x89601a); material.roughness=.65;
      material.onBeforeCompile=shader=>{
        shader.vertexShader='varying float vShoulder;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvShoulder=smoothstep(.05,.8,normal.y);');
        shader.fragmentShader='varying float vShoulder;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(.045,1.,vShoulder);');
      };
    } else if (material.name.includes('Body_Black')) {
      const shaded=new THREE.MeshPhongMaterial({name:material.name,
        color:material.name.startsWith('Upper') ? 0x070b10 : 0x090e14,
        specular:material.name.startsWith('Upper') ? 0x7ed9f2 : 0x1a4356,shininess:48,side:THREE.DoubleSide});
      for(const mesh of meshes) if(mesh.material===material)mesh.material=shaded;
      material.dispose();
    }
  }
  // A crisp projected silhouette gives the tank the grounded, graphic shadow
  // in the film. Draw after the floor and before all opaque vehicles/walls.
  // No depth comparison against the almost coplanar floor: precision varies
  // greatly across this world and polygon offset alone cannot prevent flicker.
  // Two shared batches follow hull and turret independently.
  const shadowMaterial=new THREE.ShaderMaterial({
    transparent:false,depthTest:false,depthWrite:false,blending:THREE.NoBlending,side:THREE.DoubleSide,
    vertexShader:`void main(){vec4 world=modelMatrix*vec4(position,1.);world.xz+=vec2(.5,.5)*world.y;world.y=.025;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:'void main(){gl_FragColor=vec4(0.,.001,.004,1.);}'
  });
  for(const parent of [root,barrel]) {
    const pieces=meshes.filter(m=>m.parent===parent).map(m=>{
      const g=new THREE.BufferGeometry();g.setAttribute('position',m.geometry.getAttribute('position').clone());
      if(m.geometry.index)g.setIndex(m.geometry.index.clone());
      if(g.index){const flat=g.toNonIndexed();g.dispose();return flat;}return g;
    });
    const geometry=mergeGeometries(pieces);pieces.forEach(g=>g.dispose());
    const shadow=new THREE.Mesh(geometry,shadowMaterial);shadow.frustumCulled=false;shadow.renderOrder=-1;shadow.userData.breakupExclude=true;parent.add(shadow);
  }
  const flash = new THREE.Mesh(new THREE.SphereGeometry(.36,12,8),glow(0xe0faff));
  flash.position.set(...TANK.muzzle.map((v,i)=>v-TANK.pivot[i]));
  flash.visible=false;flash.userData.breakupExclude=true; barrel.add(flash);
  const turboTrim=[...new Set(meshes.filter(m=>m.material.name==='Wheels_Red_Emission').map(m=>m.material))];
  return {root,turret,barrel,flash,tracks:[],turboTrim,source:'arabinowitz'};
}

const recognizerUrl = new URL('../../assets/runtime/models/tron_1982_recognizer.glb', import.meta.url).href;

export async function loadRecognizer() {
  const {scene} = await new GLTFLoader().loadAsync(recognizerUrl);
  await yieldToBrowser();
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(scene), center = bounds.getCenter(new THREE.Vector3());
  // Match the simulation's shoulder origin: feet -22, crown +8 before
  // RECOGNIZER_SCALE is applied. Preserve the downloaded model's proportions.
  const scale = 30 / (bounds.max.y-bounds.min.y);
  const transform = new THREE.Matrix4().makeTranslation(0,-22,0)
    .multiply(new THREE.Matrix4().makeScale(scale,scale,scale))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
  const root = new THREE.Group(), meshes = [];
  scene.traverse(mesh => {
    if (!mesh.isMesh) return;
    mesh.geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(transform,mesh.matrixWorld));
    meshes.push(mesh);
  });
  tagRecognizerBlocks(meshes);
  const eyeTriangles=tagRecognizerEye(meshes);
  root.userData.eyeTriangles=eyeTriangles;
  const legs=[new THREE.Group(),new THREE.Group()];
  legs.forEach((leg,i)=>{leg.name=i?'right-leg':'left-leg';root.add(leg);});
  for (const mesh of meshes) {
    if(mesh.material.name==='Base') {
      mesh.material.color.setHex(RECOGNIZER_TINTS.black); mesh.material.roughness=.65;
    } else mesh.material.emissiveIntensity=.8;
    // The GLB is two material meshes, not a rig. Split whole triangles at the
    // shoulder seam, retaining the original normals, UVs and luminous trim.
    const source=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
    const buckets=[[],[],[]],p=source.attributes.position;
    for(let i=0;i<p.count;i+=3) {
      const maxY=Math.max(p.getY(i),p.getY(i+1),p.getY(i+2));
      const x=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3;
      buckets[maxY< -5.3&&Math.abs(x)>9?(x<0?1:2):0].push(i,i+1,i+2);
    }
    buckets.forEach((indices,bucket)=>{
      if(!indices.length)return;
      const geometry=new THREE.BufferGeometry();
      for(const [name,attr] of Object.entries(source.attributes)) {
        const values=new Float32Array(indices.length*attr.itemSize);
        indices.forEach((index,j)=>{for(let k=0;k<attr.itemSize;k++)values[j*attr.itemSize+k]=attr.array[index*attr.itemSize+k];});
        geometry.setAttribute(name,new THREE.BufferAttribute(values,attr.itemSize));
      }
      (bucket?legs[bucket-1]:root).add(new THREE.Mesh(geometry,mesh.material));
    });
    source.dispose();mesh.geometry.dispose();
  }
  return root;
}

export function createRecognizer(template, {tintColor=RECOGNIZER_TINTS.black,eyeColor=RECOGNIZER_EYE.color}={}) {
  const root=template.clone(true);
  let material;const materials=new Map();
  root.traverse(mesh=>{
    if(!mesh.isMesh)return;
    // Each aircraft can flash on impact independently; geometry stays shared.
    if(!materials.has(mesh.material))materials.set(mesh.material,mesh.material.clone());
    mesh.material=materials.get(mesh.material);
    if(mesh.material.name==='Base') material=mesh.material;
  });
  // Project the actual solid parts onto the floor, using the same light
  // direction and draw ordering as the tanks. Parenting follows the folding rig.
  const shadowMaterial=new THREE.ShaderMaterial({
    transparent:false,depthTest:false,depthWrite:false,blending:THREE.NoBlending,side:THREE.DoubleSide,
    vertexShader:`void main(){vec4 world=modelMatrix*vec4(position,1.);world.xz+=vec2(.5,.5)*max(0.,world.y);world.y=.025;gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader:'void main(){gl_FragColor=vec4(0.,.001,.004,1.);}'
  });
  const solids=[];root.traverse(mesh=>{if(mesh.isMesh&&mesh.material.name==='Base')solids.push(mesh);});
  for(const mesh of solids){
    const shadow=new THREE.Mesh(mesh.geometry,shadowMaterial);
    shadow.name='recognizer-ground-shadow';shadow.frustumCulled=false;shadow.renderOrder=-1;
    shadow.userData.breakupExclude=true;mesh.add(shadow);
  }
  const legs=[root.getObjectByName('left-leg'),root.getObjectByName('right-leg')];
  function pose(fold) {
    const t=THREE.MathUtils.clamp(fold,0,1),smooth=t*t*(3-2*t);
    legs.forEach((leg,i)=>{
      const side=i?1:-1,angle=side*smooth*Math.PI;
      leg.rotation.y=angle;
      // Rotate around each leg's center while the mounts slide inward.
      leg.position.set(side*15*(1-Math.cos(angle))-side*13*smooth,0,side*15*Math.sin(angle));
    });
  }
  const eye=configureRecognizerEye(material,eyeColor);
  const setTintColor=color=>material.color.set(color);
  setTintColor(tintColor);
  return {root,material,legs,pose,setTintColor,...eye};
}

// Release a completed sibling load if the other file fails.
export async function loadVehicles() {
  const results=await Promise.allSettled([createTank(),loadRecognizer(),createBossTank()]);
  const failure=results.find(r=>r.status==='rejected');
  if(failure) {
    for(const result of results) if(result.status==='fulfilled') {
      const root=result.value.root || result.value;
      const geometries=new Set(), materials=new Set();
      root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
      geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    }
    throw new Error('Unable to load the vehicle models. Please reload the page.', {cause:failure.reason});
  }
  return results.map(r=>r.value);
}

// Share geometry, but isolate enemy materials from player turbo and tuning.
export function cloneEnemyTank(source){
 const root=source.root.clone(true),mapping=new Map();
 function pair(a,b){mapping.set(a,b);a.children.forEach((c,i)=>pair(c,b.children[i]));}
 pair(source.root,root);
 const materials=new Map();
 root.traverse(o=>{
   if(!o.material)return;
   const original=o.material;
   if(!materials.has(original)){
     const m=original.clone();m.onBeforeCompile=original.onBeforeCompile;
     materials.set(original,m);
   }
   o.material=materials.get(original);
 });
 return {root,turret:mapping.get(source.turret),barrel:mapping.get(source.barrel),flash:mapping.get(source.flash),tracks:[],source:source.source};
}
