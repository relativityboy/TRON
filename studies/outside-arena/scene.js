import * as T from 'three';
import {createOutsideArenaFloor,OUTSIDE_ARENA_FLOOR} from './floor.js';
export const OUTSIDE_ARENA_WALL=Object.freeze({heightMeters:150,depthMeters:16,bayPitchMeters:40,pierOffsetMeters:0,pierWidthMeters:22,pierProjectionMeters:20,pierBaseProjectionMeters:20,pierTopProjectionMeters:17,portalWidthMeters:9,portalHeightMeters:15,portalChamferMeters:1.6,tunnelDepthMeters:22,surfaceColor:0x314963});
// Background only; the approved floor is composed as its own unchanged group.
export function createOutsideArenaScene(c=OUTSIDE_ARENA_WALL){
 const root=new T.Group();root.name='Outside arena — background scene study';root.userData={units:'meters',source:'OutsideArena.m4v',scale:'estimated; unseen surfaces approximated',configuration:{...c}};
 root.add(createOutsideArenaFloor());
 const architecture=new T.Group();architecture.name='Wall study — unapproved';root.add(architecture);
 const wallMaterial=new T.MeshStandardMaterial({color:c.surfaceColor,roughness:1,metalness:0,side:T.DoubleSide});
 const half=OUTSIDE_ARENA_FLOOR.widthMeters/2,z0=OUTSIDE_ARENA_FLOOR.wallZ,h=c.heightMeters,pitch=c.bayPitchMeters;
 const pw=c.portalWidthMeters/2,ph=c.portalHeightMeters,bevel=c.portalChamferMeters;
 const offset=((c.pierOffsetMeters??0)%pitch+pitch)%pitch;
 const baseProjection=c.pierBaseProjectionMeters??c.pierProjectionMeters,topProjection=c.pierTopProjectionMeters??Math.max(0,c.pierProjectionMeters-3);
 const frontZ=y=>z0+baseProjection+(topProjection-baseProjection)*y/h;
 const outline=[[-half,0],[-pw,0],[-pw,ph-bevel],[-pw+bevel,ph],[pw-bevel,ph],[pw,ph-bevel],[pw,0],[half,0],[half,h],[-half,h]];
 const shape=new T.Shape(outline.map(p=>new T.Vector2(...p)));
 const wall=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:c.depthMeters,bevelEnabled:false,steps:1}),wallMaterial);wall.name='Recessed wall backplane with chamfered entrance';wall.position.z=z0-c.depthMeters;architecture.add(wall);
 const positions=[];
 function face(points){for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]]){positions.push(...p);}}
 // Broad folded wall faces alternate with deep black bays. The doorway
 // belongs to a solid blue central face rather than an empty dark bay.
 for(let bay=-Math.ceil(half/pitch)-1;bay<=Math.ceil(half/pitch)+1;bay++){
  const center=bay*pitch+offset;if(Math.abs(center)>half+.001)continue;
  const wb=c.pierWidthMeters/2,wt=wb*.82,front=frontZ(0);
  const a=[center-wb,0,front],b=[center+wb,0,front],d=[center+wt,h,frontZ(h)],e=[center-wt,h,frontZ(h)];
  if(Math.abs(center)<.001){
   const panelOutline=[[-wb,0],[-pw,0],[-pw,ph-bevel],[-pw+bevel,ph],[pw-bevel,ph],[pw,ph-bevel],[pw,0],[wb,0],[wt,h],[-wt,h]];
   const panelShape=new T.Shape(panelOutline.map(p=>new T.Vector2(...p)));
   const panelGeometry=new T.ShapeGeometry(panelShape),p=panelGeometry.attributes.position;
   for(let i=0;i<p.count;i++)p.setZ(i,(topProjection-baseProjection)*p.getY(i)/h);panelGeometry.computeVertexNormals();
   const panel=new T.Mesh(panelGeometry,wallMaterial);
   panel.name='Blue central wall face with chamfered doorway';panel.position.z=front;architecture.add(panel);
  }else face([a,b,d,e]);
  face([[center-pitch*.32,0,z0],a,e,[center-pitch*.26,h,z0]]);
  face([b,[center+pitch*.32,0,z0],[center+pitch*.26,h,z0],d]);
  face([e,d,[center+pitch*.26,h,z0],[center-pitch*.26,h,z0]]);
 }
 const doorwayZ=offset<.001?frontZ:()=>z0;
 const opening=[[-pw,0],[-pw,ph-bevel],[-pw+bevel,ph],[pw-bevel,ph],[pw,ph-bevel],[pw,0]];
 for(let i=0;i<opening.length-1;i++){
  const a=opening[i],b=opening[i+1];
  face([[a[0],a[1],doorwayZ(a[1])-.04],[a[0],a[1],z0-c.tunnelDepthMeters],[b[0],b[1],z0-c.tunnelDepthMeters],[b[0],b[1],doorwayZ(b[1])-.04]]);
 }
 face([[-pw,-.1,z0-c.tunnelDepthMeters],[-pw,-.1,doorwayZ(0)],[pw,-.1,doorwayZ(0)],[pw,-.1,z0-c.tunnelDepthMeters]]);
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
 const piers=new T.Mesh(geometry,wallMaterial);piers.name='Tall faceted piers and sloping bay sides';architecture.add(piers);
 architecture.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 root.userData.triangles=0;root.traverse(o=>{if(o.isMesh)root.userData.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
 return root;
}
