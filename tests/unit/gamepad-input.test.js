import test from 'node:test';
import assert from 'node:assert/strict';
import {GamepadController,gamepadAxis} from '../../src/app/gamepad-controller.js';
import {InputController} from '../../src/app/input-controller.js';
const pad=()=>({index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))});
test('dead zone and proportional axes; tank fire and cycle pedals reach shared command',()=>{
 const p=pad(),g=new GamepadController();g.poll([p]);p.axes=[.5,-.5,.6,-.4];p.buttons[7].value=1;
 const result=g.poll([p],{playing:true}),input=new InputController();input.gamepadKeys=result.held;input.gamepadAxes=result.axes;
 const cmd=input.command({playerVehicle:'tank',gunner:true});assert.equal(cmd.throttle,gamepadAxis(.5));assert.equal(cmd.steer,gamepadAxis(.5));assert(cmd.fire&&cmd.turret>0&&cmd.aimPitch>0);assert.equal(gamepadAxis(.1),0);
 input.gamepadKeys=g.poll([p],{playing:true,cycle:true}).held;
 assert(input.command({playerVehicle:'cycle'}).cycleTurbo);p.buttons[6].value=1;input.gamepadKeys=g.poll([p],{playing:true,cycle:true}).held;assert(!input.command({playerVehicle:'cycle'}).cycleTurbo);assert(input.command({playerVehicle:'cycle'}).cycleSlow);
});
test('cycle turns and menu buttons have one edge per deflection',()=>{
 const p=pad(),g=new GamepadController();g.poll([p]);p.axes[0]=-1;
 assert.deepEqual(g.poll([p],{playing:true,cycle:true}).pressed,['ArrowLeft']);assert.deepEqual(g.poll([p],{playing:true,cycle:true}).pressed,[]);
 p.axes[0]=0;g.poll([p]);p.axes[0]=1;assert.deepEqual(g.poll([p]).pressed,['ArrowRight']);
 p.buttons[9].value=1;assert(g.poll([p]).pressed.includes('Enter'));assert(!g.poll([p]).pressed.includes('Enter'));
});
test('disconnect and focus loss release channels and require neutral before rearming',()=>{
 const p=pad(),g=new GamepadController();g.poll([p]);p.buttons[7].value=1;assert(g.poll([p],{playing:true}).held.has('Space'));
 assert.equal(g.poll([p],{active:false}).held.size,0);assert.equal(g.poll([p],{playing:true}).held.size,0);
 p.buttons[7].value=0;g.poll([p]);p.buttons[7].value=1;assert(g.poll([p],{playing:true}).held.has('Space'));
 assert.equal(g.poll([]).held.size,0);assert.equal(g.poll([p],{playing:true}).held.size,0);
});
test('clearing manual input releases controller without releasing physical keyboard on normal pedal release',()=>{
 const i=new InputController();i.keys.add('KeyW');i.gamepadKeys.add('KeyS');assert.equal(i.command({}).throttle,-1);i.gamepadKeys.clear();assert.equal(i.command({}).throttle,1);i.gamepadAxes={turret:1};i.clear();assert.equal(i.command({}).turret,0);
});
