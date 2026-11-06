import {BufferGeometry,Float32BufferAttribute} from 'three';
// Clip a line/ray pair in (u,t): u runs along an authored edge and t points
// toward the sun (-.5,+1,-.5). Project the surviving convex region onto u.
function shadowSpan(a,b,wall,height){
 const dy=b[1]-a[1],maxT=height-Math.min(a[1],b[1]);if(maxT<=0)return null;
 let polygon=[[0,0],[1,0],[1,maxT],[0,maxT]];
 const clip=(A,B,C)=>{
  const next=[];
  for(let i=0;i<polygon.length;i++){
   const p=polygon[i],q=polygon[(i+1)%polygon.length],dp=A*p[0]+B*p[1]+C,dq=A*q[0]+B*q[1]+C,inside=dp<=1e-9,other=dq<=1e-9;
   if(inside)next.push(p);
   if(inside!==other){const f=dp/(dp-dq);next.push([p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f]);}
  }
  polygon=next;
 };
 clip(dy,1,a[1]-height);clip(-dy,-1,-a[1]);
 for(const {a:p,nx,ns} of wall.edges){
  if(!polygon.length)return null;
  clip((b[0]-a[0])*nx-(b[2]-a[2])*ns,(-nx+ns)*.5,(a[0]-p.x)*nx+(-a[2]-p.s)*ns);
 }
 if(!polygon.length)return null;
 const lo=Math.min(...polygon.map(p=>p[0])),hi=Math.max(...polygon.map(p=>p[0]));return hi-lo>1e-7?[lo,hi]:null;
}
export function shadeMazeEdges(source,walls,height,darkness){
 const candidates=walls.map(w=>({wall:w,minU:Math.min(...w.points.map(p=>p.x)),maxU:Math.max(...w.points.map(p=>p.x))+.5*height,minV:-Math.max(...w.points.map(p=>p.s)),maxV:-Math.min(...w.points.map(p=>p.s))+.5*height}));
 const attributes=Object.fromEntries(Object.keys(source.attributes).filter(k=>k!=='color').map(k=>[k,[]])),colors=[],position=source.attributes.position;
 for(let i=0;i<position.count;i+=2){
  const a=[position.getX(i),position.getY(i),position.getZ(i)],b=[position.getX(i+1),position.getY(i+1),position.getZ(i+1)],u=[a[0]+.5*a[1],b[0]+.5*b[1]],v=[a[2]+.5*a[1],b[2]+.5*b[1]],spans=[];
  const selfNormal=source.attributes.shadowSelfShadeNormal;
  if(selfNormal&&selfNormal.getX(i)*.5-selfNormal.getY(i)+selfNormal.getZ(i)*.5>1e-7)spans.push([0,1]);
  for(const c of candidates){
   if(Math.max(...u)<c.minU||Math.min(...u)>c.maxU||Math.max(...v)<c.minV||Math.min(...v)>c.maxV)continue;
   const span=shadowSpan(a,b,c.wall,height);if(span)spans.push(span);
  }
  const cuts=[0,1,...spans.flat()].sort((a,b)=>a-b);
  for(let j=1;j<cuts.length;j++){
   const lo=cuts[j-1],hi=cuts[j];if(hi-lo<1e-7)continue;const mid=(lo+hi)/2,shade=spans.some(([l,r])=>mid>=l&&mid<=r)?1-darkness:1;
   for(const t of [lo,hi]){
    for(const [name,values] of Object.entries(attributes)){const attr=source.attributes[name];for(let k=0;k<attr.itemSize;k++)values.push(attr.array[i*attr.itemSize+k]+(attr.array[(i+1)*attr.itemSize+k]-attr.array[i*attr.itemSize+k])*t);}
    colors.push(shade,shade,shade);
   }
  }
 }
 const geometry=new BufferGeometry();for(const [name,values] of Object.entries(attributes))geometry.setAttribute(name,new Float32BufferAttribute(values,source.attributes[name].itemSize));geometry.setAttribute('color',new Float32BufferAttribute(colors,3));geometry.computeBoundingSphere();return geometry;
}
