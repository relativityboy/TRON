import {Box3,Vector3,PCFShadowMap} from 'three';
export const ARENA_STUDY_SHADOW=Object.freeze({size:4096,filterRadius:1.8,bias:-.0002,normalBiasMeters:.4,paddingMeters:4});
export function configureArenaStudyShadows(renderer,key){
 const c=ARENA_STUDY_SHADOW;renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFShadowMap;renderer.shadowMap.autoUpdate=false;
 key.castShadow=true;const size=Math.min(c.size,renderer.capabilities.maxTextureSize);key.shadow.mapSize.set(size,size);key.shadow.radius=c.filterRadius;key.shadow.bias=c.bias;key.shadow.normalBias=c.normalBiasMeters;
}
// Fit the light camera to the walls, not the apron or a large fixed rectangle.
// Rebuild only after geometry/light changes; orbiting the review camera is free.
export function fitArenaStudyShadow(renderer,key,model){
 const architecture=model.children[1];if(!architecture)return;
 architecture.updateWorldMatrix(true,true);key.updateWorldMatrix(true,false);key.target.updateWorldMatrix(true,false);key.shadow.updateMatrices(key);
 const box=new Box3().setFromObject(architecture),bounds=new Box3(),point=new Vector3();
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])bounds.expandByPoint(point.set(x,y,z).applyMatrix4(key.shadow.camera.matrixWorldInverse));
 const p=ARENA_STUDY_SHADOW.paddingMeters,camera=key.shadow.camera;
 Object.assign(camera,{left:bounds.min.x-p,right:bounds.max.x+p,bottom:bounds.min.y-p,top:bounds.max.y+p,near:Math.max(.1,-bounds.max.z-p),far:Math.max(1,-bounds.min.z+p)});camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
}
