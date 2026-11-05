#!/usr/bin/env python3
"""Build a phase-matched continuous engine loop from the user-supplied clip."""
import array,hashlib,json,math,pathlib,subprocess,sys,wave
source=pathlib.Path(sys.argv[1]);rate=44100;overlap=.08;target=.118
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-vn','-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
a=array.array('f');a.frombytes(raw);frames=len(a)//2
# Avoid codec boundary samples; find a trailing overlap matching the start's phase.
start=round(.025*rate);fade=round(overlap*rate)
for ch in range(2):
 dc=sum(a[ch::2])/frames
 for i in range(ch,len(a),2):a[i]-=dc

def score(end,stride):
 tail=end-fade;dot=left=right=0.
 for i in range(0,fade,stride):
  for ch in range(2):
   x=a[2*(start+i)+ch];y=a[2*(tail+i)+ch]
   dot+=x*y;left+=x*x;right+=y*y
 return dot/math.sqrt(max(left*right,1e-20))
end=max(range(round(.70*rate),frames-round(.02*rate),16),key=lambda e:score(e,16))
end=max(range(max(round(.70*rate),end-16),min(frames-round(.02*rate),end+17)),key=lambda e:score(e,4))
period=end-start-fade
loop=[[a[2*i],a[2*i+1]] for i in range(start+fade,end-fade)]
for i in range(fade):
 w=.5-.5*math.cos(math.pi*i/(fade-1))
 loop.append([a[2*(end-fade+i)+ch]*(1-w)+a[2*(start+i)+ch]*w for ch in range(2)])
# Circular, stereo-linked RMS leveling avoids a periodic crossfade loudness dip.
n=len(loop);radius=round(.05*rate);energy=[sum(v*v for v in f)/2 for f in loop];prefix=[0.]
for v in energy*3:prefix.append(prefix[-1]+v)
for i,f in enumerate(loop):
 rms=math.sqrt((prefix[n+i+radius+1]-prefix[n+i-radius])/(2*radius+1));gain=target/max(rms,.001)
 for ch in range(2):f[ch]*=gain
peak=max(abs(v) for f in loop for v in f);limit=min(1,.7/peak)
pcm=array.array('h',(round(max(-1,min(1,v*limit))*32767) for f in loop for v in f))
out=pathlib.Path('public/assets/audio');sha=hashlib.sha256(source.read_bytes()).hexdigest()
for name in ['cycle-drive.wav','cycle-drive-cabin.wav']:
 with wave.open(str(out/name),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
manifest_path=out/'cycle-source.json';manifest=json.loads(manifest_path.read_text());manifest['note']='Engine loops replaced from user-supplied CycleInteriorSound1.mp4; other event clips retain their prior source.'
for clip in manifest['clips']:
 if clip['file'] not in ['cycle-drive.wav','cycle-drive-cabin.wav']:continue
 for key in ['requestedRangeSeconds']:clip.pop(key,None)
 clip.update(source=str(source),sha256=sha,startSeconds=start/rate,endSeconds=end/rate,filters='DC removal only',loopCrossfadeSeconds=overlap,loopCrossfadeCurve='phase-matched raised-cosine linear overlap',rmsTarget=target,leveling='100 ms circular stereo-linked RMS',durationSeconds=n/rate,selection='Phase-matched inner clip with 80 ms loop join; original stereo waveform, no spectral resynthesis.',rebuild='python3 tools/assets/prepare-cycle-interior.py "'+str(source)+'"')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
p=pathlib.Path('assets/catalog.json');catalog=json.loads(p.read_text())
for asset in catalog['assets']:
 if asset['path'] not in ['public/assets/audio/cycle-drive.wav','public/assets/audio/cycle-drive-cabin.wav']:continue
 data=pathlib.Path(asset['path']).read_bytes();asset.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),transformations='CycleInteriorSound1.mp4: DC removal, phase-matched 80 ms raised-cosine overlap, circular stereo-linked RMS leveling; original stereo PCM.',conversionCommands=['python3 tools/assets/prepare-cycle-interior.py "/Users/steve/Desktop/CycleInteriorSound1.mp4"'])
p.write_text(json.dumps(catalog,indent=2)+'\n')
levels=[];window=round(.1*rate)
for i in range(0,n,window):
 f=[loop[(i+j)%n] for j in range(window)];levels.append(10*math.log10(sum(v*v for row in f for v in row)/(2*window)))
steps=sorted(abs(pcm[2*((i+1)%n)+ch]-pcm[2*i+ch])/32767 for i in range(n) for ch in range(2))
print(json.dumps(dict(durationSeconds=n/rate,sourceAudioSeconds=frames/rate,startSeconds=start/rate,endSeconds=end/rate,overlapCorrelation=score(end,1),peak=peak*limit,levelSpreadDb=max(levels)-min(levels),seamStep=max(abs(pcm[ch]-pcm[-2+ch])/32767 for ch in range(2)),step99Percentile=steps[int(len(steps)*.99)]),indent=2))
