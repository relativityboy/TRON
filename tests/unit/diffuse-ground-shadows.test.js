import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {DiffuseGroundShadows} from '../../src/rendering/diffuse-ground-shadows.js';
import {MazeShadows} from '../../src/rendering/maze-shadows.js';
import {createScenario} from '../../src/levels/scenario.js';

test('diffuse masks use finite local bounds, preserve source geometry and dispose',()=>{
 const {world:map}=createScenario({layout:'blueprint',siteCount:4,centralLabyrinth:true});
 const root=new T.Group(),slabs=new T.Mesh();root.add(slabs);
 const before=JSON.stringify(map.WALLS);
 const shadows=new DiffuseGroundShadows({slabs},map,.6);
 assert.equal(shadows.tiles.length,map.MAZE_INSTANCES.length);
 for(const t of shadows.tiles){
  assert(t.width>0&&t.height>0);assert.equal(t.mesh.visible,false);
  assert([...t.geometry.attributes.position.array].every(Number.isFinite));
  assert([...t.geometry.attributes.position.array].every(x=>x>=-1.001&&x<=1.001));
  assert.equal(t.mesh.userData.shadowUnionAttenuation,'gl_FragColor.r');
 }
 assert.equal(JSON.stringify(map.WALLS),before);
 shadows.ready=true;shadows.visible=true;assert(shadows.tiles.every(t=>t.mesh.visible));
 shadows.visible=false;assert(shadows.tiles.every(t=>!t.mesh.visible));
 shadows.dispose();assert.equal(root.children.length,1);
});

test('ground shadow fallback ignores inactive time, trips once and permits manual retry',()=>{
 const scene=new T.Scene(),slabs=new T.Mesh(new T.BoxGeometry(5,10,5),new T.MeshBasicMaterial());scene.add(slabs);
 const s=new MazeShadows({slabs},[],{MAZE_INSTANCES:[],MAZE_LENGTH:100,WALL_HEIGHT:10});
 s.diffuseGround.ready=true;
 for(let i=0;i<400;i++)s.monitorGroundShadows(.1,false,true,60);
 assert.equal(s.groundShadowMode,'diffuse');
 for(let i=0;i<400;i++)s.monitorGroundShadows(.1,true,false,60);
 assert.equal(s.groundShadowMode,'diffuse');
 for(let i=0;i<140;i++)s.monitorGroundShadows(.1,true,true,60);
 assert.equal(s.groundShadowMode,'sharp');assert.equal(s.groundShadowReason,'performance');assert(s.floorShadow.visible);
 s.setGroundShadowMode('diffuse');assert.equal(s.groundShadowReason,null);assert.equal(s.floorShadow.visible,false);
 s.setGroundShadowMode('sharp');assert(s.floorShadow.visible);
 s.dispose();slabs.geometry.dispose();slabs.material.dispose();
});


test('the shared shadow switch restores original vehicle uniforms and focused tile',()=>{
 const scene=new T.Scene(),slabs=new T.Mesh(new T.BoxGeometry(20,54,20),new T.MeshBasicMaterial());slabs.position.y=27;scene.add(slabs);
 const clu=new T.Mesh(new T.BoxGeometry(5,3,8),new T.MeshBasicMaterial()),enemy=new T.Mesh(new T.BoxGeometry(5,3,8),new T.MeshBasicMaterial());scene.add(clu,enemy);
 const map={MAZE_INSTANCES:[{x:0,s:0}],MAZE_LENGTH:200,WALL_HEIGHT:54};
 const s=new MazeShadows({slabs},[clu,enemy],map,{sharpReceiver:clu});
 const compile=material=>{const shader={uniforms:{},vertexShader:T.ShaderLib.basic.vertexShader,fragmentShader:T.ShaderLib.basic.fragmentShader};material.onBeforeCompile(shader);return shader;};
 const focused=compile(clu.material),global=compile(enemy.material);
 for(const shader of [focused,global]){
  assert.equal(shader.uniforms.mazeShadowDiffuseEnabled.value,1);
  assert(shader.fragmentShader.includes('uniform vec2 mazeShadowDiffuseSigmaUv[1]'));
  assert(shader.fragmentShader.includes('if(mazeShadowDiffuseEnabled>.5)'));
  assert(shader.fragmentShader.includes('local-samplePosition'));
  assert(!shader.fragmentShader.includes('recShadow'));
 }
 assert.equal(s.sharpShadows.entries[0].camera.right,48);
 s.setGroundShadowMode('sharp');
 assert.equal(s.sharpShadows.entries[0].camera.right,24);
 assert.equal(focused.uniforms.mazeShadowDiffuseEnabled.value,0);assert.equal(global.uniforms.mazeShadowDiffuseEnabled.value,0);
 s.setGroundShadowMode('diffuse');s.diffuseGround.ready=true;
 for(let i=0;i<140;i++)s.monitorGroundShadows(.1,true,true,60);
 assert.equal(focused.uniforms.mazeShadowDiffuseEnabled.value,0);assert.equal(global.uniforms.mazeShadowDiffuseEnabled.value,0);
 assert.equal(s.sharpShadows.entries[0].camera.right,24);
 s.setGroundShadowMode('diffuse');assert.equal(focused.uniforms.mazeShadowDiffuseEnabled.value,1);
 assert.equal(s.sharpLastPosition.x,Infinity);
 s.dispose();for(const mesh of [clu,enemy,slabs]){mesh.geometry.dispose();mesh.material.dispose();}
});
