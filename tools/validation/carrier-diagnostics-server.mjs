import {createServer} from 'node:http';
import {writeFile} from 'node:fs/promises';

const allowedOrigin='http://127.0.0.1:5190',limit=2*1024*1024;
let latest=null,image=null;
const server=createServer(async(req,res)=>{
 const origin=req.headers.origin;
 if((origin&&origin!==allowedOrigin)||req.headers.host!=='127.0.0.1:5191'){res.writeHead(403).end();return;}
 res.setHeader('Cache-Control','no-store');
 if(origin)res.setHeader('Access-Control-Allow-Origin',allowedOrigin);
 if(req.method==='GET'&&req.url==='/latest'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(latest));return;}
 if(req.method==='GET'&&req.url==='/latest.png'){if(!image){res.writeHead(404).end();return;}res.setHeader('Content-Type','image/png');res.end(image);return;}
 if(req.method!=='POST'||req.url!=='/report'){res.writeHead(404).end();return;}
 try{
  const chunks=[];let bytes=0;
  for await(const chunk of req){bytes+=chunk.length;if(bytes>limit){res.writeHead(413).end();return;}chunks.push(chunk);}
  const report=JSON.parse(Buffer.concat(chunks).toString());
  if(report.receivedFrom!=='carrier-debug-v1'){res.writeHead(400).end();return;}
  if(typeof report.screenshot==='string'&&report.screenshot.startsWith('data:image/png;base64,')){
   image=Buffer.from(report.screenshot.slice('data:image/png;base64,'.length),'base64');await writeFile('/private/tmp/tron-carrier-live.png',image);
  }
  delete report.screenshot;latest={...report,receivedAt:new Date().toISOString()};
  await writeFile('/private/tmp/tron-carrier-live.json',JSON.stringify(latest,null,2));
  res.writeHead(204).end();
 }catch{res.writeHead(400).end();}
});
server.listen(5191,'127.0.0.1',()=>console.log('Carrier diagnostics: http://127.0.0.1:5191/latest'));
