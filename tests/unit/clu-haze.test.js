import test from 'node:test';
import assert from 'node:assert/strict';
import {CluHaze,mazeEnclosure,CLU_HAZE as C} from '../../src/rendering/clu-haze.js';
const open={wallIntersection:()=>null},canyon={wallIntersection:()=>.1};
test('enclosure measures nearby wall coverage continuously',()=>{
 assert.equal(mazeEnclosure(open,0,0),0);assert.equal(mazeEnclosure(canyon,0,0),1);
 const distant={wallIntersection:()=>.95};assert(mazeEnclosure(distant,0,0)<.1);
});
test('haze builds and clears gradually, pauses and resets',()=>{
 const haze=new CluHaze();let scale=haze.update(canyon,0,0,1/60);
 assert(scale>C.openDensityScale&&scale<C.openDensityScale+.02);
 for(let i=0;i<600;i++)haze.update(canyon,0,0,1/60);
 assert(haze.enclosure>.95);const before=haze.enclosure;
 scale=haze.update(open,0,0,1/60);assert(haze.enclosure>before-.01);
 for(let i=0;i<1200;i++)haze.update(open,0,0,1/60);
 assert(haze.enclosure<.02);const paused=haze.enclosure;haze.update(canyon,0,0,0);assert.equal(haze.enclosure,paused);
 haze.reset();assert.equal(haze.enclosure,0);
});
