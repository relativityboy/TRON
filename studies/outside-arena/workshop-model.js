import {createOutsideArenaScene,OUTSIDE_ARENA_WALL} from './scene.js';
const limits={heightMeters:[30,400],depthMeters:[1,80],bayPitchMeters:[20,120],pierOffsetMeters:[-120,120],pierWidthMeters:[3,60],pierProjectionMeters:[1,60],pierBaseProjectionMeters:[0,60],pierTopProjectionMeters:[0,60],portalWidthMeters:[2,30],portalHeightMeters:[3,60],portalChamferMeters:[.1,10],tunnelDepthMeters:[2,80]};
const parameterSchema={type:'object',additionalProperties:false,required:[...Object.keys(limits),'surfaceColor'],properties:{...Object.fromEntries(Object.entries(limits).map(([key,[minimum,maximum]])=>[key,{type:'number',minimum,maximum}])),surfaceColor:{type:'string',pattern:'^#[0-9a-fA-F]{6}$'}}};
const partSchema={type:'object',additionalProperties:false,required:['id','name','parameters'],properties:{id:{type:'string',enum:['wall']},name:{type:'string'},parameters:parameterSchema}};
const lightingSchema={type:'object',additionalProperties:false,required:['angleDegrees','heightMeters','intensity','ambientIntensity'],properties:{angleDegrees:{type:'number',minimum:-80,maximum:80},heightMeters:{type:'number',minimum:60,maximum:450},intensity:{type:'number',minimum:.1,maximum:5},ambientIntensity:{type:'number',minimum:0,maximum:2}}};
export const SCENE_MODEL_SCHEMA={type:'object',additionalProperties:false,required:['name','parts','lighting'],properties:{name:{type:'string'},parts:{type:'array',minItems:1,maxItems:1,items:partSchema},lighting:lightingSchema}};
export const SCENE_REVISION_SCHEMA={type:'object',additionalProperties:false,required:['summary','model'],properties:{summary:{type:'string'},model:SCENE_MODEL_SCHEMA}};
const exact=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k));
export function validateSceneModel(model){
 const fail=message=>{throw Error(message);},text=s=>typeof s==='string'&&s.trim()&&s.length<=100;
 if(!exact(model,['name','parts','lighting'])||!text(model.name)||!Array.isArray(model.parts)||model.parts.length!==1)fail('Invalid arena scene');
 const part=model.parts[0];if(!exact(part,['id','name','parameters'])||part.id!=='wall'||!text(part.name)||!exact(part.parameters,[...Object.keys(limits).filter(k=>!['pierBaseProjectionMeters','pierTopProjectionMeters','pierOffsetMeters'].includes(k)||Object.hasOwn(part.parameters,k)),'surfaceColor']))fail('Invalid wall parameters');
 const p={...part.parameters,pierOffsetMeters:part.parameters.pierOffsetMeters??0,pierBaseProjectionMeters:part.parameters.pierBaseProjectionMeters??part.parameters.pierProjectionMeters,pierTopProjectionMeters:part.parameters.pierTopProjectionMeters??Math.max(0,part.parameters.pierProjectionMeters-3)};
 for(const [key,[min,max]] of Object.entries(limits))if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)fail(`Invalid ${key}`);
 if(!/^#[0-9a-f]{6}$/i.test(p.surfaceColor))fail('Invalid wall color');
 if(p.pierWidthMeters>=p.bayPitchMeters*.85||p.portalWidthMeters>=p.pierWidthMeters*.8||p.portalHeightMeters>=p.heightMeters*.8||p.portalChamferMeters>=Math.min(p.portalWidthMeters/2,p.portalHeightMeters/2))fail('Keep the doorway inside its central face and leave room between wall sections');
 const offset=((p.pierOffsetMeters%p.bayPitchMeters)+p.bayPitchMeters)%p.bayPitchMeters,clearance=Math.min(offset,p.bayPitchMeters-offset);
 if(offset>.001&&clearance<Math.max(p.pierWidthMeters/2,p.bayPitchMeters*.32)+p.portalWidthMeters/2+.1)fail('Shift pillars far enough to leave the fixed doorway clear, or use zero offset for the original central doorway pillar');
 const schema=SCENE_MODEL_SCHEMA.properties.lighting.properties;
 if(!exact(model.lighting,Object.keys(schema)))fail('Invalid scene lighting');
 for(const [key,{minimum,maximum}] of Object.entries(schema))if(typeof model.lighting[key]!=='number'||!Number.isFinite(model.lighting[key])||model.lighting[key]<minimum||model.lighting[key]>maximum)fail(`Invalid ${key}`);
 return model;
}
export function buildSceneWorkshopModel(model){
 validateSceneModel(model);const p=model.parts[0].parameters;
 const root=createOutsideArenaScene({...p,surfaceColor:Number.parseInt(p.surfaceColor.slice(1),16)});
 root.name=model.name;root.children[1].name=model.parts[0].name;
 root.children[1].traverse(o=>{o.userData.partId='wall';});root.userData.lighting={...model.lighting};return root;
}
export function startingSceneModel(){return {name:'Outside arena scene',parts:[{id:'wall',name:'Arena walls and doorway',parameters:{...OUTSIDE_ARENA_WALL,surfaceColor:'#314963'}}],lighting:{angleDegrees:-47,heightMeters:230,intensity:2.6,ambientIntensity:.22}};}
