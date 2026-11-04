import * as THREE from 'three';
import {validateModel} from './design-schema.js';
export function buildModel(design){
 validateModel(design);
 const group=new THREE.Group();group.name=design.name;group.userData={units:'meters',status:'User-directed low-poly wall study; not integrated into gameplay'};
 const materials=new Map(design.materials.map(m=>[m.id,new THREE.MeshStandardMaterial({name:m.id,color:m.color,roughness:m.roughness,metalness:0})]));
 for(const part of design.parts){
  let geometry;
  if(part.kind==='box')geometry=new THREE.BoxGeometry(...part.size).toNonIndexed();
  else{
   const shape=new THREE.Shape(part.points.map(([a,b])=>new THREE.Vector2(a,part.plane==='xz'?-b:b)));
   geometry=new THREE.ExtrudeGeometry(shape,{depth:part.depth,steps:1,bevelEnabled:false,curveSegments:1});
   if(part.plane==='xz')geometry.rotateX(-Math.PI/2);
   if(part.plane==='yz')geometry.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
  }
  geometry.clearGroups();
  const normal=geometry.attributes.normal;
  // Contiguous groups avoid an exported GLB primitive for every triangle.
  for(let i=0;i<normal.count;i+=3){
   const index=normal.getY(i)>.15?1:0,last=geometry.groups.at(-1);
   if(last?.materialIndex===index)last.count+=3;else geometry.addGroup(i,3,index);
  }
  const mesh=new THREE.Mesh(geometry,[materials.get(part.material),materials.get(part.topMaterial)]);
  mesh.name=part.name;mesh.userData.partId=part.id;mesh.position.fromArray(part.position);mesh.rotation.fromArray([...part.rotation,'XYZ']);group.add(mesh);
 }
 return group;
}
export function disposeModel(model){const geometries=new Set(),materials=new Set();model.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
