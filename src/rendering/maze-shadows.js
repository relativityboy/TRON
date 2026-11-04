import {DEFAULT_WORLD,worldFor} from '../levels/scenario.js';
import * as T from 'three';
import {createStaticWallShadowGeometry} from './static-wall-shadows.js';
import {RecognizerShadows} from './recognizer-shadows.js';
// Bias measured in depth-buffer units plus receiver slope. Clipped shadow
// vertices are independently rounded to float32; at distant maze coordinates
// one unit allowed entire patches to alternate with the underlying wall.
export const MAZE_SHADOW_STYLE=Object.freeze({darkness:.6});
const WALL_SHADOW_DEPTH = Object.freeze({factor: -2, units: -4});

// The maze is static: render its depth maps once, independently of moving casters.
export class MazeShadows extends RecognizerShadows{
 constructor(world,vehicles=[],map=DEFAULT_WORLD){
  const {MAZE_INSTANCES,MAZE_LENGTH,WALL_HEIGHT}=map;
  // The decorative facade details can be smaller than a shadow texel. Casting
  // them into the slab's own map creates alternating triangle-shaped patches.
  // Use the shared solid wall prisms for casting, retain relief as receivers.
  const positions=world.slabs.userData.shadowPositions;
  const casterGeometry=positions?new T.BufferGeometry():null;
  if(casterGeometry){casterGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));casterGeometry.setAttribute('shadowWallId',new T.Float32BufferAttribute(world.slabs.userData.shadowIds,1));}
  const caster=casterGeometry?new T.Mesh(casterGeometry):world.slabs;caster.updateMatrixWorld(true);
  const casters=MAZE_INSTANCES.map(m=>{
   const root=new T.Group();root.position.set(m.x,WALL_HEIGHT/2,-m.s);
   return {root,casters:[caster],radius:MAZE_LENGTH*.85,distance:MAZE_LENGTH*2};
  });
  // Floor shadow coverage is exact geometry. Do not cut moving floor shadows
  // with the lower-resolution atlas: its stair steps disagree with this edge.
  if(world.floor)world.floor.userData.exactMazeFloorShadow=true;
  const darkness=MAZE_SHADOW_STYLE.darkness;
  const receivers=[];
  for(const root of vehicles)root.traverse(o=>{if(o.isMesh&&!o.userData.breakupExclude)receivers.push(o);});
  super(casters,receivers,0,{size:2048,prefix:'mazeShadow',darkness,excludeSelf:true,filterEdges:true});
  this.casterGeometry=casterGeometry;if(casterGeometry)caster.material.dispose();
  // Project exact slab geometry onto the floor and multiply its existing color.
  // Stencil bit 0 makes the operation a union: overlapping triangles/slabs
  // darken each sample only once, preserving grid lines without map stair steps.
  const material=new T.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,side:T.DoubleSide,
   blending:T.CustomBlending,blendSrc:T.ZeroFactor,blendDst:T.SrcColorFactor,
   blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,
   stencilWrite:true,stencilWriteMask:1,stencilFuncMask:1,stencilRef:1,
   stencilFunc:T.NotEqualStencilFunc,stencilZPass:T.ReplaceStencilOp,
   uniforms:{attenuation:{value:1-darkness}},
   vertexShader:`void main(){vec4 p=modelMatrix*vec4(position,1.);p.xz+=vec2(.5)*max(0.,p.y);p.y=-.06;
#include <begin_vertex>
gl_Position=projectionMatrix*viewMatrix*p;}`,
   fragmentShader:'uniform float attenuation;void main(){gl_FragColor=vec4(vec3(attenuation),1.);\n#include <tonemapping_fragment>\n}'
  });
  this.floorShadow=new T.Mesh(world.slabs.geometry,material);this.floorShadow.frustumCulled=false;this.floorShadow.renderOrder=-1.5;
  this.floorShadow.matrixAutoUpdate=false;
  this.floorShadow.onBeforeRender=()=>{world.slabs.updateWorldMatrix(true,false);this.floorShadow.matrixWorld.copy(world.slabs.matrixWorld);};
  world.slabs.parent.add(this.floorShadow);
  const wallMaterial=material.clone();wallMaterial.depthTest=true;wallMaterial.polygonOffset=true;wallMaterial.polygonOffsetFactor=WALL_SHADOW_DEPTH.factor;wallMaterial.polygonOffsetUnits=WALL_SHADOW_DEPTH.units;
  wallMaterial.stencilWriteMask=wallMaterial.stencilFuncMask=wallMaterial.stencilRef=2;
  wallMaterial.vertexShader='void main(){\n#include <begin_vertex>\ngl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  this.wallShadow=new T.Mesh(createStaticWallShadowGeometry(world.slabs,casterGeometry||world.slabs.geometry),wallMaterial);
  // Moving carrier shadows and exact maze polygons represent occlusion of
  // the same light. Compose their minimum visibility, not multiplied darkness.
  world.slabs.userData.exactMazeWallShadow=true;
  this.floorShadow.userData.shadowUnionAttenuation=1-darkness;
  this.floorShadow.userData.shadowWorldExpression='p.xyz';
  this.wallShadow.userData.shadowUnionAttenuation=1-darkness;
  world.carrierShadowOverlays=[this.floorShadow,this.wallShadow];
  this.originalWallShadow=this.wallShadow.geometry;
  this.wallShadow.renderOrder=.5;world.slabs.parent.add(this.wallShadow);
 }
 refreshDamage(slabs,revision){
  if(this.damageRevision===revision)return;
  if(this.damageRevision===undefined&&revision===0){this.damageRevision=revision;return;}
  if(this.wallShadow.geometry!==this.originalWallShadow)this.wallShadow.geometry.dispose();
  const receiver=slabs.userData.damageReceiver;
  if(!receiver){this.wallShadow.geometry=this.originalWallShadow;this.damageRevision=revision;return;}
  const local=createStaticWallShadowGeometry(receiver,this.casterGeometry||slabs.geometry),base=this.originalWallShadow.attributes,positions=[],damaged=slabs.userData.damagedSourceTriangles;
  for(let i=0;i<base.position.count;i++)if(!damaged.has(base.sourceTriangle.getX(i)))positions.push(base.position.getX(i),base.position.getY(i),base.position.getZ(i));
  const array=new Float32Array(positions.length+local.attributes.position.array.length);array.set(positions);array.set(local.attributes.position.array,positions.length);local.dispose();
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(array,3));geometry.computeBoundingSphere();
  this.wallShadow.geometry=geometry;this.damageRevision=revision;
 }
 dispose(){if(this.wallShadow.geometry!==this.originalWallShadow)this.originalWallShadow.dispose();super.dispose();this.casterGeometry?.dispose();this.floorShadow.material.dispose();this.floorShadow.removeFromParent();this.wallShadow.geometry.dispose();this.wallShadow.material.dispose();this.wallShadow.removeFromParent();}
 update(renderer){if(this.ready)return;super.update(renderer);this.ready=true;}
}
