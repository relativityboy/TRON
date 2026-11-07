#!/usr/bin/env python3
"""Prepare a short, steady film-waveform engine loop, without resynthesizing it."""
import array, hashlib, json, math, pathlib, subprocess, sys, wave
source=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '/Users/steve/Desktop/light cycle sfx.mp4')
rate=44100
# FFT inspection: main ~258/316 Hz bands stay stable here; avoid the later sweep.
requested=(34,35); start=34.425; duration=.35; overlap=.05; repeats=3
filters='highpass=f=100,lowpass=f=6500'
raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',str(source),'-t',str(duration),'-vn','-af',filters,'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
values=array.array('f');values.frombytes(raw)
x=[[values[i],values[i+1]] for i in range(0,len(values),2)]
# Remove DC, then overlap the trailing/leading portions, retaining actual PCM.
for ch in range(2):
    dc=sum(v[ch] for v in x)/len(x)
    for v in x:v[ch]-=dc
fade=round(overlap*rate); period=len(x)-fade
loop=[v[:] for v in x[fade:period]]
for i in range(fade):
    w=.5-.5*math.cos(math.pi*i/(fade-1))
    loop.append([x[period+i][ch]*(1-w)+x[i][ch]*w for ch in range(2)])
# Circular stereo-linked RMS leveling: steady loudness, preserved stereo balance.
energy=[sum(v*v for v in frame)/2 for frame in loop]; n=len(loop); radius=round(.04*rate)
prefix=[0.]
for v in energy*3:prefix.append(prefix[-1]+v)
for i,frame in enumerate(loop):
    level=math.sqrt((prefix[n+i+radius+1]-prefix[n+i-radius])/(2*radius+1))
    gain=.118/max(level,.001)
    for ch in range(2):frame[ch]*=gain
peak=max(abs(v) for frame in loop for v in frame)
limit=min(1,.7/peak)
pcm=array.array('h',(round(max(-1,min(1,v*limit))*32767) for frame in loop*repeats for v in frame))
out=pathlib.Path('public/assets/audio')
source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
for name in ('cycle-drive.wav','cycle-drive-cabin.wav'):
    with wave.open(str(out/name),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(rate);w.writeframes(pcm.tobytes())
manifest_path=out/'cycle-source.json';manifest=json.loads(manifest_path.read_text())
manifest['note']='Engine loops replaced from user-selected light cycle sfx.mp4 34–35 seconds; other event clips retain their prior source.'
for clip in manifest['clips']:
    if clip['file'] in ('cycle-drive.wav','cycle-drive-cabin.wav'):
        clip.update(source=str(source),sha256=source_hash,requestedRangeSeconds=requested,startSeconds=start,endSeconds=start+duration,
                    filters=filters,loopCrossfadeSeconds=overlap,loopCrossfadeCurve='raised-cosine linear overlap',
                    rmsTarget=.118,leveling='80 ms circular stereo-linked RMS',durationSeconds=len(pcm)/2/rate,
                    selection='Stable inner waveform grain; repeated three times. No spectral resynthesis. Main ~258/316 Hz ridges are approximately steady; mixed secondary sounds are not isolated.',
                    rebuild='python3 tools/assets/prepare-cycle-drone.py "'+str(source)+'"')
manifest_path.write_text(json.dumps(manifest,indent=2)+'\n')
catalog_path=pathlib.Path('assets/catalog.json');catalog=json.loads(catalog_path.read_text())
for asset in catalog['assets']:
    if asset['path'] in ['public/assets/audio/cycle-drive.wav','public/assets/audio/cycle-drive-cabin.wav']:
        data=pathlib.Path(asset['path']).read_bytes();asset.update(bytes=len(data),sha256=hashlib.sha256(data).hexdigest(),creditId='film',author='TRON (1982) filmmakers / respective rights holders, including Disney',license='Film-derived mixed soundtrack; no redistribution license supplied.',transformations='User-selected 34–35 s; stable 34.425–34.775 s waveform grain, 50 ms overlap, circular stereo leveling, repeated 3x.',conversionCommands=['python3 tools/assets/prepare-cycle-drone.py'],unresolvedProvenance=True)
catalog_path.write_text(json.dumps(catalog,indent=2)+'\n')
print(json.dumps({'duration':len(pcm)/2/rate,'grainSeconds':n/rate,'peak':peak*limit,'sourceSha256':source_hash}))
