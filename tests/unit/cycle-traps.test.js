import test from 'node:test';
import assert from 'node:assert/strict';
import {OffenseEvents,offensePoints} from '../../tools/ai/fitness.mjs';
import {projectState,compactSnapshot,decodeSnapshot} from '../../shared/multiplayer/snapshots.js';
import {advanceContinuousCycles,cycleCollisionTrails} from '../../shared/simulation/cycle-continuous.js';
import {trackCycleTraps,invalidateCycleTraps} from '../../shared/simulation/cycle-traps.js';
function fixture({scanAfterClosure=true}={}){
 const victim={id:0,team:0,x:0,z:0,alive:true},attacker={id:1,team:1,x:50,z:50,alive:true};
 const r={round:1,time:0,teamCount:2,cycles:[victim,attacker],trails:[],breaches:[]};
 const wall=(id,x,z,x2,z2)=>({trail:{bikeId:id},a:{x,z},end:{x:x2,z:z2}});
 const walls=[wall(0,-20,-20,20,-20),wall(0,-20,20,20,20),wall(0,-20,-20,-20,20)];
 const scan=()=>{for(let i=0;i<2;i++){r.time+=.2;trackCycleTraps(r,walls,[]);}};
 scan();walls.push(wall(1,20,-20,20,20));if(scanAfterClosure)scan();
 return {r,victim,attacker,walls,wall,scan,die(owner=0){trackCycleTraps(r,walls,[{b:victim,hit:{owner}}]);victim.alive=false;}};
}
test('confinement survives a long delay and the victim filling its own pocket',()=>{
 const f=fixture();assert.equal(f.attacker.trapsCreated.length,1);
 f.walls.push(f.wall(0,-10,-20,-10,15),f.wall(0,-10,15,15,15));
 f.r.time+=90;f.scan();f.die();
 assert.deepEqual(f.attacker.trapAssists,[{id:0,team:0,share:1}]);
 f.die();assert.equal(f.attacker.trapAssists.length,1);
});
test('opening the enclosing wall or escaping removes credit',()=>{
 for(const escape of [false,true]){const f=fixture();
  if(escape)f.victim.x=50;else f.walls.pop();
  f.scan();f.die();assert.equal(f.attacker.trapAssists,undefined);
 }
});
test('direct hit is not doubled as an assist; old walls alone do not earn new trap awards',()=>{
 const f=fixture();f.die(1);assert.equal(f.attacker.trapAssists,undefined);
 const other=fixture();other.r.round++;other.scan();other.die();assert.equal(other.attacker.trapAssists,undefined);
});
test('friendly enclosure and oversized geometry cannot earn trap credit',()=>{
 const f=fixture();f.attacker.team=0;f.r.round++;f.scan();f.die();assert.equal(f.attacker.trapAssists,undefined);
 const g=fixture();g.r.trails=Array(2049).fill({});g.scan();g.die();assert.equal(g.attacker.trapAssists,undefined);
});

test('sub-grid geometry cuts invalidate stale attribution without duplicating confinement reward',()=>{
 const f=fixture();invalidateCycleTraps(f.r);f.scan();f.die();
 assert.equal(f.attacker.trapAssists,undefined);assert.equal(f.attacker.trapsCreated.length,1);
});

test('box completed between scans is credited when the victim immediately hits its own wall',()=>{
 const f=fixture({scanAfterClosure:false});f.r.time+=.01;f.die();
 assert.deepEqual(f.attacker.trapAssists,[{id:0,team:0,share:1}]);
 f.die();assert.equal(f.attacker.trapAssists.length,1);
});
test('between-scan death does not credit a reopened or friendly enclosure or double a direct kill',()=>{
 for(const kind of ['open','friendly','direct']){
  const f=fixture({scanAfterClosure:false});
  if(kind==='open')f.walls.pop();if(kind==='friendly')f.attacker.team=f.victim.team;
  f.r.time+=.01;f.die(kind==='direct'?1:0);
  assert.equal(f.attacker.trapAssists,undefined);
 }
});

test('swept self-wall collision credits the newly enclosing opponent before marking the victim dead',()=>{
 const victim={id:0,team:0,x:0,z:-19.7,dir:0,alive:true,progress:1,segment:-1,travelRate:8,trailStopped:true};
 const attacker={id:1,team:1,x:50,z:50,dir:1,alive:true,progress:1,segment:-1,travelRate:0,trailStopped:true};
 const r={round:1,time:0,phase:'racing',teamCount:2,cycles:[victim,attacker],trails:[],breaches:[],closedArena:true,crashes:[],scores:[0,0]};
 const wall=(bikeId,x1,z1,x2,z2)=>({bikeId,team:r.cycles[bikeId].team,x1,z1,x2,z2});
 r.trails.push(wall(0,-20,-20,20,-20),wall(0,-20,20,20,20),wall(0,-20,-20,-20,20));
 trackCycleTraps(r,cycleCollisionTrails(r),[]);r.time=.11;trackCycleTraps(r,cycleCollisionTrails(r),[]);
 r.trails.push(wall(1,20,-20,20,20));r.time=.12;
 const before=projectState({race:r,tick:0,clients:[],waiting:[]});
 advanceContinuousCycles(r,[victim,attacker],.1);
 assert.equal(victim.alive,false);assert.equal(attacker.alive,true);
 assert.deepEqual(attacker.trapAssists,[{id:0,team:0,share:1}]);
 assert.equal(attacker.wallEliminations,undefined,'self-wall crash is not mislabeled as a direct trail hit');
 assert.equal(r.crashes.length,1);
 const offense=new OffenseEvents();offense.sample(r,r.time);
 assert.equal(offense.events.length,1);assert.equal(offense.events[0].credits[0].kind,'trap');
 assert(Math.abs(offensePoints({matchLimitSeconds:180,offenseEvents:offense.events},attacker.team)-(2+2*(1-r.time/180)))<1e-9);
 const next=projectState({race:r,tick:1,clients:[],waiting:[]});
 for(const previous of [null,before]){
  const decoded=decodeSnapshot(compactSnapshot(next,previous),previous);
  assert.deepEqual(decoded.race.cycles.find(b=>b.id===1).trapAssists,attacker.trapAssists);
 }
});
