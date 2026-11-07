import test from 'node:test';
import assert from 'node:assert/strict';
import {fftPower, analyze} from '../../tools/audio/analyze-recognizer.mjs';
import {recognizerSynthChannels} from '../../src/audio/recognizer-synth.js';
test('FFT locates an exact-bin sine and preserves its energy',()=>{
 const n=1024,input=Float64Array.from({length:n},(_,i)=>Math.sin(2*Math.PI*32*i/n));
 const power=fftPower(input);assert.ok(Math.abs(power[32]-n*n/4)<1e-6);
 const other=power.reduce((sum,v,i)=>sum+(i===32?0:v),0);assert.ok(other<1e-12);
});
test('Recognizer spectrum retains both measured bass registers and restrained upper partials',()=>{
 const stereo=recognizerSynthChannels('flight',12000),mono=stereo[0].map((v,i)=>(v+stereo[1][i])/2);
 const measured=analyze(mono);
 // Reference: 49.0%, 41.2%, 7.6%, 1.0% in the first four bands.
 for(const [index,target] of [[0,.490],[1,.412],[2,.076]])assert.ok(Math.abs(measured.bands[index].energyFraction-target)<.05);
 assert.ok(measured.bands.slice(4).reduce((sum,b)=>sum+b.energyFraction,0)<.005,'no broadband hiss');
 assert.ok(measured.peaks.slice(0,8).some(p=>p.hz<40));
 assert.ok(measured.peaks.slice(0,8).some(p=>p.hz>70));
});
