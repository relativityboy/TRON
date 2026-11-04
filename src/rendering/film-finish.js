import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
// A photographic finish after tone mapping, rather than a rough wall material.
// Pixel sizes are drawing-buffer pixels; strengths operate on display RGB.
export const FILM_FINISH=Object.freeze({grainStrength:.028,mottleStrength:.055,grainSizePixels:1.6,mottleSizePixels:18,framesPerSecond:24,vignetteStrength:.36,vignetteScale:1.35});
export function createFilmFinishPass(options={}){
 const c={...FILM_FINISH,...options};
 return new ShaderPass({
  uniforms:{tDiffuse:{value:null},time:{value:0},grainStrength:{value:c.grainStrength},mottleStrength:{value:c.mottleStrength},grainSize:{value:c.grainSizePixels},mottleSize:{value:c.mottleSizePixels},filmRate:{value:c.framesPerSecond},vignetteStrength:{value:c.vignetteStrength},vignetteScale:{value:c.vignetteScale}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;
   uniform float time,grainStrength,mottleStrength,grainSize,mottleSize,filmRate,vignetteStrength,vignetteScale;varying vec2 vUv;
   float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
   float noise(vec2 p,float seed){
    vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);vec2 shift=vec2(seed*17.13,seed*31.79);
    return mix(mix(hash(cell+shift),hash(cell+vec2(1.,0.)+shift),f.x),mix(hash(cell+vec2(0.,1.)+shift),hash(cell+vec2(1.)+shift),f.x),f.y)-.5;
   }
   void main(){
    vec4 sampleColor=texture2D(tDiffuse,vUv);vec3 c=sampleColor.rgb;
    float luminance=dot(c,vec3(.2126,.7152,.0722));
    float midtones=smoothstep(.015,.12,luminance)*(1.-smoothstep(.65,.95,luminance));
    float blue=smoothstep(0.,.08,c.b-max(c.r,c.g));float coverage=midtones*mix(.45,1.,blue);
    float frame=floor(time*filmRate);
    float grain=noise(gl_FragCoord.xy/grainSize,frame);
    float mottle=noise(gl_FragCoord.xy/mottleSize,frame+137.);
    // Zero-centered, monochrome grain; shadow blacks stay quiet. Modulate broad
    // areas softly without blurring or resampling geometric edges/trim.
    c+=coverage*(vec3(grain*grainStrength)+c*mottle*mottleStrength);
    float vignette=1.-vignetteStrength*pow(length((vUv-.5)*vignetteScale),2.);
    gl_FragColor=vec4(max(c*vignette,vec3(0.)),sampleColor.a);
   }`,
 });
}
