import test from 'node:test';
import assert from 'node:assert/strict';
import {AI_FITNESS,fastWinBonus,wallEliminationsByTeam,trapRewardsByTeam,matchFitness,compareFitness,OffenseEvents,offensePoints} from '../../tools/ai/fitness.mjs';
test('faster wins earn a bounded tunable bonus, never faster losses or timeouts',()=>{
 const result={winner:0,seconds:90,matchLimitSeconds:180};
 assert.equal(matchFitness(result,0),1.25);
 assert.equal(matchFitness({...result,seconds:0},0),1.5);
 assert.equal(matchFitness({...result,seconds:180},0),1);
 assert.equal(matchFitness({...result,seconds:200},0),1);
 assert.equal(matchFitness(result,0,{...AI_FITNESS,fastWinBonusPoints:1}),1.5);
 for(const seconds of [0,90,180]){
  assert.equal(matchFitness({...result,seconds},1),0);
  assert.equal(matchFitness({...result,seconds,winner:null,confinements:[1]},0),0);
 }
 for(const timing of [{seconds:-1},{seconds:NaN},{seconds:Infinity},{seconds:undefined},{matchLimitSeconds:0},{matchLimitSeconds:undefined},{matchLimitSeconds:Infinity}])assert.equal(fastWinBonus({...result,...timing},0),0);
});
test('offline wall credits count unique enemies including dead owners, not allies or self',()=>{
 const race={teamCount:2,cycles:[{id:0,team:0,alive:false,wallEliminations:[{id:2},{id:2},{id:1},{id:0}]},{id:1,team:0,wallEliminations:[{id:2}]},{id:2,team:1}]};
 assert.deepEqual(wallEliminationsByTeam(race),[1,0]);
 assert.equal(matchFitness({winner:null,wallEliminations:[1,0]},0),2);
 assert.equal(matchFitness({winner:0,wallEliminations:[1,0]},0),3);
});
test('aggression has primary weight but never overrides the runtime gate',()=>{
 const baseline={passesTiming:true,winRate:.5,fitness:.5};
 assert(compareFitness({...baseline,fitness:.6},baseline)<0);
 assert(compareFitness({...baseline,winRate:.4,fitness:.8},baseline)<0);
 assert(compareFitness({...baseline,passesTiming:false,winRate:1,fitness:1.4},baseline)>0);
});

test('multiple trappers share capped per-victim evaluation credit',()=>{
 const race={teamCount:3,cycles:[{id:0,team:0,trapAssists:[{id:2}],trapsCreated:[{id:2}]},{id:1,team:1,trapAssists:[{id:2}],trapsCreated:[{id:2}]},{id:2,team:2}]};
 assert.deepEqual(trapRewardsByTeam(race),{trapAssists:[.5,.5,0],confinements:[.5,.5,0]});
 assert.equal(matchFitness({winner:null,trapAssists:[1],confinements:[1]},0),2);
});

test('early confirmed eliminations have stronger credit, without rewarding an unfinished confinement',()=>{
 const result=seconds=>({winner:null,matchLimitSeconds:60,offenseEvents:[{victimId:9,seconds,credits:[{team:0,kind:'wall',share:1}]}]});
 assert.equal(matchFitness(result(15),0),3.5);
 assert.equal(matchFitness(result(45),0),2.5);
 assert.equal(matchFitness(result(60),0),2);
 assert.equal(matchFitness({...result(15),offenseEvents:[],confinements:[20]},0),0);
 for(const seconds of [undefined,NaN,Infinity,-1])assert.equal(offensePoints(result(seconds),0),2);
 assert.equal(offensePoints({...result(15),matchLimitSeconds:0},0),2);
});
test('direct kills and successful trappers share one capped victim pool, including dead wall owners',()=>{
 const race={cycles:[
  {id:0,team:0,alive:false,wallEliminations:[{id:3},{id:3}],trapAssists:[{id:3}]},
  {id:1,team:1,alive:true,trapAssists:[{id:3},{id:3}]},
  {id:2,team:1,alive:true,trapAssists:[{id:3}]},
  {id:3,team:2,alive:false},
 ]};
 const tracker=new OffenseEvents();tracker.sample(race,15);tracker.sample(race,30);
 assert.equal(tracker.events.length,1);
 assert.equal(tracker.events[0].seconds,15);
 const result={matchLimitSeconds:60,offenseEvents:tracker.events};
 assert.equal(offensePoints(result,0),1.75);assert.equal(offensePoints(result,1),1.75);
 assert.equal(offensePoints({...result,offenseEvents:[...tracker.events,...tracker.events]},0),1.75);
});
test('trap credit waits for death; friendly, escaped and uncredited deaths receive no offense points',()=>{
 const race={cycles:[{id:0,team:0,alive:true,trapsCreated:[{id:1}]},{id:1,team:1,alive:true}]};
 const tracker=new OffenseEvents();tracker.sample(race,5);assert.equal(tracker.events.length,0);
 race.cycles[1].alive=false;race.cycles[0].trapAssists=[{id:1}];tracker.sample(race,40);
 assert.equal(tracker.events[0].seconds,40);
 assert.equal(tracker.events[0].credits[0].kind,'trap');
 for(const changes of [{escaped:true},{team:0}]){
  const t=new OffenseEvents();t.sample({cycles:[race.cycles[0],{...race.cycles[1],...changes}]},40);assert.equal(t.events.length,0);
 }
 const t=new OffenseEvents();t.sample({cycles:[{id:0,team:0,alive:false}]},10);assert.equal(t.events.length,0);
});

test('version 3 doubles both confirmed kill types equally while preserving win and victim caps',()=>{
 assert.equal(AI_FITNESS.version,3);assert.equal(AI_FITNESS.winPoints,1);
 const previous={...AI_FITNESS,enemyWallPoints:1,trapAssistPoints:1,earlyEliminationBonusPoints:1};
 for(const seconds of [0,45,180]){
  const result=kind=>({winner:null,matchLimitSeconds:180,offenseEvents:[{victimId:7,seconds,credits:[{team:0,kind,share:1}]}]});
  assert.equal(offensePoints(result('wall'),0),offensePoints(result('trap'),0));
  assert.equal(offensePoints(result('wall'),0),2*offensePoints(result('wall'),0,previous));
  assert.equal(offensePoints(result('trap'),0),2*offensePoints(result('trap'),0,previous));
 }
 const lateKill={winner:null,matchLimitSeconds:180,offenseEvents:[{victimId:7,seconds:180,credits:[{team:0,kind:'trap',share:1}]}]};
 assert(matchFitness(lateKill,0)>matchFitness({winner:0,seconds:0,matchLimitSeconds:180,offenseEvents:[]},0));
});
