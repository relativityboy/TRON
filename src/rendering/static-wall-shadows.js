import * as T from 'three';

// Metres in the light's projection plane. The hash only limits CPU candidates;
// it has no effect on the precision of the clipped shadow boundaries.
const CELL_METERS=64,EPSILON=1e-7,COPLANAR_METERS=.01;
// Lift clipped decals off their receiver before float32 upload. Depth bias alone
// cannot compensate for independently rounded, nearly coplanar triangles.
export const WALL_SHADOW_SURFACE_OFFSET_METERS=.02;
const LIGHT=new T.Vector3(.5,-1,.5);
const dot=(plane,p)=>plane.x*p.x+plane.y*p.y+plane.z*p.z+plane.w;
function planeThrough(a,b,c,inside){
 const n=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a));
 if(n.lengthSq()<1e-16)return null;
 n.normalize();const plane={x:n.x,y:n.y,z:n.z,w:-n.dot(a)};
 if(dot(plane,inside)<0){plane.x*=-1;plane.y*=-1;plane.z*=-1;plane.w*=-1;}
 return plane;
}
function bounds(points){
 const u=points.map(p=>p.x+.5*p.y),v=points.map(p=>p.z+.5*p.y);
 return {minU:Math.min(...u),maxU:Math.max(...u),minV:Math.min(...v),maxV:Math.max(...v),maxY:Math.max(...points.map(p=>p.y)),minY:Math.min(...points.map(p=>p.y))};
}
function cells(b,visit){
 for(let x=Math.floor(b.minU/CELL_METERS);x<=Math.floor(b.maxU/CELL_METERS);x++)for(let z=Math.floor(b.minV/CELL_METERS);z<=Math.floor(b.maxV/CELL_METERS);z++)visit(`${x},${z}`);
}
function clip(points,plane){
 const out=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],da=dot(plane,a),db=dot(plane,b),aIn=da>=-EPSILON,bIn=db>=-EPSILON;
  if(aIn)out.push(a);
  if(aIn!==bIn)out.push(a.clone().lerp(b,Math.max(0,Math.min(1,da/(da-db)))));
 }
 return out;
}
function triangles(geometry,matrix){
 const position=geometry.attributes.position,ids=geometry.attributes.shadowWallId,selfNormals=geometry.attributes.shadowSelfShadeNormal,index=geometry.index,result=[],normalMatrix=new T.Matrix3().getNormalMatrix(matrix);
 for(let offset=0;offset<(index?.count??position.count);offset+=3){
  const indices=[0,1,2].map(i=>index?index.getX(offset+i):offset+i);
  const points=indices.map(i=>new T.Vector3().fromBufferAttribute(position,i).applyMatrix4(matrix));
  const selfNormal=selfNormals?new T.Vector3().fromBufferAttribute(selfNormals,indices[0]).applyMatrix3(normalMatrix).normalize():null;
  result.push({points,id:ids?.getX(indices[0])??0,bounds:bounds(points),selfNormal});
 }
 return result;
}
const casterCache=new WeakMap();
// Each caster triangle sweeps a prism along the light direction. Intersecting
// that prism with a receiver triangle produces an exact planar shadow polygon.
export function createStaticWallShadowGeometry(receiver,casterGeometry,{selfShade=false}={}){
 receiver.updateWorldMatrix(true,false);
 const receivers=triangles(receiver.geometry,receiver.matrixWorld),matrixKey=receiver.matrixWorld.elements.join(',');
 let cached=casterCache.get(casterGeometry);
 if(!cached||cached.matrixKey!==matrixKey){
 const bins=new Map(),casters=triangles(casterGeometry,receiver.matrixWorld);
 for(const caster of casters){
  const [a,b,c]=caster.points,cap=planeThrough(a,b,c,a.clone().add(LIGHT));
  if(!cap||Math.abs(cap.x*LIGHT.x+cap.y*LIGHT.y+cap.z*LIGHT.z)<1e-4)continue;
  caster.planes=[cap,...caster.points.map((p,i)=>planeThrough(p,caster.points[(i+1)%3],p.clone().add(LIGHT),caster.points[(i+2)%3]))];
  if(caster.planes.some(p=>!p))continue;
  cells(caster.bounds,key=>{if(!bins.has(key))bins.set(key,[]);bins.get(key).push(caster);});
 }
 cached={matrixKey,bins};casterCache.set(casterGeometry,cached);
 }
 const bins=cached.bins,positions=[],sourceTriangles=[];
 for(const [sourceTriangle,receiver] of receivers.entries()){
  const candidates=new Set();cells(receiver.bounds,key=>{for(const c of bins.get(key)||[])candidates.add(c);});
  const r=receiver.bounds;
  const [ra,rb,rc]=receiver.points;
  const normal=new T.Vector3().subVectors(rb,ra).cross(new T.Vector3().subVectors(rc,ra)).normalize();
  const lift=normal.clone().multiplyScalar(WALL_SHADOW_SURFACE_OFFSET_METERS);
  // Closed slab faces turned away from the directional light are shielded by
  // their own slab. Use the same stencil-union layer as other wall shadows so
  // overlapping occlusion never multiplies darkness.
  if(selfShade&&receiver.id>0&&(normal.dot(LIGHT)>EPSILON||(receiver.selfNormal?.dot(LIGHT)??0)>EPSILON)){
   for(const p of receiver.points){positions.push(p.x+lift.x,p.y+lift.y,p.z+lift.z);sourceTriangles.push(sourceTriangle);}
   continue;
  }
  for(const caster of candidates){
   if(!selfShade&&receiver.id>0&&caster.id===receiver.id)continue;
   // Adjacent slabs can share a plane but carry different wall IDs. Float32
   // rounding must not turn those coplanar faces into triangle-shaped casters.
   if(receiver.points.every(p=>Math.abs(dot(caster.planes[0],p))<COPLANAR_METERS))continue;
   const c=caster.bounds;
   if(c.maxY<r.minY-EPSILON||c.maxU<r.minU||c.minU>r.maxU||c.maxV<r.minV||c.minV>r.maxV)continue;
   let polygon=receiver.points;
   for(const plane of caster.planes){polygon=clip(polygon,plane);if(polygon.length<3)break;}
   for(let i=1;i+1<polygon.length;i++){
    const [a,b,c]=[polygon[0],polygon[i],polygon[i+1]];
    if(new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).lengthSq()<1e-12)continue;
    for(const p of [a,b,c]){positions.push(p.x+lift.x,p.y+lift.y,p.z+lift.z);sourceTriangles.push(sourceTriangle);}
   }
  }
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('sourceTriangle',new T.Float32BufferAttribute(sourceTriangles,1));geometry.computeBoundingSphere();return geometry;
}
