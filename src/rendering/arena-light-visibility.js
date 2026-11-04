// Use the static arena's own light-depth atlas to limit moving aircraft shadows
// to directly lit surfaces. Maze occlusion alone cannot see the arena walls.
export function arenaLightVisibility(atlas,prefix,worldPosition){
 const name=s=>prefix+s;
 return {
  uniforms:{[name('Atlas')]:{value:atlas.target.texture},[name('Matrices')]:{value:atlas.entries.map(e=>e.matrix)}},
  declarations:`uniform sampler2D ${name('Atlas')};uniform mat4 ${name('Matrices')}[${atlas.entries.length}];`,
  visible:name('Visible'),
  code:`float ${name('Visible')}=1.;
   vec3 ${name('Normal')}=normalize(cross(dFdx(${worldPosition}),dFdy(${worldPosition})));
   if(!gl_FrontFacing)${name('Normal')}=-${name('Normal')};
   if(dot(${name('Normal')},vec3(-.5,1.,-.5))<=.001)${name('Visible')}=0.;
   ${atlas.entries.map((_,i)=>`{
    vec4 projected=${name('Matrices')}[${i}]*vec4(${worldPosition},1.);vec3 p=projected.xyz/projected.w;
    if(all(greaterThan(p,vec3(0.)))&&all(lessThan(p,vec3(1.)))){
     vec3 px=dFdx(p),py=dFdy(p);float det=px.x*py.y-px.y*py.x;
     vec2 slope=abs(det)>1e-20?vec2(px.z*py.y-py.z*px.y,py.z*px.x-px.z*py.x)/det:vec2(0.);
     vec2 local=(floor(p.xy*${atlas.size}.)+.5)/${atlas.size}.;
     vec2 uv=(local+vec2(${i%atlas.columns}.,${Math.floor(i/atlas.columns)}.))/vec2(${atlas.columns}.,${atlas.rows}.);
     float nearest=unpackRGBAToDepth(texture2D(${name('Atlas')},uv));
     float depth=p.z+dot(slope,local-p.xy);
     if(depth>nearest+6./16777216.)${name('Visible')}=0.;
    }
   }`).join('\n')}`,
 };
}
