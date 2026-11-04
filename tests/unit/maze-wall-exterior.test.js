import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createOutlineMaze} from '../../src/levels/outline-maze.js';
import {createMazeWorld} from '../../src/levels/maze-world.js';
import {createWorld} from '../../src/rendering/world.js';
import {exteriorWallFace,wallFaceGap} from '../../src/rendering/maze-wall-exterior.js';
function fixture(){
 const base=createOutlineMaze({shapes:[{outline:[[0,0],[108,0],[108,24],[0,24]]},{outline:[[0,60],[108,60],[108,84],[0,84]]}],size:[108,84],metersPerPixel:1});
 const geometry=createMazeWorld(base,1982,4),world={...base,...geometry,MAZE_INSTANCES:geometry.instances,WALLS:geometry.walls};
 const scene=new T.Scene(),rendered=createWorld(scene,world);return {world,scene,rendered,dispose(){scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}};
}
test('canyon-facing walls keep the pattern while outward faces remain flat at every rotated site',()=>{
 const f=fixture();try{
  assert(f.world.instances.some(m=>m.angle!==0));let outside=0,inside=0;
  for(const face of f.rendered.slabs.userData.damageFaces){
   if(exteriorWallFace(face,f.world.instances)){outside++;assert(!face.reliefBoxes?.length,'outside face must have no ribs or molding');}
   else{inside++;assert(face.reliefBoxes?.length,'opposing canyon face must retain the accepted pattern');}
  }
  assert.equal(outside,24);assert.equal(inside,8);
  assert.equal(new Set(f.rendered.slabs.userData.reliefPatches.map(p=>p.face)).size,inside);
 }finally{f.dispose();}
});
test('an outward-facing notch is still a canyon when another wall opposes it',()=>{
 const face={mazeId:0,a:{x:10,s:10},b:{x:10,s:30},nx:1,ns:0};
 const wall={edges:[{a:{x:30,s:0},b:{x:30,s:40}}]};
 assert.equal(exteriorWallFace(face,[{id:0,x:0,s:0,walls:[wall]}]),false);
 assert.equal(exteriorWallFace(face,[{id:0,x:0,s:0,walls:[{edges:[]}]}]),true);
 // A distant site must never classify another maze's outer face as internal.
 assert.equal(exteriorWallFace(face,[{id:0,x:0,s:0,walls:[{edges:[]}]},{id:1,x:500,s:0,walls:[wall]}]),true);
});

test('narrow opposing-wall gaps omit all relief while wide corridors retain it at rotated sites',()=>{
 for(const gap of [12,23,25,36]){
  const base=createOutlineMaze({shapes:[{outline:[[0,0],[108,0],[108,24],[0,24]]},{outline:[[0,24+gap],[108,24+gap],[108,48+gap],[0,48+gap]]}],size:[108,48+gap],metersPerPixel:1});
  const geometry=createMazeWorld(base,1982,4),map={...base,...geometry,MAZE_INSTANCES:geometry.instances,WALLS:geometry.walls},scene=new T.Scene(),rendered=createWorld(scene,map);
  try{
   const canyon=rendered.slabs.userData.damageFaces.filter(f=>!exteriorWallFace(f,map.MAZE_INSTANCES));assert.equal(canyon.length,8);
   for(const face of canyon){assert(Math.abs(wallFaceGap(face,map.MAZE_INSTANCES)-gap)<1e-6);assert.equal(!!face.reliefBoxes?.length,gap>=24);}
  }finally{scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
 }
});
