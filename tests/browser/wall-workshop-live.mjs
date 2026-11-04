// Explicit opt-in live integration test. Uses the signed-in local Codex CLI.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {wallStudioPlugin} from '../../server/wall-studio.js';
if(process.env.TRON_STUDIO_LIVE!=='1')throw Error('Set TRON_STUDIO_LIVE=1 to run one real Codex revision.');
const storeDir=await mkdtemp(join(tmpdir(),'tron-workshop-live-'));
const server=await createServer({configFile:false,root:process.cwd(),cacheDir:join(storeDir,'vite-cache'),plugins:[wallStudioPlugin({storeDir})],optimizeDeps:{noDiscovery:true,include:['three','three/addons/controls/OrbitControls.js','three/addons/exporters/GLTFExporter.js']},server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/wall-study.html`);await page.waitForFunction(()=>window.wallStudy?.state?.current.id===0);
 await page.locator('#feedback').fill('Remove every ledge from both sides. Keep the main slab, the vertical panels, dimensions and all materials exactly as they are. Do not add anything else.');
 await page.keyboard.press('Enter');
 await page.waitForFunction(()=>['ready','failed','cancelled'].includes(wallStudy.state?.job?.status),{},{timeout:270000});
 const result=await page.evaluate(()=>({job:wallStudy.state.job,revision:wallStudy.state.current.id,parts:wallStudy.design.parts.map(p=>p.id)}));
 console.log(JSON.stringify(result,null,2));assert.equal(result.job.status,'ready');assert.equal(result.revision,1);assert.equal(result.parts.length,11);assert(!result.parts.some(id=>id.includes('ledge')));assert.deepEqual(errors,[]);
 await mkdir('test-results/wall-workshop',{recursive:true});await page.screenshot({path:'test-results/wall-workshop/live-revision.png',fullPage:true});
 console.log('One real Codex revision passed: removed eight ledges, retained eleven slab/panel parts. Temporary test workspace only.');
}finally{await browser.close();await server.close();await rm(storeDir,{recursive:true,force:true});}
