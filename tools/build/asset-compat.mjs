import {readFile,cp,mkdir,readdir,unlink} from 'node:fs/promises';
import {dirname} from 'node:path';
const paths=JSON.parse(await readFile('assets/path-map.json','utf8'));
// Existing installed clients retain these URLs until a later, verified retirement.
for(const [old,current] of Object.entries(paths)){
 if(old.startsWith('public/')){
  const output='dist/'+old.slice(7);await mkdir(dirname(output),{recursive:true});await cp(current,output);
 }else if(current.startsWith('assets/runtime/')){
  const output='dist/'+old;await mkdir(dirname(output),{recursive:true});await cp(current,output);
 }

}
console.log('Emitted legacy runtime asset URLs and preview derivatives.');

async function cleanMetadata(dir){
 for(const e of await readdir(dir,{withFileTypes:true})){
  const path=dir+'/'+e.name;
  if(e.isDirectory())await cleanMetadata(path);
  else if(e.name==='.DS_Store'||e.name.startsWith('._'))await unlink(path);
 }
}
await cleanMetadata('dist');
