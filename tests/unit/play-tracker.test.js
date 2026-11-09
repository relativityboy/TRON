import test from 'node:test';
import assert from 'node:assert/strict';
import {PlayTracker} from '../../src/analytics/play-tracker.js';
test('counts controlled runs and seated rounds, never menus or spectators',()=>{
 const plays=[],t=new PlayTracker(m=>plays.push(m));
 const run={cycleRace:{round:1,phase:'countdown',playerId:0,cycles:[{id:0,alive:true}]},multiplayer:{connected:true,seat:null}};
 const update=(game,mode='running')=>t.update({mode,game,run});
 update('space','ready');update('cycles');update('multiplayer');assert.deepEqual(plays,[]);
 update('space');update('space');update('space','paused');update('space');assert.deepEqual(plays,['clu']);
 t.reset();update('space');run.cycleRace.phase='racing';update('cycles');update('cycles');
 run.cycleRace.round++;update('cycles');update('multiplayer');
 run.multiplayer.seat=0;update('multiplayer');update('multiplayer');
 run.cycleRace.round++;run.cycleRace.cycles[0].alive=false;update('multiplayer');
 run.cycleRace.cycles[0].alive=true;update('multiplayer');
 assert.deepEqual(plays,['clu','clu','cycles-solo','cycles-solo','cycles-mp','cycles-mp']);
});
