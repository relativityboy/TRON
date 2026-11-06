import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {browserScenario} from '../../src/game/browser-scenario.js';
import {carrierFor,CARRIER} from '../../src/game/carrier.js';
import {DEFAULT_WORLD} from '../../src/levels/scenario.js';
import {GameSession} from '../../src/simulation/game-session.js';
import {SceneryClock} from '../../src/rendering/scenery-clock.js';
import {CarrierMaterialization} from '../../src/rendering/carrier-materialization.js';
import {applyCycleOpeningCarrier,CYCLE_OPENING_CARRIER} from '../../src/rendering/cycle-opening.js';

test('actual simulation snapshots keep carrier transit and reveal finite through CLU ticks and restart',()=>{
 const world=browserScenario({pathname:'/',search:'?layoutSeed=1982'},()=>.5).world,session=new GameSession({world,seed:1982}),clock=new SceneryClock(),c=carrierFor(world);
 const ship=new T.Group(),geometry=new T.BoxGeometry(1224.65,201.96,277.01),material=new T.MeshBasicMaterial();material.name='TxTC01';ship.add(new T.Mesh(geometry,material));
 ship.position.set(c.startX,c.altitude,-c.s);const reveal=new CarrierMaterialization(ship);
 try{
  const spawn={...world.SPAWN};
  for(const before of [0,.1,15,59,180]){
   session.run.time=before;session.advance({},1/60);assert.equal(session.previous.time,before);
   for(const alpha of [0,.25,.5,1]){
    const time=clock.sample(session.run,session.previous,alpha,1/60);
    assert(Math.abs(time-(before+(session.run.time-before)*alpha))<1e-9);
    ship.position.set(c.startX+c.speed*time,c.altitude,-c.s);reveal.updateTransit(time,c.speed);
    assert(ship.position.toArray().every(Number.isFinite),'carrier must not leave the scene through NaN position');
    assert(Number.isFinite(reveal.opacity)&&Number.isFinite(reveal.solid.rezCut.value)&&Number.isFinite(reveal.wire.rezCut.value),'materialization must remain finite');
   }
  }
  assert.equal(reveal.opacity,1);assert.deepEqual(world.SPAWN,spawn,'Clu spawn and heading remain unchanged');
  session.reset(1982);clock.reset();assert.equal(clock.sample(session.run,session.previous,1,0),0);reveal.updateTransit(0,c.speed);assert.equal(reveal.opacity,0);
 }finally{session.dispose();reveal.dispose();ship.traverse(o=>o.geometry?.dispose());material.dispose();reveal.lineMaterial.dispose();reveal.rectangle.material.dispose();}
});

test('authored transit and the light-cycle opening retain their existing placement',()=>{
 const c=carrierFor(DEFAULT_WORLD);assert.equal(c.startX,CARRIER.startX);assert.equal(c.s,CARRIER.s);
 const ship=new T.Group(),site={x:123,s:456};applyCycleOpeningCarrier(ship,0,site);
 const opening=CYCLE_OPENING_CARRIER;
 assert.equal(ship.position.x,site.x+opening.xOffsetMeters-Math.cos(opening.yawRadians)*opening.setbackMeters);
 assert.equal(ship.position.y,opening.altitudeMeters);assert.equal(ship.rotation.y,opening.yawRadians);
});
