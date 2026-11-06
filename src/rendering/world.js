import {shadeMazeEdges} from './maze-edge-shadows.js';
import {MAZE_SHADOW_STYLE} from './maze-shadow-style.js';
import {exteriorWallFace,wallFaceGap} from './maze-wall-exterior.js';
import {appendWallPattern,appendWallPatternEdges,MAZE_WALL_EDGE_STYLE,MAZE_WALL_PATTERN} from './maze-wall-pattern.js';
import {DEFAULT_WORLD,worldFor} from '../levels/scenario.js';
import {GROUND_GRID_METERS,GROUND_GRID_LINE_HALF_WIDTH,GROUND_GRID_AA_SCALE} from '../levels/ground-grid.js';
import * as THREE from 'three';

// Match the approved revision 7's near-black blue walls in linear RGB.
// Keep roof/molding tops blue so their silhouette carries the relief.
const WALL_FACE_TONE=new THREE.Color(0x111423).toArray();

// Preserve near fog exactly; distant geometry keeps a readable silhouette.
function distantFog(shader,falloff=200){
  shader.fragmentShader=shader.fragmentShader.replace('#include <fog_fragment>',THREE.ShaderChunk.fog_fragment.replace('fogDensity * fogDensity * vFogDepth * vFogDepth', 'fogDensity * fogDensity * readableDepth * readableDepth').replace('#ifdef FOG_EXP2', `#ifdef FOG_EXP2\n float readableDepth = vFogDepth <= 250. ? vFogDepth : 250. + ${falloff.toFixed(1)} * (1. - exp(-(vFogDepth - 250.) / ${falloff.toFixed(1)}));`));
}
export function createWorld(scene,world=DEFAULT_WORLD,arena=null) {
  const {MAZE_INSTANCES,WALLS,WALL_HEIGHT,HALF,FLOOR_HALF,BASIS,wallAt}=world;
  const positions=[],colors=[],exposed=[],shadowIds=[],damageFaces=[];let shadowId=0;
  function quad(a,b,c,d,tone,id=shadowId) {const start=positions.length/3;for(const p of [a,b,c,a,c,d]){positions.push(...p);colors.push(...tone);shadowIds.push(id);}return start;}
  for(const w of WALLS) {
    shadowId++;
    const h=WALL_HEIGHT;
    const roof=[.035,.075,.19];
    for(const tri of w.triangles||THREE.ShapeUtils.triangulateShape(w.points.map(p=>new THREE.Vector2(p.x,p.s)),[]).map(t=>t.map(i=>({a:w.points[i]}))))for(const p of tri.map(e=>e.a)){positions.push(p.x,h,-p.s);colors.push(...roof);shadowIds.push(shadowId);}
    for(const edge of w.edges) {
      const {a,b,nx,ns}=edge;
      if(wallAt((a.x+b.x)/2+nx*.1,(a.s+b.s)/2+ns*.1))continue;
      exposed.push({...edge,shadowId,mazeId:w.mazeId});
      const shade=1+nx*.25-ns*.12;
      const length=Math.hypot(b.x-a.x,b.s-a.s);
      damageFaces.push({a,b,nx,ns,mazeId:w.mazeId,length,ux:(b.x-a.x)/length,uz:-(b.s-a.s)/length,height:h,start:positions.length/3,shadowId,tone:WALL_FACE_TONE.map(channel=>channel*shade)});
      quad([a.x,0,-a.s],[b.x,0,-b.s],[b.x,h,-b.s],[a.x,h,-a.s],WALL_FACE_TONE.map(channel=>channel*shade));

    }
  }
  const shadowPositions=positions.slice(),casterShadowIds=shadowIds.slice();
  // Join collinear cell boundaries before detailing, so the underlying maze
  // grid does not turn into a visible checkerboard of panel seams.
  const key=p=>p.x.toFixed(4)+','+p.s.toFixed(4);
  const starts=new Map(exposed.map(e=>[key(e.a),e])), used=new Set(), faces=[];
  for(const first of exposed) {
    if(used.has(first))continue;
    let edge=first;used.add(edge);let end=edge.b;
    while(true) {
      const next=starts.get(key(end));
      if(!next||used.has(next)||Math.abs(next.nx-first.nx)+Math.abs(next.ns-first.ns)>.001)break;
      used.add(next);end=next.b;
    }
    faces.push({...first,b:end});
  }
  const lines=[],lineShadowIds=[],lineNormals=[],lineSelfNormals=[],corners=new Map();let lineNormal=[0,1,0];
  const line=(a,b,id=shadowId,normal=lineNormal,selfNormal=[0,0,0])=>{lines.push(new THREE.Vector3(...a),new THREE.Vector3(...b));lineShadowIds.push(id,id);lineNormals.push(...normal,...normal);lineSelfNormals.push(...selfNormal,...selfNormal);};
  for(const {a,b,nx,ns,shadowId:faceShadowId} of faces) {
    shadowId=faceShadowId;lineNormal=[nx,0,-ns];
    const length=Math.hypot(b.x-a.x,b.s-a.s);
    const p=(distance,y,out=.035)=>[a.x+(b.x-a.x)*distance/length+nx*out,y,-a.s-(b.s-a.s)*distance/length-ns*out];
    line(p(0,WALL_HEIGHT-.12),p(length,WALL_HEIGHT-.12));
    for(const point of [a,b]) {
      const k=key(point),list=corners.get(k)||[];list.push({point,nx,ns,shadowId});corners.set(k,list);
    }
  }
  const canyonFaces=faces.filter(face=>{const gap=wallFaceGap(face,MAZE_INSTANCES);return !exteriorWallFace(face,MAZE_INSTANCES,gap)&&gap>=MAZE_WALL_PATTERN.minimumDecoratedGapMeters;});
  const reliefPatches=appendWallPattern({faces:canyonFaces,damageFaces,height:WALL_HEIGHT,quad,wallTone:WALL_FACE_TONE,roofTone:[.035,.075,.19]});

  appendWallPatternEdges(damageFaces,line);

  // Vertical seams only at silhouette corners, not between coplanar cells.
  for(const items of corners.values()) {
    if(items.length<2||items.every(e=>Math.abs(e.nx-items[0].nx)+Math.abs(e.ns-items[0].ns)<.001))continue;
    shadowId=items[0].shadowId;
    const {point}=items[0],nx=items.reduce((v,e)=>v+e.nx,0)*.035,ns=items.reduce((v,e)=>v+e.ns,0)*.035;
    lineNormal=[nx,0,-ns];
    line([point.x+nx,.25,-point.s-ns],[point.x+nx,WALL_HEIGHT-.15,-point.s-ns]);
  }
  const seams=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(lines),
    new THREE.LineBasicMaterial({color:MAZE_WALL_EDGE_STYLE.color,vertexColors:true,transparent:true,opacity:MAZE_WALL_EDGE_STYLE.opacity,depthTest:true,depthWrite:false,toneMapped:false}));
  seams.renderOrder=1;
  seams.geometry.setAttribute('shadowWallId',new THREE.Float32BufferAttribute(lineShadowIds,1));
  seams.geometry.setAttribute('shadowReceiverNormal',new THREE.Float32BufferAttribute(lineNormals,3));
  seams.geometry.setAttribute('shadowSelfShadeNormal',new THREE.Float32BufferAttribute(lineSelfNormals,3));
  const unshadedEdges=seams.geometry;seams.geometry=shadeMazeEdges(unshadedEdges,WALLS,WALL_HEIGHT,MAZE_SHADOW_STYLE.darkness);unshadedEdges.dispose();
  seams.material.onBeforeCompile=shader=>distantFog(shader,120);
  scene.add(seams);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('shadowWallId',new THREE.Float32BufferAttribute(shadowIds,1));geometry.computeBoundingSphere();
  // Stable flat receiver normals avoid derivative noise on faces grazing the light.
  geometry.computeVertexNormals();
  geometry.setAttribute('shadowReceiverNormal',geometry.attributes.normal.clone());
  // Low horizontal molding belongs to the facade's shade, including the
  // upward-facing strip and miter tips projecting beyond the solid prism.
  // Keep geometric normals independent for decal lift and aircraft shadows.
  const selfShadeNormals=new Float32Array(positions.length);
  for(const patch of reliefPatches)if(patch.kind==='molding'){
    for(let i=patch.start;i<patch.start+6;i++)selfShadeNormals.set([patch.face.nx,0,-patch.face.ns],i*3);
  }
  geometry.setAttribute('shadowSelfShadeNormal',new THREE.BufferAttribute(selfShadeNormals,3));
  const canyonEnclosure={value:0};
  const slabMaterial=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide});
  slabMaterial.onBeforeCompile=shader=>{
    distantFog(shader,120);
    shader.uniforms.canyonEnclosure=canyonEnclosure;
    shader.vertexShader='varying vec3 vSlab;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSlab=position;');
    shader.fragmentShader='varying vec3 vSlab; uniform float canyonEnclosure;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      // Continuous broad washes across joined cells, never a tile-by-tile tint.
      float wash=.85+.15*sin(vSlab.x*.002-vSlab.z*.003);
      diffuseColor.rgb*=wash;
      // Lift far silhouettes gradually, without altering nearby surface colors.
      float distantReadability=smoothstep(350.,1600.,distance(cameraPosition.xz,vSlab.xz));
      diffuseColor.rgb+=vec3(.005,.012,.028)*distantReadability*(1.-canyonEnclosure);`);
  };
  const slabs=new THREE.Mesh(geometry,slabMaterial);slabs.userData.damageFaces=damageFaces;slabs.userData.reliefPatches=reliefPatches;slabs.userData.shadowPositions=shadowPositions;slabs.userData.shadowIds=casterShadowIds;scene.add(slabs);
  const aerialView={value:0};
  const arenaFootprint={value:new THREE.Vector3(arena?.position.x??0,arena?.position.z??0,arena?466:0)};
  const floorMaterial=new THREE.MeshBasicMaterial({color:0x2b4362});
  floorMaterial.onBeforeCompile=shader=>{
    distantFog(shader);
    shader.uniforms.aerialView=aerialView;
    {
      shader.uniforms.arenaFootprint=arenaFootprint;
      shader.fragmentShader='uniform vec3 arenaFootprint;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n if(all(lessThan(abs(vGround.xz-arenaFootprint.xy),vec2(arenaFootprint.z)))) discard;');
    }
    shader.uniforms.floorHighTint={value:new THREE.Color(0x233560)};
    shader.vertexShader='varying vec3 vGround;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader='varying vec3 vGround; uniform vec3 floorHighTint; uniform float aerialView;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      diffuseColor.rgb=mix(diffuseColor.rgb,floorHighTint,smoothstep(12.,40.,cameraPosition.y));
      float wash=.92+.08*sin(vGround.x*.004+vGround.z*.003);
      vec2 cell=abs(fract(vGround.xz/${GROUND_GRID_METERS.toFixed(1)}+.5)-.5)*${GROUND_GRID_METERS.toFixed(1)};
      vec2 aa=fwidth(vGround.xz)*${GROUND_GRID_AA_SCALE.toFixed(1)};
      float grid=1.-min(smoothstep(${GROUND_GRID_LINE_HALF_WIDTH.toFixed(2)},${GROUND_GRID_LINE_HALF_WIDTH.toFixed(2)}+aa.x,cell.x),smoothstep(${GROUND_GRID_LINE_HALF_WIDTH.toFixed(2)},${GROUND_GRID_LINE_HALF_WIDTH.toFixed(2)}+aa.y,cell.y));
      float outside=1.;
      ${MAZE_INSTANCES.map(m=>{const BASIS=m.basis||world.BASIS,FLOOR_HALF=m.floorHalf||world.FLOOR_HALF;return `{
        vec2 delta=vec2(vGround.x,-vGround.z)-vec2(${m.x.toFixed(6)},${m.s.toFixed(6)});
        vec2 site=vec2(${Math.cos(m.angle).toFixed(6)}*delta.x+${Math.sin(m.angle).toFixed(6)}*delta.y,${(-Math.sin(m.angle)).toFixed(6)}*delta.x+${Math.cos(m.angle).toFixed(6)}*delta.y);
        vec2 localMaze=vec2(${BASIS.d.toFixed(6)}*site.x-(${BASIS.b.toFixed(6)})*site.y,-(${BASIS.c.toFixed(6)})*site.x+${BASIS.a.toFixed(6)}*site.y)/${(BASIS.a*BASIS.d-BASIS.b*BASIS.c).toFixed(6)};
        outside*=max(step(${FLOOR_HALF[0].toFixed(1)},abs(localMaze.x)),step(${FLOOR_HALF[1].toFixed(1)},abs(localMaze.y)));
      }`;}).join('\n')}
      float grazing=1.-abs(normalize(cameraPosition-vGround).y);
      float visibility=mix(.55,1.,smoothstep(.2,.8,grazing))*mix(1.,.16,smoothstep(50.,140.,cameraPosition.y));
      visibility=mix(visibility,.85,aerialView);
      float gridFade=1.-smoothstep(mix(160.,1800.,aerialView),mix(650.,3000.,aerialView),length(cameraPosition-vGround));
      diffuseColor.rgb=mix(diffuseColor.rgb*wash*visibility,vec3(.65,.76,.95),grid*outside*mix(.95,.045,aerialView)*gridFade);`);
  };
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.y=-.06;floor.renderOrder=-2;floor.userData.arenaFootprint=arenaFootprint;scene.add(floor);
  return {floor,slabs,seams,aerialView,canyonEnclosure};
}
