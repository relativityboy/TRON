const vectorSchema={type:'array',items:{type:'number'},minItems:3,maxItems:3};
const point={type:'array',items:{type:'number'},minItems:2,maxItems:2};
export const MODEL_SCHEMA={type:'object',additionalProperties:false,required:['name','materials','parts'],properties:{
 name:{type:'string'},
 materials:{type:'array',minItems:1,maxItems:8,items:{type:'object',additionalProperties:false,required:['id','color','roughness'],properties:{id:{type:'string'},color:{type:'string'},roughness:{type:'number'}}}},
 parts:{type:'array',minItems:1,maxItems:48,items:{type:'object',additionalProperties:false,required:['id','name','kind','position','rotation','size','plane','points','depth','material','topMaterial'],properties:{
  id:{type:'string'},name:{type:'string'},kind:{type:'string',enum:['box','extrusion']},position:vectorSchema,rotation:vectorSchema,size:vectorSchema,plane:{type:'string',enum:['xy','xz','yz']},points:{type:'array',items:point,maxItems:16},depth:{type:'number'},material:{type:'string'},topMaterial:{type:'string'},
 }}},
}};
export const REVISION_SCHEMA={type:'object',additionalProperties:false,required:['summary','model'],properties:{summary:{type:'string'},model:MODEL_SCHEMA}};

function check(ok,message){if(!ok)throw Error(message);}
const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
function text(value,max=100){return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
function vector(value,min,max){return Array.isArray(value)&&value.length===3&&value.every(n=>number(n,min,max));}
function exactKeys(value,keys){check(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(value,k)),'Unexpected model fields');}
export function validateModel(model){
 exactKeys(model,['name','materials','parts']);check(text(model.name),'Invalid model name');
 check(Array.isArray(model.materials)&&model.materials.length>=1&&model.materials.length<=8,'Use 1–8 materials');
 const materials=new Set();
 for(const material of model.materials){exactKeys(material,['id','color','roughness']);check(text(material.id,40)&&!materials.has(material.id),'Material IDs must be unique');materials.add(material.id);check(/^#[0-9a-f]{6}$/i.test(material.color),'Invalid material color');check(number(material.roughness,0,1),'Invalid roughness');}
 check(Array.isArray(model.parts)&&model.parts.length>=1&&model.parts.length<=48,'Use 1–48 simple parts');
 const ids=new Set();
 for(const part of model.parts){
  exactKeys(part,Object.keys(MODEL_SCHEMA.properties.parts.items.properties));
  check(text(part.id,60)&&!ids.has(part.id),'Part IDs must be unique');ids.add(part.id);check(text(part.name),'Invalid part name');
  check(['box','extrusion'].includes(part.kind)&&['xy','xz','yz'].includes(part.plane),'Invalid primitive');
  check(vector(part.position,-1000,1000)&&vector(part.rotation,-Math.PI*2,Math.PI*2),'Invalid position or rotation');
  check(vector(part.size,.005,1000)&&number(part.depth,.005,1000),'Invalid dimensions');
  check(materials.has(part.material)&&materials.has(part.topMaterial),'Unknown material');
  check(Array.isArray(part.points)&&part.points.length<=16,'Too many profile points');
  for(const p of part.points)check(Array.isArray(p)&&p.length===2&&p.every(n=>number(n,-1000,1000)),'Invalid profile point');
  if(part.kind==='extrusion'){
   const points=part.points;check(points.length>=3,'Extrusions need at least three profile points');
   let area=0;
   for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];check(Math.hypot(a[0]-b[0],a[1]-b[1])>.001,'Repeated profile point');area+=a[0]*b[1]-b[0]*a[1];}
   check(Math.abs(area)>.0001,'Profile has zero area');
   const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
   const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-8&&p[0]>=Math.min(a[0],b[0])-1e-8&&p[0]<=Math.max(a[0],b[0])+1e-8&&p[1]>=Math.min(a[1],b[1])-1e-8&&p[1]<=Math.max(a[1],b[1])+1e-8;
   for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    if(j===i+1||(i===0&&j===points.length-1))continue;
    const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
    check(!(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)&&!on(a,b,c)&&!on(a,b,d)&&!on(c,d,a)&&!on(c,d,b),'Profile crosses itself');
   }
  }
 }
 return model;
}
