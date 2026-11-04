"""Local, masked sparse reconstruction trial. No service uploads or game changes.
Run with Python containing pycolmap 4.2.1, opencv-python-headless 5.0.0.93.
Extracted HDR->SDR frames are expected in test-results/maze-wall-video/clip{1,2}.
"""
import json, pathlib, sqlite3, sys
import cv2
import numpy as np
import pycolmap as pc
root=pathlib.Path(__file__).resolve().parents[2]
base=root/'test-results/maze-wall-video'
results=[]
for clip in [1,2]:
 directory=base/f'clip{clip}'
 work=base/f'sfm-clip{clip}'
 images=work/'images'; masks=work/'masks'; output=work/'sparse'
 for d in [images,masks,output]:d.mkdir(parents=True,exist_ok=True)
 for path in sorted(directory.glob('frame-*.png')):
  image=cv2.imread(str(path));gray=cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
  # Reduce grain before feature extraction; contrast stretch is for tracking only.
  gray=cv2.GaussianBlur(gray,(5,5),1)
  gray=cv2.createCLAHE(clipLimit=2,tileGridSize=(8,8)).apply(gray)
  cv2.imwrite(str(images/path.name),gray)
  mask=np.full(gray.shape,255,dtype=np.uint8)
  # Conservative static-wall region; tank and its shadow occupy the lower frame.
  mask[int(mask.shape[0]*.43):]=0
  hsv=cv2.cvtColor(image,cv2.COLOR_BGR2HSV)
  moving=((hsv[:,:,1]>100)&((hsv[:,:,0]<20)|(hsv[:,:,0]>165))).astype(np.uint8)*255
  moving=cv2.dilate(moving,np.ones((51,51),np.uint8))
  mask[moving>0]=0
  cv2.imwrite(str(masks/(path.name+'.png')),mask)
 reader=pc.ImageReaderOptions();reader.camera_model='SIMPLE_PINHOLE';reader.mask_path=str(masks)
 feature=pc.FeatureExtractionOptions();feature.num_threads=4;feature.max_image_size=1600
 feature.sift.max_num_features=4096
 database=work/'database.db'
 pc.extract_features(database,images,camera_mode=pc.CameraMode.SINGLE,reader_options=reader,extraction_options=feature,device=pc.Device.cpu)
 matching=pc.FeatureMatchingOptions();matching.num_threads=4
 pc.match_exhaustive(database,matching_options=matching,device=pc.Device.cpu)
 options=pc.IncrementalPipelineOptions();options.num_threads=4;options.random_seed=1982;options.max_runtime_seconds=90
 options.min_model_size=3;options.max_num_models=2
 # Leave geometric acceptance thresholds at defaults: do not force a bad solve.
 maps=pc.incremental_mapping(database,images,output,options=options)
 report={'clip':clip,'images':len(list(images.glob('*.png'))),'models':[]}
 with sqlite3.connect(database) as db:
  report['features']=[{'image':n,'features':r} for n,r in db.execute('select images.name,keypoints.rows from images join keypoints on images.image_id=keypoints.image_id order by images.name')]
  report['verifiedPairs']=db.execute('select count(*) from two_view_geometries where rows>=15').fetchone()[0]
 for key,model in maps.items():
  folder=output/str(key);model.write_text(folder);model.export_PLY(folder/'points.ply')
  report['models'].append({'id':key,'registeredImages':model.num_reg_images(),'points3D':model.num_points3D(),'meanReprojectionErrorPixels':model.compute_mean_reprojection_error(),'meanTrackLength':model.compute_mean_track_length()})
 results.append(report)
 (base/'sfm-report.json').write_text(json.dumps({'pycolmap':pc.__version__,'mask':'Upper 43 percent only, saturated red/orange subjects excluded with dilation','results':results},indent=2))
 print(json.dumps(report),flush=True)
