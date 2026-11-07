// Re-run against the local reference; baseline metrics are retained in the report.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {analyze,decodeAudio} from './analyze-recognizer.mjs';
import {recognizerSynthChannels,RECOGNIZER_SYNTH} from '../../src/audio/recognizer-synth.js';
const input=process.argv[2];if(!input)throw Error('Usage: node tools/audio/compare-recognizer.mjs reference.mp4 [output.json]');
const original=JSON.parse(readFileSync('tools/audio/results/recognizer-synth-fft-comparison.json'));
const reference=analyze(decodeAudio(input));
const report={reference:{file:input.split('/').at(-1),sha256:createHash('sha256').update(readFileSync(input)).digest('hex'),durationSeconds:reference.durationSeconds},
 configuration:RECOGNIZER_SYNTH,method:original.method,limitations:'Band agreement does not prove perceptual fidelity. Quiet frames contain aircraft as well as ambience. Mono statistics do not measure stereo character. Full-clip reference and 12-second synth have different modulation resolution.',layers:{}};
for(const kind of ['flight','ambience']){
 const c=recognizerSynthChannels(kind,12000),after=analyze(c[0].map((v,i)=>(v+c[1][i])/2)),before=original.layers[kind].before;
 const l1=a=>reference.bands.reduce((s,b,i)=>s+Math.abs(b.energyFraction-a.bands[i].energyFraction),0);
 report.layers[kind]={before,after,referenceBandAbsoluteErrorBefore:l1(before),referenceBandAbsoluteErrorAfter:l1(after)};
}
writeFileSync(process.argv[3]||'test-results/recognizer-synth-fft-comparison.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({reference:report.reference,bands:reference.bands,after:report.layers.flight.after.bands},null,2));
