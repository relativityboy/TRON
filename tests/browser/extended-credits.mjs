import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:5173');
 await page.waitForFunction(()=>window.__tron&&!document.querySelector('#start').disabled);
 const result=await page.evaluate(async()=>{
  const {TerminalTribute,creditPages}=await import('/src/ui/terminal.js');
  const normal=(await import('/docs/credits.txt?raw')).default;
  const extended=(await import('/docs/credits_display.txt?raw')).default;
  const element=document.querySelector('#end-tribute').cloneNode(true);
  const tribute=new TerminalTribute(element,normal,extended);tribute.start(true);
  const seen=[];
  for(let i=0;i<3000&&tribute.active;i++){
   tribute.update(10,true);
   seen.push(element.querySelector('#tribute-text').textContent);
  }
  const {GLTFLoader}=await import('/node_modules/three/examples/jsm/loaders/GLTFLoader.js');
  const loader=new GLTFLoader();
  const models=[];
  for(const path of ['preti_light_cycle_arena.glb','preti_arena_signatures.glb']){
   const {scene}=await loader.loadAsync('/docs/models/'+path);let meshes=0,triangles=0,signatures=0;
   scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;if(o.name.includes('daniel_preti'))signatures++;}});
   models.push({meshes,triangles,signatures});
  }
  return {seen,phase:tribute.phase,active:tribute.active,pages:creditPages(extended),models};
 });
 assert.equal(result.phase,'signoff');assert.equal(result.active,false);
 assert(result.seen.some(s=>s.includes('A USER AND A PROGRAM')));
 assert(result.seen.some(s=>s.includes('DANIEL PRETI')));
 assert(result.pages.every(p=>!p.includes('https://')&&p.split('\n').length<=8));
 assert.equal(result.pages.find(p=>p.startsWith('CLOUDFLARE')).split('\n').length,2);
 assert(result.pages.some(p=>p.startsWith('JIHS\n')&&p.includes('TRON SUNSHIP')));
 assert(!result.pages.some(p=>p.includes('ARABINOWITZ')&&p.includes('SHRIKER1')));
 assert.equal(result.models[0].signatures,0);assert.equal(result.models[1].signatures,116);
 assert.equal(result.models.reduce((n,m)=>n+m.triangles,0),8349);
 const rendering=await page.evaluate(async()=>{
  const {TerminalTribute}=await import('/src/ui/terminal.js');
  const extended=(await import('/docs/credits_display.txt?raw')).default;
  const element=document.querySelector('#end-tribute');
  document.body.classList.add('detached','victory-credits');
  const tribute=new TerminalTribute(element,'INTRO',extended);tribute.start(false);
  tribute.index=tribute.sentences.reduce((best,text,i)=>i>=tribute.extendedStart&&text.length>tribute.sentences[best].length?i:best,tribute.extendedStart);
  tribute.nextCharacter=0;
  const expected=tribute.sentences[tribute.index],samples=[];let removed=0,first=null;
  const observer=new MutationObserver(records=>{for(const r of records)removed+=r.removedNodes.length;});
  observer.observe(tribute.output,{childList:true,subtree:true});
  let previous=performance.now();
  await new Promise(resolve=>{
   const frame=now=>{
    const dt=(now-previous)/1000;previous=now;
    const start=performance.now();tribute.update(dt);samples.push(performance.now()-start);
    first??=tribute.output.querySelector('.printer-character');
    if(tribute.count<expected.length)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);
  });
  await Promise.resolve();observer.disconnect();
  const box=element.getBoundingClientRect(),left=document.querySelector('#intro .terminal-content').getBoundingClientRect().left;
  return {rows:new Set([...tribute.output.querySelectorAll('.printer-character')].map(e=>Math.round(e.getBoundingClientRect().top))).size,removed,stable:first===tribute.output.querySelector('.printer-character'),text:tribute.output.textContent,expected,left:box.left,right:innerWidth-box.right,originalLeft:left,earlyMs:samples.slice(0,60).reduce((a,b)=>a+b,0)/60,lateMs:samples.slice(-60).reduce((a,b)=>a+b,0)/60};
 });
 assert(rendering.rows<=21);assert.equal(rendering.removed,0);assert(rendering.stable);assert.equal(rendering.text,rendering.expected);
 assert(Math.abs(rendering.left-rendering.right)<1);assert.equal(rendering.left,rendering.originalLeft);
 await page.screenshot({path:'test-results/extended-credits-layout.png'});
 console.log('Credits append cost, early/late ms:',rendering.earlyMs,rendering.lateMs);
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.locator('#end-tribute').evaluate(e=>{const b=e.getBoundingClientRect();return {left:b.left,right:innerWidth-b.right,overflow:e.scrollWidth>e.clientWidth+1};});
 assert(Math.abs(mobile.left-mobile.right)<1);assert(!mobile.overflow);
 console.log('Extended credits follow the tribute and reach signoff; both split GLBs load with all 8,349 triangles preserved.',result.models);
}finally{await browser.close();}
