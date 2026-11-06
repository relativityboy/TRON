import * as T from 'three';

export const DIFFUSE_GROUND_SHADOW=Object.freeze({size:2048,sigmaMeters:8,paddingSigmas:4});

// Cache world-space coverage, not the floor color: grid lines remain crisp.
export class DiffuseGroundShadows {
 constructor(world,map,darkness){
  this.tiles=[];this.ready=false;
  const c=DIFFUSE_GROUND_SHADOW;
  for(const site of map.MAZE_INSTANCES){
   const walls=(map.WALLS||[]).filter(w=>w.mazeId===site.id);
   if(!walls.length)continue;
   const points=walls.flatMap(w=>w.points),pad=c.sigmaMeters*c.paddingSigmas;
   const minX=Math.min(...points.map(p=>p.x))-pad,minZ=-Math.max(...points.map(p=>p.s))-pad;
   const maxX=Math.max(...points.map(p=>p.x))+map.WALL_HEIGHT*.5+pad,maxZ=-Math.min(...points.map(p=>p.s))+map.WALL_HEIGHT*.5+pad;
   const width=maxX-minX,height=maxZ-minZ,positions=[];
   // Orthographic projection of solid roof footprints; equal-height walls
   // project to the convex hull of their base and shifted roof.
   for(const w of walls){
    const triangles=w.triangles?.map(t=>t.map(e=>e.a))||T.ShapeUtils.triangulateShape(w.points.map(p=>new T.Vector2(p.x,p.s)),[]).map(t=>t.map(i=>w.points[i]));
    for(const triangle of triangles){
    const pts=triangle.flatMap(p=>[{x:p.x,y:-p.s},{x:p.x+map.WALL_HEIGHT*.5,y:-p.s+map.WALL_HEIGHT*.5}]).sort((a,b)=>a.x-b.x||a.y-b.y);
    const cross=(a,b,p)=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    const half=list=>{const out=[];for(const p of list){while(out.length>1&&cross(out.at(-2),out.at(-1),p)<=0)out.pop();out.push(p);}return out;};
    const a=half(pts),b=half([...pts].reverse());a.pop();b.pop();const poly=a.concat(b);
    for(let i=1;i<poly.length-1;i++)for(const p of [poly[0],poly[i],poly[i+1]])positions.push((p.x-minX)/width*2-1,(p.y-minZ)/height*2-1,0);
    }
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   const maskMaterial=new T.ShaderMaterial({depthTest:false,depthWrite:false,side:T.DoubleSide,vertexShader:'void main(){gl_Position=vec4(position,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(1.);}'});
   const scene=new T.Scene();scene.add(new T.Mesh(geometry,maskMaterial));
   const material=new T.ShaderMaterial({toneMapped:false,depthTest:false,depthWrite:false,transparent:false,
    blending:T.CustomBlending,blendSrc:T.ZeroFactor,blendDst:T.SrcColorFactor,blendSrcAlpha:T.ZeroFactor,blendDstAlpha:T.OneFactor,
    uniforms:{mask:{value:null},darkness:{value:darkness}},
    vertexShader:'varying vec2 maskUv;void main(){maskUv=uv;\n#include <begin_vertex>\ngl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:'uniform sampler2D mask;uniform float darkness;varying vec2 maskUv;void main(){gl_FragColor=vec4(vec3(1.-darkness*texture2D(mask,maskUv).r),1.);\n#include <tonemapping_fragment>\n}'
   });
   const mesh=new T.Mesh(new T.PlaneGeometry(width,height),material);mesh.rotation.x=-Math.PI/2;
   // Plane UV v runs toward -Z after rotation; invert to match mask coordinates.
   const uv=mesh.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));
   mesh.position.set(minX+width/2,-.06,minZ+height/2);mesh.renderOrder=-1.5;mesh.visible=false;
   mesh.userData.shadowUnionAttenuation='gl_FragColor.r';world.slabs.parent.add(mesh);
   this.tiles.push({scene,geometry,maskMaterial,mesh,width,height});
  }
 }
 update(renderer){
  if(this.ready)return;
  const c=DIFFUSE_GROUND_SHADOW,size=Math.min(c.size,renderer.capabilities.maxTextureSize),camera=new T.Camera();
  const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha(),auto=renderer.autoClear;
  const quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({depthTest:false,depthWrite:false,
   uniforms:{source:{value:null},stepUv:{value:new T.Vector2()}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}',
   fragmentShader:'uniform sampler2D source;uniform vec2 stepUv;varying vec2 vUv;void main(){float sum=0.;float weight=0.;for(int i=-16;i<=16;i++){float x=float(i)*.25;float w=exp(-.5*x*x);sum+=texture2D(source,vUv+stepUv*x).r*w;weight+=w;}gl_FragColor=vec4(vec3(sum/weight),1.);}'
  })),blurScene=new T.Scene();blurScene.add(quad);
  try{
   renderer.autoClear=true;renderer.setClearColor(0,1);
   for(const tile of this.tiles){
    const options={depthBuffer:false,stencilBuffer:false,minFilter:T.LinearFilter,magFilter:T.LinearFilter};
    const mask=new T.WebGLRenderTarget(size,size,options),scratch=new T.WebGLRenderTarget(size,size,options);tile.target=mask;
    try{
     renderer.setRenderTarget(mask);renderer.render(tile.scene,camera);
     quad.material.uniforms.source.value=mask.texture;quad.material.uniforms.stepUv.value.set(c.sigmaMeters/tile.width,0);
     renderer.setRenderTarget(scratch);renderer.render(blurScene,camera);
     quad.material.uniforms.source.value=scratch.texture;quad.material.uniforms.stepUv.value.set(0,c.sigmaMeters/tile.height);
     renderer.setRenderTarget(mask);renderer.render(blurScene,camera);tile.mesh.material.uniforms.mask.value=mask.texture;
    }finally{scratch.dispose();}
   }
   this.ready=true;
  }finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);renderer.autoClear=auto;quad.geometry.dispose();quad.material.dispose();}
 }
 set visible(value){for(const tile of this.tiles)tile.mesh.visible=value&&this.ready;}
 dispose(){for(const t of this.tiles){t.target?.dispose();t.geometry.dispose();t.maskMaterial.dispose();t.mesh.geometry.dispose();t.mesh.material.dispose();t.mesh.removeFromParent();}}
}
