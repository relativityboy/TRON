import {MP} from './config.js';

// Addresses must come from the transport, never a caller-supplied identity or
// forwarded header. Retain only active counts and a rolling minute of admissions.
export class MultiplayerAdmission{
 constructor({development=false,clock=()=>Date.now()}={}){this.development=development;this.clock=clock;this.clients=new Map();}
 reserve(address){
  if(this.development)return {ok:true,release(){}};
  if(typeof address!=='string'||!address.trim()||address.length>64)return {ok:false,status:403,error:'Missing client identity'};
  const ip=address.trim().toLowerCase().replace(/^::ffff:/,''),now=this.clock();
  for(const [key,client] of this.clients){
   client.starts=client.starts.filter(time=>time>now-MP.connectionWindowMs);
   if(!client.active&&!client.starts.length)this.clients.delete(key);
  }
  let client=this.clients.get(ip);
  const deny=(error,retryAfter=1)=>({ok:false,status:429,error,retryAfter});
  if(!client){
   if(this.clients.size>=MP.maxTrackedIps)return deny('Connection admission busy',60);
   client={active:0,starts:[]};this.clients.set(ip,client);
  }
  if(client.active>=MP.maxConnectionsPerIp)return deny('Three connections per IP allowed');
  if(client.starts.length>=MP.maxConnectionsPerIpPerWindow)return deny('Too many reconnects',Math.max(1,Math.ceil((client.starts[0]+MP.connectionWindowMs-now)/1000)));
  client.active++;client.starts.push(now);let released=false;
  return {ok:true,release:()=>{if(!released){released=true;client.active--;}}};
 }
}
