import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizerPose} from '../../src/rendering/recognizer-pose.js';
const old={id:1,x:0,y:20,s:0,yaw:Math.PI-.02,fold:0,state:'wander'};
const current={...old,x:2,y:22,s:4,yaw:-Math.PI+.02,fold:1};
test('recognizer render poses interpolate position, fold and shortest yaw without mutating simulation',()=>{
 const pose=recognizerPose(current,old,.5);
 assert.deepEqual(pose,{x:1,y:21,s:2,yaw:Math.PI,fold:.5});
 assert.equal(current.x,2);assert.equal(old.x,0);
 assert.equal(recognizerPose(current,old,1),current);
});
test('recognizer discontinuities snap instead of drawing a teleport or spawn sweep',()=>{
 for(const previous of [undefined,{...old,id:2},{...old,state:'materializing'},{...old,teleport:{}}])assert.equal(recognizerPose(current,previous,.5),current);
 const teleport={...current,teleport:{}};assert.equal(recognizerPose(teleport,old,.5),teleport);
});
test('session retains independent recognizer poses before each fixed step',async()=>{
 const {GameSession}=await import('../../src/simulation/game-session.js');
 const session=new GameSession();const e=session.run.recognizers[0],before={x:e.x,y:e.y,s:e.s,yaw:e.yaw};
 session.advance({},1/60);
 const snapshot=session.previous.recognizers.find(p=>p.id===e.id);
 for(const key of Object.keys(before))assert.equal(snapshot[key],before[key]);
 e.x+=10;assert.equal(snapshot.x,before.x);session.dispose();
});
