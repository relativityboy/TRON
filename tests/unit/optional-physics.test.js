import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canUseWebAssembly,optionalPhysicsBackend} from '../../src/simulation/optional-physics.js';
test('missing or blocked WebAssembly never loads the physics backend',async()=>{
 for(const getAPI of [()=>undefined,()=>{throw Error('Denied');},()=>({Module(){throw Error('Blocked');}})]){
  let loads=0;assert.equal(canUseWebAssembly(getAPI),false);assert.equal(await optionalPhysicsBackend({getAPI,load:async()=>{loads++;}}),null);assert.equal(loads,0);
 }
});
test('backend loading and compilation failures resolve to fallback without rejecting',async()=>{
 assert.equal(await optionalPhysicsBackend({load:async()=>{throw Error('Network failed');}}),null);
 assert.equal(await optionalPhysicsBackend({load:async()=>({default:{init:async()=>{throw Error('Compilation refused');}}})}),null);
 const backend={init:async()=>{}};assert.equal(await optionalPhysicsBackend({load:async()=>({default:backend})}),backend);
});
test('a stalled initialization has a deadline and late rejection remains handled',async()=>{
 let reject;const task=new Promise((_,no)=>{reject=no;});
 assert.equal(await optionalPhysicsBackend({load:()=>task,timeoutMs:10}),null);reject(Error('late network failure'));await new Promise(resolve=>setImmediate(resolve));
});
