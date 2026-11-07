import {LIGHT_CYCLES as C} from './config/light-cycles.js';
import {ARENA_WALL} from './config/arena-breaches.js';

// Attribution only, never collision authority. Work and storage are bounded.
export const TRAP_LIMITS=Object.freeze({side:40,scanSeconds:.1,maxTrails:2048,maxCandidates:3,
 maxFloodVisits:16000,maxAreaFraction:.4,minRestoredCells:80,minRestoredRatio:1.5});
const L=TRAP_LIMITS,N=L.side,S=N*N,E=S*2,edge=ARENA_WALL.innerMeters/C.cellMeters,step=edge*2/N;
const contexts=new WeakMap();
const coordinate=i=>-edge+(i+.5)*step;
const cell=(x,z)=>{const ix=Math.floor((x+edge)/step),iz=Math.floor((z+edge)/step);return ix<0||iz<0||ix>=N||iz>=N?-1:iz*N+ix;};
export function invalidateCycleTraps(r){const c=contexts.get(r);if(c){c.active.clear();c.previous.clear();}}
function context(r){
 let c=contexts.get(r);if(!c||c.round!==r.round){c={round:r.round,next:0,cursor:0,previous:new Map(),active:new Map(),awarded:new Set(),created:new Set(),map:new Uint16Array(E),scratch:new Uint16Array(E),outside:new Uint8Array(S),seen:new Uint8Array(S),queue:new Int32Array(S)};contexts.set(r,c);}return c;
}
function build(c,r,barriers){
 c.map.fill(0);c.outside.fill(0);
 for(const {trail,a,end:b} of barriers){
  const bit=1<<trail.bikeId;
  // Arena trails are cardinal. Ignore diagonal road joins rather than invent a barrier.
  if(Math.abs(a.x-b.x)<1e-6){
   const ix=Math.floor((a.x+edge)/step-.5);if(ix<0||ix>=N-1)continue;
   for(let z=0;z<N;z++)if(coordinate(z)>=Math.min(a.z,b.z)&&coordinate(z)<=Math.max(a.z,b.z))c.map[(z*N+ix)*2]|=bit;
  }else if(Math.abs(a.z-b.z)<1e-6){
   const iz=Math.floor((a.z+edge)/step-.5);if(iz<0||iz>=N-1)continue;
   for(let x=0;x<N;x++)if(coordinate(x)>=Math.min(a.x,b.x)&&coordinate(x)<=Math.max(a.x,b.x))c.map[(iz*N+x)*2+1]|=bit;
  }
 }
 // Expand real wall openings to the coarse cell: uncertain escapes deny credit.
 for(const b of r.breaches??[]){const along=b.along/C.cellMeters,i=Math.max(0,Math.min(N-1,Math.floor((along+edge)/step)));
  for(let j=Math.max(0,i-1);j<=Math.min(N-1,i+1);j++)c.outside[b.axis==='x'?j*N+(b.sign>0?N-1:0):(b.sign>0?N-1:0)*N+j]=1;
 }
}
function flood(c,map,start,ignore=0){
 if(start<0)return null;c.seen.fill(0);let count=1;c.queue[0]=start;c.seen[start]=1;
 for(let i=0;i<count;i++){
  if(++c.visits>L.maxFloodVisits)return null;
  const k=c.queue[i],x=k%N,z=Math.floor(k/N);if(c.outside[k])return S;
  const add=(next,key)=>{if(!c.seen[next]&&!(map[key]&~ignore)){c.seen[next]=1;c.queue[count++]=next;}};
  if(x<N-1)add(k+1,k*2);if(x>0)add(k-1,(k-1)*2);
  if(z<N-1)add(k+N,k*2+1);if(z>0)add(k-N,(k-N)*2+1);
 }
 return count;
}
const meaningful=(area,restored)=>area!==null&&restored!==null&&area<=S*L.maxAreaFraction&&restored-area>=L.minRestoredCells&&restored>=area*L.minRestoredRatio;
function validate(c,b,trap){
 const start=cell(b.x,b.z);if(start<0||!trap.region[start])return false;
 // New walls inside the pocket must not erase responsibility for the original trap.
 // Removed/expired walls do open it: retain only original barriers still present.
 for(let i=0;i<E;i++)c.scratch[i]=trap.map[i]&c.map[i];
 const area=flood(c,c.scratch,start),restored=flood(c,c.scratch,start,1<<trap.owner);
 return area===null||restored===null?null:meaningful(area,restored);
}
function scan(c,r,b){
 const start=cell(b.x,b.z),old=c.previous.get(b.id),traps=c.active.get(b.id)??[];
 c.active.set(b.id,traps.filter(t=>validate(c,b,t)!==false));
 if(old&&start>=0){
  const area=flood(c,c.map,start),region=c.seen.slice();
  if(area!==null&&area<=S*L.maxAreaFraction){
   let tested=0;
   // Rotate priority so crowded scenes do not permanently favor low IDs.
   for(let i=0;i<r.cycles.length&&tested<L.maxCandidates;i++){
    const owner=r.cycles[(i+c.cursor)%r.cycles.length];if(owner.team===b.team)continue;
    const bit=1<<owner.id;let changed=false;
    for(let j=0;j<E;j++){const fresh=c.map[j]&bit&~old[j];c.scratch[j]=c.map[j]&~fresh;changed||=!!fresh;}
    if(!changed)continue;tested++;
    const restored=flood(c,c.scratch,start);
    if(!meaningful(area,restored))continue;
    const active=c.active.get(b.id);if(!active.some(t=>t.owner===owner.id))active.push({owner:owner.id,map:c.map.slice(),region});
    const key=`${owner.id}:${b.id}`;
    if(!c.created.has(key)){c.created.add(key);(owner.trapsCreated??=[]).push({id:b.id,team:b.team});}
   }
  }
 }
 c.previous.set(b.id,c.map.slice());
}
/** Called before collision mutations. Hits are already resolved against these barriers. */
export function trackCycleTraps(r,barriers,proposals){
 const c=context(r),deaths=proposals.filter(p=>p.hit),due=r.time>=c.next;
 if(!due&&!deaths.length)return;
 if(r.cycles.length>C.maxCycles||barriers.length>L.maxTrails||r.trails.length>L.maxTrails){c.active.clear();c.previous.clear();return;}
 build(c,r,barriers);c.visits=0;
 for(const {b,hit} of deaths){
  if(c.awarded.has(b.id))continue;
  // A closing wall can be followed by a self-wall death before this victim's
  // next round-robin scan. Inspect the actual collision barriers first.
  scan(c,r,b);c.awarded.add(b.id);
  const eligible=(c.active.get(b.id)??[]).filter(t=>t.owner!==hit.owner&&r.cycles.find(o=>o.id===t.owner)?.team!==b.team&&validate(c,b,t)===true);
  // One victim contributes at most one shared assist reward.
  for(const trap of eligible){const owner=r.cycles.find(o=>o.id===trap.owner);
   (owner.trapAssists??=[]).push({id:b.id,team:b.team,share:1/eligible.length});
  }
  c.active.delete(b.id);
 }
 if(due){
  c.next=r.time+L.scanSeconds;
  const b=r.cycles[c.cursor++%r.cycles.length];
  if(b?.alive&&!b.escaped&&!deaths.some(p=>p.b.id===b.id))scan(c,r,b);
 }
}
