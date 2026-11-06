import test from 'node:test';
import assert from 'node:assert/strict';
import {SceneryClock} from '../../src/rendering/scenery-clock.js';

test('multiplayer scenery advances each frame despite packet holds, corrections and new rounds',()=>{
  const clock=new SceneryClock(),run={time:12,multiplayer:{}};
  assert.equal(clock.sample(run,run,1,0),12);
  for(let frame=1;frame<=120;frame++){
    // Simulate stale timestamps, a backwards correction, and a round reset.
    run.time=frame<30?12:frame<60?11:0;
    const time=clock.sample(run,run,1,1/60);
    assert.ok(Math.abs(time-(12+frame/60))<1e-10);
  }
});
test('solo scenery interpolates simulation time and respects pauses and resets',()=>{
  const clock=new SceneryClock();
  assert.equal(clock.sample({time:2},{time:1},.25,.1),1.25);
  assert.equal(clock.sample({time:2},{time:2},.5,.1),2);
  clock.sample({time:50,multiplayer:{}},{time:2},1,0);
  clock.reset();
  assert.equal(clock.sample({time:0,multiplayer:{}},{time:0},1,0),0);
  assert.equal(clock.sample({time:1},{time:0},.5,.1),.5);
});

test('solo scenery cannot become NaN when an older pose snapshot omits its timestamp',()=>{
 const clock=new SceneryClock();
 for(const previous of [{},{time:undefined},{time:NaN},undefined])assert.equal(clock.sample({time:15},previous,.5,1/60),15);
 assert.equal(clock.sample({time:2},{time:1},.25,1/60),1.25,'valid snapshots retain interpolation');
});
