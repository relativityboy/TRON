// Reproducible windowed FFT analysis. Requires local ffmpeg; never ships source audio.
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
export function fftPower(input) {
 const n=input.length,re=Float64Array.from(input),im=new Float64Array(n);
 for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)[re[i],re[j]]=[re[j],re[i]];}
 for(let size=2;size<=n;size*=2){const angle=-2*Math.PI/size,wr=Math.cos(angle),wi=Math.sin(angle);
  for(let start=0;start<n;start+=size){let ar=1,ai=0;for(let j=0;j<size/2;j++){
   const a=start+j,b=a+size/2,tr=ar*re[b]-ai*im[b],ti=ar*im[b]+ai*re[b];
   re[b]=re[a]-tr;im[b]=im[a]-ti;re[a]+=tr;im[a]+=ti;
   const next=ar*wr-ai*wi;ai=ar*wi+ai*wr;ar=next;
  }}
 }
 return Float64Array.from({length:n/2},(_,i)=>re[i]*re[i]+im[i]*im[i]);
}
export function analyze(samples,sampleRate=12000){
 const n=16384,hop=1024,window=Float64Array.from({length:n},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/(n-1)));
 const bands=[[20,60],[60,120],[120,250],[250,500],[500,1000],[1000,2000],[2000,5000]];
 const frames=[],average=new Float64Array(n/2);
 for(let start=0;start+n<=samples.length;start+=hop){
  const power=fftPower(window.map((w,i)=>w*samples[start+i]));
  const energy=bands.map(([lo,hi])=>{let sum=0;for(let i=Math.ceil(lo*n/sampleRate);i<hi*n/sampleRate;i++)sum+=power[i];return sum;});
  frames.push({time:(start+n/2)/sampleRate,power,energy,total:energy.reduce((a,b)=>a+b,0)});
  power.forEach((v,i)=>average[i]+=v);
 }
 const peaks=p=>{const found=[];for(let i=2;i<p.length-1;i++)if(p[i]>p[i-1]&&p[i]>p[i+1]&&i*sampleRate/n>=20)found.push(i);
  found.sort((a,b)=>p[b]-p[a]);const selected=[];
  for(const i of found){if(selected.every(j=>Math.abs(j-i)*sampleRate/n>3))selected.push(i);if(selected.length===16)break;}
  const maximum=Math.max(...p);return selected.map(i=>({hz:+(i*sampleRate/n).toFixed(2),db:+(10*Math.log10(p[i]/maximum)).toFixed(2)}));};
 const sorted=[...frames].sort((a,b)=>a.total-b.total),quiet=sorted.slice(0,Math.ceil(frames.length*.15));
 const quietSpectrum=new Float64Array(n/2);quiet.forEach(f=>f.power.forEach((v,i)=>quietSpectrum[i]+=v));
 const sections=[];for(let t=0;t<samples.length/sampleRate;t+=6){const selected=frames.filter(f=>f.time>=t&&f.time<t+6);if(!selected.length)continue;
 const power=new Float64Array(n/2);selected.forEach(f=>f.power.forEach((v,i)=>power[i]+=v));sections.push({start:t,peaks:peaks(power).slice(0,8)});}
 const modulation=bands.map((range,b)=>{const length=2**Math.ceil(Math.log2(frames.length)),values=new Float64Array(length),mean=frames.reduce((s,f)=>s+Math.sqrt(f.energy[b]),0)/frames.length;
  frames.forEach((f,i)=>values[i]=(Math.sqrt(f.energy[b])-mean)*(.5-.5*Math.cos(2*Math.PI*i/(frames.length-1))));
  const power=fftPower(values),rate=sampleRate/hop,indices=[];for(let i=1;i<power.length-1;i++)if(i*rate/length>=.1&&power[i]>power[i-1]&&power[i]>power[i+1])indices.push(i);
  indices.sort((a,b)=>power[b]-power[a]);return {rangeHz:range,peaksHz:indices.slice(0,5).map(i=>+(i*rate/length).toFixed(3))};});
 // A separate 20 ms RMS envelope retains modulation up to 25 Hz; the
 // long spectral windows above only measure slow band-envelope movement.
 const block=240,count=Math.floor(samples.length/block),envelope=new Float64Array(2**Math.ceil(Math.log2(count)));
 for(let j=0;j<count;j++){let energy=0;for(let i=0;i<block;i++)energy+=samples[j*block+i]**2;envelope[j]=Math.sqrt(energy/block);}
 const mean=envelope.slice(0,count).reduce((a,b)=>a+b,0)/count;
 for(let i=0;i<count;i++)envelope[i]=(envelope[i]-mean)*(.5-.5*Math.cos(2*Math.PI*i/(count-1)));
 const envelopePower=fftPower(envelope),envelopeIndices=[];
 for(let i=1;i<envelopePower.length-1;i++)if(i*sampleRate/block/envelope.length>=.1&&envelopePower[i]>envelopePower[i-1]&&envelopePower[i]>envelopePower[i+1])envelopeIndices.push(i);
 envelopeIndices.sort((a,b)=>envelopePower[b]-envelopePower[a]);
 const envelopePeaks=envelopeIndices.slice(0,20).map(i=>({hz:+(i*sampleRate/block/envelope.length).toFixed(3),db:+(10*Math.log10(envelopePower[i]/envelopePower[envelopeIndices[0]])).toFixed(2)}));
 const sum=average.reduce((a,b)=>a+b,0);
 return {sampleRateHz:sampleRate,fftSize:n,resolutionHz:sampleRate/n,hopSeconds:hop/sampleRate,durationSeconds:samples.length/sampleRate,
 peaks:peaks(average),quietPeaks:peaks(quietSpectrum),quietTimes:quiet.filter((_,i)=>i%20===0).map(f=>+f.time.toFixed(2)),
 bands:bands.map((range,b)=>({rangeHz:range,energyFraction:frames.reduce((s,f)=>s+f.energy[b],0)/sum})),sections,modulation,envelopePeaks};
}
export function decodeAudio(input) {
 const decoded=spawnSync('ffmpeg',['-v','error','-i',input,'-vn','-ac','1','-ar','12000','-f','f32le','pipe:1'],{maxBuffer:40*1024*1024});
 if(decoded.status!==0)throw Error(decoded.stderr.toString());
 const bytes=decoded.stdout;
 return new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
}
if(process.argv[1]?.endsWith('analyze-recognizer.mjs')){
 const input=process.argv[2];if(!input)throw Error('Usage: node tools/audio/analyze-recognizer.mjs source.mp4 [report.json]');
 const samples=decodeAudio(input);
 const result=analyze(samples);writeFileSync(process.argv[3]||'test-results/recognizer-reference-fft.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
}
