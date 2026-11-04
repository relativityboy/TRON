import {spawn} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {REVISION_SCHEMA} from '../studies/maze-wall/design-schema.js';
import {join} from 'node:path';
export function codexRunner({command=process.env.TRON_STUDIO_CODEX||'codex'}={}){
 return async({prompt,imagePaths,jobDir,signal,onProgress})=>{
  const schemaPath=join(jobDir,'schema.json'),outputPath=join(jobDir,'answer.json');
  await writeFile(schemaPath,JSON.stringify(REVISION_SCHEMA));
  const args=['exec','--ephemeral','--sandbox','read-only','--skip-git-repo-check','--disable','shell_tool','--disable','unified_exec','--disable','multi_agent','--disable','apps','--config','web_search="disabled"','--cd',jobDir,'--json','--output-schema',schemaPath,'--output-last-message',outputPath];
  for(const path of imagePaths)args.push('--image',path);
  args.push('-');
  await new Promise((resolve,reject)=>{
   const child=spawn(command,args,{stdio:['pipe','pipe','pipe'],signal});let buffer='',failure='',err='';
   child.stdin.on('error',()=>{});child.stdin.end(prompt);
   child.stderr.on('data',chunk=>{err=(err+chunk.toString()).slice(-2000);});
   child.stdout.on('data',chunk=>{
    buffer+=chunk.toString();if(buffer.length>4*1024*1024){child.kill();failure='Codex output exceeded the revision limit';return;}
    let newline;while((newline=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);try{const event=JSON.parse(line);
     if(event.type==='turn.started')onProgress('Reviewing your model and reference images…');
     if(event.type==='error'||event.type==='turn.failed')failure=event.message||event.error?.message||'Codex revision failed';
     if(event.type==='item.started'&&event.item?.type==='agent_message')onProgress('Preparing the revised geometry…');
    }catch{/* Non-JSON diagnostics are never sent to the browser. */}}
   });
   child.on('error',error=>reject(error.name==='AbortError'?error:Error(error.code==='ENOENT'?'Codex CLI was not found. Install it and run codex login, then restart the dev server.':error.message)));
   child.on('close',code=>code===0&&!failure?resolve():reject(Error(failure||(/not logged|authenticat|login/i.test(err)?'Codex needs sign-in. Run codex login, then retry.':`Codex exited with code ${code}. Check its sign-in and your usage limits, then retry.`))));
  });
  return JSON.parse(await readFile(outputPath,'utf8'));
 };
}
export function revisionPrompt({model,text,view,references,history}){
 return `You are editing a SIMPLE architectural wall model with a human art director. Return ONLY the requested structured JSON: a brief summary and the complete revised model. Do not use tools or edit files. The host applies validated geometry data; no code is needed.
Keep geometry very simple: a few flat faces, boxes and polygon-profile extrusions. Preserve existing part IDs and everything the user did not ask to change. Prefer fewer parts and polygons. This is static architecture, not a character or isolated collectible. Reference frames show the original 1982 TRON maze. Earlier generated/model studies were rejected: do not treat them as authoritative. Let the user's correction guide you. Do not add fine texture, subdivision, smooth bevels, decorative strips or speculative details. Remove unwanted geometry when asked. If a request is ambiguous, choose the smallest reasonable edit and state the assumption in the summary.
Units: metres, Y-up. Positions are world XYZ, rotations are XYZ Euler radians. Boxes use size XYZ, centered at position. Extrusions use points as a closed simple polygon WITHOUT repeating the first point; no holes. The plane is xy (points X,Y, extrusion along +Z), xz (points X,Z, extrusion along +Y), or yz (points Y,Z, extrusion along +X). Position/rotation transform the entire extrusion. Use 3–16 nonintersecting profile vertices. Boxes still require unused plane="xy", points=[], depth=1. Extrusions still require unused size=[1,1,1]. All positive dimensions must be >=0.005. Material colors are #RRGGBB, roughness 0–1. topMaterial is applied to faces whose LOCAL normal has a positive Y component; use the same material ID twice for a uniform part. No textures or executable data. Keep within 48 parts and 8 materials.
The first attached image is the CURRENT VIEWPORT (not a film reference). Remaining images, in order: ${references.map((r,i)=>`${i+2}: ${r.name}`).join('; ')||'none'}.
Current camera / selected part: ${JSON.stringify(view)}.
Recent user directions and results (context only): ${JSON.stringify(history.slice(-6))}.
CURRENT MODEL: ${JSON.stringify(model)}
USER REQUEST: ${text}`;
}
