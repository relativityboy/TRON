"""Second local trial: forward/backward checked optical-flow tracks into COLMAP.
Run after track-maze-wall.py; uses its static-wall masks and processing inputs.
"""
import pathlib,json,sqlite3
import cv2
import numpy as np
import pycolmap as pc
base=pathlib.Path(__file__).resolve().parents[2]/'test-results/maze-wall-video'
reports=[]
for clip in [1,2]:
 source=base/f'sfm-clip{clip}'; output=base/f'flow-clip{clip}';output.mkdir(exist_ok=True)
 paths=sorted((source/'images').glob('*.png')); observations=[];frames=[];next_id=0
 previous=None;active=np.empty((0,1,2),np.float32);ids=np.empty(0,np.int64)
 for path in paths:
  gray=cv2.imread(str(path),0);gray=cv2.GaussianBlur(gray,(7,7),1.4)
  mask=cv2.imread(str(source/'masks'/(path.name+'.png')),0)
  if previous is not None and len(active):
   moved,ok,err=cv2.calcOpticalFlowPyrLK(previous,gray,active,None,winSize=(31,31),maxLevel=4,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,.01))
   back,back_ok,_=cv2.calcOpticalFlowPyrLK(gray,previous,moved,None,winSize=(31,31),maxLevel=4)
   xy=moved[:,0];h,w=gray.shape
   inside=(xy[:,0]>=2)&(xy[:,0]<w-2)&(xy[:,1]>=2)&(xy[:,1]<h-2)
   ix=np.clip(xy[:,0].astype(int),0,w-1);iy=np.clip(xy[:,1].astype(int),0,h-1)
   valid=inside&(ok[:,0]>0)&(back_ok[:,0]>0)&(np.linalg.norm(back[:,0]-active[:,0],axis=1)<.7)&(err[:,0]<18)&(mask[iy,ix]>0)
   active=moved[valid];ids=ids[valid]
  seedmask=mask.copy()
  for xy in active[:,0]:cv2.circle(seedmask,tuple(xy.astype(int)),10,0,-1)
  fresh=cv2.goodFeaturesToTrack(gray,maxCorners=max(0,600-len(active)),qualityLevel=.025,minDistance=10,mask=seedmask,blockSize=9) if len(active)<600 else None
  if fresh is not None:
   count=len(fresh);active=np.concatenate([active,fresh]);ids=np.concatenate([ids,np.arange(next_id,next_id+count)]);next_id+=count
  observations.append({int(id):i for i,id in enumerate(ids)})
  frames.append(active[:,0].copy());previous=gray
 database=output/'database.db'
 pairs=[]
 with pc.Database.open(database) as db:
  h,w=gray.shape;camera=pc.Camera(model='SIMPLE_PINHOLE',width=w,height=h,params=[1.2*w,w/2,h/2]);camid=db.write_camera(camera)
  imageids=[]
  for path,points in zip(paths,frames):
   imageid=db.write_image(pc.Image(name=path.name,camera_id=camid));imageids.append(imageid);db.write_keypoints(imageid,points+.5)
  for i in range(len(paths)):
   for j in range(i+1,min(i+7,len(paths))):
    shared=observations[i].keys()&observations[j].keys()
    if len(shared)<15:continue
    matches=np.array([[observations[i][id],observations[j][id]] for id in sorted(shared)],dtype=np.uint32)
    db.write_matches(imageids[i],imageids[j],matches);pairs.append(paths[i].name+' '+paths[j].name)
 pairpath=output/'pairs.txt';pairpath.write_text('\n'.join(pairs)+'\n')
 pc.verify_matches(database,pairpath)
 options=pc.IncrementalPipelineOptions();options.num_threads=4;options.random_seed=1982;options.max_runtime_seconds=90;options.min_model_size=3;options.max_num_models=2
 sparse=output/'sparse';sparse.mkdir(exist_ok=True)
 maps=pc.incremental_mapping(database,source/'images',sparse,options=options)
 report={'clip':clip,'images':len(paths),'trackedCornersPerFrame':[len(points) for points in frames],'models':[]}
 with sqlite3.connect(database) as db:report['verifiedPairs']=db.execute('select count(*) from two_view_geometries where rows>=15').fetchone()[0]
 for key,model in maps.items():
  folder=sparse/str(key);model.write_text(folder);model.export_PLY(folder/'points.ply')
  report['models'].append({'id':key,'registeredImages':model.num_reg_images(),'points3D':model.num_points3D(),'meanReprojectionErrorPixels':model.compute_mean_reprojection_error(),'meanTrackLength':model.compute_mean_track_length()})
 reports.append(report);(base/'flow-report.json').write_text(json.dumps(reports,indent=2));print(json.dumps(report),flush=True)
