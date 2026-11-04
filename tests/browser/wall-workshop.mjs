import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {mkdtemp,rm,readFile,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {wallStudioPlugin} from '../../server/wall-studio.js';
const storeDir=await mkdtemp(join(tmpdir(),'tron-workshop-browser-')),errors=[];
const initial=JSON.parse(await readFile('studies/maze-wall/design.json','utf8'));
let behavior='hold',release,invocation;
const runner=async context=>{
 invocation=context;
 if(behavior==='fail')throw Error('Fixture provider unavailable');
 await new Promise((resolve,reject)=>{release=resolve;context.signal.addEventListener('abort',()=>reject(Error('cancelled')),{once:true});});
 const model=structuredClone(initial);model.parts[0].position[0]=5;
 return {summary:'Moved the main slab five metres to the right.',model};
};
const server=await createServer({configFile:false,root:process.cwd(),cacheDir:join(storeDir,'vite-cache'),plugins:[wallStudioPlugin({storeDir,runner})],optimizeDeps:{noDiscovery:true,include:['three','three/addons/controls/OrbitControls.js','three/addons/exporters/GLTFExporter.js']},server:{host:'127.0.0.1',port:0,hmr:false}});
await server.listen();const url=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:1100}});page.on('pageerror',e=>errors.push(e.message));
 // Reproduce an older preview server returning HTML instead of the editor API.
 let apiOffline=true;
 await page.route('**/api/wall-studio/state',route=>apiOffline?route.fulfill({contentType:'text/html',body:'<!doctype html><title>old preview</title>'}):route.continue());
 await page.goto(`${url}/wall-study.html`);
 await page.waitForFunction(()=>window.wallStudy?.model&&document.querySelector('#status').textContent.includes('served a page instead of the editor API'));
 assert(await page.locator('#submit').isDisabled());
 // Recovery must replace the fallback with the saved state and populate history.
 apiOffline=false;
 await page.waitForFunction(()=>window.wallStudy?.state?.current.id===0);
 assert.equal(await page.locator('#history li').count(),1);
 assert.equal(await page.locator('#revision-label').textContent(),'Revision 0');
 assert.equal(await page.locator('.reference-card').count(),2);assert(await page.locator('#submit').isEnabled());
 // Real browser drag-and-drop image upload, including persistent reference storage.
 await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=120;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#384860';ctx.fillRect(0,0,120,80);
  const data=atob(canvas.toDataURL('image/png').split(',')[1]),bytes=Uint8Array.from(data,c=>c.charCodeAt(0));
  const transfer=new DataTransfer();transfer.items.add(new File([bytes],'wall-reference.png',{type:'image/png'}));
  document.querySelector('#dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:transfer,bubbles:true,cancelable:true}));
 });
 await page.waitForFunction(()=>document.querySelectorAll('.reference-card').length===3);
 await page.locator('.reference-card button').first().click();assert(await page.locator('#reference-dialog').isVisible());await page.keyboard.press('Escape');
 await page.locator('#parts').selectOption('slab');await page.locator('#feedback').fill('Move the selected slab five metres to the right.');
 await page.keyboard.press('Enter');await page.waitForFunction(()=>wallStudy.state.job?.status==='working');assert(await page.locator('#submit').isDisabled());
 assert.equal(invocation.imagePaths.length,4);assert.match(invocation.prompt,/selectedPartId.*slab/);assert.match(invocation.prompt,/wall-reference.png/);
 const cameraBefore=await page.evaluate(()=>wallStudy.camera.position.toArray());release();
 await page.waitForFunction(()=>wallStudy.state.current.id===1);assert.equal(await page.evaluate(()=>wallStudy.design.parts[0].position[0]),5);
 assert.deepEqual(await page.evaluate(()=>wallStudy.camera.position.toArray()),cameraBefore);assert.equal(await page.locator('#feedback').inputValue(),'');
 await page.reload();await page.waitForFunction(()=>window.wallStudy?.state?.current.id===1);assert.equal(await page.locator('.reference-card').count(),3);
 behavior='fail';await page.locator('#feedback').fill('Test a failed revision');await page.keyboard.press('Enter');await page.waitForFunction(()=>wallStudy.state.job?.status==='failed');assert.equal(await page.evaluate(()=>wallStudy.state.current.id),1);assert.equal(await page.locator('#feedback').inputValue(),'Test a failed revision');
 behavior='hold';await page.locator('#feedback').fill('Test cancellation');await page.keyboard.press('Enter');await page.waitForFunction(()=>wallStudy.state.job?.status==='working');await page.locator('#cancel').click();await page.waitForFunction(()=>wallStudy.state.job?.status==='cancelled');assert.equal(await page.evaluate(()=>wallStudy.state.current.id),1);
 await page.locator('[data-restore="0"]').click();await page.waitForFunction(()=>wallStudy.state.current.id===2);assert.equal(await page.evaluate(()=>wallStudy.design.parts[0].position[0]),0);
 const downloadPromise=page.waitForEvent('download');await page.locator('#download').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/revision-2.glb/);const bytes=await readFile(await download.path());assert.equal(bytes.toString('ascii',0,4),'glTF');
 for(const view of ['front','side','top','detail','canyon','whole']){await page.locator(`[data-view="${view}"]`).click();await page.waitForTimeout(100);}
 await mkdir('test-results/wall-workshop',{recursive:true});await page.screenshot({path:'test-results/wall-workshop/desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'test-results/wall-workshop/mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Wall workshop: image drop, visual references, part selection, Enter revision, persistent reload, failure/cancel, restoration, GLB export and responsive layout pass.');
}finally{await browser.close();await server.close();await rm(storeDir,{recursive:true,force:true});}
