// Validation guides selection; only the later fresh suite is held-out evidence.
export function judgePlateauChallenger(current,challenger,seeds,{minGain=.02,relativeGain=0,improvedFraction=.75,preserveOffense=false}={}){
 const gain=challenger.fitness-current.fitness;
 const requiredGain=Math.max(minGain,Math.abs(current.fitness)*relativeGain);
 const seedFitness=(result,seed)=>result.rows.filter(r=>r.seed===seed).reduce((sum,row)=>sum+row.fitness,0);
 const improvedSeeds=seeds.filter(seed=>seedFitness(challenger,seed)>seedFitness(current,seed)+1e-9).length;
 const requiredSeeds=Math.ceil(seeds.length*improvedFraction);
 const offensePasses=!preserveOffense||challenger.offensePoints+1e-9>=current.offensePoints;
 return {gain,requiredGain,improvedSeeds,requiredSeeds,offensePasses,passes:gain>=requiredGain&&improvedSeeds>=requiredSeeds&&offensePasses};
}
