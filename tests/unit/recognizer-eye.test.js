import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {tagRecognizerEye} from '../../src/rendering/recognizer-eye.js';
import {tagRecognizerBlocks} from '../../src/rendering/recognizer-blocks.js';

test('only the lower crown rectangle receives the yellow eye mask in the actual model',async()=>{
 const bytes=await readFile(new URL('../../assets/runtime/models/tron_1982_recognizer.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(scene),center=bounds.getCenter(new T.Vector3()),scale=30/(bounds.max.y-bounds.min.y);
 const transform=new T.Matrix4().makeTranslation(0,-22,0).multiply(new T.Matrix4().makeScale(scale,scale,scale)).multiply(new T.Matrix4().makeTranslation(-center.x,-bounds.min.y,-center.z));
 const meshes=[];scene.traverse(m=>{if(m.isMesh){m.geometry.applyMatrix4(new T.Matrix4().multiplyMatrices(transform,m.matrixWorld));meshes.push(m);}});
 tagRecognizerBlocks(meshes);const originals=meshes.map(m=>m.geometry.attributes.position.array.slice());
 assert.equal(tagRecognizerEye(meshes),4);let selected=0,upper=0;
 for(const [k,m] of meshes.entries()){
  assert.deepEqual(m.geometry.attributes.position.array,originals[k]);
  const p=m.geometry.attributes.position,mask=m.geometry.attributes.recognizerEye;
  if(mask)for(let i=0;i<p.count;i++){
   if(mask.getX(i)){selected++;assert(p.getY(i)>=7.35&&p.getY(i)<=7.61);}
   if(p.getY(i)>7.65){upper++;assert.equal(mask.getX(i),0);}
  }
  m.geometry.dispose();m.material.dispose();
 }
 assert.equal(selected,12);assert(upper>0);
});
