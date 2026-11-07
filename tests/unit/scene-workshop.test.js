import test from 'node:test';
import assert from 'node:assert/strict';
import {startingSceneModel,validateSceneModel,buildSceneWorkshopModel} from '../../studies/outside-arena/workshop-model.js';
import {disposeModel} from '../../studies/maze-wall/build-model.js';
test('scene workshop validates wall proportions and rejects attempts to replace its fixed floor',()=>{
 assert.doesNotThrow(()=>validateSceneModel(startingSceneModel()));
 for(const change of [m=>m.floor={},m=>m.parts.push({...m.parts[0],id:'floor'}),m=>m.parts[0].parameters.heightMeters=NaN,m=>m.parts[0].parameters.portalWidthMeters=25,m=>m.lighting.angleDegrees=100]){const m=startingSceneModel();change(m);assert.throws(()=>validateSceneModel(m));}
});
test('wall and lighting revisions preserve approved floor geometry and transforms',()=>{
 const a=startingSceneModel(),b=structuredClone(a);b.parts[0].parameters.heightMeters=170;b.parts[0].parameters.bayPitchMeters=47.5;b.lighting.angleDegrees=20;
 const first=buildSceneWorkshopModel(a),second=buildSceneWorkshopModel(b);
 try{assert.deepEqual(first.children[0].children[0].geometry.attributes.position.array,second.children[0].children[0].geometry.attributes.position.array);assert.equal(second.userData.lighting.angleDegrees,20);assert.equal(second.children[1].userData.partId,'wall');assert(second.getObjectByName('Blue central wall face with chamfered doorway'),'Doorway stays centered at arbitrary bay spacing');}finally{disposeModel(first);disposeModel(second);}
});
test('independent base/top depths produce a flush base with the original top retained, and old revisions still load',()=>{
 const model=startingSceneModel(),p=model.parts[0].parameters;
 p.pierBaseProjectionMeters=0;p.pierTopProjectionMeters=17;const root=buildSceneWorkshopModel(model);
 try{const g=root.getObjectByName('Tall faceted piers and sloping bay sides').geometry.attributes.position;let floor=0,roof=0;for(let i=0;i<g.count;i++){if(Math.abs(g.getY(i))<1e-6){assert(g.getZ(i)<=-180+1e-5);if(Math.abs(g.getZ(i)+180)<1e-5)floor++;}if(Math.abs(g.getY(i)-150)<1e-6&&Math.abs(g.getZ(i)+163)<1e-5)roof++;}assert(floor>0&&roof>0);}finally{disposeModel(root);}
 delete p.pierBaseProjectionMeters;delete p.pierTopProjectionMeters;assert.doesNotThrow(()=>validateSceneModel(model));const legacy=buildSceneWorkshopModel(model);disposeModel(legacy);
});
test('half-bay offset leaves the doorway through flat wall and keeps the floor fixed',async()=>{
 const {Raycaster,Vector3}=await import('three');const a=startingSceneModel(),b=structuredClone(a);b.parts[0].parameters.pierOffsetMeters=20;b.parts[0].parameters.pierBaseProjectionMeters=0;b.parts[0].parameters.pierTopProjectionMeters=17;
 const first=buildSceneWorkshopModel(a),second=buildSceneWorkshopModel(b);
 try{second.updateMatrixWorld(true);assert(!second.getObjectByName('Blue central wall face with chamfered doorway'));assert.equal(new Raycaster(new Vector3(0,7,-140),new Vector3(0,0,-1),0,80).intersectObject(second).length,0);assert.deepEqual(first.children[0].children[0].geometry.attributes.position.array,second.children[0].children[0].geometry.attributes.position.array);}finally{disposeModel(first);disposeModel(second);}
 const overlap=startingSceneModel();overlap.parts[0].parameters.pierOffsetMeters=4;assert.throws(()=>validateSceneModel(overlap),/doorway clear/);
});
