import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {appendWallPattern,appendWallPatternEdges,wallPatternBoxes,MAZE_WALL_PATTERN as P} from '../../src/rendering/maze-wall-pattern.js';
import {createOutlineMaze} from '../../src/levels/outline-maze.js';
import {createWorld} from '../../src/rendering/world.js';
import {MazeWallDamage} from '../../src/rendering/maze-wall-damage.js';
function fixture(){
 const map=createOutlineMaze({shapes:[{outline:[[0,0],[108,0],[108,24],[0,24]]}],size:[108,24],metersPerPixel:1});map.MAZE_INSTANCES=[{x:0,s:0,angle:0}];
 const scene=new T.Scene(),world=createWorld(scene,map),face=world.slabs.userData.damageFaces.find(f=>f.ns===-1&&f.length===108);
 return {scene,map,world,face,dispose(){scene.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});}};
}
test('revision 7 wall pattern retains rib spacing, projection and raised molding proportions',()=>{
 const boxes=wallPatternBoxes(108,54),ribs=boxes.filter(b=>b.kind==='rib'),molding=boxes.find(b=>b.kind==='molding');
 assert.equal(ribs.length,3);assert.deepEqual(ribs.map(b=>[b.left,b.right]),[[9,27],[45,63],[81,99]]);
 assert(ribs.every(b=>b.out===.73125&&b.top===53.75&&b.bottom===0));assert.equal((molding.top+molding.bottom)/2,8.1);assert(Math.abs(molding.top-molding.bottom-2.7)<1e-8);assert.equal(molding.out,.9140625);
 const half=wallPatternBoxes(54,27);assert.equal(half[0].out,P.ribProjectionMeters*P.reliefDepthScale/2);assert.equal(half[0].top,53.75/2);
 for(const length of [.1,1,5,17,36,109])for(const box of wallPatternBoxes(length,54)){assert(box.left>=0&&box.right<=length);assert(box.right>box.left);}
});
test('wall pattern is actual raised geometry and preserves map collision and solid shadow casters',()=>{
 const f=fixture();try{
  assert(f.world.slabs.userData.reliefPatches.length>0);
  const ray=new T.Raycaster(new T.Vector3(-36,15,25),new T.Vector3(0,0,-1));f.world.slabs.updateMatrixWorld();assert(Math.abs(ray.intersectObject(f.world.slabs)[0].point.z-12.73125)<1e-5);
  const cast=f.world.slabs.userData.shadowPositions;assert(Math.max(...cast.filter((_,i)=>i%3===2))<=12);
  assert(f.map.freePosition(-36,-13,0));assert(!f.map.freePosition(-36,-11.9,0));assert.equal(f.map.WALL_HEIGHT,54);
  const ids=f.world.slabs.geometry.attributes.shadowWallId;assert.equal(ids.count,f.world.slabs.geometry.attributes.position.count);
 }finally{f.dispose();}
});
test('impact cavities cut through both ribs and molding, remain sealed, and reset restores the pattern',()=>{
 for(const y of [15,8.1]){
  const f=fixture(),damage=new MazeWallDamage(f.scene,f.world.slabs,f.world.seams);try{
   const original=f.world.slabs.geometry;assert(damage.hit({subject:'surface',x:-36,y,s:-12,normal:{x:0,y:0,z:1}}));damage.update(0);f.world.slabs.updateMatrixWorld();
   const hits=new T.Raycaster(new T.Vector3(-36,y,25),new T.Vector3(0,0,-1)).intersectObject(f.world.slabs);assert(hits.length);assert(hits[0].point.z<11.5,'raised surface must not cover cavity');
   for(let dx=-3;dx<=3;dx+=.35)for(let dy=-2;dy<=2;dy+=.35){const hits=new T.Raycaster(new T.Vector3(-36+dx,y+dy,25),new T.Vector3(0,0,-1)).intersectObject(f.world.slabs);assert(hits.length,'cut must remain sealed by the base cavity');}
   for(const value of f.world.slabs.geometry.attributes.position.array)assert(Number.isFinite(value));
   assert(f.world.slabs.userData.damagedSourceTriangles.size>2,'changed relief triangles must leave the original shadow overlay');
   damage.clear();assert.equal(f.world.slabs.geometry,original);assert(new T.Raycaster(new T.Vector3(-36,y,25),new T.Vector3(0,0,-1)).intersectObject(f.world.slabs)[0].point.z>=12.73125-1e-5);
  }finally{damage.dispose();f.dispose();}
 }
});
test('faint facade outlines contain no diagonal wireframe and break across impact cavities',()=>{
 const f=fixture(),damage=new MazeWallDamage(f.scene,f.world.slabs,f.world.seams);
 try{
  const seams=f.world.seams,p=seams.geometry.attributes.position;
  assert.equal(seams.material.depthTest,true);assert.equal(seams.material.depthWrite,false);assert.equal(seams.material.toneMapped,false);assert(seams.material.opacity<.7);
  let selected=0;
  for(let i=0;i<p.count;i+=2){const dx=p.getX(i+1)-p.getX(i),dy=p.getY(i+1)-p.getY(i),dz=p.getZ(i+1)-p.getZ(i);assert(Math.abs(dy)<1e-5||Math.hypot(dx,dz)<1e-5,'no diagonal triangulation outlines');if(Math.abs(p.getX(i)+45)<1e-4&&Math.abs(p.getZ(i)-12.75625)<1e-4&&Math.abs(dy)>40)selected++;}
  assert.equal(selected,1,'rib edge is one continuous vertical stroke');
  assert(damage.hit({subject:'surface',x:-45,y:15,s:-12,normal:{x:0,y:0,z:1}}));damage.update(0);
  const q=seams.geometry.attributes.position;let spans=0;
  for(let i=0;i<q.count;i+=2)if(Math.abs(q.getX(i)+45)<1e-4&&Math.abs(q.getX(i+1)+45)<1e-4&&Math.abs(q.getZ(i)-12.75625)<1e-4){spans++;assert(!(Math.min(q.getY(i),q.getY(i+1))<15&&Math.max(q.getY(i),q.getY(i+1))>15),'outline must not bridge the cavity');}
  assert.equal(spans,2);damage.clear();assert.equal(seams.geometry.attributes.position.count,p.count);
 }finally{damage.dispose();f.dispose();}
});

test('molding and outlines meet at convex, concave and oblique corners without end caps',()=>{
 for(const polygon of [[[0,0],[100,0],[100,100],[0,100]],[[0,0],[100,0],[100,40],[40,40],[40,100],[0,100]],[[0,0],[100,0],[140,70],[0,100]]]){
  const faces=polygon.map(([x,s],i)=>{const [bx,bs]=polygon[(i+1)%polygon.length],length=Math.hypot(bx-x,bs-s),ux=(bx-x)/length,us=(bs-s)/length;return {a:{x,s},b:{x:bx,s:bs},length,ux,uz:-us,nx:us,ns:-ux,mazeId:0,height:54,shadowId:i};});
  let index=0;const patches=appendWallPattern({faces,damageFaces:faces,height:54,quad:()=>{const start=index;index+=6;return start;},wallTone:[.01,.02,.03],roofTone:[.03,.07,.19]});
  const point=(face,x,out)=>[face.a.x+face.ux*x+face.nx*out,-face.a.s+face.uz*x-face.ns*out];
  for(let i=0;i<faces.length;i++){
   const a=faces[i],b=faces[(i+1)%faces.length],ba=a.reliefBoxes.find(p=>p.kind==='molding'),bb=b.reliefBoxes.find(p=>p.kind==='molding');
   assert.equal(ba.left,0);assert.equal(ba.right,a.length);assert(!ba.leftEnd&&!ba.rightEnd);
   const pa=point(a,ba.frontRight,ba.out),pb=point(b,bb.frontLeft,bb.out);assert(Math.hypot(pa[0]-pb[0],pa[1]-pb[1])<1e-8);
   assert(patches.some(p=>p.face===a&&p.vertices.some(v=>v.x===ba.frontRight&&v.out===ba.out)));
  }
  const lines=[];appendWallPatternEdges(faces,(a,b)=>lines.push([a,b]));
  const height=(P.moldingCenterMeters+P.moldingHeightMeters/2);
  const band=lines.filter(([a,b])=>Math.abs(a[1]-height)<1e-8&&Math.abs(b[1]-height)<1e-8);
  assert.equal(band.length,faces.length);
  for(let i=0;i<band.length;i++){const end=band[i][1],start=band[(i+1)%band.length][0];assert(Math.hypot(...end.map((v,j)=>v-start[j]))<1e-8);}
 }
});
