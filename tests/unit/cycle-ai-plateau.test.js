import test from 'node:test';
import assert from 'node:assert/strict';
import {judgePlateauChallenger} from '../../tools/ai/plateau-gate.mjs';
const seeds=Array.from({length:8},(_,i)=>i);
const result=(values,offensePoints=10)=>({fitness:values.reduce((a,b)=>a+b,0)/values.length,offensePoints,rows:values.map((fitness,seed)=>({seed,fitness}))});
const current=result(Array(8).fill(1));
const options={minGain:.02,relativeGain:.05,improvedFraction:.75,preserveOffense:true};
test('plateau requires meaningful relative improvement across seed groups',()=>{
 const gate=judgePlateauChallenger(current,result([1.1,1.1,1.1,1.1,1.1,1.1,1,1]),seeds,options);
 assert(gate.passes);assert.equal(gate.improvedSeeds,6);assert.equal(gate.requiredSeeds,6);assert.equal(gate.requiredGain,.05);
 assert(!judgePlateauChallenger(current,result(Array(8).fill(1.049)),seeds,options).passes);
});
test('a high aggregate score from only two seeds does not pass breadth gate',()=>{
 const gate=judgePlateauChallenger(current,result([2,2,1,1,1,1,1,1]),seeds,options);
 assert(gate.gain>.05);assert.equal(gate.improvedSeeds,2);assert(!gate.passes);
});
test('offense regression blocks accepting more wins or other fitness gains',()=>{
 const challenger=result(Array(8).fill(1.2),9);
 const gate=judgePlateauChallenger(current,challenger,seeds,options);
 assert(!gate.offensePasses);assert(!gate.passes);
 assert(judgePlateauChallenger(current,challenger,seeds,{...options,preserveOffense:false}).passes);
});
test('absolute gain floor and unchanged incumbent do not count as improvement',()=>{
 assert(!judgePlateauChallenger(result(Array(8).fill(.1)),result(Array(8).fill(.11)),seeds,options).passes);
 const gate=judgePlateauChallenger(current,current,seeds,options);
 assert.equal(gate.gain,0);assert.equal(gate.improvedSeeds,0);assert(!gate.passes);
});
