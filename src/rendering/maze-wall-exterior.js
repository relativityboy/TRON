// Static per-site facade classification; translated/rotated mazes are queried
// only against their own walls, never against a distant site.
const SAMPLE_FRACTIONS=[.15,.5,.85],SURFACE_OFFSET_METERS=.1,EPSILON=1e-7;
export function wallFaceGap(face,instances){
 const site=instances.find(m=>m.id===face.mazeId);if(!site?.walls?.length)return Infinity;
 const edges=site.walls.flatMap(w=>w.edges);let nearest=Infinity;
 for(const fraction of SAMPLE_FRACTIONS){
  const ox=face.a.x+(face.b.x-face.a.x)*fraction+face.nx*SURFACE_OFFSET_METERS,os=face.a.s+(face.b.s-face.a.s)*fraction+face.ns*SURFACE_OFFSET_METERS;
  for(const {a,b} of edges){
   const dx=b.x-a.x,ds=b.s-a.s,den=face.nx*ds-face.ns*dx;if(Math.abs(den)<EPSILON)continue;
   const ax=a.x-ox,as=a.s-os,t=(ax*ds-as*dx)/den,u=(ax*face.ns-as*face.nx)/den;
   if(t>EPSILON&&u>=-EPSILON&&u<=1+EPSILON)nearest=Math.min(nearest,t+SURFACE_OFFSET_METERS);
  }
 }
 return nearest;
}
export function exteriorWallFace(face,instances,gap=wallFaceGap(face,instances)){
 const site=instances.find(m=>m.id===face.mazeId);if(!site?.walls?.length)return false;
 const x=(face.a.x+face.b.x)/2,s=(face.a.s+face.b.s)/2;
 return (x-site.x)*face.nx+(s-site.s)*face.ns>EPSILON&&!Number.isFinite(gap);
}
