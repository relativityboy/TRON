import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createStaticWallShadowGeometry} from '../../src/rendering/static-wall-shadows.js';
import {shadeMazeEdges} from '../../src/rendering/maze-edge-shadows.js';
test('neighboring wall IDs on the same rounded plane cannot cast false triangles',()=>{
 for(const offset of [0,7000]){
  const receiverGeometry=new T.PlaneGeometry(40,30).toNonIndexed();receiverGeometry.translate(offset,15,-offset);
  receiverGeometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(6).fill(1),1));
  const receiver=new T.Mesh(receiverGeometry);
  const caster=new T.PlaneGeometry(40,30).toNonIndexed();caster.translate(offset,15,-offset-.0005);
  caster.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(6).fill(2),1));
  const shadows=createStaticWallShadowGeometry(receiver,caster);assert.equal(shadows.attributes.position.count,0);
  shadows.dispose();caster.dispose();receiverGeometry.dispose();receiver.material.dispose();
 }
});
test('projecting ledge caps and outlines inherit the wall shade beyond its solid corner',()=>{
 const caster=new T.BoxGeometry(20,54,20).toNonIndexed();caster.translate(0,27,0);
 caster.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(caster.attributes.position.count).fill(1),1));
 // A miter tip extends past z=-10. Its own upward normal faces the sun,
 // and a sun ray misses the prism, but it belongs to the shaded +X facade.
 const cap=new T.BufferGeometry();cap.setAttribute('position',new T.Float32BufferAttribute([10,9,-12,11,9,-12,11,9,-14,10,9,-12,11,9,-14,10,9,-14],3));
 cap.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(6).fill(1),1));
 const receiver=new T.Mesh(cap),unmarked=createStaticWallShadowGeometry(receiver,caster,{selfShade:true});
 assert.equal(unmarked.attributes.position.count,0);
 cap.setAttribute('shadowSelfShadeNormal',new T.Float32BufferAttribute([1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0],3));
 const shaded=createStaticWallShadowGeometry(receiver,caster,{selfShade:true});
 assert.equal(shaded.attributes.position.count,6,'the complete cap uses the existing shadow union');
 cap.attributes.shadowSelfShadeNormal.array.fill(0);for(let i=0;i<6;i++)cap.attributes.shadowSelfShadeNormal.setX(i,-1);
 const lit=createStaticWallShadowGeometry(receiver,caster,{selfShade:true});assert.equal(lit.attributes.position.count,0,'sun-facing facade stays lit');
 const line=new T.BufferGeometry();line.setAttribute('position',new T.Float32BufferAttribute([11,9,-12,11,9,-14],3));line.setAttribute('shadowSelfShadeNormal',new T.Float32BufferAttribute([1,0,0,1,0,0],3));
 const edges=shadeMazeEdges(line,[],54,.6);assert([...edges.attributes.color.array].every(v=>Math.abs(v-.4)<1e-6),'the outline must not repaint a bright edge over the shaded cap');
 for(const g of [caster,cap,unmarked,shaded,lit,line,edges])g.dispose();receiver.material.dispose();
});
test('closed slab faces turned away from the light self-shade, while roofs and sun-facing sides remain lit',()=>{
 const geometry=new T.BoxGeometry(20,54,20).toNonIndexed();geometry.translate(0,27,0);geometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1),1));
 const receiver=new T.Mesh(geometry),shadow=createStaticWallShadowGeometry(receiver,geometry,{selfShade:true});
 try{
  const p=geometry.attributes.position,n=geometry.attributes.normal,source=shadow.attributes.sourceTriangle,counts=new Map();
  for(let i=0;i<source.count;i++)counts.set(source.getX(i),(counts.get(source.getX(i))||0)+1);
  for(let i=0;i<p.count;i+=3){const away=n.getX(i)*.5-n.getY(i)+n.getZ(i)*.5>1e-7;assert.equal(counts.get(i/3)||0,away?3:0);}
 }finally{shadow.dispose();geometry.dispose();receiver.material.dispose();}
});
