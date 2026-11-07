import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {CluCannonBolts,CLU_BOLT} from '../../src/rendering/clu-cannon-bolts.js';
import {CLU_WEAPON} from '../../src/game/config.js';
test('Clu bolt trail grows only with travel, ignores hostile shots and clears on reset',()=>{
 const scene=new T.Scene(),bolts=new CluCannonBolts(scene),camera=new T.PerspectiveCamera();camera.position.set(0,0,20);
 const p={x:0,y:0,s:0,vx:0,vy:0,vs:165,life:CLU_WEAPON.lifetime};
 const matrix=new T.Matrix4(),position=new T.Vector3(),rotation=new T.Quaternion(),scale=new T.Vector3();
 bolts.update([p,{...p,faction:'enemy'}],camera);assert.equal(bolts.heads.count,1);bolts.trails.getMatrixAt(0,matrix);assert.equal(Math.hypot(...matrix.elements.slice(8,11)),0);
 p.life-=.01;bolts.update([p],camera);bolts.trails.getMatrixAt(0,matrix);matrix.decompose(position,rotation,scale);assert(Math.abs(scale.z-1.65/CLU_BOLT.trailLengthMeters)<1e-6);
 p.life-=1;bolts.update(Array(CLU_BOLT.capacity+10).fill(p),camera);assert.equal(bolts.heads.count,CLU_BOLT.capacity);assert([...bolts.heads.instanceMatrix.array].every(Number.isFinite));
 bolts.update([],camera);assert.equal(bolts.heads.count,0);assert.equal(bolts.trails.count,0);
 scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
