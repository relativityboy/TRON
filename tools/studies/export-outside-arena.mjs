import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createOutsideArena,disposeOutsideArena} from '../../studies/outside-arena/model.js';
class ExportFileReader{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}}
globalThis.FileReader=ExportFileReader;
const model=createOutsideArena();try{const data=await new GLTFExporter().parseAsync(model,{binary:true});await writeFile(new URL('../../studies/outside-arena/outside-arena-floor.glb',import.meta.url),Buffer.from(data));await writeFile(new URL('../../assets/source/models/outside-arena/floor.glb',import.meta.url),Buffer.from(data));console.log(JSON.stringify({bytes:data.byteLength,triangles:model.userData.triangles}));}finally{disposeOutsideArena(model);}
