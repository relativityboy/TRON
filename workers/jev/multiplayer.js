import {ArenaHub} from '../../shared/multiplayer/hub.js';
import {MP} from '../../shared/multiplayer/config.js';
import {MultiplayerAdmission} from '../../shared/multiplayer/admission.js';
// One named object is the shared arena. No timer or storage while it is empty.
export class MultiplayerArena{
 constructor(){this.hub=new ArenaHub();this.admission=new MultiplayerAdmission();}
 async fetch(request){
  const protocol=Number(new URL(request.url).searchParams.get('v'));
  if(request.headers.get('Upgrade')?.toLowerCase()!=='websocket'||protocol!==MP.protocol)return new Response('WebSocket protocol required',{status:400});
  // Cloudflare owns CF-Connecting-IP; X-Forwarded-For and query flags are ignored.
  const permit=this.admission.reserve(request.headers.get('CF-Connecting-IP'));
  if(!permit.ok)return Response.json({error:permit.error},{status:permit.status,headers:{'Cache-Control':'no-store',...(permit.retryAfter?{'Retry-After':String(permit.retryAfter)}:{})}});
  let server;
  try{
   const pair=Object.values(new WebSocketPair()),client=pair[0];server=pair[1];server.accept();
   server.addEventListener('close',permit.release);server.addEventListener('error',permit.release);
   this.hub.add(server,protocol);
   return new Response(null,{status:101,webSocket:client});
  }catch(error){permit.release();server?.close();throw error;}
 }
}
