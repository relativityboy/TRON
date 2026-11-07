import * as T from 'three';
import {CLU_WEAPON} from '../game/config.js';
// Reference: user-supplied bulltets.m4v / bullets2.m4v. Visual dimensions in m.
export const CLU_BOLT=Object.freeze({capacity:80,headLengthMeters:1.25,headWidthMeters:.32,trailLengthMeters:7.5,barbs:8,barbWidthMeters:.44,spineWidthMeters:.07,headColor:0xe1e8e8,trailColor:0x8796ad});
function trailGeometry(){
 const c=CLU_BOLT,positions=[];
 const triangle=(a,b,d)=>positions.push(...a,...b,...d);
 const width=c.spineWidthMeters,length=c.trailLengthMeters;
 triangle([-width,0,-length],[width,0,-length],[width,0,0]);triangle([-width,0,-length],[width,0,0],[-width,0,0]);
 for(let i=0;i<c.barbs;i++){
  const front=-(i+.35)*length/c.barbs,back=front-.68*length/c.barbs,w=c.barbWidthMeters*(.65+.35*i/c.barbs);
  // Discrete triangular shoulders leave the stepped, finned silhouette in the
  // film, rather than a continuous glowing beam or a smoke-particle trail.
  triangle([0,0,front],[0,0,back],[w,0,back]);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
export class CluCannonBolts {
 constructor(scene){
  const c=CLU_BOLT;this.root=new T.Group();this.root.name='Clu pale finned cannon shots';scene.add(this.root);
  const headGeometry=new T.SphereGeometry(.5,10,6);headGeometry.scale(c.headWidthMeters,c.headWidthMeters,c.headLengthMeters);headGeometry.translate(0,0,-c.headLengthMeters/2);
  this.heads=new T.InstancedMesh(headGeometry,new T.MeshBasicMaterial({color:new T.Color(c.headColor).multiplyScalar(1.65)}),c.capacity);
  this.trails=new T.InstancedMesh(trailGeometry(),new T.MeshBasicMaterial({color:c.trailColor,side:T.DoubleSide}),c.capacity);
  for(const m of [this.heads,this.trails]){m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);this.root.add(m);}
  this.forward=new T.Vector3();this.right=new T.Vector3();this.up=new T.Vector3();this.toCamera=new T.Vector3();this.position=new T.Vector3();this.basis=new T.Matrix4();this.matrix=new T.Matrix4();this.scale=new T.Vector3();this.rotation=new T.Quaternion();
 }
 update(projectiles,camera){
  const c=CLU_BOLT;let count=0;
  for(const p of projectiles){
   if(p.faction==='enemy'||p.life<=0||count>=c.capacity)continue;
   const speed=this.forward.set(p.vx,p.vy,-p.vs).length();if(speed<1e-6)continue;
   this.forward.multiplyScalar(1/speed);this.position.set(p.x,p.y,-p.s);
   this.toCamera.subVectors(camera.position,this.position);
   this.right.crossVectors(this.toCamera,this.forward);
   if(this.right.lengthSq()<1e-8){this.right.crossVectors(camera.up,this.forward);if(this.right.lengthSq()<1e-8)this.right.set(1,0,0);}
   this.right.normalize();this.up.crossVectors(this.forward,this.right).normalize();this.basis.makeBasis(this.right,this.up,this.forward);this.rotation.setFromRotationMatrix(this.basis);
   this.scale.set(1,1,1);this.matrix.compose(this.position,this.rotation,this.scale);this.heads.setMatrixAt(count,this.matrix);
   // Grow behind the muzzle only as far as the shot has actually travelled.
   const travel=Math.max(0,(CLU_WEAPON.lifetime-p.life)*speed),length=Math.min(c.trailLengthMeters,travel);
   this.scale.set(1,1,length/c.trailLengthMeters);this.matrix.compose(this.position,this.rotation,this.scale);this.trails.setMatrixAt(count,this.matrix);count++;
  }
  this.heads.count=this.trails.count=count;this.heads.instanceMatrix.needsUpdate=this.trails.instanceMatrix.needsUpdate=true;
 }
}
