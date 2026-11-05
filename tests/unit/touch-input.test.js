import test from 'node:test';
import assert from 'node:assert/strict';
import {InputController} from '../../src/app/input-controller.js';
test('touch pedals share keyboard commands, brake wins, and focus clearing releases them',()=>{
 const input=new InputController(),run={playerVehicle:'cycle',cycleRace:{playerId:0,cycles:[{}]}};
 input.touchKeys.add('KeyW');assert(input.command(run).cycleTurbo);
 input.queueCycleTurn(-1);assert.equal(input.command(run).cycleTurn,-1);input.consume();assert(input.command(run).cycleTurbo);
 input.touchKeys.add('KeyS');assert(input.command(run).cycleSlow);assert(!input.command(run).cycleTurbo);
 input.keys.add('KeyW');input.touchKeys.clear();assert(input.command(run).cycleTurbo,'releasing touch does not release the physical keyboard');
 input.touchKeys.add('KeyS');input.clearKeys();assert(!input.command(run).cycleSlow&&!input.command(run).cycleTurbo);
});
test('arrow pedals match WASD for arena cycles, road cycles and tanks',()=>{
 const input=new InputController();
 for(const run of [{playerVehicle:'tank'},{playerVehicle:'cycle',cycleRace:{playerId:0,cycles:[{}]}},{playerVehicle:'cycle',cycleRace:{playerId:0,cycles:[{escaped:true}]}}]){
  for(const [letter,arrow] of [['KeyW','ArrowUp'],['KeyS','ArrowDown'],['KeyA','ArrowLeft'],['KeyD','ArrowRight']]){
   input.clear();input.keys.add(letter);const expected=input.command(run);input.clear();input.keys.add(arrow);assert.deepEqual(input.command(run),expected);
  }
 }
 input.clear();input.keys.add('ArrowUp');input.keys.add('KeyS');assert(!input.command({playerVehicle:'cycle'}).cycleTurbo);assert(input.command({playerVehicle:'cycle'}).cycleSlow);
});
