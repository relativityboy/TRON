// Offline evaluation only: never adds work to a live simulation tick.
export const AI_FITNESS=Object.freeze({version:3,winPoints:1,fastWinBonusPoints:.5,enemyWallPoints:2,trapAssistPoints:2,earlyEliminationBonusPoints:2,confinementPoints:0,approachPoints:.15});
// Observe confirmed deaths offline; no timestamps or scoring work added to live AI.
export class OffenseEvents{
 constructor(){this.seen=new Set();this.events=[];}
 sample(race,seconds){
  for(const victim of race.cycles){
   if(victim.alive||victim.escaped||this.seen.has(victim.id))continue;
   this.seen.add(victim.id);
   const eligible=owner=>owner.id!==victim.id&&owner.team!==victim.team;
   const direct=race.cycles.filter(owner=>eligible(owner)&&owner.wallEliminations?.some(hit=>hit.id===victim.id));
   const assists=race.cycles.filter(owner=>eligible(owner)&&owner.trapAssists?.some(hit=>hit.id===victim.id)&&!direct.includes(owner));
   const credits=[];
   // One victim, one pool: direct owner(s) and trappers share it, never two kills.
   for(const [owners,kind] of [[direct,'wall'],[assists,'trap']])for(const owner of owners)
    credits.push({team:owner.team,kind,share:(direct.length&&assists.length ? .5 : 1)/owners.length});
   if(credits.length)this.events.push({victimId:victim.id,seconds,credits});
  }
 }
}
export function offensePoints(result,team,weights=AI_FITNESS){
 if(!Array.isArray(result.offenseEvents))return (result.wallEliminations?.[team]??0)*weights.enemyWallPoints+(result.trapAssists?.[team]??0)*weights.trapAssistPoints;
 const victims=new Set();let points=0;
 for(const event of result.offenseEvents){
  if(victims.has(event.victimId))continue;victims.add(event.victimId);
  const early=Number.isFinite(event.seconds)&&event.seconds>=0&&Number.isFinite(result.matchLimitSeconds)&&result.matchLimitSeconds>0
   ?Math.max(0,1-event.seconds/result.matchLimitSeconds):0;
  const total=event.credits.reduce((sum,c)=>sum+Math.max(0,c.share),0);
  for(const credit of event.credits)if(credit.team===team)
   points+=Math.max(0,credit.share)/Math.max(1,total)*((credit.kind==='wall'?weights.enemyWallPoints:weights.trapAssistPoints)+(weights.earlyEliminationBonusPoints??0)*early);
 }
 return points;
}
export function fastWinBonus(result,team,weights=AI_FITNESS){
 // Missing legacy timing earns no bonus; only a confirmed winner qualifies.
 if(team==null||result.winner!==team||!Number.isFinite(result.seconds)||result.seconds<0||!Number.isFinite(result.matchLimitSeconds)||result.matchLimitSeconds<=0)return 0;
 return weights.fastWinBonusPoints*Math.max(0,1-result.seconds/result.matchLimitSeconds);
}
export function wallEliminationsByTeam(race){
 const victims=new Set(),counts=Array(race.teamCount).fill(0);
 for(const owner of race.cycles)for(const hit of owner.wallEliminations??[]){
  const victim=race.cycles.find(b=>b.id===hit.id);
  if(!victim||victim.id===owner.id||victim.team===owner.team||victims.has(victim.id))continue;
  victims.add(victim.id);counts[owner.team]++;
 }
 return counts;
}
export function trapRewardsByTeam(race){
 const assists=Array(race.teamCount).fill(0),confinements=Array(race.teamCount).fill(0);
 for(const field of ['trapAssists','trapsCreated']){
  const victims=new Map();
  for(const owner of race.cycles)for(const hit of owner[field]??[]){
   const victim=race.cycles.find(b=>b.id===hit.id);if(!victim||victim.team===owner.team)continue;
   if(!victims.has(hit.id))victims.set(hit.id,new Set());victims.get(hit.id).add(owner);
  }
  for(const owners of victims.values())for(const owner of owners)(field==='trapAssists'?assists:confinements)[owner.team]+=1/owners.size;
 }
 return {trapAssists:assists,confinements};
}
export function matchFitness(result,team,weights=AI_FITNESS){
 return (result.winner===team?weights.winPoints:0)+fastWinBonus(result,team,weights)+offensePoints(result,team,weights)+(result.confinements?.[team]??0)*weights.confinementPoints+Math.max(0,Math.min(1,result.approach?.[team]??0))*(weights.approachPoints??0);
}
// Runtime is the hard gate; successful aggression and wins jointly rank policies.
export function compareFitness(a,b){
 return Number(b.passesTiming)-Number(a.passesTiming)||b.fitness-a.fitness||b.winRate-a.winRate;
}
