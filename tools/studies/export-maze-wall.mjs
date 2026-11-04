import {readFile,writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createWallStudy} from '../../studies/maze-wall/model.js';
import {disposeModel} from '../../studies/maze-wall/build-model.js';
class ExportFileReader{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}}
globalThis.FileReader=ExportFileReader;
let design;
try{const state=JSON.parse(await readFile(new URL('../../.local/wall-studio/state.json',import.meta.url),'utf8'));design=state.revisions.at(-1).model;}catch(error){if(error.code!=='ENOENT')throw error;}
const model=createWallStudy(design);
try{
 const data=await new GLTFExporter().parseAsync(model,{binary:true});
 await writeFile(new URL('../../studies/maze-wall/maze-wall.glb',import.meta.url),Buffer.from(data));
 console.log(`Exported maze-wall.glb (${data.byteLength} bytes)`);
}finally{disposeModel(model);}
