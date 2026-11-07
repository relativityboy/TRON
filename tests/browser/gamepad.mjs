import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.testPad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({value:0,pressed:false}))};
  navigator.getGamepads=()=>[window.testPad];
 });
 for(const id of ['start','start-cycles']){
  await page.goto('http://localhost:5173/');await page.waitForFunction(id=>!document.getElementById(id).disabled,id);
  await page.locator('#'+id).click();await page.waitForFunction(()=>__tron.state.mode==='running');
  if(id==='start-cycles')await page.waitForFunction(()=>__tron.state.cycleRace.phase==='racing',null,{timeout:60000});
  await page.waitForTimeout(200);
  await page.evaluate(()=>testPad.buttons[8].value=1);
  await page.locator('#controls-help').waitFor({state:'visible'});
  assert((await page.locator('#controls-help').innerText()).includes('CONTROLLER'));
  await page.evaluate(()=>testPad.buttons[8].value=0);await page.waitForTimeout(100);
  await page.evaluate(()=>testPad.buttons[0].value=1);
  await page.locator('#controls-help').waitFor({state:'hidden'});
  await page.evaluate(()=>testPad.buttons[0].value=0);
  await page.waitForFunction(()=>__tron.state.mode==='running');
  await page.evaluate(()=>{testPad.axes[0]=-.7;testPad.axes[1]=-.8;testPad.buttons[7].value=1;});
  await page.waitForTimeout(300);
  await page.evaluate(()=>testPad.connected=false);await page.waitForTimeout(100);
 }
 assert.deepEqual(errors,[]);console.log('CLU/cycle controller help, resume, input and disconnect run without page errors. Physical controller review pending.');
}finally{await browser.close();}
