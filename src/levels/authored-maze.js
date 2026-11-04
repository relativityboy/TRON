// A fixed, reproducible reconstruction study, not a recovered film maze map.
// The supplied overview establishes broad slabs, parallel channels and grid edges;
// passages outside that view are authored here. Coordinates: x, s = world -Z.
export const CELL = 38;
export const SIZE = 25;
export const HALF = SIZE * CELL / 2;
export const WALL_HEIGHT = 54;
// Oblique axes stretch the maze into long, skewed slabs rather than square blocks.
export const BASIS = Object.freeze({a:2.2,b:1.05,c:.08,d:1});
const determinant=BASIS.a*BASIS.d-BASIS.b*BASIS.c;
export function gridToWorld(u,v) {return {x:BASIS.a*u+BASIS.b*v,s:BASIS.c*u+BASIS.d*v};}
export function worldToGrid(x,s) {return {u:(BASIS.d*x-BASIS.b*s)/determinant,v:(BASIS.a*s-BASIS.c*x)/determinant};}
export const SPAWN = {...gridToWorld(0,-HALF-HALF),yaw:-Math.atan2(BASIS.b,BASIS.d)};
export const RECOGNIZER_STARTS = [
  [-HALF-130,-HALF+120], [HALF+150,-HALF+230],
  [-HALF-110,HALF-80], [HALF+120,HALF+120], [60,HALF+160],
].map(([u,v])=>gridToWorld(u,v));
function random(seed) {
  return () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
}
const rng=random(1982), grid=Array.from({length:SIZE},()=>Array(SIZE).fill(1));
// Carve connected channels, then add loops, courts and long parallel passages.
const stack=[[1,1]]; grid[1][1]=0;
while(stack.length) {
  const [c,r]=stack.at(-1);
  const choices=[[2,0],[-2,0],[0,2],[0,-2]].filter(([dc,dr])=>c+dc>0&&c+dc<SIZE-1&&r+dr>0&&r+dr<SIZE-1&&grid[r+dr][c+dc]);
  if(!choices.length){stack.pop();continue;}
  // Favor long parallel runs, with occasional cross-cuts and forks.
  // This keeps a connected maze while forming broad blade-like islands.
  const weights=choices.map(([dc])=>dc ? 7 : 1);
  let pick=rng()*weights.reduce((a,b)=>a+b,0),chosen=choices.length-1;
  for(let i=0;i<choices.length;i++){pick-=weights[i];if(pick<0){chosen=i;break;}}
  const [dc,dr]=choices[chosen];
  grid[r+dr/2][c+dc/2]=0;grid[r+dr][c+dc]=0;stack.push([c+dc,r+dr]);
}
function carve(c0,r0,c1,r1) {for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++)grid[r][c]=0;}
carve(12,0,12,3); // Entry opens into a real east/west choice.
carve(3,3,21,3); carve(3,9,19,9); carve(5,17,23,17);
carve(7,5,7,21); carve(19,3,19,19);
carve(11,11,13,13); carve(2,18,4,20); // Open courts.
carve(0,7,3,7); carve(21,21,24,21); carve(5,21,5,24);
export const GRID = grid.map(row=>Object.freeze(row));
export function cellAt(x,s) {const {u,v}=worldToGrid(x,s);return {c:Math.floor((u+HALF)/CELL),r:Math.floor((v+HALF)/CELL)};}
export function cellCenter(c,r) {return gridToWorld((c+.5)*CELL-HALF,(r+.5)*CELL-HALF);}
export function solidCell(c,r) {return c>=0&&r>=0&&c<SIZE&&r<SIZE&&GRID[r][c]===1;}
export const OPEN_CELLS=[];
export const WALLS=[];
const wallByCell=new Map();
for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++) {
  if(!GRID[r][c]) {OPEN_CELLS.push({...cellCenter(c,r),c,r});continue;}
  const u=c*CELL-HALF,v=r*CELL-HALF;
  const corners=[[u,v],[u+CELL,v],[u+CELL,v+CELL],[u,v+CELL]];
  const exposed=[!solidCell(c-1,r)&&!solidCell(c,r-1),!solidCell(c+1,r)&&!solidCell(c,r-1),
    !solidCell(c+1,r)&&!solidCell(c,r+1),!solidCell(c-1,r)&&!solidCell(c,r+1)];
  const points=[];
  corners.forEach((p,i)=>{
    if(!exposed[i]){points.push(gridToWorld(...p));return;}
    // Long diagonal cuts at exposed corners create pointed slab ends.
    // Opposite corners get a long diagonal slice; their neighbors stay
    // almost square. Adjacent cuts sum to less than one edge length.
    const amount=i%2===0 ? .82+((c+r)%3)*.025 : .045;
    for(const neighbor of [corners[(i+3)%4],corners[(i+1)%4]])points.push(gridToWorld(p[0]+(neighbor[0]-p[0])*amount,p[1]+(neighbor[1]-p[1])*amount));
  });
  const w={points,minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),
    minS:Math.min(...points.map(p=>p.s)),maxS:Math.max(...points.map(p=>p.s)),height:WALL_HEIGHT,c,r};
  w.edges=points.map((a,i)=>{const b=points[(i+1)%points.length],dx=b.x-a.x,ds=b.s-a.s,len=Math.hypot(dx,ds);return {a,b,nx:ds/len,ns:-dx/len};});
  WALLS.push(w);wallByCell.set(`${c},${r}`,w);
}
export function insideWall(w,x,s) {return w.edges.every(e=>(x-e.a.x)*e.nx+(s-e.a.s)*e.ns<=1e-8);}
export function wallAt(x,s) {const {c,r}=cellAt(x,s),w=wallByCell.get(`${c},${r}`);return !!w&&insideWall(w,x,s);}
export function nearbyWalls(x,s,radius) {
  const corners=[cellAt(x-radius,s-radius),cellAt(x+radius,s-radius),cellAt(x-radius,s+radius),cellAt(x+radius,s+radius)];
  const c0=Math.max(0,Math.min(...corners.map(p=>p.c))),c1=Math.min(SIZE-1,Math.max(...corners.map(p=>p.c)));
  const r0=Math.max(0,Math.min(...corners.map(p=>p.r))),r1=Math.min(SIZE-1,Math.max(...corners.map(p=>p.r))),out=[];
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){const w=wallByCell.get(`${c},${r}`);if(w)out.push(w);}
  return out;
}
export function closestWallPoint(w,x,s) {
  let best=null;
  for(const edge of w.edges) {
    const {a,b}=edge,dx=b.x-a.x,ds=b.s-a.s;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(s-a.s)*ds)/(dx*dx+ds*ds)));
    const px=a.x+dx*t,ps=a.s+ds*t,distance=Math.hypot(x-px,s-ps);
    if(!best||distance<best.distance)best={x:px,s:ps,distance,nx:edge.nx,ns:edge.ns};
  }
  return best;
}
export function freePosition(x,s,radius=0) {
  return !nearbyWalls(x,s,radius).some(w=>insideWall(w,x,s)||closestWallPoint(w,x,s).distance<radius);
}
// Clip against the very same convex prisms used for the roof and wall meshes.
export function wallIntersection(a,b,padding=0) {
  if(Math.min(a.y,b.y)>WALL_HEIGHT+padding)return null;
  let nearest=null;
  const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minS=Math.min(a.s,b.s),maxS=Math.max(a.s,b.s);
  for(const w of WALLS) {
    if(maxX<w.minX-padding||minX>w.maxX+padding||maxS<w.minS-padding||minS>w.maxS+padding)continue;
    let enter=0,leave=1;
    function clip(start,delta,limit) {
      if(Math.abs(delta)<1e-10){if(start>limit)enter=2;return;}
      const t=(limit-start)/delta;
      if(delta<0)enter=Math.max(enter,t);else leave=Math.min(leave,t);
    }
    clip(a.y,b.y-a.y,w.height+padding);clip(-a.y,a.y-b.y,1);
    for(const e of w.edges) {
      clip((a.x-e.a.x)*e.nx+(a.s-e.a.s)*e.ns,(b.x-a.x)*e.nx+(b.s-a.s)*e.ns,padding);
      if(enter>leave)break;
    }
    if(enter<=leave&&leave>=0&&enter<=1&&(nearest===null||enter<nearest))nearest=Math.max(0,enter);
  }
  return nearest;
}
export const lineOfSight=(a,b)=>wallIntersection(a,b)===null;
