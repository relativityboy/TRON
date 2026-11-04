// User-approved Wall Workshop revision 7, November 3, 2026.
// Source GLB SHA-256: 21343872666d3c31a69fc79082eb209a59aef9532a101a7e7f1c7be72e5c2d59.
// Metres at the study's 54 m wall height. Relief is presentation-only.
export const MAZE_WALL_EDGE_STYLE=Object.freeze({color:0x3b4c6a,opacity:.62,surfaceOffsetMeters:.025});
export const MAZE_WALL_PATTERN=Object.freeze({referenceHeightMeters:54,reliefDepthScale:.75,minimumDecoratedGapMeters:24,ribWidthMeters:18,ribPitchMeters:36,ribFirstCenterMeters:18,ribProjectionMeters:1.5,ribTopInsetMeters:.25,moldingCenterMeters:8.1,moldingHeightMeters:2.7,moldingProjectionMeters:1.875,cornerInsetMeters:1.875});
export function wallPatternBoxes(length,height){
 const C=MAZE_WALL_PATTERN,scale=height/C.referenceHeightMeters,margin=Math.min(C.cornerInsetMeters*scale,length/3),boxes=[];
 const add=(left,right,bottom,top,out,kind)=>{if(right-left>.05&&top-bottom>.05)boxes.push({left,right,bottom,top,out,kind});};
 for(let center=C.ribFirstCenterMeters*scale;center-C.ribWidthMeters*scale/2<length-margin;center+=C.ribPitchMeters*scale){
  add(Math.max(margin,center-C.ribWidthMeters*scale/2),Math.min(length-margin,center+C.ribWidthMeters*scale/2),0,height-C.ribTopInsetMeters*scale,C.ribProjectionMeters*scale*C.reliefDepthScale,'rib');
 }
 if(length>margin*2+.1)add(margin,length-margin,(C.moldingCenterMeters-C.moldingHeightMeters/2)*scale,(C.moldingCenterMeters+C.moldingHeightMeters/2)*scale,C.moldingProjectionMeters*scale*C.reliefDepthScale,'molding');
 return boxes;
}
// Subtract a convex cut extruded in the outward direction. Interpolation retains
// depth, so the same operation clips relief fronts, ends and horizontal caps.
export function subtractReliefCuts(polygon,cuts){
 let polygons=[polygon];
 for(const ring of cuts){
  let area=0;for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];area+=a.x*b.y-b.x*a.y;}
  const sign=area>=0?1:-1,next=[];
  for(const polygon of polygons){
   let inside=polygon;
   for(let i=0;i<ring.length&&inside.length>=3;i++){
    const a=ring[i],b=ring[(i+1)%ring.length],distance=p=>sign*((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x));
    const split=keepInside=>{
     const result=[];
     for(let j=0;j<inside.length;j++){
      const p=inside[j],q=inside[(j+1)%inside.length],dp=distance(p),dq=distance(q),pIn=keepInside?dp>=-1e-9:dp<=1e-9,qIn=keepInside?dq>=-1e-9:dq<=1e-9;
      if(pIn)result.push(p);
      if(pIn!==qIn){const t=dp/(dp-dq);result.push({x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,out:p.out+(q.out-p.out)*t});}
     }
     return result;
    };
    const outside=split(false),remaining=split(true);if(outside.length>=3)next.push(outside);inside=remaining;
   }
  }
  polygons=next;
 }
 return polygons;
}
export function appendWallPattern({faces,damageFaces,height,quad,wallTone,roofTone}){
 const patches=[];
 for(const face of faces){
  const length=Math.hypot(face.b.x-face.a.x,face.b.s-face.a.s),ux=(face.b.x-face.a.x)/length,us=(face.b.s-face.a.s)/length;
  const boxes=wallPatternBoxes(length,height);
  // Retain the original damage-face ownership across joined authored cells.
  const owners=damageFaces.filter(f=>f.mazeId===face.mazeId&&Math.abs(f.nx-face.nx)+Math.abs(f.ns-face.ns)<.001&&Math.abs((f.a.x-face.a.x)*face.nx+(f.a.s-face.a.s)*face.ns)<.001);
  for(const owner of owners){
   const start=(owner.a.x-face.a.x)*ux+(owner.a.s-face.a.s)*us;
   for(const box of boxes){
    const left=Math.max(0,box.left-start),right=Math.min(owner.length,box.right-start);if(right-left<.05)continue;
    const p=(x,y,out)=>({x,y,out}),l=left,r=right,b=box.bottom,t=box.top,d=box.out;
    const wall=(x,y,out)=>[owner.a.x+owner.ux*x+owner.nx*out,y,-owner.a.s+owner.uz*x-owner.ns*out];
    const emit=(vertices,tone)=>{const index=quad(...vertices.map(v=>wall(v.x,v.y,v.out)),tone,owner.shadowId);patches.push({face:owner,start:index,vertices,tone});};
    const shade=1+owner.nx*.25-owner.ns*.12,tone=wallTone.map(v=>v*shade);
    emit([p(l,b,d),p(r,b,d),p(r,t,d),p(l,t,d)],tone);
    emit([p(l,t,0),p(l,t,d),p(r,t,d),p(r,t,0)],roofTone);
    if(box.bottom>0)emit([p(l,b,0),p(r,b,0),p(r,b,d),p(l,b,d)],tone.map(v=>v*.65));
    // Suppress caps at internal collinear cell splits.
    if(left+start<=box.left+.001)emit([p(l,b,0),p(l,b,d),p(l,t,d),p(l,t,0)],tone.map(v=>v*.45));
    if(right+start>=box.right-.001)emit([p(r,b,d),p(r,b,0),p(r,t,0),p(r,t,d)],tone.map(v=>v*.45));
    (owner.reliefBoxes??=[]).push({left,right,bottom:b,top:t,out:d,tone,kind:box.kind,leftEnd:left+start<=box.left+.001,rightEnd:right+start>=box.right-.001});
   }
  }
 }
 return patches;
}

export function clipReliefEdge(a,b,box){
 let lo=0,hi=1;
 for(const [origin,delta,min,max] of [[a.x,b.x-a.x,box.left,box.right],[a.y,b.y-a.y,box.bottom,box.top]]){
  if(Math.abs(delta)<1e-10){if(origin<min||origin>max)return null;continue;}
  const t0=(min-origin)/delta,t1=(max-origin)/delta;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
 }
 if(hi-lo<1e-8)return null;
 return [lo,hi].map(t=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}));
}

// Authored hard edges only: no triangle diagonals or artificial cell seams.
export function appendWallPatternEdges(damageFaces,line){
 const offset=MAZE_WALL_EDGE_STYLE.surfaceOffsetMeters;
 for(const face of damageFaces){
  const p=(x,y,out)=>[face.a.x+face.ux*x+face.nx*out,y,-face.a.s+face.uz*x-face.ns*out];
  const emit=(a,b)=>line(a,b,face.shadowId,[face.nx,0,-face.ns]);
  for(const box of face.reliefBoxes||[]){
   const {left:l,right:r,bottom:b,top:t,out}=box,d=out+offset;
   emit(p(l,t,d),p(r,t,d));
   if(box.kind==='rib'){
    if(box.leftEnd)emit(p(l,b,d),p(l,t,d));
    if(box.rightEnd)emit(p(r,b,d),p(r,t,d));
   }else{
    // The top edge turns back into the wall at each molding end.
    if(box.leftEnd)emit(p(l,t,offset),p(l,t,d));
    if(box.rightEnd)emit(p(r,t,offset),p(r,t,d));
   }
  }
 }
}
