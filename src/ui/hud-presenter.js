import {gridSpeedNotice} from '../../shared/simulation/cycle-speed-ramp.js';
import {CycleRoster} from './cycle-roster.js';
import {LIGHT_CYCLES} from '../../shared/simulation/config/light-cycles.js';
import {CLU_AUTOPLAY_ENABLED} from '../game/autoplay.js';
import {Vector3} from 'three';
import {assistedRecognizerTarget,ASSIST_MARKER} from '../rendering/assist-target.js';
import { config, CLU_HEALTH, CLU_WEAPON, TURBO, GUNNER } from '../game/config.js';
const $ = (id) => document.getElementById(id);
const RESERVE_REWARD={fillMs:650,glowMs:1100};
const HEALTH_WARNING = { orange: 0.5, red: 0.25, critical: 0.1 };
export class HudPresenter {
  constructor(world, warnings) {
    this.world = world;
    this.cycleRoster=new CycleRoster($('cycle-roster'));
    this.assistPoint=new Vector3();
    this.warnings = warnings;
    this.mapContext = $('map').getContext('2d');
  }
  updateReserveReward(bike,now) {
    if(this.rewardBike!==bike){
      this.rewardBike=bike;
      this.rewardSeen=bike?.reserveReward;
      this.rewardStarted=null;
    }else if(bike?.reserveReward!==this.rewardSeen){
      this.rewardSeen=bike?.reserveReward;
      this.rewardStarted=now;
    }
    const elapsed=this.rewardStarted===null?Infinity:now-this.rewardStarted;
    const active=!!bike&&elapsed<RESERVE_REWARD.glowMs;
    for(const [id,field] of [['turbo','turboFrom'],['cycle-brake','brakeFrom']]){
      $(id).classList.toggle('reserve-reward',active);
      if(active&&elapsed<RESERVE_REWARD.fillMs){
        const start=this.rewardSeen[field]??0;
        const t=Math.min(1,elapsed/RESERVE_REWARD.fillMs);
        $(id==='turbo'?'turbo-fill':'cycle-brake-fill').style.transform=
          `scaleX(${start+((this.rewardSeen.target??1)-start)*(1-(1-t)**3)})`;
      }
    }
  }
  drawMap(run) {
    const { HALF, BASIS, WALLS } = this.world;
    const ctx = this.mapContext,
      w = 500,
      h = 500,
      scale = 440 / (2 * HALF * (BASIS.a + BASIS.b));
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#020710e8';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#253e62';
    for (const wall of WALLS) {
      ctx.beginPath();
      wall.points.forEach((p, i) => {
        const x = 250 + p.x * scale,
          y = 250 - p.s * scale;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    }
    const px = 250 + run.x * scale,
      py = 250 - run.s * scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-run.yaw);
    ctx.fillStyle = '#e8ad78';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(-4, 5);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  update({
    dt=0,
    run,
    view,
    mode,
    autoplay,
    jev,
    showSurvey,
    controlsFirstKey,
    idleReminderArmed,
    idleTime,
  }) {
    const cycleMode=run.playerVehicle==='cycle',race=run.cycleRace,touch=document.body.classList.contains('mobile-terminal');
    this.warnings.set('barrel-jam',!cycleMode&&run.barrelJam&&!run.crushed&&mode==='running'?{level:'warning',label:'BARREL LODGED',detail:'HOLD S TO PULL FREE'}:null);
    const marker=$('assist-marker'),rig=view.cameraRig;
    const target=mode==='running'&&!rig.freeCamera.active&&rig.opening==null?assistedRecognizerTarget(run):null;
    const lockId=target?.id??null;
    if(lockId!==this.assistLockId){
      this.assistFlash?.cancel();this.assistFlash=null;this.assistLockId=lockId;
      if(target)this.assistFlash=marker.animate([
        {opacity:ASSIST_MARKER.opacity,offset:0},
        {opacity:ASSIST_MARKER.opacity,offset:.499},
        {opacity:0,offset:.5},{opacity:0,offset:1},
      ],{duration:ASSIST_MARKER.flashPeriodMilliseconds,iterations:ASSIST_MARKER.flashCount});
    }
    marker.hidden=true;
    if(target){
      const camera=view.camera.position;
      this.assistPoint.set(target.x,target.y,-target.s).project(view.camera);
      const p=this.assistPoint;
      if(p.z>=-1&&p.z<=1&&Math.abs(p.x)<1&&Math.abs(p.y)<1&&this.world.lineOfSight({x:camera.x,y:camera.y,s:-camera.z},target)){
        marker.hidden=false;marker.dataset.targetId=String(target.id);
        marker.style.left=`${(p.x+1)*innerWidth/2}px`;marker.style.top=`${(1-p.y)*innerHeight/2}px`;
      }
    }
    document.body.classList.toggle('playing-cycle',cycleMode);
    document.body.classList.toggle('playing-multiplayer',cycleMode&&!!run.multiplayer);
    this.cycleRoster.update(race,cycleMode&&!run.arenaWaiting&&rig.cycleOpening===null,run.multiplayer?.unseatedWaiting??0);
    const speedNotice=cycleMode&&mode==='running'?gridSpeedNotice(race):null;
    $('cycle-speed-notice').hidden=!speedNotice;
    $('cycle-speed-notice').textContent=speedNotice?.text??'';
    const cycleControls=$('cycle-controls');
    const result=cycleMode&&race.phase==='result';
    const resultText=$('cycle-result');
    resultText.hidden=!result;
    resultText.classList.toggle('gold-winner',result&&race.winner===0);
    resultText.textContent=result?(race.winner==null?'TIED MATCH!':`${LIGHT_CYCLES.teamNames[race.winner]} TEAM WINS`):'';
    const dead=cycleMode&&!race.cycles[race.playerId].alive;
    cycleControls.hidden=!run.arenaWaiting&&(!dead||result);
    cycleControls.textContent=run.arenaWaiting?'LOADING CYCLE ARENA...':dead?'CYCLE DETROYED - ARROW KEYS TO FOLLOW - ENTER TO RESTART':'MATCH COMPLETE · RETURN / NEW MATCH';
    if(run.multiplayer){
      const mp=run.multiplayer;
      cycleControls.hidden=false;
      cycleControls.textContent=!mp.connected?'CONNECTION LOST — ESC / RETURN HOME':
        run.cycleSpectating?`WAITING${mp.queue?' · QUEUE '+mp.queue:''} · ARROWS / SPECTATE`:
        race.phase==='countdown'?(race.cameraStaging?'PREPARING GRID':'MATERIALIZING'):
        race.phase==='result'?'SURVIVORS KEEP THEIR SEATS · NEXT MATCH SOON':`MULTIPLAYER · ${mp.ping} MS`;
    }
    if(run.multiplayer?.connected&&run.multiplayer.players===1)cycleControls.textContent+=' · RETURN / NEW MATCH';
    if(touch&&cycleMode){cycleControls.textContent=cycleControls.textContent.replace('ESC / RETURN HOME','MENU / RETURN HOME').replace('ARROWS / SPECTATE','TAP SIDES / FOLLOW').replace('RETURN / NEW MATCH','TAP NEW MATCH').replace('ARROW KEYS TO FOLLOW - ENTER TO RESTART','TAP SIDES TO FOLLOW - TAP NEW MATCH');$('controls-prompt').textContent='CONTROLS / TOUCH GUIDE';}
    const promptKey=cycleMode?`cycle:${race.round}`:'clu';
    if(this.promptRun!==run||this.promptKey!==promptKey){this.promptRun=run;this.promptKey=promptKey;this.promptSeconds=0;}
    const playing=mode==='running'&&!run.arenaWaiting&&!dead&&!run.crushed&&!result&&rig.cycleOpening===null;
    if(playing)this.promptSeconds+=dt;
    $('controls-prompt').hidden=!playing||this.promptSeconds>=5;
    $('gunner-sight').hidden =
      !(view.cameraRig.gunnerOpacity > 0) || run.crushed || !['running', 'paused'].includes(mode);
    $('gunner-sight').style.opacity = String(
      (view.cameraRig.gunnerOpacity || 0) * (mode === 'paused' ? 0.35 : 1),
    );
    const point = view.cameraRig.gunScreen,
      scale = Math.min(innerWidth / 1000, innerHeight / 650);
    $('gunner-crosshair').setAttribute(
      'transform',
      point
        ? `translate(${(point.x * innerWidth) / 2 / scale} ${(-point.y * innerHeight) / 2 / scale})`
        : '',
    );
    $('aim-dot').hidden = !view.cameraRig.mouseLook;
    $('mouse-hint').textContent =
      !GUNNER.mouseEnabled || document.pointerLockElement === $('game') ? '' : 'CLICK / MOUSE AIM';
    $('gunner-sight').classList.toggle('on-target', !!view.gunnerHit);
    $('gunner-sight').classList.toggle('critical-target', !!view.gunnerHit?.critical);
    $('gunner-zoom').textContent = ['1×', '2×', '4×', '8×'][run.gunnerZoom];
    $('pitch-hint').hidden=!run.gunner&&!view.cameraRig.aerial&&!cycleMode;
    $('pitch-hint').textContent=!run.gunner&&!cycleMode?'I/K / ZOOM':'IK / AIM';
    $('zoom-hint').hidden = !(view.cameraRig.aerial || (GUNNER.mouseEnabled && run.gunner));
    $('survey').hidden = !showSurvey;
    $('autoplay-toggle').hidden=!CLU_AUTOPLAY_ENABLED;
    $('autoplay-toggle').disabled=!CLU_AUTOPLAY_ENABLED;
    $('autoplay-toggle').textContent = autoplay.enabled
      ? `${autoplay.manualFire ? 'SHIFT-U' : 'U'} / AUTOPLAY · ${jev.warning ? 'LOCAL FALLBACK' : autoplay.tactical?.source === 'jev' ? 'JEV' : 'LOCAL'}${autoplay.manualFire ? ' · MANUAL FIRE' : ''}`
      : 'U / AUTOPLAY OFF';
    $('autoplay-toggle').setAttribute('aria-pressed', String(autoplay.enabled));
    const jevStats = jev.stats.value,
      statsNode = $('jev-stats');
    statsNode.hidden=!!run.multiplayer||(!CLU_AUTOPLAY_ENABLED&&!cycleMode);
    statsNode.children[0].textContent = `N / JEV ${config.aiMode==='jev'?'ON':'OFF'} · ${jevStats.requests} REQUESTS · ${jevStats.requestsPerSecond.toFixed(1)}/s`;
    statsNode.children[1].textContent = `${jevStats.estimatedRequests ? '~' : ''}$${jevStats.costUsd.toFixed(5)} USD`;

    if(this.loggedAiMode!==config.aiMode){
      this.loggedAiMode=config.aiMode;
      console.info(config.aiMode==='jev'?'JEV AI selected.':config.aiMode==='classic'?'Classic enemy AI selected.':'Local tactical AI selected.');
    }
    const unavailable=config.aiMode==='jev'&&!!jev.warning;
    const now=performance.now();
    if(unavailable&&!this.jevWasUnavailable){
      this.jevNoticeUntil=now+4000;
      console.warn('JEV unavailable:',jev.warning.detail);
    }
    this.jevWasUnavailable=unavailable;
    this.warnings.set('jev',!run.multiplayer&&unavailable&&(cycleMode||now<this.jevNoticeUntil)
      ?{level:'warning',label:'JEV UNAVAILABLE',detail:cycleMode?'LOCAL AI ACTIVE':'',transient:!cycleMode}:null);
    const watchedCycleId=result?rig.cycleResultCamera.shot?.id:run.cycleSpectating?(run.cycleFollowId??view.cameraRig.cycleOverview?.trackedId??race?.playerId):race?.playerId;
    const cycleBike=cycleMode?(race.cycles.find(b=>b.id===watchedCycleId)??race.cycles[race.playerId]):null;
    const roadHealthBike=cycleBike?.escaped?cycleBike:null;
    document.body.classList.toggle('cycle-road',!!roadHealthBike);
    const healthFraction = roadHealthBike ? (roadHealthBike.roadHealth??1) : run.crushed ? 0 : Math.max(0, Math.min(1, run.health / CLU_HEALTH.max)),
      healthPercent = Math.ceil(healthFraction * 100);
    $('health-fill').style.transform = `scaleX(${healthFraction})`;
    $('health-meter').setAttribute('aria-valuenow', String(healthPercent));
    $('clu-health').dataset.level =
      healthFraction <= HEALTH_WARNING.critical
        ? 'critical'
        : healthFraction <= HEALTH_WARNING.red
          ? 'red'
          : healthFraction <= HEALTH_WARNING.orange
            ? 'orange'
            : 'normal';
    const shotsMeter = $('shots-meter');
    const storedShots = run.crushed ? 0 : run.extraShots;
    shotsMeter.setAttribute('aria-valuenow', String(storedShots));
    for (let i = 0; i < shotsMeter.children.length; i++) {
      const charge = i < storedShots ? 1 : !run.crushed && i === storedShots ? Math.min(1, run.shotRest / CLU_WEAPON.reserveRecharge) : 0;
      shotsMeter.children[i].style.setProperty('--charge', String(charge));
      shotsMeter.children[i].classList.toggle('ready', i < storedShots);
    }
    const roadBike=roadHealthBike;
    const brake=$('cycle-brake');
    brake.hidden=!cycleMode||!!roadBike;
    brake.classList.toggle('boosting',!!cycleBike?.braking);
    brake.classList.toggle('charging',(cycleBike?.brakeCharge??1)<1);
    brake.setAttribute('aria-label',`Brake reserve ${Math.round((cycleBike?.brakeCharge??1)*100)} percent`);
    $('cycle-brake-fill').style.transform=`scaleX(${cycleBike?.brakeCharge??1})`;
    const turbo = $('turbo'),
      boosting = cycleMode ? cycleBike.boosting : run.turboRemaining > 0,
      charging = cycleMode ? cycleBike.turboCharge < 1 : run.turboCooldown > 0;
    turbo.querySelector('span').textContent = roadBike ? `W / ↑ / TURBO · ${roadBike.reverseGear?'R':Math.round(roadBike.targetRoadSpeed*3.6)+' SET'} · ${Math.round(Math.abs(roadBike.roadSpeed)*3.6)} KM/H` : cycleMode ? 'W / ↑ / TURBO' : 'SHIFT / TURBO';
    turbo.setAttribute(
      'aria-label',
      boosting ? 'Turbo active' : charging ? 'Turbo recharging' : 'Turbo ready',
    );
    turbo.classList.toggle('boosting', boosting);
    turbo.classList.toggle('charging', charging);
    $('turbo-fill').style.transform =
      `scaleX(${cycleMode ? cycleBike.turboCharge : boosting ? run.turboRemaining / TURBO.duration : 1 - run.turboCooldown / TURBO.rechargeSeconds})`;
    this.updateReserveReward(cycleBike,now);
    $('hint').hidden=true;
    document.body.classList.toggle('impact', run.impact > 0.6 && !view.cameraRig.reducedMotion);
    if (showSurvey) this.drawMap(run);
    if (import.meta.env.DEV && !$('tuning').hidden) {
      $('ai-status').textContent = jev.status;
      $('ai-decision').textContent = JSON.stringify(
        jev.history.at(-1) || {
          mode: config.aiMode,
          units: [...run.recognizers, ...run.enemyTanks].map((e) => ({
            id: e.id,
            maneuver: e.tactical?.plan?.kind,
            source: e.tactical?.source,
            blocked: e.tactical?.blocked,
          })),
        },
        null,
        2,
      );
      $('perception').textContent = run.recognizers
        .map(
          (e) =>
            `R${e.id + 1} ${e.state} | ${e.canSee ? 'visual' : e.memory ? `last seen ${(run.time - e.memory.seenAt).toFixed(1)}s ago via R${e.memory.source + 1}` : 'no sighting'}`,
        )
        .join('\n');
    }
  }
}
