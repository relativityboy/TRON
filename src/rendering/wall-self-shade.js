import {Float32BufferAttribute} from 'three';
import {MAZE_SHADOW_STYLE} from './maze-shadow-style.js';

// Constant per face: self-shade belongs to the wall surface, not a second
// nearly coplanar polygon whose depth can alternate as the camera moves.
export function applyWallSelfShade(geometry){
 const normals=geometry.attributes.normal,facade=geometry.attributes.shadowSelfShadeNormal,ids=geometry.attributes.shadowWallId;
 const visibility=new Float32Array(geometry.attributes.position.count).fill(1);
 const away=(attribute,i)=>attribute&&attribute.getX(i)*.5-attribute.getY(i)+attribute.getZ(i)*.5>1e-7;
 for(let i=0;i<visibility.length;i++)if((ids?.getX(i)??0)>0&&(away(normals,i)||away(facade,i)))visibility[i]=1-MAZE_SHADOW_STYLE.darkness;
 geometry.setAttribute('wallSelfShade',new Float32BufferAttribute(visibility,1));
}

export function patchWallSelfShadeShader(shader){
 shader.vertexShader='attribute float wallSelfShade; varying float vWallSelfShade;\n'+shader.vertexShader;
 shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvWallSelfShade=wallSelfShade;');
 shader.fragmentShader='varying float vWallSelfShade;\n'+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>','#include <fog_fragment>\ngl_FragColor.rgb*=vWallSelfShade;');
}
