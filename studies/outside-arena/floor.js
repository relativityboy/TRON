import * as T from 'three';
// Approximate meters, Y-up. This is a review study, independent of gameplay.
export const OUTSIDE_ARENA_FLOOR=Object.freeze({widthMeters:640,wallZ:-180,apronDepthMeters:480,tileMeters:40,wellWidthMeters:25,wellDepthMeters:2.5,gridWidthMeters:.65});
export function createOutsideArenaFloor(c=OUTSIDE_ARENA_FLOOR){
 const root=new T.Group();root.name='Outside arena — floor study';root.userData={units:'meters',source:'OutsideArena.m4v',scale:'estimated; unseen surfaces approximated',configuration:{...c}};
 const positions=[],colors=[];
 const palette={floor:new T.Color(0x485367),wellFloor:new T.Color(0x30394e),wellSide:new T.Color(0x23293e),wall:new T.Color(0x10111f),pierFront:new T.Color(0x20253d),pierSide:new T.Color(0x171b30)};
 const quad=(a,b,d,e,color)=>{for(const p of [a,b,d,a,d,e]){positions.push(...p);colors.push(color.r,color.g,color.b);}};
 const tile=c.tileMeters,half=c.widthMeters/2,z0=c.wallZ,depth=c.apronDepthMeters,w=c.wellWidthMeters/2;
 // Each tile is four solid strips around a genuine open recess, plus its walls
 // and floor. No black decals or large coplanar overlay planes.
 for(let x=-half;x<half-.01;x+=tile)for(let z=z0;z<z0+depth-.01;z+=tile){
  const cx=x+tile/2,cz=z+tile/2,l=cx-w,r=cx+w,b=cz-w,f=cz+w;
  // Keep a central unbroken lane leading to the small opening.
  const well=z>z0+tile*.5;
  const rect=(x0,x1,z1,z2,y,color)=>quad([x0,y,z1],[x0,y,z2],[x1,y,z2],[x1,y,z1],color);
  if(!well){rect(x,x+tile,z,z+tile,0,palette.floor);continue;}
  rect(x,l,z,z+tile,0,palette.floor);rect(r,x+tile,z,z+tile,0,palette.floor);
  rect(l,r,z,b,0,palette.floor);rect(l,r,f,z+tile,0,palette.floor);
  rect(l,r,b,f,-c.wellDepthMeters,palette.wellFloor);
  const d=-c.wellDepthMeters;
  quad([l,0,b],[l,d,b],[r,d,b],[r,0,b],palette.wellSide);
  quad([r,0,b],[r,d,b],[r,d,f],[r,0,f],palette.wellSide.clone().multiplyScalar(.6));
  quad([r,0,f],[r,d,f],[l,d,f],[l,0,f],palette.wellSide.clone().multiplyScalar(1.2));
  quad([l,0,f],[l,d,f],[l,d,b],[l,0,b],palette.wellSide.clone().multiplyScalar(.85));
 }
 const floorGeometry=new T.BufferGeometry();floorGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));floorGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));floorGeometry.computeVertexNormals();
 const floor=new T.Mesh(floorGeometry,new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide}));floor.name='Apron with recessed square wells';root.add(floor);
 const gridMaterial=new T.MeshBasicMaterial({color:0x57311e,side:T.DoubleSide});
 const box=(name,size,position,material)=>{const mesh=new T.Mesh(new T.BoxGeometry(...size),material);mesh.name=name;mesh.position.set(...position);root.add(mesh);return mesh;};
 for(let x=-half;x<=half;x+=tile)box('Orange longitudinal grid line',[c.gridWidthMeters,.008,depth],[x,.01,z0+depth/2],gridMaterial);
 for(let z=z0;z<=z0+depth;z+=tile)box('Orange cross grid line',[c.widthMeters,.008,c.gridWidthMeters],[0,.01,z],gridMaterial);
 root.userData.triangles=0;root.traverse(o=>{if(o.isMesh)root.userData.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 return root;
}
export function disposeOutsideArenaFloor(root){const materials=new Set();root.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});for(const m of materials)m.dispose();}
