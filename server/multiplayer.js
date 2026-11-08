import {WebSocketServer} from 'ws';
import {ArenaHub} from '../shared/multiplayer/hub.js';
import {MP} from '../shared/multiplayer/config.js';
import {MultiplayerAdmission} from '../shared/multiplayer/admission.js';
export function multiplayerPlugin(){
 const configure=(server,development)=>{
  const admission=new MultiplayerAdmission({development});
  const hub=new ArenaHub(),sockets=new WebSocketServer({noServer:true,maxPayload:MP.maxMessageBytes});
  const upgrade=(request,socket,head)=>{
   const url=new URL(request.url,'http://localhost');if(url.pathname!=='/api/multiplayer')return;
   let valid=false;try{valid=new URL(request.headers.origin).host===request.headers.host;}catch{}
   const protocol=Number(url.searchParams.get('v'));
   if(!valid||protocol!==MP.protocol){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
   const permit=admission.reserve(request.socket.remoteAddress);
   if(!permit.ok){socket.write(`HTTP/1.1 ${permit.status} ${permit.status===429?'Too Many Requests':'Forbidden'}\r\nConnection: close\r\n${permit.retryAfter?`Retry-After: ${permit.retryAfter}\r\n`:''}\r\n`);socket.destroy();return;}
   // Also release failed handshakes and abrupt TCP disconnects, exactly once.
   socket.once('close',permit.release);socket.once('error',permit.release);
   try{sockets.handleUpgrade(request,socket,head,ws=>{ws.once('close',permit.release);ws.once('error',permit.release);hub.add(ws,protocol);});}
   catch{permit.release();socket.destroy();}
  };
  server.httpServer?.on('upgrade',upgrade);
  server.httpServer?.once('close',()=>{hub.dispose();sockets.close();server.httpServer.off('upgrade',upgrade);});
 };
 return {name:'cycle-multiplayer',configureServer:server=>configure(server,true),configurePreviewServer:server=>configure(server,false)};
}
