import {subtractReliefCuts,clipReliefEdge} from './maze-wall-pattern.js';
import * as T from 'three';
import {contains,subtractAll,edgeCuts} from './wall-cut-polygons.js';
import {seededRandom} from '../game/random.js';
export const MAZE_WALL_DAMAGE=Object.freeze({radiusMeters:1.7,sizeScaleMin:1,sizeScaleMax:3,maxRadiusMeters:4.5,depthMeters:1.05,maxDepthMeters:1.8,growthMeters:.45,edgeMarginMeters:.12,maxCavities:96,fragmentsPerHit:7,maxFragments:84,fragmentSeconds:2.8,gravityMetersPerSecondSquared:9.81});
const local=(face,p)=>({x:(p.x-face.a.x)*face.ux+(p.z+face.a.s)*face.uz,y:p.y});
const world=(face,x,y,depth=0)=>[face.a.x+face.ux*x-face.nx*depth,y,-face.a.s+face.uz*x+face.ns*depth];
/** Shallow presentation-only cavities: the solid maze collision prisms stay intact. */
export class MazeWallDamage{
 constructor(scene,slabs,seams){
  this.scene=scene;this.slabs=slabs;this.seams=seams;this.faces=slabs.userData.damageFaces;
  this.original=slabs.geometry;this.originalIndex=Uint32Array.from({length:slabs.geometry.attributes.position.count},(_,i)=>i);this.originalSeams=seams.geometry;this.cavities=[];this.fragments=[];this.revision=0;this.dirty=false;
  this.fragmentGeometry=new T.BoxGeometry(1.7,1.3,1.5);
  this.fragmentMaterial=new T.MeshStandardMaterial({color:0x172339,roughness:.85,flatShading:true});
 }
 hit(event){
  if(event.subject!=='surface'||Math.abs(event.normal?.y??1)>.1)return false;
  const p={x:event.x,y:event.y,z:-event.s},C=MAZE_WALL_DAMAGE;
  let face,point;
  for(const candidate of this.faces){
   const plane=(p.x-candidate.a.x)*candidate.nx+(p.z+candidate.a.s)*-candidate.ns;
   if(Math.abs(plane)>.08||candidate.nx*event.normal.x-candidate.ns*event.normal.z<.99)continue;
   const q=local(candidate,p);
   if(q.x<0||q.x>candidate.length||q.y<0||q.y>candidate.height)continue;
   face=candidate;point=q;break;
  }
  if(!face)return false;
  const same=this.cavities.filter(c=>c.face===face);
  let cavity=same.find(c=>Math.hypot(c.x-point.x,c.y-point.y)<c.radius+C.radiusMeters);
  if(!cavity){
   if(this.cavities.length>=C.maxCavities)return false;
   const radius=Math.min(C.radiusMeters,point.x-C.edgeMarginMeters,face.length-point.x-C.edgeMarginMeters,point.y-C.edgeMarginMeters,face.height-point.y-C.edgeMarginMeters);
   if(radius<.25)return false;
   cavity={face,x:point.x,y:point.y,radius:0,depth:0,hits:0,cuts:[]};
   const random=seededRandom((Math.round(event.x*31)^Math.round(event.s*73)^Math.round(event.y*101))>>>0);
   // Overlapping square and elongated hexagonal prisms, each at its own angle.
   cavity.cuts=Array.from({length:3},(_,i)=>{
    const angle=(random()-.5)*Math.PI,co=Math.cos(angle),si=Math.sin(angle);
    const w=.35+random()*.15,h=.48+random()*.22,cx=(random()-.5)*.45,cy=(i-1)*.48;
    const vertices=i===1?[[-w,-h],[w,-h],[w,h],[-w,h]]:
     [[-w,-h*.55],[0,-h],[w,-h*.55],[w,h*.55],[0,h],[-w,h*.55]];
    return {shape:vertices.map(([x,y])=>[cx+x*co-y*si,cy+x*si+y*co]),depthScale:.65+i*.16};
   });
   const bound=Math.max(...cavity.cuts.flatMap(c=>c.shape.map(([x,y])=>Math.hypot(x,y))));
   for(const cut of cavity.cuts)cut.shape=cut.shape.map(([x,y])=>[x/bound,y/bound]);
   cavity.sizeScale=C.sizeScaleMin+random()*(C.sizeScaleMax-C.sizeScaleMin);
   this.cavities.push(cavity);
  }
  const limit=Math.min(C.maxRadiusMeters*cavity.sizeScale,cavity.x-C.edgeMarginMeters,face.length-cavity.x-C.edgeMarginMeters,cavity.y-C.edgeMarginMeters,face.height-cavity.y-C.edgeMarginMeters,...same.filter(c=>c!==cavity).map(c=>Math.hypot(c.x-cavity.x,c.y-cavity.y)-c.radius-C.edgeMarginMeters));
  cavity.radius=Math.min(limit,cavity.hits?cavity.radius+C.growthMeters*cavity.sizeScale:C.radiusMeters*cavity.sizeScale);
  cavity.depth=Math.min(C.maxDepthMeters,cavity.hits?cavity.depth+.18:C.depthMeters,cavity.radius*.7);
  cavity.hits++;this.dirty=true;this.spawnFragments(event,cavity.hits);return true;
 }
 spawnFragments(event,hit){
  const C=MAZE_WALL_DAMAGE,random=seededRandom((Math.round(event.x*123)^Math.round(event.s*321)^hit)>>>0);
  for(let i=0;i<C.fragmentsPerHit;i++){
   if(this.fragments.length>=C.maxFragments){const old=this.fragments.shift();old.mesh.removeFromParent();}
   const mesh=new T.Mesh(this.fragmentGeometry,this.fragmentMaterial),size=.12+random()*.27;
   mesh.scale.set(size,size*(.6+random()),size*(.5+random()));mesh.position.set(event.x,event.y,-event.s);mesh.rotation.set(random()*6,random()*6,random()*6);
   const speed=2+random()*5,n=event.normal;
   this.scene.add(mesh);this.fragments.push({mesh,age:0,velocity:new T.Vector3(n.x*speed+(random()-.5)*3,2+random()*4,n.z*speed+(random()-.5)*3),spin:new T.Vector3(random()*4,random()*4,random()*4)});
  }
 }
 rebuild(){
  const positions=[],colors=[],ids=[],localPositions=[],localIds=[],base=this.original.attributes;
  const damaged=new Map(this.cavities.map(c=>[c.face.start,c.face]));
  const patches=(this.slabs.userData.reliefPatches||[]).filter(p=>damaged.has(p.face.start));
  const removed=[...damaged.keys(),...patches.map(p=>p.start)].sort((a,b)=>a-b);
  const emit=(points,tone,id)=>{for(const p of points){positions.push(...p);colors.push(...tone);ids.push(id);}};
  for(const face of damaged.values()){
   const localStart=positions.length;
   const cavities=this.cavities.filter(c=>c.face===face),outer=[{x:0,y:0},{x:face.length,y:0},{x:face.length,y:face.height},{x:0,y:face.height}];
   const cuts=cavities.flatMap(c=>c.cuts.map(cut=>({depth:c.depth*cut.depthScale,ring:cut.shape.map(([x,y])=>({x:c.x+x*c.radius,y:c.y+y*c.radius}))})));
   const emitPolygon=(polygon,depth,tone)=>{
    for(let j=1;j<polygon.length-1;j++)emit([polygon[0],polygon[j],polygon[j+1]].map(p=>world(face,p.x,p.y,depth)),tone,face.shadowId);
   };
   for(const polygon of subtractAll([outer],cuts.map(c=>c.ring)))emitPolygon(polygon,0,face.tone);
   for(let i=0;i<cuts.length;i++){
    const cut=cuts[i],others=cuts.filter((_,j)=>j!==i);
    // Flat bottoms; deeper overlapping prisms remove the shallower floor.
    const deeper=others.filter(c=>c.depth>cut.depth).map(c=>c.ring);
    for(const polygon of subtractAll([cut.ring],deeper))emitPolygon(polygon,cut.depth,face.tone.map(v=>v*.13));
    for(let j=0;j<cut.ring.length;j++){
     const a=cut.ring[j],b=cut.ring[(j+1)%cut.ring.length],splits=edgeCuts(a,b,others.map(c=>c.ring));
     const at=t=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
     for(let k=1;k<splits.length;k++){
      const mid=at((splits[k-1]+splits[k])/2);
      const startDepth=Math.max(0,...others.filter(c=>contains(c.ring,mid)).map(c=>c.depth));
      if(startDepth>=cut.depth-1e-8)continue;
      const p=at(splits[k-1]),q=at(splits[k]),u=world(face,p.x,p.y,startDepth),v=world(face,q.x,q.y,startDepth),w=world(face,q.x,q.y,cut.depth),z=world(face,p.x,p.y,cut.depth);
      const shelf=Math.abs(b.x-a.x)/Math.hypot(b.x-a.x,b.y-a.y);
      emit([u,v,w,u,w,z],face.tone.map(v=>v*(.22+shelf)),face.shadowId);
     }
    }
   }
   // Cut the same footprint through raised ribs/molding so relief cannot
   // conceal the existing impact cavity. Keep the solid collision wall intact.
   const emitRelief=(polygon,tone)=>{for(let i=1;i<polygon.length-1;i++)emit([polygon[0],polygon[i],polygon[i+1]].map(p=>world(face,p.x,p.y,-p.out)),tone,face.shadowId);};
   for(const patch of patches.filter(p=>p.face===face))for(const polygon of subtractReliefCuts(patch.vertices,cuts.map(c=>c.ring)))emitRelief(polygon,patch.tone);
   for(const box of face.reliefBoxes||[])for(let i=0;i<cuts.length;i++){
    const cut=cuts[i];
    for(let j=0;j<cut.ring.length;j++){
     const edge=clipReliefEdge(cut.ring[j],cut.ring[(j+1)%cut.ring.length],box);if(!edge)continue;
     const [a,b]=edge,side=[{...a,out:0},{...b,out:0},{...b,out:box.out},{...a,out:box.out}];
     for(const polygon of subtractReliefCuts(side,cuts.filter((_,k)=>k!==i).map(c=>c.ring)))emitRelief(polygon,box.tone.map(v=>v*.35));
    }
   }
   localPositions.push(...positions.slice(localStart));localIds.push(...ids.slice(localStart/3));

  }
  const geometry=new T.BufferGeometry();
  for(const [name,extra,size] of [['position',positions,3],['color',colors,3],['shadowWallId',ids,1]]){
   const original=base[name].array,array=new Float32Array(original.length+extra.length);array.set(original);array.set(extra,original.length);geometry.setAttribute(name,new T.BufferAttribute(array,size));
  }
  const indices=new Uint32Array(base.position.count-removed.length*6+positions.length/3);let from=0,offset=0;
  for(const start of removed){indices.set(this.originalIndex.subarray(from,start),offset);offset+=start-from;from=start+6;}
  indices.set(this.originalIndex.subarray(from),offset);offset+=base.position.count-from;
  for(let i=0;i<positions.length/3;i++)indices[offset+i]=base.position.count+i;
  geometry.setIndex(new T.BufferAttribute(indices,1));geometry.boundingSphere=this.original.boundingSphere?.clone()??null;
  if(!geometry.boundingSphere)geometry.computeBoundingSphere();
  geometry.computeVertexNormals();geometry.setAttribute('shadowReceiverNormal',geometry.attributes.normal.clone());
  if(this.slabs.geometry!==this.original)this.slabs.geometry.dispose();this.slabs.geometry=geometry;
  this.slabs.userData.damageReceiver?.geometry.dispose();
  const localGeometry=new T.BufferGeometry();localGeometry.setAttribute('position',new T.Float32BufferAttribute(localPositions,3));localGeometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(localIds,1));
  const receiver=new T.Mesh(localGeometry);receiver.matrix.copy(this.slabs.matrix);receiver.matrixAutoUpdate=false;
  this.slabs.userData.damageReceiver=receiver;
  this.slabs.userData.damagedSourceTriangles=new Set(removed.flatMap(start=>[start/3,start/3+1]));
  this.rebuildSeams();this.revision++;this.dirty=false;
 }
 rebuildSeams(){
  const source=this.originalSeams,attributes=Object.fromEntries(Object.keys(source.attributes).map(k=>[k,[]])),p=source.attributes.position;
  for(let i=0;i<p.count;i+=2){
   const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1);let spans=[[0,1]];
   for(const c of this.cavities)for(const cut of c.cuts){
    const f=c.face,plane=q=>(q.x-f.a.x)*f.nx-(q.z+f.a.s)*f.ns;
    const reach=Math.max(.4,...(f.reliefBoxes||[]).map(box=>box.out+.1));
    if(Math.abs(plane(a))>reach||Math.abs(plane(b))>reach)continue;
    const u=local(f,a),v=local(f,b),ring=cut.shape.map(([x,y])=>({x:c.x+x*c.radius,y:c.y+y*c.radius}));
    // Split at every boundary crossing: stepped outlines are concave.
    const dx=v.x-u.x,dy=v.y-u.y,cuts=[0,1];
    for(let j=0;j<ring.length;j++){
     const a=ring[j],b=ring[(j+1)%ring.length],ex=b.x-a.x,ey=b.y-a.y,den=dx*ey-dy*ex;
     if(Math.abs(den)<1e-9)continue;
     const ax=a.x-u.x,ay=a.y-u.y,t=(ax*ey-ay*ex)/den,q=(ax*dy-ay*dx)/den;
     if(t>0&&t<1&&q>=0&&q<=1)cuts.push(t);
    }
    cuts.sort((a,b)=>a-b);
    const inside=(x,y)=>{
     let result=false;
     for(let j=0,k=ring.length-1;j<ring.length;k=j++){
      const a=ring[j],b=ring[k];
      if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)result=!result;
     }
     return result;
    };
    for(let j=1;j<cuts.length;j++){
     const enter=cuts[j-1],leave=cuts[j],mid=(enter+leave)/2;
     if(!inside(u.x+dx*mid,u.y+dy*mid))continue;
     spans=spans.flatMap(([lo,hi])=>leave<=lo||enter>=hi?[[lo,hi]]:[[lo,Math.max(lo,enter)],[Math.min(hi,leave),hi]].filter(([x,y])=>y-x>1e-8));
    }

   }
   for(const span of spans)for(const t of span)for(const [name,values] of Object.entries(attributes)){
    const attr=source.attributes[name];for(let k=0;k<attr.itemSize;k++)values.push(attr.array[i*attr.itemSize+k]*(1-t)+attr.array[(i+1)*attr.itemSize+k]*t);
   }
  }
  const geometry=new T.BufferGeometry();for(const [name,values] of Object.entries(attributes))geometry.setAttribute(name,new T.Float32BufferAttribute(values,source.attributes[name].itemSize));geometry.computeBoundingSphere();
  if(this.seams.geometry!==this.originalSeams)this.seams.geometry.dispose();this.seams.geometry=geometry;
 }
 update(dt){
  if(this.dirty)this.rebuild();
  const C=MAZE_WALL_DAMAGE;
  for(const f of this.fragments){f.age+=dt;f.velocity.y-=C.gravityMetersPerSecondSquared*dt;f.mesh.position.addScaledVector(f.velocity,dt);f.mesh.rotation.x+=f.spin.x*dt;f.mesh.rotation.y+=f.spin.y*dt;
   if(f.mesh.position.y<.1){f.mesh.position.y=.1;f.velocity.y=Math.abs(f.velocity.y)*.25;f.velocity.x*=.7;f.velocity.z*=.7;}
   f.mesh.scale.multiplyScalar(f.age>C.fragmentSeconds-.4?Math.exp(-dt*10):1);
  }
  this.fragments=this.fragments.filter(f=>{if(f.age<C.fragmentSeconds)return true;f.mesh.removeFromParent();return false;});
 }
 clear(){
  this.slabs.userData.damageReceiver?.geometry.dispose();this.slabs.userData.damageReceiver=null;
  for(const f of this.fragments)f.mesh.removeFromParent();this.fragments=[];this.cavities=[];this.dirty=false;
  if(this.slabs.geometry!==this.original){this.slabs.geometry.dispose();this.slabs.geometry=this.original;this.revision++;}
  if(this.seams.geometry!==this.originalSeams){this.seams.geometry.dispose();this.seams.geometry=this.originalSeams;}
 }
 dispose(){this.clear();this.fragmentGeometry.dispose();this.fragmentMaterial.dispose();}
}
