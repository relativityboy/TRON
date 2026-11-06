import {RECOGNIZER_EYE_COLOR} from '../game/recognizer-appearance.js';
import {Color,Float32BufferAttribute} from 'three';
export const RECOGNIZER_EYE=Object.freeze({color:RECOGNIZER_EYE_COLOR,minHeightMeters:7.35,maxHeightMeters:7.61,maxHalfWidthMeters:1.6,maxFrontNormalZ:-.6});
// Select only the lower of the two stacked crown rectangles. The upper cap
// and the chest retain their body tint. Coordinates use the normalized 30 m body.
export function tagRecognizerEye(meshes){
 let triangles=0;const c=RECOGNIZER_EYE;
 for(const mesh of meshes){
  if(mesh.material.name!=='Base')continue;
  const p=mesh.geometry.attributes.position,n=mesh.geometry.attributes.normal,mask=new Float32Array(p.count);
  for(let i=0;i<p.count;i+=3){
   const ids=[i,i+1,i+2];
   if(ids.every(j=>p.getY(j)>=c.minHeightMeters&&p.getY(j)<=c.maxHeightMeters&&Math.abs(p.getX(j))<=c.maxHalfWidthMeters)&&ids.reduce((sum,j)=>sum+n.getZ(j),0)/3<c.maxFrontNormalZ){mask.fill(1,i,i+3);triangles++;}
  }
  mesh.geometry.setAttribute('recognizerEye',new Float32BufferAttribute(mask,1));
 }
 return triangles;
}
export function configureRecognizerEye(material,color=RECOGNIZER_EYE.color){
 const eyeColor=new Color(color),previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);shader.uniforms.recognizerEyeColor={value:eyeColor};
  shader.vertexShader='attribute float recognizerEye; varying float vRecognizerEye;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRecognizerEye=recognizerEye;');
  shader.fragmentShader='uniform vec3 recognizerEyeColor; varying float vRecognizerEye;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,recognizerEyeColor,vRecognizerEye);');
 };
 material.customProgramCacheKey=()=>key+'-recognizer-eye-v1';
 return {eyeColor,setEyeColor:color=>eyeColor.set(color)};
}
