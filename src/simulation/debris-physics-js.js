import * as T from 'three';
import {DEBRIS_PHYSICS as C} from './debris-physics-config.js';
const SETTLE={speedMetersPerSecond:.35,spinRadiansPerSecond:.2,contactDragPerSecond:7,contactSpinDragPerSecond:5,surfaceOffsetMeters:.001};
const matrix=new T.Matrix4(),center=new T.Vector3(),half=new T.Vector3(),normal=new T.Vector3(),delta=new T.Quaternion(),axis=new T.Vector3();
function bounds(piece){
 matrix.makeRotationFromQuaternion(piece.group.quaternion);const e=matrix.elements,h=piece.collider.half;
 half.set(Math.abs(e[0])*h.x+Math.abs(e[4])*h.y+Math.abs(e[8])*h.z,Math.abs(e[1])*h.x+Math.abs(e[5])*h.y+Math.abs(e[9])*h.z,Math.abs(e[2])*h.x+Math.abs(e[6])*h.y+Math.abs(e[10])*h.z);
 center.copy(piece.collider.center).applyQuaternion(piece.group.quaternion).add(piece.group.position);
}
// A swept, axis-aligned box against each convex wall prism. Rotation is visual;
// this is a simpler scenery solver, not Rapier's rigid-body/vehicle contact solver.
function wallHit(wall,start,end,extent){
 let best=null;
 for(const edges of wall.triangles||[wall.edges]){
  let enter=0,leave=1,hitNormal=null,startsInside=true;
  const clip=(d0,d1,limit,n)=>{
   if(d0>limit+1e-7)startsInside=false;
   const change=d1-d0;if(Math.abs(change)<1e-10){if(d0>limit)leave=-1;return;}
   const t=(limit-d0)/change;if(change<0){if(t>enter){enter=t;hitNormal=n;}}else leave=Math.min(leave,t);
  };
  clip(start.y,end.y,wall.height+extent.y,[0,1,0]);clip(-start.y,-end.y,extent.y,[0,-1,0]);
  for(const edge of edges){const a=edge.a,b=edge.b,length=Math.hypot(b.x-a.x,b.s-a.s);if(!length)continue;
   const nx=edge.nx??(b.s-a.s)/length,ns=edge.ns??-(b.x-a.x)/length;
   clip((start.x-a.x)*nx+(-start.z-a.s)*ns,(end.x-a.x)*nx+(-end.z-a.s)*ns,Math.abs(nx)*extent.x+Math.abs(ns)*extent.z,[nx,0,-ns]);
  }
  if(!startsInside&&hitNormal&&enter<=leave&&enter>=0&&enter<=1&&(!best||enter<best.t))best={t:enter,normal:hitNormal};
 }
 return best;
}
export class JavascriptDebrisPhysics{
 constructor(nearbyWalls=()=>[]){this.backend='javascript';this.world=null;this.nearbyWalls=nearbyWalls;this.pieces=new Set();this.targets=new Map();this.walls=new Set();this.time=0;this.accumulator=0;this.nextPieceId=0;}
 add(piece,gravity=C.gravityMetersPerSecondSquared){
  const box=new T.Box3();for(const mesh of piece.group.children)if(mesh.isMesh&&!mesh.userData.breakupExclude){mesh.geometry.computeBoundingBox();box.union(mesh.geometry.boundingBox);}
  piece.collider={center:box.getCenter(new T.Vector3()),half:box.getSize(new T.Vector3()).multiplyScalar(.5)};
  piece.debrisId=++this.nextPieceId;piece.gravity=gravity;piece.startTime=this.time+(piece.delay||0);piece.sleeping=false;this.pieces.add(piece);
 }
 activate(piece){piece.fallbackActive=true;}
 syncVehicles(targets){this.targets=new Map(targets.map(data=>[data.key,{data}]));}
 addWall(wall){this.walls.add(wall);}
 // Approximate scenery contacts must not invent damaging rigid-body impacts.
 drainImpacts(){return [];}
 update(dt){
  if(!this.pieces.size){this.accumulator=0;return;}
  this.accumulator+=Math.max(0,Math.min(dt,C.maxFrame));
  while(this.accumulator+1e-10>=C.step){
   for(const piece of this.pieces){
    if(this.time+1e-10<piece.startTime){if(piece.inheritedVelocity)piece.group.position.addScaledVector(piece.inheritedVelocity,C.step);continue;}
    if(piece.sleeping)continue;
    this.activate(piece);
    const spin=piece.spin.length();if(spin>1e-9){axis.copy(piece.spin).divideScalar(spin);delta.setFromAxisAngle(axis,spin*C.step);piece.group.quaternion.premultiply(delta).normalize();}
    bounds(piece);const start=center.clone();
    piece.velocity.x/=1+C.horizontalDampingPerSecond*C.step;piece.velocity.z/=1+C.horizontalDampingPerSecond*C.step;
    // Integrate constant gravity without adding mass-dependent acceleration.
    const move=piece.velocity.clone().multiplyScalar(C.step);move.y-=.5*piece.gravity*C.step*C.step;piece.velocity.y-=piece.gravity*C.step;
    const end=start.clone().add(move),reach=half.length()+move.length()+1;let hit=null;
    for(const wall of this.nearbyWalls(start.x,-start.z,reach)){this.addWall(wall);const candidate=wallHit(wall,start,end,half);if(candidate&&(!hit||candidate.t<hit.t))hit=candidate;}
    let touching=false;
    if(hit){normal.fromArray(hit.normal);piece.group.position.addScaledVector(move,Math.max(0,hit.t-1e-6));piece.group.position.addScaledVector(normal,SETTLE.surfaceOffsetMeters);const closing=piece.velocity.dot(normal);if(closing<0)piece.velocity.addScaledVector(normal,-(1+C.restitution)*closing);touching=normal.y>.5;}
    else piece.group.position.add(move);
    bounds(piece);const bottom=center.y-half.y;
    if(bottom<SETTLE.surfaceOffsetMeters){piece.group.position.y+=SETTLE.surfaceOffsetMeters-bottom;if(piece.velocity.y<0)piece.velocity.y*=-C.restitution;touching=true;}
    if(touching){piece.velocity.x*=Math.exp(-SETTLE.contactDragPerSecond*C.step);piece.velocity.z*=Math.exp(-SETTLE.contactDragPerSecond*C.step);piece.spin.multiplyScalar(Math.exp(-SETTLE.contactSpinDragPerSecond*C.step));if(Math.abs(piece.velocity.y)<SETTLE.speedMetersPerSecond)piece.velocity.y=0;
     if(piece.velocity.length()<SETTLE.speedMetersPerSecond&&piece.spin.length()<SETTLE.spinRadiansPerSecond){piece.velocity.set(0,0,0);piece.spin.set(0,0,0);piece.sleeping=true;}
    }else piece.spin.multiplyScalar(Math.exp(-C.angularDamping*C.step));
   }
   this.time+=C.step;this.accumulator=Math.max(0,this.accumulator-C.step);
  }
 }
 observations(){return [...this.pieces].map(piece=>{bounds(piece);return {id:piece.debrisId,x:center.x,s:-center.z,y:center.y,vx:piece.velocity.x,vs:-piece.velocity.z,vy:piece.velocity.y,radius:Math.hypot(half.x,half.z),halfHeight:half.y,gravity:piece.gravity,sleeping:!!piece.sleeping};});}
 remove(piece){this.pieces.delete(piece);piece.fallbackActive=false;}
 clear(){for(const piece of this.pieces)this.remove(piece);this.targets.clear();this.accumulator=0;this.time=0;}
 dispose(){this.clear();this.walls.clear();}
}
