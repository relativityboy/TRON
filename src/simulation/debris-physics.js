import * as THREE from 'three';
import {DEBRIS_DAMAGE} from './debris-damage.js';
import {optionalPhysicsBackend} from './optional-physics.js';
import {JavascriptDebrisPhysics} from './debris-physics-js.js';
import {DEBRIS_PHYSICS} from './debris-physics-config.js';
export {DEBRIS_PHYSICS} from './debris-physics-config.js';

let RAPIER=null;
export const debrisPhysicsReady=optionalPhysicsBackend().then(backend=>{RAPIER=backend;return backend;});
const rotation=new THREE.Quaternion(),rotationMatrix=new THREE.Matrix4(),rotatedCenter=new THREE.Vector3();
const SCENERY=0x00010002,DEBRIS=0x00020005,VEHICLE=0x00040002;
export class DebrisPhysics {
 constructor(nearbyWalls=()=>[]){
  if(!RAPIER)return new JavascriptDebrisPhysics(nearbyWalls);
  this.backend='rapier';
  this.nearbyWalls=nearbyWalls;this.world=new RAPIER.World({x:0,y:-DEBRIS_PHYSICS.gravityMetersPerSecondSquared,z:0});
  this.world.timestep=DEBRIS_PHYSICS.step;this.world.integrationParameters.maxCcdSubsteps=4;
  this.world.numSolverIterations=8;
  this.world.integrationParameters.normalizedAllowedLinearError=.001;
  this.targets=new Map();this.colliderOwners=new Map();this.impacts=[];this.queue=new RAPIER.EventQueue(true);
  this.nextPieceId=0;this.pieces=new Set();this.walls=new Set();this.time=0;this.accumulator=0;
  this.world.createCollider(RAPIER.ColliderDesc.cuboid(100000,10,100000).setTranslation(0,-10,0).setCollisionGroups(SCENERY));
 }
 add(piece,gravity=DEBRIS_PHYSICS.gravityMetersPerSecondSquared){
  const box=new THREE.Box3();
  for(const mesh of piece.group.children)if(mesh.isMesh&&!mesh.userData.breakupExclude){mesh.geometry.computeBoundingBox();box.union(mesh.geometry.boundingBox);}
  piece.collider={center:box.getCenter(new THREE.Vector3()),half:box.getSize(new THREE.Vector3()).multiplyScalar(.5)};
  piece.debrisId=++this.nextPieceId;piece.hitTimes=new Map();piece.gravity=gravity;piece.startTime=this.time+(piece.delay||0);piece.sleeping=false;
  piece.previousPosition=piece.group.position.clone();piece.previousRotation=piece.group.quaternion.clone();
  this.pieces.add(piece);
 }
 activate(piece){
  const {group,velocity,spin,collider}=piece,p=group.position,c=collider.center,h=collider.half;
  piece.body=this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x,p.y,p.z).setRotation(group.quaternion)
   .setLinvel(velocity.x,velocity.y,velocity.z).setAngvel(spin).setGravityScale(piece.gravity/DEBRIS_PHYSICS.gravityMetersPerSecondSquared)
   .setLinearDamping(0).setAngularDamping(DEBRIS_PHYSICS.angularDamping).setCcdEnabled(true));
  const shape=this.world.createCollider(RAPIER.ColliderDesc.cuboid(Math.max(.02,h.x),Math.max(.02,h.y),Math.max(.02,h.z)).setTranslation(c.x,c.y,c.z)
   .setDensity(DEBRIS_DAMAGE.density).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS).setFriction(DEBRIS_PHYSICS.friction).setRestitution(DEBRIS_PHYSICS.restitution).setCollisionGroups(DEBRIS),piece.body);
  piece.shape=shape;this.colliderOwners.set(shape.handle,{piece});
 }
 syncVehicles(targets){
  const keys=new Set(targets.map(t=>t.key));
  for(const [key,t] of this.targets)if(!keys.has(key)){
   for(const shape of t.shapes)this.colliderOwners.delete(shape.handle);
   this.world.removeRigidBody(t.body);this.targets.delete(key);
  }
  for(const data of targets){
   let t=this.targets.get(data.key);
   const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),data.yaw);
   if(!t){
    const body=this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(data.x,data.y,data.z).setRotation(q));
    t={body,shapes:[]};this.targets.set(data.key,t);
    for(const box of data.boxes){
     const shape=this.world.createCollider(RAPIER.ColliderDesc.cuboid(...box.half).setTranslation(...box.center).setCollisionGroups(VEHICLE),body);
     t.shapes.push(shape);this.colliderOwners.set(shape.handle,{target:t});
    }
   }
   if(!this.pieces.size){t.body.setTranslation({x:data.x,y:data.y,z:data.z},true);t.body.setRotation(q,true);}
   t.data=data;t.start={...t.body.translation()};t.rotationStart=new THREE.Quaternion().copy(t.body.rotation());t.rotationEnd=q;
   data.boxes.forEach((box,i)=>t.shapes[i].setTranslationWrtParent({x:box.center[0],y:box.center[1],z:box.center[2]}));
  }
 }
 collectImpacts(){
  const hits=new Map();
  this.queue.drainCollisionEvents((a,b,started)=>{
   if(!started)return;
   const first=this.colliderOwners.get(a),second=this.colliderOwners.get(b);
   const piece=first?.piece||second?.piece,target=first?.target||second?.target;
   if(!piece||!target||this.time-(piece.hitTimes.get(target.data.key)??-Infinity)<DEBRIS_DAMAGE.recontactSeconds)return;
   this.world.contactPair(piece.shape,this.world.getCollider(first?.target?a:b),(manifold,flipped)=>{
    if(!manifold.numSolverContacts())return;
    const point=manifold.solverContactPoint(0),normal=new THREE.Vector3().copy(manifold.normal()).multiplyScalar(flipped?-1:1);
    const arm=new THREE.Vector3().copy(point).sub(piece.preCenter);
    const velocity=new THREE.Vector3().crossVectors(piece.preSpin,arm).add(piece.preVelocity).sub(new THREE.Vector3().copy(target.data.velocity));
    const targetArm=new THREE.Vector3().copy(point).sub(new THREE.Vector3().copy(target.body.worldCom()));
    velocity.sub(new THREE.Vector3().crossVectors(new THREE.Vector3().copy(target.body.angvel()),targetArm));
    const closing=Math.max(0,velocity.dot(normal));
    const energy=.5*piece.body.mass()*closing*closing;
    if(energy<=DEBRIS_DAMAGE.thresholdJoules)return;
    // A compound vehicle may start multiple contacts with one piece at once.
    let perPiece=hits.get(piece);if(!perPiece){perPiece=new Map();hits.set(piece,perPiece);}
    if(energy>(perPiece.get(target.data.key)?.energy||0))perPiece.set(target.data.key,{target:target.data.key,energy,point:{...point}});
   });
  });
  for(const [piece,targets] of hits)for(const [key,hit] of targets){piece.hitTimes.set(key,this.time);this.impacts.push(hit);}
 }
 drainImpacts(){return this.impacts.splice(0);}
 addWall(wall){
  if(this.walls.has(wall))return;this.walls.add(wall);
  for(const edges of wall.triangles||[wall.edges]){
   // Local coordinates avoid loss of precision on distant maze instances.
   const origin=edges[0].a,vertices=[];
   for(const edge of edges)for(const y of [0,wall.height])vertices.push(edge.a.x-origin.x,y,-edge.a.s+origin.s);
   const shape=RAPIER.ColliderDesc.convexHull(new Float32Array(vertices));
   if(shape)this.world.createCollider(shape.setTranslation(origin.x,0,-origin.s).setCollisionGroups(SCENERY).setFriction(DEBRIS_PHYSICS.friction));
  }
 }
 update(dt){
  if(!this.pieces.size){this.accumulator=0;return;}
  this.accumulator+=Math.min(dt,DEBRIS_PHYSICS.maxFrame);
  const step=DEBRIS_PHYSICS.step;
  const totalSteps=Math.floor((this.accumulator+1e-10)/step);let substep=0;
  while(this.accumulator+1e-10>=step){
   const fraction=++substep/totalSteps;
   for(const t of this.targets.values()){
    t.body.setNextKinematicTranslation({x:t.start.x+(t.data.x-t.start.x)*fraction,y:t.start.y+(t.data.y-t.start.y)*fraction,z:t.start.z+(t.data.z-t.start.z)*fraction});
    t.body.setNextKinematicRotation(rotation.copy(t.rotationStart).slerp(t.rotationEnd,fraction));
   }
   for(const p of this.pieces){
    if(!p.body){
     // Sections not yet detached still travel with their destroyed vehicle.
     if(this.time+1e-10<p.startTime){
      if(p.inheritedVelocity)p.group.position.addScaledVector(p.inheritedVelocity,step);
      continue;
     }
     this.activate(p);
    }
    // Rapier's generic damping also slows vertical free fall. Damp only the
    // horizontal axes so heavy detached parts retain Earth-gravity acceleration.
    if(!p.body.isSleeping()){
     const velocity=p.body.linvel(),drag=1/(1+DEBRIS_PHYSICS.horizontalDampingPerSecond*step);
     p.body.setLinvel({x:velocity.x*drag,y:velocity.y,z:velocity.z*drag},false);
    }
    p.preVelocity=new THREE.Vector3().copy(p.body.linvel());p.preSpin=new THREE.Vector3().copy(p.body.angvel());p.preCenter=new THREE.Vector3().copy(p.body.worldCom());
    const position=p.body.translation();p.previousPosition.copy(position);p.previousRotation.copy(p.body.rotation());
    const reach=p.collider.center.length()+p.collider.half.length()+p.velocity.length()*step+1;
    if(!p.body.isSleeping())for(const wall of this.nearbyWalls(position.x,-position.z,reach))this.addWall(wall);
   }
   this.world.step(this.queue);this.collectImpacts();this.time+=step;this.accumulator=Math.max(0,this.accumulator-step);
  }
  const alpha=this.accumulator/step;
  for(const p of this.pieces)if(p.body){
   p.group.position.copy(p.previousPosition).lerp(p.body.translation(),alpha);
   p.group.quaternion.copy(p.previousRotation).slerp(rotation.copy(p.body.rotation()),alpha);
   // Contact solvers allow tiny overlaps; interpolating a tumbling corner can
   // dip below the plane too. Keep the displayed box above the floor without
   // altering Rapier's velocities, contact impulses or angular momentum.
   rotationMatrix.makeRotationFromQuaternion(p.group.quaternion);
   const e=rotationMatrix.elements,h=p.collider.half;
   rotatedCenter.copy(p.collider.center).applyQuaternion(p.group.quaternion);
   const bottom=p.group.position.y+rotatedCenter.y-(Math.abs(e[1])*h.x+Math.abs(e[5])*h.y+Math.abs(e[9])*h.z);
   if(bottom<0)p.group.position.y-=bottom;
   p.velocity.copy(p.body.linvel());p.spin.copy(p.body.angvel());p.sleeping=p.body.isSleeping();
  }
 }
 observations(){
  return [...this.pieces].map(p=>{
   const q=p.body?p.body.rotation():p.group.quaternion;
   rotationMatrix.makeRotationFromQuaternion(rotation.copy(q));
   const e=rotationMatrix.elements,h=p.collider.half;
   const ex=Math.abs(e[0])*h.x+Math.abs(e[4])*h.y+Math.abs(e[8])*h.z;
   const ey=Math.abs(e[1])*h.x+Math.abs(e[5])*h.y+Math.abs(e[9])*h.z;
   const ez=Math.abs(e[2])*h.x+Math.abs(e[6])*h.y+Math.abs(e[10])*h.z;
   const center=rotatedCenter.copy(p.collider.center).applyQuaternion(rotation).add(p.body?p.body.translation():p.group.position);
   const v=p.body?p.body.linvel():p.velocity;
   return {id:p.debrisId,x:center.x,s:-center.z,y:center.y,vx:v.x,vs:-v.z,vy:v.y,
    radius:Math.hypot(ex,ez),halfHeight:ey,gravity:p.gravity,sleeping:!!p.sleeping};
  });
 }
 remove(piece){if(piece.body){this.colliderOwners.delete(piece.shape.handle);this.world.removeRigidBody(piece.body);piece.body=null;}this.pieces.delete(piece);}
 clear(){for(const piece of this.pieces)this.remove(piece);this.syncVehicles([]);this.impacts=[];this.queue.clear();this.accumulator=0;this.time=0;}
 dispose(){this.clear();this.queue.free();this.world.free();}
}
