import test from 'node:test';
import assert from 'node:assert/strict';
import * as maze from '../../src/levels/blueprint-maze.js';
test('traced islands triangulate without filling concave notches',()=>{
 assert.equal(maze.WALLS.length,20);
 for(const w of maze.WALLS){
  const polygonArea=Math.abs(w.points.reduce((a,p,i)=>{const q=w.points[(i+1)%w.points.length];return a+p.x*q.s-q.x*p.s;},0))/2;
  const triangleArea=w.triangles.reduce((area,edges)=>{const [a,b,c]=edges.map(e=>e.a);return area+Math.abs((b.x-a.x)*(c.s-a.s)-(b.s-a.s)*(c.x-a.x))/2;},0);
  assert.ok(Math.abs(polygonArea-triangleArea)<1e-6);
 }
 const notch=maze.pixelToWorld([435,120]);assert.equal(maze.wallAt(notch.x,notch.s),false);
 assert.equal(maze.wallIntersection({...notch,y:10},{...notch,y:11}),null);
 const solid=maze.pixelToWorld([350,50]);assert.equal(maze.wallAt(solid.x,solid.s),true);
 assert.equal(maze.wallIntersection({...solid,y:10},{...solid,y:11}),0);
 assert.equal(maze.wallIntersection({...solid,y:60},{...solid,y:70}),null);
});
test('point occupancy and triangulated visibility agree throughout the blueprint',()=>{
 for(let y=4;y<941;y+=17)for(let x=4;x<1672;x+=17){
  const p=maze.pixelToWorld([x,y]);assert.equal(maze.wallIntersection({...p,y:10},{...p,y:11})!==null,maze.wallAt(p.x,p.s));
 }
});
test('spawn and navigation samples clear traced walls',()=>{
 assert.ok(maze.freePosition(maze.SPAWN.x,maze.SPAWN.s,3.5));
 for(let y=980;y>=865;y-=2){const p=maze.pixelToWorld([1288,y]);assert.ok(maze.freePosition(p.x,p.s,3.5));}
 assert.ok(maze.OPEN_CELLS.length>200);
 for(const p of maze.OPEN_CELLS)assert.ok(maze.freePosition(p.x,p.s,4));
});


test('initial tank position is half a maze width outside the southern boundary',()=>{
 assert.ok(Math.abs((-maze.FLOOR_HALF[1]-maze.SPAWN.s)-maze.HALF)<1e-8);
 for(let s=maze.SPAWN.s;s< -maze.FLOOR_HALF[1];s+=10)assert.ok(maze.freePosition(maze.SPAWN.x,s,3.5));
});

test('central labyrinth preserves courtyard, holes and matching collision triangles',async()=>{
 const lab=await import('../../src/levels/labyrinth-maze.js');
 assert.equal(lab.WALLS.length,116);
 const area=points=>Math.abs(points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p.x*q.s-q.x*p.s;},0))/2;
 for(const w of lab.WALLS){
  const roof=area(w.points)-w.holes.reduce((sum,h)=>sum+area(h),0);
  const triangles=w.triangles.reduce((sum,t)=>sum+area(t.map(e=>e.a)),0);
  assert.ok(Math.abs(roof-triangles)<1e-5);
 }
 const court=lab.pixelToWorld([724,514]);assert.ok(lab.freePosition(court.x,court.s,250));
 const {groundRoute}=await import('../../src/simulation/ground-routing.js');
 const route=groundRoute(lab.pixelToWorld([724,1100]),court,{world:lab,cellMeters:12,maxIterations:100000,detourMeters:4000,longRange:true});
 assert.ok(route.length>0);assert.deepEqual(route.at(-1),court);
 for(let y=5;y<1086;y+=23)for(let x=5;x<1448;x+=23){const p=lab.pixelToWorld([x,y]);assert.equal(lab.wallIntersection({...p,y:10},{...p,y:11})!==null,lab.wallAt(p.x,p.s));}
});

test('fifth maze fits between four grid-aligned outer sites and participates in gameplay',async()=>{
 const {createScenario}=await import('../../src/levels/scenario.js'),{createRun}=await import('../../src/simulation/run.js');
 for(const seed of [0,42,1982,99999]){
  const {world}=createScenario({layout:'blueprint',layoutSeed:seed,centralLabyrinth:true});
  const center=world.MAZE_INSTANCES[4];assert.equal(center.kind,'labyrinth');
  assert.equal(world.MAZE_INSTANCES.length,5);
  for(const m of world.MAZE_INSTANCES){assert.equal(Math.abs(m.x%24),0);assert.equal(Math.abs(m.s%24),0);}
  for(const m of world.MAZE_INSTANCES.slice(0,4)){
   const a=m.bounds,b=center.bounds;
   assert.ok(a.maxX+200<b.minX||b.maxX+200<a.minX||a.maxS+200<b.minS||b.maxS+200<a.minS,'exterior clearance');
  }
  const r=createRun(1982,world);assert.equal(r.dataBeams.length,5);assert.equal(r.teleportPads.length,0);
  assert.equal(r.enemyTanks.filter(e=>e.mazeId===4&&!e.boss).length,24);
  for(const p of r.teleportPads)assert.ok(world.freePosition(p.x,p.s,34));
  assert.equal(r.recognizers.filter(e=>e.mazeId===4).length,6);
  const {inPatrolRegion}=await import('../../src/levels/patrol-region.js');
  for(const units of [r.enemyTanks,r.recognizers])for(const e of units.filter(e=>e.mazeId===4&&!e.boss))assert.ok(inPatrolRegion(e,center));
  const b=r.dataBeams[4];assert.equal(b.x,center.beamPosition.x);assert.equal(b.s,center.beamPosition.s);assert.ok(world.freePosition(b.x,b.s,20));
 }
});
