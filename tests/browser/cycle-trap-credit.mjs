import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:900,height:400}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/trap-credit-fixture',r=>r.fulfill({contentType:'text/html',body:'<link rel="stylesheet" href="/src/ui/style.css?direct"><body class="playing-cycle"><div id="cycle-roster"></div></body>'}));
 await page.goto('http://127.0.0.1:5173/trap-credit-fixture');
 const result=await page.evaluate(async()=>{
  const {trackCycleTraps}=await import('/shared/simulation/cycle-traps.js');
  const {advanceContinuousCycles,cycleCollisionTrails}=await import('/shared/simulation/cycle-continuous.js');
  const {projectState,compactSnapshot,decodeSnapshot}=await import('/shared/multiplayer/snapshots.js');
  const {CycleRoster}=await import('/src/ui/cycle-roster.js');
  const victim={id:0,team:0,x:0,z:-19.7,dir:0,alive:true,progress:1,segment:-1,travelRate:8,trailStopped:true};
  const attacker={id:1,team:1,x:50,z:50,dir:1,alive:true,progress:1,segment:-1,travelRate:0,trailStopped:true};
  const race={round:1,time:0,phase:'racing',teamCount:2,cycles:[victim,attacker],trails:[],breaches:[],closedArena:true,crashes:[],scores:[0,0]};
  const wall=(bikeId,x1,z1,x2,z2)=>({bikeId,team:race.cycles[bikeId].team,x1,z1,x2,z2});
  race.trails.push(wall(0,-20,-20,20,-20),wall(0,-20,20,20,20),wall(0,-20,-20,-20,20));
  trackCycleTraps(race,cycleCollisionTrails(race),[]);race.time=.11;trackCycleTraps(race,cycleCollisionTrails(race),[]);
  race.trails.push(wall(1,20,-20,20,20));race.time=.12;
  const before=projectState({race,tick:0,clients:[],waiting:[]});
  const roster=new CycleRoster(document.getElementById('cycle-roster'));roster.update(before.race,true);
  advanceContinuousCycles(race,[victim,attacker],.1);
  const next=projectState({race,tick:1,clients:[],waiting:[]});
  const decoded=decodeSnapshot(compactSnapshot(next,before),before);roster.update(decoded.race,true);
  return {victimAlive:victim.alive,assists:decoded.race.cycles[1].trapAssists};
 });
 assert.equal(result.victimAlive,false);assert.deepEqual(result.assists,[{id:0,team:0,share:1}]);
 const owner=page.locator('[data-cycle-id="1"]');
 assert.equal(await owner.locator('.cycle-roster-kill.trap-assist').count(),1);
 assert.match(await owner.getAttribute('aria-label'),/1 trap assist/);
 assert.equal(await page.locator('[data-cycle-id="0"] .cycle-roster-kill').count(),0);
 await page.screenshot({path:'test-results/cycle-trap-credit.png'});assert.deepEqual(errors,[]);
 console.log('Immediate self-wall death credits enclosing opponent through collision, MP delta and roster.');
}finally{await browser.close();}
