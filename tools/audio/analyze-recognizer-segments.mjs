// Analyze contiguous intervals independently: never FFT across joined edits.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {analyze,decodeAudio,fftPower} from './analyze-recognizer.mjs';
export function meanSpectrum(samples,range,{sampleRate=12000,size=8192,hop=600}={}) {
 const [start,end]=range;
 if(!(start>=0&&end>start&&end*sampleRate<=samples.length&&end-start>=size/sampleRate))throw Error('Invalid/short analysis interval');
 const result=new Float64Array(size/2);let frames=0;
 for(let offset=Math.ceil(start*sampleRate);offset+size<=end*sampleRate;offset+=hop){
  const power=fftPower(Float64Array.from({length:size},(_,i)=>samples[offset+i]*(.5-.5*Math.cos(2*Math.PI*i/(size-1)))));
  power.forEach((v,i)=>result[i]+=v);frames++;
 }
 return result.map(v=>v/frames);
}
export function residualHarmonics(active,background,{fundamentalHz,halfWidthHz},sampleRate=12000){
 const size=active.length*2,rows=[];
 for(let harmonic=1;harmonic<=20;harmonic++){
  let on=0,off=0;
  for(let k=Math.ceil((fundamentalHz*harmonic-halfWidthHz)*size/sampleRate);k<(fundamentalHz*harmonic+halfWidthHz)*size/sampleRate;k++){on+=active[k];off+=background[k];}
  rows.push({harmonic,hz:fundamentalHz*harmonic,activePower:on,backgroundPower:off,residualPower:Math.max(0,on-off)});
 }
 const maximum=Math.max(...rows.map(r=>r.residualPower));
 return rows.map(r=>({...r,relativeAmplitude:Math.sqrt(r.residualPower/maximum)}));
}
if(process.argv[1]?.endsWith('analyze-recognizer-segments.mjs')){
 const input=process.argv[2];if(!input)throw Error('Pass the local reference MP4');
 const selections=JSON.parse(readFileSync('tools/audio/recognizer-segments.json'));
 const samples=decodeAudio(input),groups={};
 for(const group of ['active','background'])groups[group]=selections[group].map(range=>({rangeSeconds:range,analysis:analyze(samples.slice(range[0]*12000,range[1]*12000))}));
 const study=selections.harmonicStudy;
 const harmonics=residualHarmonics(meanSpectrum(samples,study.active),meanSpectrum(samples,study.background),study);
 const report={source:selections.source,sha256:createHash('sha256').update(readFileSync(input)).digest('hex'),selections,
  method:'Separate contiguous-window FFTs; harmonic study subtracts mean background power in matched bands before amplitude normalization. No phase recovery or source isolation; residual is an estimate.',groups,harmonics};
 writeFileSync('tools/audio/results/recognizer-segmented-fft.json',JSON.stringify(report,null,2));
 // Ignored local-only comparison clips. No references or excerpts enter dist.
 mkdirSync('test-results/recognizer-reference',{recursive:true});
 const previews=[];
 for(const [group,range] of [['active',study.active],['background',study.background]]){
  const name=`${group}-${range[0]}-${range[1]}.wav`;
  const result=spawnSync('ffmpeg',['-y','-v','error','-ss',String(range[0]),'-i',input,'-t',String(range[1]-range[0]),'-vn','-c:a','pcm_s16le','test-results/recognizer-reference/'+name]);
  if(result.status)throw Error(result.stderr.toString());
  previews.push({group,rangeSeconds:range,url:'/test-results/recognizer-reference/'+name});
 }
 writeFileSync('test-results/recognizer-reference/segments.json',JSON.stringify({status:selections.status,previews}));
 console.log(harmonics.map(r=>({harmonic:r.harmonic,amplitude:+r.relativeAmplitude.toFixed(3)})));
}
