import {DIFFUSE_GROUND_SHADOW} from './diffuse-ground-shadows.js';

// Broad Gaussian PCF in light-space meters. Compare packed depths before
// interpolation: filtering the packed RG/RGBA colors corrupts depth values.
export const DIFFUSE_DEPTH_FILTER=Object.freeze({sigmaMeters:DIFFUSE_GROUND_SHADOW.sigmaMeters,supportSigmas:3,tapsPerAxis:6});
export function diffuseDepthFilter({index,columns,rows,size,excludeSelf,depthBias}){
 const c=DIFFUSE_DEPTH_FILTER;
 return `
 float diffuseWeight=0.;
 for(int sy=0;sy<${c.tapsPerAxis};sy++)for(int sx=0;sx<${c.tapsPerAxis};sx++){
  vec2 offset=(vec2(float(sx),float(sy))-${((c.tapsPerAxis-1)/2).toFixed(1)})*${(2*c.supportSigmas/c.tapsPerAxis).toFixed(1)};
  float weight=exp(-.5*dot(offset,offset));
  vec2 samplePosition=p.xy+offset*recShadowDiffuseSigmaUv[${index}];
  vec2 texel=samplePosition*${size}.-.5,base=floor(texel),fraction=fract(texel);
  float filteredCover=0.;
  for(int cy=0;cy<2;cy++)for(int cx=0;cx<2;cx++){
   vec2 local=(base+vec2(float(cx),float(cy))+.5)/${size}.;
   // Samples beyond a tile are unoccluded, never its neighbor in the atlas.
   if(all(greaterThanEqual(local,vec2(0.)))&&all(lessThanEqual(local,vec2(1.)))){
    vec2 uv=(local+vec2(${index%columns}.,${Math.floor(index/columns)}.))/vec2(${columns}.,${rows}.);
    vec4 sampleDepth=texture2D(recShadowAtlas,uv);
    // Correct only texel rounding on the receiver plane, not the broad
    // filter displacement: large offsets must not bend a vehicle surface.
    float receiverDepth=p.z+dot(slope,local-samplePosition);
    float sampleCover=step(${excludeSelf?'unpackRGToDepth(sampleDepth.rg)':'unpackRGBAToDepth(sampleDepth)'}+${depthBias.toFixed(7)},receiverDepth);
    ${excludeSelf?'float casterId=floor(sampleDepth.b*255.+.5)+256.*floor(sampleDepth.a*255.+.5);if(receiverWallId>.5&&abs(casterId-receiverWallId)<.5)sampleCover=0.;':''}
    vec2 w=mix(vec2(1.)-fraction,fraction,vec2(float(cx),float(cy)));
    filteredCover+=sampleCover*w.x*w.y;
   }
  }
  cover+=filteredCover*weight;diffuseWeight+=weight;
 }
 cover/=diffuseWeight;
 `;
}
