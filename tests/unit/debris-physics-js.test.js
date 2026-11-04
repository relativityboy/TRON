import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {JavascriptDebrisPhysics} from '../../src/simulation/debris-physics-js.js';
function piece(position=[0,100,0]){const group=new T.Group();group.add(new T.Mesh(new T.BoxGeometry(2,2,2)));group.position.fromArray(position);return {group,velocity:new T.Vector3(),spin:new T.Vector3()};}
function cleanup(physics,...pieces){physics.dispose();for(const p of pieces)p.group.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});}
const wall={height:10,edges:[{x:0,s:-10},{x:1,s:-10},{x:1,s:10},{x:0,s:10}].map((a,i,points)=>({a,b:points[(i+1)%points.length]}))};
test('fallback preserves Earth gravity, horizontal momentum and observations',()=>{
 const physics=new JavascriptDebrisPhysics(),p=piece();p.velocity.set(20,0,30);physics.add(p);
 try{for(let i=0;i<120;i++)physics.update(1/120);assert(Math.abs(p.velocity.y+9.81)<1e-8);assert(Math.abs(p.group.position.y-(100-9.81/2))<1e-8);assert(p.velocity.x<20&&p.velocity.x>17);const [observation]=physics.observations();assert.equal(observation.y,p.group.position.y);assert.equal(observation.vs,-p.velocity.z);assert.equal(observation.gravity,9.81);}finally{cleanup(physics,p);}
});
test('fallback delayed fragments inherit motion, pause, land and settle above the floor',()=>{
 const physics=new JavascriptDebrisPhysics(),p=piece([0,4,0]);p.delay=.1;p.inheritedVelocity=new T.Vector3(40,0,0);p.spin.set(1,.5,.2);physics.add(p);
 try{physics.update(.05);assert(Math.abs(p.group.position.x-2)<1e-6);assert.equal(p.fallbackActive,undefined);const before=p.group.position.clone();physics.update(0);assert(p.group.position.equals(before));for(let i=0;i<2400;i++)physics.update(1/120);assert.equal(p.sleeping,true);p.group.updateMatrixWorld(true);assert(new T.Box3().setFromObject(p.group).min.y>=0);assert.equal(physics.observations()[0].sleeping,true);physics.clear();assert.equal(physics.pieces.size,0);assert.equal(physics.observations().length,0);}finally{cleanup(physics,p);}
});
test('fallback sweeps fast debris against thin walls and roofs',()=>{
 for(const above of [false,true]){const physics=new JavascriptDebrisPhysics(()=>[wall]),p=piece([-8,above?15:5,0]);p.velocity.x=108;physics.add(p,0);
  try{physics.update(.1);if(above){assert(p.group.position.x>1);assert(p.velocity.x>100);}else{assert(p.group.position.x<-.98);assert(p.velocity.x<0);}}finally{cleanup(physics,p);}}
 const physics=new JavascriptDebrisPhysics(()=>[wall]),p=piece([.5,20,0]);p.velocity.y=-200;physics.add(p);
 try{physics.update(.1);assert(p.group.position.y>=11);assert(p.velocity.y>=0);}finally{cleanup(physics,p);}
});
test('fallback does not fabricate vehicle impact damage and clears targets/resources',()=>{
 const physics=new JavascriptDebrisPhysics(),p=piece();physics.add(p);physics.syncVehicles([{key:'clu'}]);assert.deepEqual(physics.drainImpacts(),[]);physics.remove(p);assert.equal(physics.pieces.size,0);physics.clear();assert.equal(physics.targets.size,0);cleanup(physics,p);
});
