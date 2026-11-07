"""Inventory asset ownership and provenance without reading credentials or local state."""
from pathlib import Path
import hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parents[2]
def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
 return h.hexdigest()
paths=json.loads((ROOT/'assets/path-map.json').read_text());reverse={}
for old,new in paths.items():reverse.setdefault(new,old)
credits={
 'project':{'author':'Steve Dekorte and project contributors','sourceUrl':'https://github.com/stevedekorte/TRON','license':'Project-generated or adapted content; underlying TRON rights remain with their owners.','record':'docs/credits_extended.txt'},
 'film':{'author':'TRON (1982) filmmakers / respective rights holders, including Disney','sourceUrl':None,'license':'Film-derived material, not open source; retained user-supplied excerpts and references.','record':'docs/assets/_index.md'},
 'wendy-carlos':{'author':'Wendy Carlos','sourceUrl':'https://www.wendycarlos.com/+tron.html','license':'Copyright soundtrack excerpts; not open source.','record':'docs/credits_extended.txt'},
 'journey':{'author':'Journey','sourceUrl':'https://music.apple.com/us/album/tron-original-motion-picture-soundtrack/1443890451','license':'Copyright soundtrack recording; not open source.','record':'docs/credits_extended.txt'},
 'arabinowitz':{'author':'arabinowitz','sourceUrl':'https://sketchfab.com/3d-models/tank-tron-1982-b730d118f54b4a868339a4ddf11e09a7','license':'Sketchfab Standard; creator specifies editorial use.','record':'docs/credits_extended.txt'},
 'shriker1':{'author':'Shriker1','sourceUrl':'https://sketchfab.com/3d-models/tron-1982-recognizer-ecb52608275c40a28d7d9dda1aed54f3','license':'Sketchfab Standard.','record':'docs/credits_extended.txt'},
 'spring-society':{'author':'SpringSociety','sourceUrl':'https://sketchfab.com/3d-models/double-turret-clu-light-tank-83df27ea6c08441a809bb5376301d430','license':'CC BY 4.0.','record':'docs/credits_extended.txt'},
 'jihs':{'author':'JIHS','sourceUrl':'https://www.turbosquid.com/3d-models/3d-tron-1982-carrier-model-1811129','license':'Supplied purchased TurboSquid models; retain readmes and seller terms. Solar Sailer redistribution terms not established by its readme.','record':'docs/models/_index.md'},
 'daniel-preti':{'author':'Daniel Preti','sourceUrl':None,'license':'User-supplied purchased asset; retain seller terms. Original large OBJ was removed previously at user request.','record':'docs/credits_extended.txt'},
 'vt323':{'author':'Peter Hull','sourceUrl':'https://github.com/google/fonts/tree/main/ofl/vt323','license':'SIL Open Font License 1.1; Interface Raster is a derivative.','record':'public/assets/fonts/OFL-VT323.txt'},
 'bit':{'author':'ControllingTransmission and BIT contributors','sourceUrl':None,'license':'MIT for BIT code; third-party libraries retain their own notices. TRON-inspired media retains underlying rights.','record':'public/bit/LICENSE'},
 'povray':{'author':'Jason Cox','sourceUrl':None,'license':'MIT; see retained license.','record':'assets/source/models/povray-lightcycle/LICENSE'},
 'unresolved':{'author':None,'sourceUrl':None,'license':'Unresolved; do not infer redistribution permission from presence in this catalog.','record':'docs/assets/_index.md'}
}
def credit(path):
 l=path.lower()
 if 'povray-lightcycle' in l:return 'povray'
 if 'only solutions' in l:return 'journey'
 if '/music/' in l:return 'wendy-carlos'
 if 'double_turret' in l:return 'spring-society'
 if 'tank_-_tron' in l:return 'arabinowitz'
 if 'tron_1982_recognizer' in l:return 'shriker1'
 if any(s in l for s in ['tron_1982_carrier','tron_1982_solar_sailer','tron carrier dae','tron_sunship']):return 'jihs'
 if any(s in l for s in ['preti','tron game sector']):return 'daniel-preti'
 if 'vt323' in l or 'interfaceraster' in l:return 'vt323'
 if path.startswith('public/bit/'):return 'bit'
 if path.startswith('references/film/'):return 'film'
 if '/audio/' in l:return 'unresolved'
 if any(s in l for s in ['/icons/','/images/encom','/fonts/mcpdotmatrix']):return 'project'
 return 'unresolved'
tracked=set(subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0'))
known=tracked|set(paths.values())
records=[]
for base in ['assets/runtime','assets/source','public','references','docs/sounds']:
 for p in sorted((ROOT/base).rglob('*')):
  if not p.is_file() or p.name in ['.DS_Store','README.md','index.html','_index.md']:continue
  path=p.relative_to(ROOT).as_posix();legacy=reverse.get(path,path);cid=credit(path)
  if path not in known and not path.startswith(('public/','assets/runtime/')):continue
  category='models' if p.suffix.lower() in ['.glb','.obj','.dae','.mtl','.uasset','.umap'] else 'audio' if p.suffix.lower() in ['.mp3','.wav','.m4a','.ogg'] else 'fonts' if p.suffix.lower() in ['.ttf','.otf'] else 'film' if p.suffix.lower() in ['.mp4','.m4v','.mov'] else 'images' if p.suffix.lower() in ['.png','.jpg','.jpeg','.svg','.webp'] else 'support'
  policy='runtime' if path.startswith(('public/','assets/runtime/')) else 'source-only' if path.startswith('assets/source/') else 'reference-only'
  source=next((old for old,new in paths.items() if new==path and old.startswith('docs/references/')),None)
  author=credits[cid]['author'];license=credits[cid]['license']
  sidecars=[q.relative_to(ROOT).as_posix() for q in p.parent.glob('*.json') if any(t in q.name for t in ['source','reference','license'])]
  conversions=[]
  for tool in (ROOT/'tools/assets').glob('*'):
   if tool.suffix in ['.mjs','.js','.py'] and p.name in tool.read_text(errors='replace'):conversions.append(('python3 ' if tool.suffix=='.py' else 'node ')+tool.relative_to(ROOT).as_posix())
  records.append({'id':'asset-'+hashlib.sha256(legacy.encode()).hexdigest()[:16],'category':category,'path':path,'sourcePath':('references/film/'+source[len('docs/references/'):] if source and (ROOT/('references/film/'+source[len('docs/references/'):])).exists() else path),'legacyPaths':[old for old,new in paths.items() if new==path],'runtimeUrl':path[7:] if path.startswith('public/') else 'Vite content-hashed asset URL' if path.startswith('assets/runtime/') else None,'creditId':cid,'author':author,'sourceUrl':credits[cid]['sourceUrl'],'license':license,'provenanceRecords':sorted(set([credits[cid]['record'],*sidecars])),'transformations':'See conversion commands and provenance records; source preserved without new conversion.' if conversions else 'No conversion performed during reorganization. Earlier modifications remain documented in credits/sidecars.','conversionCommands':conversions,'bytes':p.stat().st_size,'sha256':digest(p),'deploymentPolicy':policy,'unresolvedProvenance':cid=='unresolved'})
groups={}
for r in records:groups.setdefault(r['sha256'],[]).append(r['path'])
manifest={'schemaVersion':1,'creditsFile':'docs/credits_extended.txt','credits':credits,'assets':records,'duplicateContent':[v for v in groups.values() if len(v)>1]}
(ROOT/'assets/catalog.json').write_text(json.dumps(manifest,indent=2)+'\n')
summary={p:{'files':sum(r['deploymentPolicy']==p for r in records),'bytes':sum(r['bytes'] for r in records if r['deploymentPolicy']==p)} for p in sorted(set(r['deploymentPolicy'] for r in records))}
(ROOT/'docs/organization/inventory.json').write_text(json.dumps({'summary':summary,'unresolved':[r['id'] for r in records if r['unresolvedProvenance']],'duplicateGroups':len(manifest['duplicateContent'])},indent=2)+'\n')
print(json.dumps({'assets':len(records),'policies':summary,'duplicateGroups':len(manifest['duplicateContent'])}))
