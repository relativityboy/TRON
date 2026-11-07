import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {randomUUID,randomBytes,timingSafeEqual} from 'node:crypto';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateModel} from '../studies/maze-wall/design-schema.js';
import {buildModel,disposeModel} from '../studies/maze-wall/build-model.js';
import {codexRunner,revisionPrompt} from './wall-studio-codex.js';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
export const STUDIO_LIMITS={bodyBytes:12*1024*1024,imageBytes:3*1024*1024,maxReferences:6,jobTimeoutMs:240000,maxTriangles:1500};
const defaultReferences=[['Maze Details.png','references/film/images/mazes/Maze Details.png'],['Maze Top 2.png','references/film/images/mazes/Maze Top 2.png']];
function imageData(dataUrl){
 if(typeof dataUrl!=='string')throw Error('Attach a PNG, JPEG or WebP image');
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);if(!match)throw Error('Attach a PNG, JPEG or WebP image');
 const bytes=Buffer.from(match[2],'base64');if(!bytes.length||bytes.length>STUDIO_LIMITS.imageBytes)throw Error('Each image must be at most 3 MB');
 const valid=match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):match[1]==='jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!valid)throw Error('Image contents do not match the image type');
 return {bytes,extension:match[1],mime:`image/${match[1]}`};
}
function cleanView(view,model){
 const vector=v=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=5000);
 if(!view||!vector(view.camera)||!vector(view.target)||!['detail','whole','canyon','front','side','top'].includes(view.mode))throw Error('Invalid camera view');
 return {camera:view.camera,target:view.target,mode:view.mode,selectedPartId:model.parts.some(p=>p.id===view.selectedPartId)?view.selectedPartId:null};
}
function assertGeometry(model,{modelValidator=validateModel,modelBuilder=buildModel,maxTriangles=STUDIO_LIMITS.maxTriangles}={}){
 modelValidator(model);const mesh=modelBuilder(model);let triangles=0;
 try{mesh.traverse(o=>{if(o.isMesh){const positions=o.geometry.attributes.position;triangles+=(o.geometry.index?.count??positions.count)/3;for(const n of positions.array)if(!Number.isFinite(n))throw Error('Geometry has invalid vertices');}});if(triangles>maxTriangles)throw Error('Revision is too complex; ask for fewer parts');}finally{disposeModel(mesh);}
 return model;
}
export function createWallStudioMiddleware({storeDir=join(ROOT,'.local/wall-studio'),runner=codexRunner(),timeoutMs=STUDIO_LIMITS.jobTimeoutMs,apiPrefix='/api/wall-studio',initialPath='studies/maze-wall/design.json',initialRequest='Starting wall study',initialSummary='Starting model, ready for your corrections.',modelValidator=validateModel,modelBuilder=buildModel,maxTriangles=STUDIO_LIMITS.maxTriangles,seedReferences=defaultReferences,promptBuilder=revisionPrompt,revisionSchema}={}){
 const checkModel=model=>assertGeometry(model,{modelValidator,modelBuilder,maxTriangles});
 const token=randomBytes(24).toString('hex');let state,job=null,controller=null,closed=false,saveQueue=Promise.resolve();
 const save=()=>{const json=JSON.stringify(state,null,2)+'\n';saveQueue=saveQueue.catch(()=>{}).then(async()=>{await writeFile(join(storeDir,'state.tmp'),json);await rename(join(storeDir,'state.tmp'),join(storeDir,'state.json'));});return saveQueue;};
 const ready=(async()=>{
  await mkdir(join(storeDir,'references'),{recursive:true});await mkdir(join(storeDir,'jobs'),{recursive:true});
  try{state=JSON.parse(await readFile(join(storeDir,'state.json'),'utf8'));state.revisions.forEach(r=>modelValidator(r.model));}
  catch(error){if(error.code!=='ENOENT')throw Error('Wall workspace data could not be loaded; your files have been preserved.');
   const model=JSON.parse(await readFile(join(ROOT,initialPath),'utf8'));checkModel(model);
   state={revisions:[{id:0,createdAt:new Date().toISOString(),request:initialRequest,summary:initialSummary,model}],references:[]};
   for(const [name,path] of seedReferences){try{const id=randomUUID(),jpeg=/\.jpe?g$/i.test(path),file=`${id}.${jpeg?'jpeg':'png'}`;await writeFile(join(storeDir,'references',file),await readFile(join(ROOT,path)));state.references.push({id,name,file,mime:jpeg?'image/jpeg':'image/png'});}catch{/* Missing optional seed images do not prevent modeling. */}}
   await save();
  }
 })();
 // Surface initialization failures through the page without an unhandled rejection.
 void ready.catch(()=>{});
 const publicJob=()=>job?{id:job.id,status:job.status,message:job.message,error:job.error??null}:null;
 const publicState=()=>({token,current:state.revisions.at(-1),revisions:state.revisions.map(({model,...rest})=>rest),references:state.references.map(({file,mime,...ref})=>({...ref,url:`${apiPrefix}/references/${ref.id}`})),job:publicJob()});
 async function revise({text,baseRevision,referenceIds,view,screenshot}){
  const base=state.revisions.at(-1);
  if(job?.status==='working')throw Object.assign(Error('A revision is already in progress'),{status:409});
  if(baseRevision!==base.id)throw Object.assign(Error('The model changed in another tab. Reload it before submitting.'),{status:409});
  if(typeof text!=='string'||!text.trim()||text.length>4000)throw Error('Describe the change in 1–4000 characters');
  if(!Array.isArray(referenceIds)||referenceIds.length>6||new Set(referenceIds).size!==referenceIds.length)throw Error('Choose up to six reference images');
  const references=referenceIds.map(id=>{const ref=state.references.find(r=>r.id===id);if(!ref)throw Error('Reference image is no longer available');return ref;});
  view=cleanView(view,base.model);const capture=imageData(screenshot);if(capture.mime!=='image/png')throw Error('Viewport capture must be PNG');
  const id=randomUUID(),jobDir=join(storeDir,'jobs',id);await mkdir(jobDir);
  await writeFile(join(jobDir,'viewport.png'),capture.bytes);
  const history=state.revisions.map(({request,summary})=>({request,summary}));
  const prompt=promptBuilder({model:base.model,text:text.trim(),view,references,history});
  await writeFile(join(jobDir,'request.json'),JSON.stringify({text:text.trim(),baseRevision,view,referenceIds},null,2));
  job={id,status:'working',message:'Sending your view and references to Codex…'};controller=new AbortController();
  let timedOut=false;const timer=setTimeout(()=>{timedOut=true;controller?.abort();},timeoutMs);
  const activeController=controller;
  job.done=(async()=>{
   try{
    const answer=await runner({prompt,schema:revisionSchema,imagePaths:[join(jobDir,'viewport.png'),...references.map(r=>join(storeDir,'references',r.file))],jobDir,signal:activeController.signal,onProgress:message=>{if(job?.id===id)job.message=String(message).slice(0,200);}});
    if(activeController.signal.aborted)throw Error('Cancelled');
    if(typeof answer?.summary!=='string'||!answer.summary.trim()||answer.summary.length>2000)throw Error('Codex returned an invalid summary');
    checkModel(answer.model);
    const revision={id:base.id+1,createdAt:new Date().toISOString(),request:text.trim(),summary:answer.summary,model:answer.model};
    state.revisions.push(revision);
    try{await save();}catch(error){state.revisions.pop();throw error;}
    job.status='ready';job.message=answer.summary;
   }catch(error){job.status=activeController.signal.aborted?'cancelled':'failed';job.message=timedOut?'Revision timed out. Your previous model is intact.':activeController.signal.aborted?'Revision cancelled. Your previous model is intact.':'Revision failed. Your previous model is intact.';job.error=activeController.signal.aborted?null:String(error.message||error).slice(0,350);}
   finally{clearTimeout(timer);if(controller===activeController)controller=null;}
  })();
  return publicJob();
 }
 let mutationBusy=false;
 const middleware=async(req,res,next)=>{
  const path=req.url?.split('?')[0];if(!path?.startsWith(apiPrefix))return next();
  const send=(code,value)=>{if(!res.writableEnded){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(value));}};
  try{
   const host=new URL(`http://${req.headers.host}`).hostname;
   if(!['localhost','127.0.0.1','[::1]'].includes(host))return send(403,{error:'The wall workspace is available on localhost only'});
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Origin rejected'});
   if(req.headers['sec-fetch-site']==='cross-site')return send(403,{error:'Origin rejected'});
  }catch{return send(403,{error:'Origin rejected'});}
  try{
   await ready;if(closed)return send(503,{error:'Workspace is shutting down'});
   if(req.method==='GET'&&path===`${apiPrefix}/state`)return send(200,publicState());
   if(req.method==='GET'&&path.startsWith(`${apiPrefix}/references/`)){
    const ref=state.references.find(r=>path===`${apiPrefix}/references/${r.id}`);if(!ref)return send(404,{error:'Reference not found'});
    res.writeHead(200,{'Content-Type':ref.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(await readFile(join(storeDir,'references',ref.file)));return;
   }
   if(req.method!=='POST')return send(405,{error:'Method not allowed'});
   const received=Buffer.from(String(req.headers['x-wall-studio-token']||'')),expected=Buffer.from(token);
   if(received.length!==expected.length||!timingSafeEqual(received,expected))return send(403,{error:'Refresh the page before making changes'});
   if(req.headers['content-type']?.split(';')[0]!=='application/json')return send(415,{error:'JSON required'});
   let bytes=0,chunks=[];for await(const chunk of req){bytes+=chunk.length;if(bytes>STUDIO_LIMITS.bodyBytes)return send(413,{error:'Images are too large'});chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'Invalid request'});}
   if(path===`${apiPrefix}/cancel`){controller?.abort();return send(200,{job:publicJob()});}
   if(mutationBusy)return send(409,{error:'Another workspace change is in progress'});
   mutationBusy=true;
   try{
    if(path===`${apiPrefix}/revise`)return send(202,{job:await revise(body)});
    if(path===`${apiPrefix}/references`){
     if(state.references.length>=24)throw Error('Reference library is full (24 images)');
     if(typeof body.name!=='string'||!body.name.trim()||body.name.length>150)throw Error('Invalid image name');
     const image=imageData(body.dataUrl),id=randomUUID(),file=`${id}.${image.extension}`;
     await writeFile(join(storeDir,'references',file),image.bytes);
     state.references.push({id,name:body.name,file,mime:image.mime});await save();return send(201,publicState());
    }
    if(path===`${apiPrefix}/restore`){
     if(job?.status==='working')return send(409,{error:'Wait for the current revision or cancel it first'});
     const current=state.revisions.at(-1);if(body.baseRevision!==current.id)return send(409,{error:'The model changed in another tab. Reload it first.'});
     const old=state.revisions.find(r=>r.id===body.revisionId);if(!old)throw Error('Revision not found');
     const revision={id:current.id+1,createdAt:new Date().toISOString(),request:`Restore revision ${old.id}`,summary:`Restored revision ${old.id}.`,model:old.model};
     state.revisions.push(revision);try{await save();}catch(error){state.revisions.pop();throw error;}return send(200,publicState());
    }
    send(404,{error:'Unknown workspace action'});
   }finally{mutationBusy=false;}
  }catch(error){send(error.status||400,{error:String(error.message||error).slice(0,350)});}
 };
 middleware.close=async()=>{closed=true;controller?.abort();await job?.done;await saveQueue;};
 return middleware;
}
export function wallStudioPlugin(options={}){
 let middleware;
 return {name:options.pluginName||'local-wall-studio',configureServer(server){middleware=createWallStudioMiddleware(options);server.middlewares.use(middleware);server.httpServer?.once('close',()=>{void middleware.close();});}};
}
