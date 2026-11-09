import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=process.env.TRON_TRACKING_BUILD||'/tmp/tron-play-tracking-build';
const beacon=await readFile('/tmp/tron-analytics-beacon.js','utf8');
const chunk=(await readdir(root+'/assets')).find(f=>f.startsWith('mark-play-'));
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/check'||path==='/bit/check'){res.setHeader('Content-Type','text/html');res.end('<body>Tracking fixture</body>');return;}
  const source=path==='/tracker.js'?'src/analytics/play-tracker.js':path==='/dev-marker.js'?'src/analytics/mark-play.js':root+path;
  let data=await readFile(source);
  if(path==='/dev-marker.js')data=String(data).replaceAll('import.meta.env.PROD','false');
  res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/html');res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const context=await browser.newContext(),reports=[];
 await context.route('https://static.cloudflareinsights.com/**',r=>r.fulfill({contentType:'text/javascript',body:beacon}));
 await context.route('**/cdn-cgi/rum**',async r=>{reports.push(JSON.parse(r.request().postData()||'{}'));await r.abort();});
 const page=await context.newPage();await page.goto(url+'/check');
 await page.evaluate(async chunk=>{
  const module=await import('/assets/'+chunk);window.mark=Object.values(module).find(x=>typeof x==='function');
  const {PlayTracker}=await import('/tracker.js');window.tracker=new PlayTracker(window.mark);
  window.run={cycleRace:{round:1,phase:'countdown',playerId:0,cycles:[{id:0,alive:true}]},multiplayer:{connected:true,seat:null}};
  window.update=(game,mode='running')=>tracker.update({game,mode,run});
  update('space','ready');update('cycles');update('multiplayer');
 },chunk);
 assert.equal(await page.locator('[data-play-marker]').count(),0);
 const waitReport=async mode=>{await page.waitForFunction(mode=>document.querySelector(`[data-play-marker="${mode}"]`),mode);await new Promise(r=>setTimeout(r,1800));assert.ok(reports.some(r=>String(r.location).endsWith(`/events/play-${mode}.html`)),JSON.stringify(reports));};
 await page.evaluate(()=>{update('space');update('space');});await waitReport('clu');
 await page.evaluate(()=>{run.cycleRace.phase='racing';update('cycles');update('cycles');});await waitReport('cycles-solo');
 await page.evaluate(()=>{run.cycleRace.round++;update('cycles');});await waitReport('cycles-solo');
 await page.evaluate(()=>{run.multiplayer.seat=0;update('multiplayer');update('multiplayer');});await waitReport('cycles-mp');
 assert.equal(await page.locator('[data-play-marker]').count(),1);
 await page.goto(url+'/bit/check');await page.evaluate(async()=>{const m=await import('/src/analytics/bit-play.js');m.markBitPlay();m.markBitPlay();});await waitReport('bit');
 assert.deepEqual(reports.map(r=>new URL(r.location).pathname),['/events/play-clu.html','/events/play-cycles-solo.html','/events/play-cycles-solo.html','/events/play-cycles-mp.html','/events/play-bit.html']);
 await page.goto(url+'/check');await page.evaluate(async chunk=>{localStorage.setItem('colvmn:no-analytics','1');Object.values(await import('/assets/'+chunk)).find(x=>typeof x==='function')('cycles-solo');},chunk);
 assert.equal(await page.locator('[data-play-marker]').count(),0);
 await page.goto(url+'/events/play-cycles-solo.html');await page.waitForTimeout(1800);assert.equal(reports.length,5);
 await page.goto(url+'/check');await page.evaluate(async()=>{localStorage.clear();(await import('/dev-marker.js')).markPlay('cycles-solo');});assert.equal(await page.locator('[data-play-marker]').count(),0);
 console.log('PASS: exact mode/restart reports; no menu, spectator, opted-out or dev reports; BIT counted once; all uploads aborted.');
}finally{await browser.close();server.close();}
