import {judgePlateauChallenger} from './plateau-gate.mjs';
import {APPROACH} from './approach.mjs';
// Start from the frozen playtested policy. Stop on a predeclared validation plateau.
import {Worker} from 'node:worker_threads';
import {writeFile,mkdir,readFile,copyFile} from 'node:fs/promises';
import {PLAYTESTED_POLICY} from '../../shared/simulation/cycle-ai/policies/aggression-v3.js';
import {BASELINE_POLICY as DEFAULT_POLICY,POLICY_BOUNDS,validatePolicy} from '../../shared/simulation/cycle-ai/config.js';
import {AI_FITNESS} from './fitness.mjs';
import {match} from './benchmark.mjs';
const fastWins=process.argv.includes('--fast-wins');
const options={population:4,trainSeeds:4,validationSeeds:4,finalSeeds:8,seconds:180,workers:3,patience:3,minGain:.02,relativeGain:0,improvedFraction:.75,seedOffset:fastWins?200000:0,mutationSeed:fastWins?882913:772913};
for(const key of Object.keys(options)){
 const arg=process.argv.find(a=>a.startsWith(`--${key}=`));if(arg)options[key]=Number(arg.slice(key.length+3));
 const fractional=['minGain','relativeGain','improvedFraction'].includes(key);
 if(!Number.isFinite(options[key])||(fractional?options[key]<0:!Number.isInteger(options[key])||options[key]<0))throw Error(`Invalid ${key}`);
 if(!fractional&&!['seedOffset','mutationSeed'].includes(key)&&options[key]<1)throw Error(`Invalid ${key}`);
}
if(options.improvedFraction<=0||options.improvedFraction>1)throw Error('Invalid improvedFraction');
const artifact=process.argv.find(a=>a.startsWith('--artifact='))?.slice(11)??(fastWins?'cycle-ai-fast-wins':'cycle-ai-plateau');
if(!/^[a-z0-9-]+$/.test(artifact))throw Error('Invalid artifact');
const scales=process.argv.find(a=>a.startsWith('--mutationScales='))?.slice(17).split(',').map(Number)??[.3];
if(!scales.length||scales.some(s=>!Number.isFinite(s)||s<=0||s>1))throw Error('Invalid mutationScales');
options.mutationScales=scales;options.preserveOffense=process.argv.includes('--preserve-offense');
const evaluation=process.argv.find(a=>a.startsWith('--evaluation-opponent='))?.slice(22)??'original';
if(!['original','current'].includes(evaluation))throw Error('Invalid evaluation-opponent');
const initial=PLAYTESTED_POLICY,evaluationOpponent=evaluation==='current'?initial:DEFAULT_POLICY;
const opponentPaths=process.argv.filter(a=>a.startsWith('--opponent=')).map(a=>a.slice(11));
const extraOpponents=await Promise.all(opponentPaths.map(async path=>validatePolicy(JSON.parse(await readFile(path,'utf8')).policy)));
options.evaluationOpponent=evaluation;
await mkdir('test-results',{recursive:true});
let champion=validatePolicy(initial),rng=options.mutationSeed,stale=0,generation=0;
const random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
function mutate(parent,id,index){const p={...parent,id};for(const [key,[min,max]] of Object.entries(POLICY_BOUNDS))p[key]=Math.max(min,Math.min(max,parent[key]+(random()-.5)*(max-min)*scales[index%scales.length]));return validatePolicy(p);}
function evaluate(policy,seeds,opponents,label){return new Promise((resolve,reject)=>{
 const w=new Worker(new URL('./tournament-worker.mjs',import.meta.url),{workerData:{policy,seeds,opponents,seconds:options.seconds,label}});
 w.on('message',m=>{if(m.result)resolve(m.result);else console.log(JSON.stringify(m));});w.on('error',reject);w.on('exit',code=>{if(code)reject(Error(`Worker exit ${code}`));});
});}
async function pool(items,fn){let cursor=0;const results=Array(items.length);await Promise.all(Array.from({length:Math.min(options.workers,items.length)},async()=>{while(cursor<items.length){const i=cursor++;results[i]=await fn(items[i],i);}}));return results;}
function timing(policy){const r=match({seed:72000,mode:'bounded',seconds:options.seconds,policies:Array(4).fill(policy),measure:true});return {aiMs:r.aiMs,tickMs:r.tickMs,passes:r.aiMs.p99<=1&&r.tickMs.p99<1000/120};}
const seeds=Array.from({length:options.validationSeeds},(_,i)=>options.seedOffset+40000+i),history=[DEFAULT_POLICY,champion],records=[];
for(const policy of extraOpponents)if(!history.some(p=>p.id===policy.id))history.push(policy);
const trainingOpponents=history.slice();
let validation=await evaluate(champion,seeds,[evaluationOpponent],'initial-validation');
const initialValidation=validation;
while(stale<options.patience){
 const trainSeeds=Array.from({length:options.trainSeeds},(_,i)=>options.seedOffset+20000+generation*100+i);
 const candidates=[champion,...Array.from({length:options.population-1},(_,i)=>mutate(champion,`${artifact}-${generation}-${i}`,i))];
 const scores=await pool(candidates,async p=>({policy:p,result:await evaluate(p,trainSeeds,history,`g${generation}:${p.id}`)}));
 scores.sort((a,b)=>b.result.fitness-a.result.fitness||b.result.winRate-a.result.winRate);
 const chosen=scores[0];let challenger=null,check=null,gain=0,improvedSeeds=0,accepted=false,gate=null;
 if(chosen.policy.id!==champion.id){
  challenger=await evaluate(chosen.policy,seeds,[evaluationOpponent],`validation:${chosen.policy.id}`);
  gate=judgePlateauChallenger(validation,challenger,seeds,options);gain=gate.gain;improvedSeeds=gate.improvedSeeds;
  if(gate.passes){check=timing(chosen.policy);accepted=check.passes;}
 }
 if(accepted){champion=chosen.policy;validation=challenger;history.push(champion);stale=0;}else stale++;
 records.push({generation,scores,challenger,timing:check,gate,gain,improvedSeeds,accepted,stale,champion:champion.id});
 console.log(JSON.stringify({generation,champion:champion.id,gain,improvedSeeds,accepted,stale,validation:{...validation,rows:undefined}}));
 await writeFile(`test-results/${artifact}-checkpoint.json`,JSON.stringify({options,opponentPaths,trainingOpponents,evaluationOpponent,fitnessWeights:AI_FITNESS,approachConfig:APPROACH,initial,initialValidation,champion,validation,records,stale},null,2));
 generation++;
}
const finalSeeds=Array.from({length:options.finalSeeds},(_,i)=>options.seedOffset+100000+i);
// Cache identical policies: an unchanged champion needs no duplicate mirrors.
const finalPolicies=[champion,initial,evaluationOpponent];
const key=p=>JSON.stringify(validatePolicy(p));
const unique=[...new Map(finalPolicies.map(p=>[key(p),p])).values()];
const evaluations=await pool(unique,p=>evaluate(p,finalSeeds,[evaluationOpponent],`final:${p.id}`));
const resultFor=p=>evaluations[unique.findIndex(u=>key(u)===key(p))];
const [candidate,previousTrial,baseline]=finalPolicies.map(resultFor);
const finalTiming=timing(champion),finalGate=judgePlateauChallenger(previousTrial,candidate,finalSeeds,options);
const trialUpdated=champion.id!==initial.id&&finalTiming.passes&&finalGate.passes;
const output={version:1,options,opponentPaths,trainingOpponents,evaluationOpponent,fitnessWeights:AI_FITNESS,approachConfig:APPROACH,initial,initialValidation,policy:champion,validation,records,heldOut:{candidate,previousTrial,baseline,uniqueEvaluations:unique.length,gate:finalGate},timing:finalTiming,stale,generations:generation,trialUpdated,promoted:false,
 note:'Observed plateau under the configured patience, fitness/seed/offense gates and serial runtime limits. Fixed validation is selection data, not held-out proof. Final seeds are used once per distinct policy. No production promotion.'};
await writeFile(`test-results/${artifact}.json`,JSON.stringify(output,null,2));
if(trialUpdated){
 try{await copyFile('test-results/cycle-ai-trained.json',`test-results/${artifact}-previous-trial.json`);}catch(error){if(error.code!=='ENOENT')throw error;}
 await writeFile('test-results/cycle-ai-trained.json',JSON.stringify(output,null,2));
}
console.log(JSON.stringify({complete:true,generations:generation,stale,champion:champion.id,trialUpdated,candidate:{...candidate,rows:undefined},previousTrial:{...previousTrial,rows:undefined},baseline:{...baseline,rows:undefined},timing:finalTiming}));
