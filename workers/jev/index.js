export {MultiplayerArena} from './multiplayer.js';
import {mcpRoute} from './mcp.js';
import {errorBody} from '../../shared/jev-errors.js';
import {jevQuestion} from '../../shared/jev-protocol.js';
import {PUBLIC_LIMITS} from './budget.js';
import {withBudgetLease} from './lease.js';
export {JevBudget} from './budget.js';
const encoder=new TextEncoder();
async function boundedJson(request){
 if(Number(request.headers.get('Content-Length'))>PUBLIC_LIMITS.bodyBytes)throw new Error('size');
 const reader=request.body?.getReader();if(!reader)throw new Error('json');
 let bytes=0;const chunks=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>PUBLIC_LIMITS.bodyBytes)throw new Error('size');chunks.push(value);}}
 catch(error){await reader.cancel();throw error;}finally{reader.releaseLock();}
 const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}
 return JSON.parse(new TextDecoder().decode(buffer));
}
async function clientHash(ip,key){
 const secret=await crypto.subtle.importKey('raw',encoder.encode(key),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const digest=await crypto.subtle.sign('HMAC',secret,encoder.encode(`tron-budget:${Math.floor(Date.now()/86400000)}:${ip}`));
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
export function createWorker(fetchImpl=fetch){return {async fetch(request,env,ctx){
 const origin=request.headers.get('Origin'),allowed=(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim());
 const headers={'Cache-Control':'no-store','Vary':'Origin','Content-Type':'application/json'};
 const send=(status,value,extra={})=>new Response(JSON.stringify(errorBody(status,value)),{status,headers:{...headers,...extra}});
 if(!origin||!allowed.includes(origin))return send(403,{error:'Origin rejected'});
 Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Expose-Headers':'Retry-After'});
 const path=new URL(request.url).pathname;
 if(path==='/api/multiplayer'){
  if(env.MULTIPLAYER_ENABLED!=='true'||!env.MULTIPLAYER_ARENA)return send(503,{error:'Multiplayer unavailable'});
  return env.MULTIPLAYER_ARENA.get(env.MULTIPLAYER_ARENA.idFromName('public-arena-v1')).fetch(request);
 }
 if(!['/api/jev/decision','/api/jev/status','/api/mcp/chat','/api/mcp/status','/api/mcp/voice-status','/api/mcp/speech'].includes(path))return send(404,{error:'Not found'});
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'86400'}});
 if(path.startsWith('/api/mcp/'))return mcpRoute(request,env,ctx,{send,boundedJson,clientHash,fetchImpl});
 const configured=env.JEV_ENABLED==='true'&&!!env.TYPESAFE_API_KEY;
 if(path==='/api/jev/status'&&request.method==='GET')return send(200,{configured,model:env.TYPESAFE_MODEL||'jev-latest'});
 if(path!=='/api/jev/decision'||request.method!=='POST')return send(405,{error:'Method not allowed'});
 if(!configured)return send(503,{error:'Public AI is unavailable; using local tactics',retryAfter:60},{'Retry-After':'60'});
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return send(403,{error:'Missing client identity'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return send(415,{error:'JSON required'});
 let body;
 try{body=JSON.stringify(jevQuestion(await boundedJson(request),env.TYPESAFE_MODEL||'jev-latest'));}
 catch(error){return send(error.message==='size'?413:400,{error:'Invalid or oversized maneuver snapshot'});}
 const bytes=encoder.encode(body).byteLength;if(bytes>PUBLIC_LIMITS.upstreamBytes)return send(413,{error:'Maneuver request too large'});
 let budget,reservation;
 try{
  const client=await clientHash(ip,env.TYPESAFE_API_KEY);
  budget=env.JEV_BUDGET.get(env.JEV_BUDGET.idFromName('global'));
  const response=await budget.fetch('https://budget/reserve',{method:'POST',body:JSON.stringify({client,bytes})});
  if(!response.ok)throw new Error('Budget unavailable');reservation=await response.json();
  if(!reservation.ok)return send(429,{error:reservation.error,retryAfter:reservation.retryAfter},{'Retry-After':String(reservation.retryAfter)});
 }catch{return send(503,{error:'AI budget unavailable; using local tactics',retryAfter:30},{'Retry-After':'30'});}
 try{
  return await withBudgetLease(budget,reservation.lease,async leaseSignal=>{
   const upstream=await fetchImpl('https://api.typesafe.ai/v1/systemone',{method:'POST',headers:{Authorization:`Bearer ${env.TYPESAFE_API_KEY}`,'Content-Type':'application/json'},body,signal:AbortSignal.any([leaseSignal,AbortSignal.timeout(PUBLIC_LIMITS.timeoutMs)])});
   if(!upstream.ok)return send(502,{error:'Jev unavailable; using local tactics'});
   const data=await upstream.json(),answer=data.answers?.maneuver,options=JSON.parse(body).questions.maneuver.criteria;
   if(!Object.hasOwn(options,answer?.choice)||!Number.isFinite(answer?.confidence)||answer.confidence<0||answer.confidence>1)return send(502,{error:'Invalid Jev answer; using local tactics'});
   return send(200,{id:answer.choice,confidence:answer.confidence,probabilities:answer.probabilities||{},usage:data.usage||null});
  });
 }catch(error){const timeout=error.name==='TimeoutError'||error.name==='AbortError';return send(502,{code:timeout?'timeout':'unavailable',error:timeout?'Jev timed out; using local tactics':'Jev unavailable; using local tactics'});}
 finally{ctx.waitUntil(budget.fetch('https://budget/release',{method:'POST',body:JSON.stringify({lease:reservation.lease})}).catch(()=>{}));}
}};}
export default createWorker();
