"""Prepare local diagnostic frames and optional service inputs; never uploads files."""
import hashlib,json,pathlib,subprocess
root=pathlib.Path(__file__).resolve().parents[2]
source=root/'references/film/images/mazes/clu maze wall geometry'
out=root/'test-results/maze-wall-video';out.mkdir(parents=True,exist_ok=True)
tone='zscale=t=linear:npl=100,format=gbrpf32le,tonemap=tonemap=hable,zscale=p=bt709:t=bt709:m=bt709:r=full,format=rgb24'
metadata=[]
for clip in [1,2]:
 path=source/f'CluMazeWall{clip}.m4v';frames=out/f'clip{clip}';frames.mkdir(exist_ok=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-print_format','json','-show_format','-show_streams',str(path)]))
 video=next(s for s in probe['streams'] if s['codec_type']=='video')
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(path),'-vf',f'fps=6,{tone},scale=1600:-1,eq=gamma=1.65',str(frames/'frame-%03d.png')],check=True)
 # 1920x872, SDR, no audio: compatible with the documented KIRI input limits.
 target=out/f'clip{clip}-service-input.mp4'
 subprocess.run(['ffmpeg','-y','-v','error','-i',str(path),'-an','-sn','-dn','-vf',f'{tone},scale=1920:-2,eq=gamma=1.65','-c:v','libx264','-crf','17','-pix_fmt','yuv420p','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-movflags','+faststart',str(target)],check=True)
 metadata.append({'input':str(path.relative_to(root)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'durationSeconds':float(video['duration']),'width':video['width'],'height':video['height'],'transfer':video.get('color_transfer'),'sampleRateFramesPerSecond':6,'trackingGamma':1.65,'toneMapping':tone,'serviceInput':str(target.relative_to(root)),'uploaded':False})
(out/'inputs.json').write_text(json.dumps(metadata,indent=2)+'\n')
print('Prepared local frames and SDR service inputs; no upload performed.')
