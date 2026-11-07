import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizerSynthChannels, recognizerSynthBuffer, RECOGNIZER_SYNTH} from '../../src/audio/recognizer-synth.js';
test('procedural aircraft and ambience are deterministic bounded stereo loops',()=>{
 for(const kind of ['flight','approach','ambience']){
  const channels=recognizerSynthChannels(kind,8000), repeat=recognizerSynthChannels(kind,8000);
  assert.equal(channels[0].length,8000*RECOGNIZER_SYNTH.loopSeconds);
  assert.deepEqual(channels,repeat);
  assert.notDeepEqual(channels[0],channels[1]);
  for(const channel of channels){
   let energy=0,peak=0;for(const value of channel){assert.ok(Number.isFinite(value));energy+=value*value;peak=Math.max(peak,Math.abs(value));}
   assert.ok(Math.sqrt(energy/channel.length)>.01);assert.ok(peak<1);
   assert.ok(Math.abs(channel.at(-1)-channel[0])<1e-6,'continuous loop boundary');
  }
 }
});
test('synth buffers are shared within context, never between contexts',()=>{
 const context=()=>({createBuffer(channels,length,sampleRate){return {channels,length,sampleRate,copyToChannel(){}};}});
 const a=context(),b=context();assert.equal(recognizerSynthBuffer(a),recognizerSynthBuffer(a));
 assert.notEqual(recognizerSynthBuffer(a),recognizerSynthBuffer(b));
 assert.notEqual(recognizerSynthBuffer(a),recognizerSynthBuffer(a,'ambience'));
});
