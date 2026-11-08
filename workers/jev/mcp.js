import {mcpSpeech,speechText,MCP_SPEECH} from '../../shared/mcp-speech.js';
import {mcpMessages,mcpCompletion,mcpConfig,mcpError} from '../../shared/mcp-chat.js';
import {withBudgetLease} from './lease.js';
export async function mcpRoute(request,env,ctx,{send,boundedJson,clientHash,fetchImpl}){
 const {url,key,model}=mcpConfig(env);
 const path=new URL(request.url).pathname,speech=path==='/api/mcp/speech';
 if(path==='/api/mcp/voice-status'&&request.method==='GET')return send(200,{configured:env.MCP_ENABLED==='true'&&!!env.FAL_KEY});
 const configured=env.MCP_ENABLED==='true'&&!!key;
 if(new URL(request.url).pathname==='/api/mcp/status'&&request.method==='GET')return send(200,{configured});
 if((path!=='/api/mcp/chat'&&!speech)||request.method!=='POST')return send(405,{error:'Method not allowed'});
 if(speech?!(env.MCP_ENABLED==='true'&&env.FAL_KEY):!configured)return send(503,{error:'MCP CHAT SERVICE NOT CONFIGURED'});
 const ip=request.headers.get('CF-Connecting-IP');if(!ip)return send(403,{error:'Missing client identity'});
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return send(415,{error:'JSON required'});
 let messages;try{messages=speech?speechText(await boundedJson(request)):mcpMessages(await boundedJson(request));}catch{return send(400,{error:'Invalid conversation'});}
 let budget,lease;
 try{
  const client=await clientHash(ip,speech?env.FAL_KEY:env.MCP_API_KEY);
  budget=env.JEV_BUDGET.get(env.JEV_BUDGET.idFromName('global'));
  const reservation=await budget.fetch('https://budget/reserve',{method:'POST',body:JSON.stringify({client,bytes:new TextEncoder().encode(JSON.stringify(messages)).length})});
  if(!reservation.ok)throw new Error();const result=await reservation.json();
  if(!result.ok)return send(429,{error:'MCP BUSY — TRY AGAIN',retryAfter:result.retryAfter});
  lease=result.lease;
  const completion=await withBudgetLease(budget,lease,leaseSignal=>{
   const signal=AbortSignal.any([leaseSignal,AbortSignal.timeout(speech?MCP_SPEECH.timeoutMs:45000)]);
   return speech?mcpSpeech({text:messages,key:env.FAL_KEY,signal,fetchImpl}):mcpCompletion({messages,url,key,model,searchKey:env.BRAVE_SEARCH_API_KEY,signal,fetchImpl});
  });
  return send(200,completion);
 }catch(error){const failure=speech?{status:502,message:'MCP CLONED VOICE UNAVAILABLE'}:mcpError(error);return send(failure.status,{error:failure.message});}
 finally{if(lease)ctx.waitUntil(budget.fetch('https://budget/release',{method:'POST',body:JSON.stringify({lease})}).catch(()=>{}));}
}
