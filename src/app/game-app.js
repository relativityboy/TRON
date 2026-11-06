import {guardGameKey} from './game-keyboard.js';
import {yieldStartup} from '../loading/yield-startup.js';
import {markPlay} from '../analytics/mark-play.js';
import {PlayTracker} from '../analytics/play-tracker.js';
import {CycleTouchControls} from '../ui/cycle-touch-controls.js';
import {isMobileTerminal} from '../ui/mobile-terminal.js';
import {yieldToBrowser} from '../loading/yield-to-browser.js';
import {clearLegacyMcpCache} from '../mcp/clear-legacy-cache.js';
import {CycleRendererControl} from '../ui/cycle-renderer-control.js';
import {createMcpPanel} from '../ui/mcp-panel.js';
import {createHomeTransition} from '../ui/home-transition.js';
import {preloadBitResources} from './program-preload.js';
import {CLU_DEATH_CAMERA,livingCluKiller} from '../game/clu-death.js';
import {CreditModelPreview} from '../ui/credit-model-preview.js';
import {CLU_AUTOPLAY_ENABLED} from '../game/autoplay.js';
import {RECOGNIZER_TINTS} from '../game/recognizer-appearance.js';
import {CYCLE_OPENING,CYCLE_DEATH_HOLD_SECONDS} from '../rendering/camera-rig.js';
import { LoadingTimings } from './loading-timings.js';
import { CYCLE_TESTING } from '../../shared/simulation/config/light-cycles.js';
import {CycleTuning} from '../ui/cycle-tuning.js';
import {disposeSceneResources} from '../rendering/scene-resources.js';
import { SOLAR_SAILER, SOLAR_SAILER_DEFAULTS } from '../game/solar-sailer.js';

import { createDevelopmentTools } from './development-tools.js';
import { HudPresenter } from '../ui/hud-presenter.js';
import { GameLoop, simulationStepSeconds } from './game-loop.js';
import { InputController } from './input-controller.js';
import { GameSession } from '../simulation/game-session.js';
import { DebrisPhysics } from '../simulation/debris-physics.js';
import { browserScenario, browserRunSeed } from '../game/browser-scenario.js';
import { HEARING, HEARING_DEFAULTS } from '../game/hearing.js';
import { mergeAutoplayInput } from '../simulation/autoplay-input.js';
import { Autoplay } from '../simulation/autoplay.js';
import { JevClient } from '../ai/jev-client.js';
import { SystemWarnings } from '../ui/system-warnings.js';
import { AI_MODES } from '../game/tactical.js';
import victoryText from '../../docs/victory.txt?raw';
import creditsText from '../../docs/credits.txt?raw';
import extendedCreditsText from '../../docs/credits_display.txt?raw';
import { debrisPhysicsReady } from '../simulation/debris-physics.js';
import { saveScreenshot } from '../ui/screenshot.js';
import { loadCarrier } from '../rendering/carrier.js';
import { loadVehicles } from '../rendering/models.js';
import { Terminal, TerminalTribute, TerminalPrinter, HumanTerminalPrinter } from '../ui/terminal.js';
import { View } from '../rendering/view.js';
import { Sound } from '../audio/sound.js';
import { FLIGHT, FLIGHT_DEFAULTS } from '../simulation/flight.js';
import { startPursuit, boostTank, stopTankTurbo } from '../simulation/run.js';
import { config, defaults, GUNNER, AERIAL_ZOOM, FOLLOW_ZOOM } from '../game/config.js';

export async function createGameApp() {
  const mobileTerminal=isMobileTerminal();
  document.getElementById('clu-mobile-note').hidden=!mobileTerminal;
  void clearLegacyMcpCache();
  performance.mark('tron:startup');
  const loadingTimings = new LoadingTimings();
  const scenario = loadingTimings.sync('Scenario / maze geometry',()=>browserScenario(location));
  const { world: map } = scenario;
  const cycleStart = new URLSearchParams(location.search).get('cycleStart');
  const testCycleStart = cycleStart === '1';
  let selectedGame = 'cycles', multiplayer=null;
  const developmentTuningEnabled=import.meta.env.DEV&&new URLSearchParams(location.search).get('tuning')==='1';
  const playTracker=new PlayTracker(markPlay);
  const cycleGame=()=>selectedGame==='cycles'||selectedGame==='multiplayer';
  const $ = (id) => document.getElementById(id);
  const inputController = new InputController();
  const loop = new GameLoop({ frame, backgroundAllowed: () => autoplay.enabled });
  const sound = new Sound(map);
  const jev = new JevClient();
  const autoplay = new Autoplay({available:CLU_AUTOPLAY_ENABLED});
  const systemWarnings = new SystemWarnings($('system-warnings'));
  // Browser defaults supersede the earlier experimental preference once.
  const AI_PREFERENCE_VERSION = 4;
  config.aiMode = 'jev';
  config.aiSmallEncounter = false;
  try {
    const saved = JSON.parse(localStorage.getItem('tron-enemy-ai') || 'null');
    if (
      saved &&
      saved.version === AI_PREFERENCE_VERSION &&
      AI_MODES.includes(saved.mode)
    ) {
      config.aiMode = saved.mode;
      config.aiSmallEncounter = saved.version === AI_PREFERENCE_VERSION && saved.small === true;
    }
  } catch {}

  performance.mark('tron:simulation-start');
  const startupSeed=browserRunSeed(location);
  loadingTimings.seeds={layoutSeed:scenario.spec.layoutSeed,runSeed:startupSeed};
  const session = await loadingTimings.async('Initial simulation / enemy placement',()=>GameSession.create({ world: map, seed:startupSeed },yieldStartup));
  performance.mark('tron:simulation-ready');
  const terminal = new Terminal($('terminal-text'), $('terminal-actions'));
  const tribute = new TerminalTribute($('end-tribute'), creditsText, extendedCreditsText);
  tribute.preview=new CreditModelPreview();
  const victoryPrinter=new TerminalPrinter($('terminal-text'),victoryText);
  let endingStage=null;
  let carrierDiagnostics=null;
  let view,
    run = session.run,
    mode = 'loading';
  let showSurvey = false,
    idleTime = 0;
  let windowFocused = true;
  let controlsFirstKey = null,
    idleReminderArmed = false;
  function noteControlKey() {
    if (controlsFirstKey === null) controlsFirstKey = run.time;
    else if (run.time - controlsFirstKey >= 10) idleReminderArmed = true;
  }
  const openingDuration = 5.5, terminalFadeSeconds = 1.1, accessHoldSeconds = 1;
  let openingTime = 0, openingTransition = false, accessHoldTime = 0;
  let pausedFrom = 'running';

  const DEATH_TERMINAL = {
    holdSeconds: 1.1,
    fadeSeconds: 1,
    message: 'ILLEGAL CODE\nCLU PROGRAM DETACHED FROM SYSTEM',
  };
  const openingMessage = $('terminal-text').textContent;
  const cluAccessMessage = 'REQUEST ACCESS TO CLU PROGRAM\nCODE 6 PASSWORD TO MEMORY 0222';
  const accessPrinter = new HumanTerminalPrinter($('terminal-text'),cluAccessMessage);
  let deathElapsed = 0, deathHoldSeconds = DEATH_TERMINAL.holdSeconds,
    outroFade = 0;
  let disposed = false;
  let tuningWasPlaying=false;
  const cycleTuning=import.meta.env.DEV?new CycleTuning({session,
    onOpen:()=>{tuningWasPlaying=['running','entering'].includes(mode);inputController.clear();releaseMouse();pause();},
    onClose:()=>{inputController.clear();if(tuningWasPlaying&&!disposed)resume();},
  }):null;
  const cycleRendererControl=new CycleRendererControl({getView:()=>view,getRun:()=>run,getMode:()=>mode});
  let arenaLoad=null,solarLoad=null,solarPlaySeconds=0;
  function loadSolarInBackground(){
    if(solarLoad||!SOLAR_SAILER.enabled)return solarLoad;
    solarLoad=loadingTimings.async('Solar sailer module + model',()=>import('../rendering/solar-sailer.js').then(async({loadSolarSailer,SolarSailer})=>({model:await loadSolarSailer(),SolarSailer}))).then(({model,SolarSailer})=>{
      if(disposed){disposeSceneResources(model.ship);return;}
      view.attachSolarSailer(model,SolarSailer);
    }).catch(error=>console.warn('Solar sailer unavailable:',error));
    return solarLoad;
  }
  function loadArenaInBackground(){
    sound.loadCycleSamples();
    if(arenaLoad||!run.cycleRace)return arenaLoad;
    session.arenaReady=!!view.arena;
    if(view.arena)return;
    arenaLoad=loadingTimings.async('Arena module + models / cycle setup',()=>import('../rendering/arena.js').then(({loadArena})=>loadArena(map,[view.world.floor]))).then(arena=>{
      if(disposed){arena?.userData.cycleRace.perimeterFloorShadows.dispose();arena?.userData.cycleRace.trailShadows.dispose();arena?.userData.cycleRace.wallShadows.dispose();arena?.userData.cycleRace.shadows.dispose();arena?.userData.arenaStyle.dispose();if(arena)disposeSceneResources(arena);return;}
      loadingTimings.sync('Attach arena / floor',()=>view.attachArena(arena));session.arenaReady=true;
      loadingTimings.checkpoint('Arena assets ready');loadingTimings.print();
    }).catch(error=>{if(!disposed)fail('Unable to load the cycle arena. Please reload to retry. '+error.message);});
    return arenaLoad;
  }
  let mouseWasLocked = false;
  let inspectWasPaused = false;
  const GUNNER_WHEEL = { threshold: 40, intervalMs: 180, resetMs: 250 };
  let zoomWheelDelta = 0,
    zoomWheelTime = -Infinity,
    zoomWheelStep = -Infinity;
  const keys = inputController.keys,
    frameTimes = [];
  const listen = inputController.listen.bind(inputController);

  function clearMouseAim() {
    inputController.mouseTarget = null;
    if (view) {
      view.cameraRig.mouseLook = null;
      view.mouseTarget = null;
    }
    run.mouseAim = null;
    run.gunnerYawMotion = run.gunnerPitchMotion = 0;
    run.turretHeading = run.yaw + run.turretYaw;
  }
  function releaseMouse() {
    if (document.pointerLockElement === $('game')) document.exitPointerLock();
  }
  function captureMouse() {
    try {
      $('game')
        .requestPointerLock()
        ?.catch(() => {});
    } catch {}
  }
  function setMode(next) {
    if (!['loading', 'ready', 'entering', 'running', 'paused', 'error'].includes(next))
      throw new Error(`Unknown application mode: ${next}`);
    mode = next;
    if(['ready','error'].includes(next)){document.body.classList.remove('cycle-intro','cycle-loading','home-access');$('tuning').hidden=true;}
    if (next !== 'running') {
      clearMouseAim();
      releaseMouse();
    }
    idleTime = 0;
    loop.resetAccumulator();
    inputController.clearKeys();
    inputController.mouseFire = false;
    inputController.fireQueued = false;
    if (next !== 'running') sound.silence();
    $('overlay').hidden = next === 'running';
    $('loading').hidden = next !== 'loading';
    if (!view?.cameraRig.freeCamera.active) $('free-camera-help').hidden = true;
    $('intro').hidden = !['ready', 'entering'].includes(next);
    $('paused').hidden = next !== 'paused';
    $('error').hidden = next !== 'error';
    $('hud').hidden = !['running', 'paused'].includes(next);
    $('pause').hidden = next !== 'running';
    $('footer').hidden = next !== 'ready';
    document.body.classList.toggle('playing', next === 'running');
    document.body.classList.toggle('terminal', ['ready', 'entering', 'error'].includes(next));
    document.body.classList.toggle('entering', next === 'entering');
    document.body.classList.toggle('paused', next === 'paused');
    if (next === 'running') document.body.classList.remove('detached');
    if (next === 'paused') $('paused').focus({ preventScroll: true });
  }

  const homeTransition=createHomeTransition();
  const mcpPanel=createMcpPanel({onClose:()=>{homeTransition.clear();$('start-mcp').focus();},onLaunch:async(game,overlay)=>{
    if(mobileTerminal&&game==='space')return;
    homeTransition.clear();selectGame(game);windowFocused=true;window.focus();
    await start(overlay);await homeTransition.finish();
  }});
  async function start(directOverlay=null) {
    if(homeTransition.active||mobileTerminal&&selectedGame==='space')return;
    const homeSelection=mode==='ready'&&!endingStage;
    if(homeSelection){
      void sound.unlock().catch(e=>console.warn('Audio unavailable; continuing silently.',e.message));
      if(directOverlay)homeTransition.beginDirect(directOverlay);
      else {sound.terminalTone('access');
      await homeTransition.begin(document.querySelector('#game-menu [aria-pressed="true"]'),{waitForScene:selectedGame==='space'||cycleGame(),preparedScene:selectedGame==='space'||cycleGame(),coverUntilSceneReady:cycleGame(),keepCovered:['mcp','credits','bit'].includes(selectedGame)});}
      if(disposed)return;
    }
    if(mode==='ready'&&selectedGame==='credits'){
      void sound.unlock().catch(e=>console.warn('Audio unavailable; continuing silently.',e.message));
      outroFade=0;startVictoryCredits();void homeTransition.finish();return;
    }
    if(mode==='ready'&&selectedGame==='mcp'){
      sound.silence();mcpPanel.open();void homeTransition.finish();
      return;
    }
    if(mode==='ready'&&selectedGame==='bit'){
      try{sessionStorage.setItem('tron-home-transition',document.querySelector('#home-transition').outerHTML);}catch{}
      window.location.assign(new URL('./bit/index.html',document.baseURI).href);
      return;
    }
    if (mode === 'entering') return;
    const fromTerminal = mode === 'ready',
      opening = fromTerminal && !(cycleGame() && run.cycleRace);
    // Request both context and media playback before yielding the Return gesture.
    let audioReady;
    try {
      audioReady = sound
        .unlock()
        .catch((e) => console.warn('Audio unavailable; continuing silently.', e.message));
    } catch (e) {
      console.warn('Audio unavailable; continuing silently.', e.message);
    }
    if (disposed || mode === 'error') return;
    // Remove the selected-label curtain after its scene-ready fade completes.
    if(homeSelection)void homeTransition.finish();
    // Queue UI feedback before the expensive simulation/model reset.
    if(fromTerminal&&!homeSelection)sound.terminalTone('access');
    tribute.reset();
    victoryPrinter.reset();endingStage=null;document.body.classList.remove('victory','victory-credits');
    const accessMessage=selectedGame==='space'?cluAccessMessage:openingMessage;
    $('terminal-text').textContent=accessMessage;
    $('terminal-text').parentElement.setAttribute('aria-label',accessMessage.replaceAll('\n','. '));
    outroFade = 0;
    controlsFirstKey = null;
    idleReminderArmed = false;
    deathElapsed = 0;
    $('death-fade').hidden = true;
    jev.resetScheduling();
    autoplay.reset();
    loadingTimings.checkpoint('Start requested');
    // Home already owns a fresh simulation; rebuilding it here consumes the fade.
    const freshHomeRun=homeSelection&&run.time===0&&!run.crushed&&!run.won;
    if(!freshHomeRun)run = loadingTimings.sync('New game simulation reset',()=>session.reset(browserRunSeed(location)));
    playTracker.reset();
    run.speed = config.maxSpeed;
    if(selectedGame==='multiplayer'){
      try{
        const [{MultiplayerClient}]=await Promise.all([import('../multiplayer/client.js'),loadArenaInBackground()]);
        multiplayer?.close();multiplayer=new MultiplayerClient();await multiplayer.connect();
        if(disposed){multiplayer.close();return;}
        multiplayer.apply(run);run.projectiles=[];run.transferActive=false;inputController.clear();
        view.reset();view.cameraRig.opening=null;view.cameraRig.cycleOpening=null;
      }catch(error){multiplayer?.close();multiplayer=null;homeTransition.clear();fail(error.message+' — RETURN HOME AND TRY AGAIN.');return;}
    }else if(selectedGame==='cycles'&&run.cycleRace)session.requestCycleEntry({entranceFormation:!testCycleStart,startOutside:testCycleStart&&CYCLE_TESTING.startOutsideArena,startWithBreach:testCycleStart&&CYCLE_TESTING.startWithBreach,hideMiddleOpponent:testCycleStart&&CYCLE_TESTING.hideMiddleOpponent});
    else startPursuit(run);
    if(selectedGame==='cycles'&&!testCycleStart&&run.cycleRace)run.cycleRace.aiMode='bounded';
    if(import.meta.env.DEV&&selectedGame==='cycles'&&new URLSearchParams(location.search).get('cycleAITrial')==='1'){
      const {applyCycleAITrial}=await import('./cycle-ai-trial.js');
      await applyCycleAITrial(run.cycleRace);
    }
    loadArenaInBackground();
    run.cruiseThrottle = true;
    session.previous = { ...run };
    if(!freshHomeRun)view.reset();
    sound.reset();
    if(opening)sound.prepareMusic();
    view.cameraRig.aerial = false;
    view.cameraRig.aerialZoom = 1;
    openingTime=0;openingTransition=false;accessHoldTime=0;
    document.body.classList.remove('access-transition','access-ready');
    accessPrinter.reset();
    if(opening&&!homeSelection)accessPrinter.start();
    view.cameraRig.opening = null;
    document.body.classList.toggle('cycle-intro',selectedGame==='cycles'&&!testCycleStart);
    document.body.classList.toggle('cycle-loading',selectedGame==='cycles');
    document.body.style.setProperty('--opening-fade', '1');
    setMode(opening ? 'entering' : 'running');
    if(homeSelection){
      if(opening){document.body.classList.add('home-access');accessHoldTime=accessHoldSeconds;beginCluGame();}
    }
    if(!opening&&!run.arenaWaiting)sound.startMusic();
    await audioReady;
  }
  function pause() {
    if (mode === 'running' || mode === 'entering') {
      pausedFrom = mode;
      setMode('paused');
    }
  }
  async function resume() {
    if (mode !== 'paused' || exitConfirm.open) return;
    setMode(pausedFrom);
    const audioReady = sound.unlock().catch(() => {});
    sound.resumeMusic();
    await audioReady;
    if (!['running', 'entering'].includes(mode)) sound.silence();
  }
  function mute() {
    sound.muted = !sound.muted;
    $('sound').textContent = sound.muted ? 'SOUND OFF' : 'SOUND ON';
    $('sound').setAttribute('aria-label', sound.muted ? 'Unmute sound' : 'Mute sound');
  }
  function fail(message) {
    if(window.tronRecoverModuleFailure?.(message))return;
    $('error-title').textContent=/MULTIPLAYER/i.test(message)?'MULTIPLAYER UNAVAILABLE':'PROGRAM UNAVAILABLE';
    $('error-message').textContent = /(?:importing a module script failed|failed to fetch dynamically imported module|loading chunk|module script|preload.*(?:css|module))/i.test(message)
      ? 'PROGRAM FILES COULD NOT LOAD. RELOAD TO CHECK FOR AN UPDATE.' : message;
    setMode('error');
    $('error-home').focus({preventScroll:true});
  }

  listen($('error-home'),'click',()=>view?.cameraRig?returnToProgramSelection():location.assign('./'));

  const exitConfirm=window.createExitConfirm({
    muted:()=>sound.muted,
    onConfirm:()=>{setAutoplay(false);returnToProgramSelection();},
    onCancel:()=>{void resume();},
  });
  const touchControls=mobileTerminal?new CycleTouchControls({
    onTurn:direction=>{idleTime=0;if(run.cycleSpectating)followCycle(direction);else inputController.queueCycleTurn(direction,run.cycleRace?.pendingTurns.length??0);},
    onHeld:(turbo,brake)=>{for(const [key,held] of [['KeyW',turbo],['KeyS',brake]])held?inputController.touchKeys.add(key):inputController.touchKeys.delete(key);},
    onMenu:()=>{pause();$('paused').hidden=true;exitConfirm.show();},
    onHelp:()=>showControlsHelp(),
    onRestart:()=>{if(multiplayer){if(multiplayer.restart())inputController.clear();}else if(session.restartCycleMatch()){inputController.clear();view.cameraRig.reset();view.cameraRig.aerial=false;}},
  }):null;
  const gameChoices=[...document.querySelectorAll('#game-menu .game-choice')];
  function selectGame(game,{focus=false}={}){
    if(homeTransition.active||mobileTerminal&&game==='space')return;
    selectedGame=game;
    for(const button of gameChoices){
      const selected=button.dataset.game===game;
      button.setAttribute('aria-pressed',String(selected));
      if(selected&&focus)button.focus({preventScroll:true});
    }
  }
  for(const button of gameChoices){
    listen(button,'focus',()=>selectGame(button.dataset.game));
    listen(button,'pointerenter',event=>{if(event.pointerType==='mouse'&&mode==='ready'&&!endingStage&&!button.disabled)selectGame(button.dataset.game);});
    listen(button,'pointerdown',event=>{if(event.isPrimary&&event.button===0&&mode==='ready'&&!endingStage&&!button.disabled)selectGame(button.dataset.game);});
    listen(button,'click',()=>{if(!button.disabled&&mode==='ready'&&!endingStage){selectGame(button.dataset.game);void start();}});
  }
  selectGame(selectedGame);
  listen(window,'click',event=>{
    if(homeTransition.active){event.preventDefault();event.stopImmediatePropagation();return;}
    if(mode==='entering'&&!openingTransition){event.preventDefault();event.stopImmediatePropagation();beginCluGame();return;}
    if(!creditsVisible())return;
    event.preventDefault();event.stopImmediatePropagation();returnToProgramSelection();
  },true);
  listen($('pause'), 'click', pause);
  listen($('sound'), 'click', mute);
  let controlsHelpOpen=false,suppressHelpClickUntil=0;
  const dismissedHelpKeys=new Set();
  function showControlsHelp(){
    const cycle=run.playerVehicle==='cycle',road=cycle&&run.cycleRace.cycles[run.cycleRace.playerId].escaped;
    const groups=cycle?[
      ['DRIVING',...(road?['W OR UP / ACCELERATE + TURBO','A/D OR ARROWS / STEER','S OR DOWN / BRAKE / REVERSE']:['A/D OR LEFT/RIGHT / TURN','W OR UP / TURBO','S OR DOWN / BRAKE'])],
      ['CAMERA','P / FIRST PERSON','J/L / GLANCE','I/K / ZOOM','V / AERIAL'],
      ['AFTER DEATH','LEFT/RIGHT / FOLLOW CYCLES','ENTER / RESTART'],
      ['RENDERING','SHIFT-R / NORMAL OR POV-RAY CYCLES'],
    ]:[
      ['DRIVING','WASD OR ARROWS / DRIVE','SHIFT-W OR SHIFT-UP / CRUISE','W/S OR UP/DOWN / CANCEL CRUISE','T / TURBO'],
      ['WEAPONS','J/L / TURRET','F OR J+L / CENTER + LEVEL','SPACE / FIRE','I/K / GUNNER AIM'],
      ['CAMERA','P / GUNNER VIEW','O / GUNNER ZOOM','V / AERIAL','I/K / AERIAL ZOOM'],
    ];
    if(cycle&&selectedGame==='multiplayer')groups.push(
      ['ROSTER','COLORED GROUPS / TEAMS','FILLED CIRCLE / ACTIVE CYCLE','EMPTY COLORED CIRCLE / ELIMINATED CYCLE','WHITE OUTLINE / YOUR CYCLE','GRAY CIRCLES AT LEFT / PLAYERS WAITING TO JOIN','DOTS BELOW / WALL KILLS','HOLLOW DOTS / TRAP ASSISTS','DOT COLOR / OPPONENT TEAM'],
      ['HUMAN PLAYERS','BLACK + WHITE DIAGONAL SLASH / HUMAN PLAYER','MARKED ON BOTH THE CYCLE AND ITS ROSTER CIRCLE'],
    );
    if(cycle&&mobileTerminal)groups.unshift(['TOUCH CONTROLS','TAP LEFT / RIGHT EDGE / TURN OR FOLLOW','HOLD TOP EDGE / TURBO','HOLD BOTTOM EDGE / BRAKE','MENU / EXIT CONFIRMATION','NEW MATCH / RESTART WHEN AVAILABLE']);
    groups.push(['GAME',mobileTerminal?'MENU / HOME':'ESC / HOME']);
    $('controls-help-text').textContent=groups.map(group=>group.join('\n')).join('\n\n');
    pause();inputController.clear();releaseMouse();
    controlsHelpOpen=true;$('paused').hidden=true;$('controls-help').hidden=false;
  }
  function dismissControlsHelp(){
    controlsHelpOpen=false;$('controls-help').hidden=true;inputController.clear();void resume();
  }
  for(const type of ['pointerdown','click'])listen(window,type,event=>{
    if(type==='pointerdown'&&!controlsHelpOpen)suppressHelpClickUntil=0;
    if(type==='click'&&performance.now()<suppressHelpClickUntil){event.preventDefault();event.stopImmediatePropagation();return;}
    if(!controlsHelpOpen)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(type==='pointerdown')suppressHelpClickUntil=performance.now()+500;
    dismissControlsHelp();
  },true);
  listen(window,'keyup',event=>dismissedHelpKeys.delete(event.code));
  listen($('game'),'contextmenu',event=>{if(['running','entering'].includes(mode))event.preventDefault();});
  listen(window, 'keydown', (event) => {
    if(guardGameKey(event,['running','entering'].includes(mode))){inputController.clearKeys();return;}
    if(homeTransition.active){event.preventDefault();return;}
    idleTime = 0;
    if(dismissedHelpKeys.has(event.code)){event.preventDefault();return;}
    if(controlsHelpOpen){
      event.preventDefault();event.stopImmediatePropagation();
      if(!event.repeat){dismissedHelpKeys.add(event.code);dismissControlsHelp();}
      return;
    }
    if(event.code==='KeyY'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!exitConfirm.open&&!cycleTuning?.open&&(mode==='running'||mode==='entering'&&openingTransition)){
      event.preventDefault();if(!event.repeat)showControlsHelp();return;
    }
    if(event.code==='Escape'&&!$('tuning').hidden){event.preventDefault();$('tuning').hidden=true;return;}
    if(exitConfirm.open)return;
    if(event.code==='Escape'&&['running','entering','paused'].includes(mode)){
      event.preventDefault();
      if(!event.repeat){pause();if(cycleTuning?.open)cycleTuning.dialog.close();$('paused').hidden=true;exitConfirm.show();}
      return;
    }
    if(mode==='error'&&selectedGame==='multiplayer'&&event.code==='Escape'){event.preventDefault();returnToProgramSelection();return;}
    if (mode === 'loading') return;
    if(mode==='entering'&&!openingTransition){event.preventDefault();if(!event.repeat)beginCluGame();return;}
    if(creditsVisible()){
      event.preventDefault();
      if(!event.repeat){
        if(event.code==='Space')tribute.next();
        else if(['Escape','Enter','NumpadEnter'].includes(event.code))returnToProgramSelection();
      }
      return;
    }
    if(mode==='ready'&&!endingStage&&!document.body.classList.contains('detached')&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(event.code)){
      event.preventDefault();
      if(!event.repeat){
        if(event.code==='Enter')void start();
        else {
          const direction=['ArrowUp','ArrowLeft'].includes(event.code)?-1:1;
          const available=gameChoices.filter(button=>!button.disabled);
          const index=available.findIndex(button=>button.dataset.game===selectedGame);
          if(available.length)selectGame(available[(index+direction+available.length)%available.length].dataset.game,{focus:true});
        }
      }
      return;
    }
    if(event.code==='KeyR'&&event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&run.playerVehicle==='cycle'&&['running','entering','paused'].includes(mode)){
      event.preventDefault();if(!event.repeat)void cycleRendererControl.toggle();return;
    }
    if(mode==='running'&&(run.arenaWaiting||view.cameraRig.cycleOpening!==null)&&event.code!=='Escape'){event.preventDefault();return;}
    if(run.cycleSpectating&&['ArrowLeft','ArrowRight'].includes(event.code)){
      event.preventDefault();if(!event.repeat)followCycle(event.code==='ArrowLeft'?-1:1);return;
    }
    if(cycleTuning?.open)return;
    if(!multiplayer&&event.code==='Tab'&&cycleTuning&&run.playerVehicle==='cycle'&&['running','paused'].includes(mode)){
      event.preventDefault();if(!event.repeat)cycleTuning.show();return;
    }
    if(multiplayer&&['Enter','NumpadEnter'].includes(event.code)&&mode==='running'){
      event.preventDefault();if(!event.repeat&&multiplayer.restart())inputController.clear();return;
    }
    if(!multiplayer&&event.code==='Enter'&&!event.repeat&&run.playerVehicle==='cycle'&&session.restartCycleMatch()){
      event.preventDefault();inputController.clear();view.cameraRig.reset();view.cameraRig.aerial=false;
      if(mode==='paused')resume();return;
    }
    if (view?.cameraRig.freeCamera.active) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      if (event.code === 'Escape') { if (!event.repeat) toggleInspection(); }
      else if (event.code === 'Space') {
        if (!event.repeat) {
          if (mode === 'paused') resume(); else pause();
          $('overlay').hidden = true;
          $('free-camera-help').hidden = false;
        }
      }
      else if (event.code === 'Home' && view.arena) {
        const camera = view.camera;
        camera.position.copy(view.arena.position).add({ x: 700, y: 1000, z: 950 });
        camera.lookAt(view.arena.position);
        view.cameraRig.freeCamera.rotation.setFromQuaternion(camera.quaternion, 'YXZ');
      } else keys.add(event.code);
      return;
    }
    if(event.code==='KeyN'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&['running','entering','paused'].includes(mode)){
      event.preventDefault();
      if(!event.repeat)setJevEnabled(config.aiMode!=='jev');
      return;
    }
    // Temporary victory-preview shortcut; remove after end-screen review.
    if(event.code==='Digit8'&&event.shiftKey&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&view&&mode!=='error'){
      event.preventDefault();
      if(!event.repeat&&endingStage!=='victory'){
        run.won=true;run.crushed=false;run.speed=0;
        showVictoryScreen();
      }
      return;
    }
    if (
      CLU_AUTOPLAY_ENABLED && event.code === 'KeyU' && run.playerVehicle!=='cycle' &&
      !event.repeat &&
      ['running', 'entering', 'paused'].includes(mode)
    ) {
      event.preventDefault();
      setAutoplay(event.shiftKey ? !(autoplay.enabled && autoplay.manualFire) : !autoplay.enabled, event.shiftKey);
      return;
    }
    if (
      event.code === 'KeyB' && event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      view &&
      ['running', 'entering', 'paused'].includes(mode)
    ) {
      event.preventDefault();
      if (!event.repeat) saveScreenshot(view, $('game'));
      return;
    }
    if (['running', 'entering'].includes(mode) && !event.repeat) noteControlKey();
    if (mode === 'ready') sound.unlock().catch(() => {});
    if (mode === 'paused') {
      event.preventDefault();
      if(multiplayer)return;
      if (!event.repeat) {
        resume();
        if (['KeyW','ArrowUp'].includes(event.code)) run.cruiseThrottle = event.shiftKey;
        if (
          ['running', 'entering'].includes(mode) &&
          [
            'KeyW',
            'KeyA',
            'KeyS',
            'KeyD',
            'ArrowUp',
            'ArrowDown',
            'ArrowLeft',
            'ArrowRight',
            'KeyI',
            'KeyJ',
            'KeyK',
            'KeyL',
          ].includes(event.code)
        )
          keys.add(event.code);
      }
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    const key = event.code;
    if(run.playerVehicle==='cycle'&&!view.cameraRig.freeCamera.active&&['running','entering'].includes(mode)){
      if(['KeyW','ArrowUp','KeyS','ArrowDown'].includes(key)){
        event.preventDefault();keys.add(key);
        if(!event.repeat){
          if(['KeyS','ArrowDown'].includes(key)&&run.cycleRace.cycles[run.cycleRace.playerId].escaped)inputController.cycleReverseQueued=Math.abs(run.cycleRace.cycles[run.cycleRace.playerId].roadSpeed)<.01;
        }
        return;
      }
      if(['KeyA','ArrowLeft','KeyD','ArrowRight'].includes(key)){
        event.preventDefault();keys.add(key);if(!event.repeat)inputController.queueCycleTurn(['KeyA','ArrowLeft'].includes(key)?-1:1,run.cycleRace?.pendingTurns.length??0);return;
      }
      if(key==='KeyP'){event.preventDefault();if(!event.repeat&&!run.cycleSpectating&&run.cycleRace?.cycles[run.cycleRace.playerId]?.alive){view.cameraRig.cycleFirstPerson=!view.cameraRig.cycleFirstPerson;view.cameraRig.aerial=false;}return;}
      if(['KeyF','KeyO','KeyX','KeyT','Space'].includes(key)){event.preventDefault();return;}
    }
    if (
      !event.repeat &&
      ['KeyI', 'KeyJ', 'KeyK', 'KeyL'].includes(key) &&
      ['running', 'entering'].includes(mode)
    )
      clearMouseAim();
    if (['KeyW','ArrowUp'].includes(key) && !event.repeat && ['running', 'entering'].includes(mode)) {
      run.cruiseThrottle = event.shiftKey ? true : false;
    }
    if (!event.repeat && ['running', 'entering'].includes(mode) && key === 'KeyP') {
      view.cameraRig.beamCamera.cancel();
      if (mode === 'entering') finishOpening();
      run.gunner = !run.gunner;
      clearMouseAim();
      if (!run.gunner) releaseMouse();
      view.cameraRig.aerial = false;
      view.cameraRig.freshCamera = view.cameraRig.reducedMotion;
      return;
    }
    if (!event.repeat && ['running', 'entering'].includes(mode) && key === 'KeyO' && run.gunner) {
      run.gunnerZoom =
        run.gunnerZoom + 1 < GUNNER.fovs.length ? run.gunnerZoom + 1 : GUNNER.minZoom;
      return;
    }
    if (
      ['running', 'entering'].includes(mode) &&
      ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
    )
      event.preventDefault();
    if (key === 'Tab' && mode === 'running') {
      event.preventDefault();
      if (!event.repeat) showSurvey = !showSurvey;
      return;
    }
    if (event.repeat) return;
    const centerChord=run.playerVehicle!=='cycle'&&((key==='KeyJ'&&keys.has('KeyL'))||(key==='KeyL'&&keys.has('KeyJ')));
    if ((key === 'KeyF'||centerChord) && ['running', 'entering'].includes(mode)) {
      if(centerChord){event.preventDefault();keys.add(key);inputController.turretCenterChord=true;}
      clearMouseAim();
      run.gunnerLeveling = true;
      run.turretCentering = true;
      run.turretLocked = true;
      return;
    }
    if (key === 'KeyV' && ['running','entering'].includes(mode)) {
      if(event.repeat)return;
      if(mode==='entering')finishOpening();
      view.cameraRig.beamCamera.cancel();
      run.gunner = false;
      clearMouseAim();
      releaseMouse();
      view.cameraRig.aerial = !view.cameraRig.aerial;
      if(view.cameraRig.aerial&&view.cameraRig.aerialZoom<=AERIAL_ZOOM.minScale+1e-6)view.cameraRig.aerialZoom=1;
      view.cameraRig.freshCamera = view.cameraRig.reducedMotion;
      return;
    }
    if (key === 'Enter' && mode === 'ready') {
      event.preventDefault();
      if(event.repeat)return;
      if(endingStage==='victory'){startVictoryCredits();return;}
      terminal.done ? start() : terminal.finish();
      return;
    }
    if (mode === 'entering' && key === 'Enter') {
      event.preventDefault();
      finishOpening();
      return;
    }
    if (key === 'Escape') {
      ['running', 'entering'].includes(mode) ? pause() : resume();
      return;
    }
    if (key === 'KeyT') {
      if (event.shiftKey && developmentTuningEnabled) {
        event.preventDefault();
        if(!event.repeat)$('tuning').hidden = !$('tuning').hidden;
        return;
      }
      if (['running', 'entering'].includes(mode)) boostTank(run);
      return;
    }
    if (['running', 'entering'].includes(mode)) {
      if (key === 'Space') inputController.fireQueued = true;
      if (['KeyS', 'ArrowDown'].includes(key)) run.cruiseThrottle = false;
      keys.add(key);
    }
  });
  function followCycle(direction=1) {
    const survivors=run.cycleRace.cycles.filter(b=>b.alive);
    const index=survivors.findIndex(b=>b.id===run.cycleFollowId);
    run.cycleFollowId=survivors.length?survivors[(index<0?(direction<0?survivors.length-1:0):(index+direction+survivors.length)%survivors.length)].id:null;
    if(view.cameraRig.freeCamera.active)view.cameraRig.freeCamera.exit();
    inputController.clear();
  }
  function syncCycleSpectator() {
    if(run.playerVehicle!=='cycle')return;
    if(multiplayer){if(run.cycleSpectating&&run.cycleFollowId!=null&&!run.cycleRace.cycles[run.cycleFollowId]?.alive)followCycle();return;}
    const dead=!run.cycleRace.cycles[run.cycleRace.playerId].alive;
    if(run.cycleSpectating&&(!dead||run.won||run.crushed)){
      if(view.cameraRig.freeCamera.active)view.cameraRig.freeCamera.exit();
      run.cycleSpectating=false;run.cycleFollowId=null;run.inspection=false;inputController.clear();
    }else if(dead&&!run.won&&!run.crushed&&!run.cycleSpectating){
      run.cycleSpectating=true;run.inspection=false;inspectWasPaused=false;
      inputController.clear();releaseMouse();clearMouseAim();run.cycleFollowId=null;
      if(view.cameraRig.freeCamera.active)view.cameraRig.freeCamera.exit();
    }
    if(run.cycleSpectating){
      if(run.cycleFollowId!=null&&!run.cycleRace.cycles.some(b=>b.alive&&b.id===run.cycleFollowId)&&view.cameraRig.cycleDeathHold?.id===run.cycleFollowId&&view.cameraRig.cycleDeathHold.elapsed>=CYCLE_DEATH_HOLD_SECONDS)followCycle();
      $('free-camera-help').hidden=true;
    }
  }
  function toggleInspection() {
    const camera = view.cameraRig.freeCamera;
    if (camera.active) {
      camera.exit();
      run.inspection = false;
      inputController.clearKeys();
      $('free-camera-help').hidden = true;
      if (inspectWasPaused) setMode('paused');
      else if (mode === 'paused') resume();
    } else {
      inspectWasPaused = mode === 'paused';
      if(!run.cycleSpectating)pause();
      camera.enter({spectator:!!run.cycleSpectating});
      run.inspection = !run.cycleSpectating;
      deathElapsed = 0;
      sound.fadeMusic(0);
      $('overlay').hidden = true;
      $('free-camera-help').hidden = false;
      if(!run.cycleSpectating)$('free-camera-help').textContent='FREE CAMERA · WASD move · Q/E down/up · drag / arrows look · Shift fast · Home arena · Space run/pause · C / Esc return';
    }
  }
  function setJevEnabled(enabled) {
    config.aiMode=enabled?'jev':'local';
    session.configure('vehicle',{aiMode:config.aiMode});
    jev.resetScheduling();
    if(!enabled&&autoplay.enabled)setAutoplay(false);
    if(import.meta.env.DEV)$('enemy-ai').value=config.aiMode;
    try{localStorage.setItem('tron-enemy-ai',JSON.stringify({version:AI_PREFERENCE_VERSION,mode:config.aiMode,small:config.aiSmallEncounter}));}catch{}
  }
  function setAutoplay(enabled, manualFire = false) {
    enabled=enabled&&CLU_AUTOPLAY_ENABLED;
    if(enabled&&config.aiMode!=='jev')setJevEnabled(true);
    autoplay.setEnabled(enabled, {manualFire});
    jev.resetScheduling();
    run.cruiseThrottle = false;
    inputController.clearKeys();
    inputController.mouseFire = false;
    inputController.fireQueued = false;
    clearMouseAim();
    if (enabled) {
      run.gunner = false;
      run.turretLocked = false;
      run.turretCentering = false;
      releaseMouse();
    }
  }
  listen($('autoplay-toggle'), 'click', () => setAutoplay(!autoplay.enabled));
  listen(window, 'keyup', (e) => {
    idleTime = 0;
    inputController.release(e.code);
    if(run.playerVehicle!=='cycle'&&['KeyW','ArrowUp'].includes(e.code)&&!keys.has('KeyW')&&!keys.has('ArrowUp'))stopTankTurbo(run);
  });
  listen($('game'), 'pointerdown', (e) => {
    idleTime = 0;
    if (view?.cameraRig.freeCamera.active) return;
    if (run.gunner && !GUNNER.mouseEnabled) return;
    if ((mode === 'running'||mode==='entering'&&openingTransition) && e.button === 0) {
      if (run.gunner && document.pointerLockElement !== $('game')) {
        captureMouse();
        return;
      }
      inputController.mouseFire = true;
      inputController.fireQueued = true;
    }
  });
  listen(document, 'mousemove', (event) => {
    if(run.cycleSpectating&&['ArrowLeft','ArrowRight'].includes(event.code)){
      event.preventDefault();if(!event.repeat)followCycle(event.code==='ArrowLeft'?-1:1);return;
    }
    if(cycleTuning?.open)return;
    if (view?.cameraRig.freeCamera.active) {
      if (event.buttons === 1) view.cameraRig.freeCamera.look(event.movementX, event.movementY);
      return;
    }
    if (
      !GUNNER.mouseEnabled ||
      mode !== 'running' ||
      !run.gunner ||
      run.crushed ||
      document.pointerLockElement !== $('game')
    )
      return;
    if (!event.movementX && !event.movementY) return;
    view.cameraRig.moveMouseAim(event.movementX, event.movementY, run);
    idleTime = 0;
  });
  listen(document, 'pointerlockchange', () => {
    const locked = document.pointerLockElement === $('game');
    if (mouseWasLocked && !locked) {
      clearMouseAim();
      inputController.mouseFire = false;
      inputController.fireQueued = false;
      if (!autoplay.enabled && run.gunner && !run.crushed && mode === 'running') pause();
    }
    mouseWasLocked = locked;
  });
  listen(
    $('game'),
    'wheel',
    (event) => {
      if (view?.cameraRig.freeCamera.active) { event.preventDefault(); return; }
      if (run.gunner && !GUNNER.mouseEnabled) {
        event.preventDefault();
        return;
      }
      if (!(view?.cameraRig.aerial || run.gunner) || !['running', 'paused'].includes(mode) || event.ctrlKey)
        return;
      event.preventDefault();
      idleTime = 0;
      const pixels =
        event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (run.gunner) {
        const now = performance.now();
        if (
          now - zoomWheelTime > GUNNER_WHEEL.resetMs ||
          Math.sign(pixels) !== Math.sign(zoomWheelDelta)
        )
          zoomWheelDelta = 0;
        zoomWheelTime = now;
        zoomWheelDelta += pixels;
        if (
          Math.abs(zoomWheelDelta) >= GUNNER_WHEEL.threshold &&
          now - zoomWheelStep >= GUNNER_WHEEL.intervalMs
        ) {
          run.gunnerZoom = Math.max(
            GUNNER.minZoom,
            Math.min(GUNNER.fovs.length - 1, run.gunnerZoom - Math.sign(zoomWheelDelta)),
          );
          zoomWheelDelta = 0;
          zoomWheelStep = now;
        }
        return;
      }
      view.cameraRig.aerialZoom = Math.max(
        AERIAL_ZOOM.minScale,
        Math.min(
          AERIAL_ZOOM.maxScale,
          view.cameraRig.aerialZoom * Math.exp(Math.max(-600, Math.min(600, pixels)) * AERIAL_ZOOM.wheelExponentPerPixel),
        ),
      );
    },
    { passive: false },
  );
  listen(window, 'pointerup', () => {
    inputController.mouseFire = false;
  });
  listen(window, 'blur', () => {
    windowFocused = false;
    inputController.clearKeys();
    inputController.mouseFire = false;
    inputController.fireQueued = false;
    clearMouseAim();
    if (!autoplay.enabled&&!multiplayer) pause();
  });
  listen(window, 'focus', () => {
    windowFocused = true;
  });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) {
      inputController.clearKeys();
      inputController.mouseFire = false;
      inputController.fireQueued = false;
      clearMouseAim();
      if (!autoplay.enabled&&!multiplayer) pause();
    }
    if (view && !disposed) {
      loop.reschedule();
    }
  });
  listen(window, 'resize', () => view?.resize());
  listen($('game'), 'webglcontextlost', (event) => {
    event.preventDefault();
    fail('The graphics connection was interrupted. Reload to reconnect.');
  });

  const hud = new HudPresenter(map, systemWarnings);

  function showVictoryScreen(){
    endingStage='victory';tribute.reset();outroFade=0;
    view.cameraRig.opening=null;
    document.body.style.setProperty('--opening-fade','1');
    document.body.classList.remove('detached','victory-credits');
    document.body.classList.add('victory');
    setMode('ready');sound.reset();jev.resetScheduling();
    $('terminal-text').parentElement.setAttribute('aria-label',victoryText.trimEnd());
    victoryPrinter.start();$('death-fade').hidden=true;
  }

  function creditsVisible(){
    return mode==='ready'&&(endingStage==='credits'||document.body.classList.contains('detached'));
  }
  function returnToProgramSelection(){
    multiplayer?.close();multiplayer=null;
    sound.reset();tribute.reset();victoryPrinter.reset();accessPrinter.reset();
    jev.resetScheduling();autoplay.reset();inputController.clear();releaseMouse();
    run=session.reset(browserRunSeed(location));view.reset();view.cameraRig.opening=null;
    document.body.classList.remove('detached','victory','victory-credits');endingStage=null;
    $('terminal-text').textContent=openingMessage;
    $('terminal-text').parentElement.setAttribute('aria-label',openingMessage.replaceAll('\n','. '));
    deathElapsed=0;outroFade=0;openingTransition=false;openingTime=0;accessHoldTime=0;
    document.body.classList.remove('access-transition','access-ready');
    $('death-fade').hidden=true;
    selectGame(selectedGame);setMode('ready');
  }

  function startVictoryCredits(){
    endingStage='credits';victoryPrinter.reset();
    document.body.classList.remove('victory');document.body.classList.add('detached','victory-credits');
    $('terminal-text').textContent='';$('terminal-text').parentElement.setAttribute('aria-label','');
    sound.startMusic('terminal');tribute.start(view.cameraRig.reducedMotion);
  }

  function updateDeathTerminal(dt) {
    const fade = $('death-fade');
    if (view.cameraRig.freeCamera.active) { deathElapsed = 0; fade.hidden = true; return; }
    if(mode==='ready'&&endingStage==='victory'){victoryPrinter.update();return;}
    if (mode === 'ready' && (run.crushed||endingStage==='credits')) {
      const music = sound.musicDirector.music;
      const signOffReady =
        sound.musicDirector.musicMode === 'terminal' &&
        (music?.ended ||
          (Number.isFinite(music?.duration) && music.currentTime >= music.duration - 5) ||
          !!sound.musicDirector.musicError);
      if (tribute.update(dt, signOffReady)) sound.endOfLine();
      tribute.preview.update(tribute,dt);
      if (!tribute.active && tribute.phase === 'signoff') {
        outroFade += dt;
        fade.hidden = false;
        fade.style.opacity = String(Math.min(1, outroFade / 5));
        if (outroFade >= 5) {
          returnToProgramSelection();
          $('terminal-text').parentElement.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: 500,
          });
        }
      }
      return;
    }
    if (!run.crushed&&!run.won) {
      deathElapsed = 0;
      fade.hidden = true;
      return;
    }
    if (!['running', 'entering'].includes(mode)) return;
    if(deathElapsed===0)deathHoldSeconds=livingCluKiller(run)?CLU_DEATH_CAMERA.holdSeconds:DEATH_TERMINAL.holdSeconds;
    deathElapsed += dt;
    sound.fadeMusic(deathElapsed / (deathHoldSeconds + DEATH_TERMINAL.fadeSeconds));
    const amount = Math.max(
      0,
      Math.min(1, (deathElapsed - deathHoldSeconds) / DEATH_TERMINAL.fadeSeconds),
    );
    fade.hidden = amount === 0;
    fade.style.opacity = String(amount);
    if (amount < 1) return;
    view.cameraRig.opening = null;
    document.body.style.setProperty('--opening-fade', '1');
    if(run.won){
      showVictoryScreen();return;
    }
    $('terminal-text').textContent = DEATH_TERMINAL.message;
    const copy = $('terminal-text').parentElement;
    copy.setAttribute('aria-label', DEATH_TERMINAL.message.replace('\n', '. '));
    document.body.classList.add('detached');
    setMode('ready');
    sound.startMusic('terminal');
    tribute.start(view.cameraRig.reducedMotion);
    fade.hidden = true;
    copy.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: view.cameraRig.reducedMotion ? 0 : 500,
    });
  }

  function beginCluGame(){
    if(mode!=='entering'||accessPrinter.active||openingTransition||accessHoldTime<accessHoldSeconds)return;
    inputController.clear();
    run.speed=config.maxSpeed;run.cruiseThrottle=true;
    sound.unlock().catch(e=>console.warn('Audio unavailable; continuing silently.',e.message));
    sound.startMusic();
    document.body.classList.remove('access-ready');
    if(view.cameraRig.reducedMotion)finishOpening();
    else {openingTransition=true;openingTime=0;view.cameraRig.opening=0;document.body.classList.add('access-transition');}
  }
  function finishOpening() {
    const held = [...keys],
      firing = inputController.mouseFire,
      queued = inputController.fireQueued;
    view.cameraRig.opening = null;
    accessPrinter.reset();openingTransition=false;
    document.body.classList.remove('access-transition','access-ready');
    document.body.classList.remove('home-access');
    setMode('running');
    for (const key of held) keys.add(key);
    inputController.mouseFire = firing;
    inputController.fireQueued = queued;
  }

  function frame(dt, background) {
    if (disposed||mcpPanel.active) return;
    cycleRendererControl.update();
    // Optional scenery: all game modes can load it after active play begins.
    // Use local play time, not MP server age, so joining cannot stall the opening.
    if(mode==='running'&&!solarLoad){
      solarPlaySeconds+=dt;
      if(solarPlaySeconds>=SOLAR_SAILER.backgroundLoadSeconds)loadSolarInBackground();
    }
    if (run.crushed && run.mouseAim) clearMouseAim();
    if (!autoplay.enabled && !multiplayer && (document.hidden || !windowFocused)) pause();
    if (mode === 'running') idleTime = keys.size || inputController.mouseFire ? 0 : idleTime + dt;
    if (mode === 'entering') {
      if(openingTransition){
        openingTime+=dt;
        view.cameraRig.opening=Math.min(1,openingTime/openingDuration);
        document.body.style.setProperty('--opening-fade',String(Math.max(0,1-openingTime/terminalFadeSeconds)));
        if(openingTime>=openingDuration||view.cameraRig.reducedMotion)finishOpening();
      }else if(accessPrinter.active)accessPrinter.update();
      else {accessHoldTime+=dt;beginCluGame();}
    }

    if((mode==='running'||mode==='entering'&&openingTransition)&&!run.gunner&&view.cameraRig.cycleOpening===null&&!view.cameraRig.freeCamera.active&&(run.playerVehicle==='cycle'||view.cameraRig.aerial)){
      const direction=Number(keys.has('KeyK'))-Number(keys.has('KeyI'));
      const rig=view.cameraRig,field=rig.aerial?'aerialZoom':'followZoom',limits=rig.aerial?AERIAL_ZOOM:FOLLOW_ZOOM;
      rig[field]=Math.max(limits.minScale,Math.min(limits.maxScale,rig[field]*Math.exp(direction*dt*limits.keyboardExponentPerSecond)));
    }
    view.cameraRig.cycleGlanceInput = mode === 'running' && !view.cameraRig.freeCamera.active
      ? Number(keys.has('KeyL')) - Number(keys.has('KeyJ')) : 0;
    if(mode==='running'&&view.cameraRig.cycleOpening!==null&&(!sound.context||sound.cycleSamplesReady)){
      view.cameraRig.cycleOpening+=dt/CYCLE_OPENING.durationSeconds;
      if(view.cameraRig.cycleOpening>=1+CYCLE_OPENING.formationSeconds/CYCLE_OPENING.durationSeconds){
        run.cycleRace.remaining=0;
      }
      if(view.cameraRig.cycleOpening>=1+(CYCLE_OPENING.formationSeconds+CYCLE_OPENING.launchHoldSeconds)/CYCLE_OPENING.durationSeconds){
        view.cameraRig.finishCycleOpening();
        inputController.clear();
        document.body.classList.remove('cycle-intro');
      }
    }
    if(multiplayer){
      const command=mode==='running'&&windowFocused&&!document.hidden&&!run.cycleSpectating?inputController.command(run,{mouseLook:false,mouseTarget:null}):{};
      multiplayer.input(command);inputController.consume();session.previous={...run};multiplayer.apply(run);
    }
    if (!multiplayer&&(mode === 'running'||mode==='entering'&&openingTransition)) {
      if (frameTimes.length >= 3600) frameTimes.shift();
      if (dt > 0) frameTimes.push(dt * 1000);
      loop.advance(
        dt,
        background,
        () => !run.won && (view.cameraRig.cycleOpening===null||!sound.context||sound.cycleSamplesReady) && (mode === 'running' || mode === 'entering'),
        (fixedStep) => {
          let command = inputController.command(run, {
            mouseLook: view.cameraRig.mouseLook,
            mouseTarget: view.mouseTarget,
          });
          if (view.cameraRig.freeCamera.active) command = { ...command, cycleTurbo: false, cycleSlow: false, cycleRoad: {}, throttle: 0, steer: 0, fire: false, firePressed: false, mouseTarget: null, turret: 0, aimPitch: 0 };
          if (autoplay.enabled)
            command = mergeAutoplayInput(autoplay.input(run), command, view.cameraRig.freeCamera.active ? new Set() : keys, run);
          const events = session.advance(command, fixedStep, {holdCycleRace:view.cameraRig.cycleOpening!==null&&view.cameraRig.cycleOpening<1+CYCLE_OPENING.formationSeconds/CYCLE_OPENING.durationSeconds});
          inputController.consume();
          for (const event of events) {
            if(event.type==='cycleArrival'){loadingTimings.checkpoint('Player entered cycle arena');loadingTimings.print();}
            if(event.type==='cycleArrival'||event.type==='cycleRetry'){
              setAutoplay(false);inputController.clear();releaseMouse();clearMouseAim();view.cameraRig.reset();view.cameraRig.aerial=false;
              document.body.classList.remove('cycle-loading');
              if(event.type==='cycleArrival'&&document.body.classList.contains('cycle-intro')&&!view.cameraRig.reducedMotion){
                view.cameraRig.cycleOpening=CYCLE_OPENING.startSeconds/CYCLE_OPENING.durationSeconds;
                // Advance the patrol through the skipped opening with bounded steps.
                for(let remaining=CYCLE_OPENING.startSeconds;remaining>0;remaining-=fixedStep)
                  session.advance({},Math.min(fixedStep,remaining),{holdCycleRace:true});
              }
              else document.body.classList.remove('cycle-intro');
            }
            view.event(event);
            sound.effect(event.type, event);
          }
        },
        simulationStepSeconds(run),
      );
    }
    playTracker.update({mode,game:selectedGame,run});
    jev.update(run, !multiplayer && !run.arenaWaiting && !run.won && mode === 'running', autoplay);
    if (!autoplay.enabled && !multiplayer && (document.hidden || !windowFocused)) pause();
    if (view && mode !== 'error') {syncCycleSpectator();updateDeathTerminal(dt);}
    if (view && mode !== 'error') {
      view.cameraRig.freeCamera.update(dt, keys);
      if (!document.hidden && !(mode==='ready'&&endingStage==='victory')) {
        view.monitorCycleRenderer(dt,run.playerVehicle==='cycle'&&mode==='running'&&!background&&!document.hidden&&windowFocused&&view.cameraRig.cycleOpening===null&&!run.arenaWaiting&&run.cycleRace?.phase==='racing');
        view.updateAntialiasing(dt,mode==='running'&&!background&&!document.hidden&&windowFocused&&view.cameraRig.opening===null&&view.cameraRig.cycleOpening===null&&!run.arenaWaiting);
        view.render(run, session.previous, mode === 'running'&&!multiplayer ? loop.alpha : 1, dt, mode);
        const formation=view.cameraRig.multiplayerFormationCamera.shot;
        if(multiplayer&&formation?.ready&&run.cycleRace.cameraStaging&&!cycleRendererControl.busy&&!homeTransition.active&&!document.hidden&&(!sound.context||sound.cycleSamplesReady))multiplayer.cameraReady(formation.round,formation.seat);
        if((mode==='running'||mode==='entering'&&openingTransition)&&!run.arenaWaiting&&!document.body.classList.contains('cycle-loading'))homeTransition.sceneReady();
      }
      carrierDiagnostics?.sample();
      sound.cycleOpeningSeconds=view.cameraRig.cycleOpening===null?null:view.cameraRig.cycleOpening*CYCLE_OPENING.durationSeconds;
      if(multiplayer)sound.cycleOpeningAudio?.updateMaterialization(run.cycleRace,mode==='running');
      else sound.cycleOpeningAudio?.update(sound.cycleOpeningSeconds,mode==='running');
      sound.update(run, view.camera, mode === 'running'||mode==='entering'&&openingTransition);
      touchControls?.update({
        visible:run.playerVehicle==='cycle'&&mode==='running'&&!homeTransition.active&&!run.arenaWaiting&&view.cameraRig.cycleOpening===null&&!exitConfirm.open&&!controlsHelpOpen,
        driving:run.cycleRace?.phase==='racing'&&!run.cycleSpectating&&!!run.cycleRace?.cycles[run.cycleRace.playerId]?.alive,
        spectating:!!run.cycleSpectating,
        restart:multiplayer?run.multiplayer?.players===1:run.cycleRace?.phase==='result'||!run.cycleRace?.cycles[run.cycleRace.playerId]?.alive,
      });
      hud.update({
        dt,
        run,
        view,
        mode,
        autoplay,
        jev,
        showSurvey,
        controlsFirstKey,
        idleReminderArmed,
        idleTime,
      });
    }
  }

  async function initialize() {
    try {
      const programResources=loadingTimings.async('CLU/cycle audio and BIT resources',()=>Promise.all([sound.preload().catch(error=>console.warn('Audio preload unavailable:',error)),preloadBitResources().catch(error=>console.warn('BIT preload unavailable:',error))]));
      await loadingTimings.async('Wait for physics initialization',()=>debrisPhysicsReady);
      await yieldToBrowser();
      const context = loadingTimings.sync('Create WebGL2 context',()=>$('game').getContext('webgl2', {
        stencil: true,
        antialias: true,
        powerPreference: 'high-performance',
      }));
      if (!context)
        throw new Error(
          'This game needs WebGL 2. Try a current desktop browser with hardware acceleration enabled.',
        );
      performance.mark('tron:assets-start');
      const [[tank, recognizer, boss], carrier] = await Promise.all([
        loadingTimings.async('Tank + Recognizer models (fetch, decode, adapt)',()=>loadVehicles()),
        loadingTimings.async('Carrier model (fetch, decode, adapt)',()=>loadCarrier()),
      ]);
      performance.mark('tron:assets-ready');
      await yieldToBrowser();
      const physics = loadingTimings.sync('Create debris physics world',()=>new DebrisPhysics(map.nearbyWalls));
      view = await loadingTimings.async('Build rendering world / meshes / shadows',()=>View.create($('game'), tank, recognizer, carrier, null, map, physics, null, boss));
      if(import.meta.env.DEV&&new URLSearchParams(location.search).get('carrierDebug')==='1'){
        const {createCarrierDiagnostics}=await import('./carrier-diagnostics.js');
        carrierDiagnostics=createCarrierDiagnostics({getView:()=>view,getRun:()=>run,getMode:()=>mode});
      }
      performance.mark('tron:world-ready');
      session.arenaReady=!run.cycleRace;
      session.attachDebris(physics, view.breakups);
      if (disposed) {
        view.dispose();
        physics.dispose();
        return;
      }
      const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
      view.cameraRig.reducedMotion = motionPreference.matches;
      listen(motionPreference, 'change', (e) => {
        view.cameraRig.reducedMotion = e.matches;
      });

      // Finish arena downloads and model repair before accepting a game choice.
      // A cached GLB still needs decoding/adaptation; doing that on Return stalls entry.
      await Promise.all([loadArenaInBackground(),programResources]);
      if(disposed||mode==='error')return;

      // Compile the actual CLU opening (vehicles, carrier and shadows included)
      // during loading, so Return does not spend the dissolve compiling shaders.
      await yieldToBrowser();
      view.cameraRig.opening=0;
      loadingTimings.sync('CLU opening render / shader setup',()=>view.render(run, session.previous, 1, 0, 'entering'));
      view.cameraRig.opening=null;
      await yieldToBrowser();
      loadingTimings.sync('First render submission / shader setup',()=>view.render(run, session.previous, 1, 0, 'ready'));
      performance.mark('tron:first-frame');
      $('start').disabled = mobileTerminal;
      $('start-cycles').disabled = false;
      $('start-multiplayer').disabled = false;
      $('start-bit').disabled = false;
      $('start-mcp').disabled = false;
      $('start-credits').disabled = false;
      terminal.finish();
      setMode('ready');
      loadingTimings.checkpoint('Opening terminal ready');
      window.dispatchEvent(new Event('tron:ready'));
      loadingTimings.print();
      requestAnimationFrame(()=>{if(!disposed)loadingTimings.checkpoint('Frame callback after opening ready');});
      loop.start();
      if(new URLSearchParams(location.search).get('mcpLaunch')==='cycles'){
        const cover=document.createElement('div');Object.assign(cover.style,{position:'fixed',inset:'0',background:'#010207',zIndex:1100});document.body.append(cover);
        selectGame('cycles');void start(cover).then(()=>homeTransition.finish()).finally(()=>cover.remove());
      }else if(testCycleStart&&run.cycleRace)void start().catch(error=>{if(!disposed)fail(error.message);});
    } catch (error) {
      console.error(error);
      if (!disposed) fail(error.message);
    }
  }

  if (import.meta.env.DEV) {
    listen($('close-tuning'),'click',()=>{$('tuning').hidden=true;});
    $('enemy-ai').value = config.aiMode;
    $('ai-small-encounter').checked = config.aiSmallEncounter;
    listen($('apply-ai'), 'click', () => {
      config.aiMode = $('enemy-ai').value;
      config.aiSmallEncounter = $('ai-small-encounter').checked;
      try {
        localStorage.setItem(
          'tron-enemy-ai',
          JSON.stringify({
            version: AI_PREFERENCE_VERSION,
            mode: config.aiMode,
            small: config.aiSmallEncounter,
          }),
        );
      } catch {}
      session.configure('vehicle', {
        aiMode: config.aiMode,
        aiSmallEncounter: config.aiSmallEncounter,
      });
      jev.resetScheduling();
      start();
    });
    const ranges = {
      aiConfidence: [0, 1, 0.05],
      acceleration: [4, 20, 0.5],
      braking: [8, 35, 1],
      maxSpeed: [15, 40, 1],
      steering: [0.4, 2.5, 0.05],
      cameraDistance: [10, 30, 1],
      cameraHeight: [4, 14, 0.5],
      cameraLag: [2, 15, 0.5],
      fov: [45, 85, 1],
      enemySpeed: [10, 45, 1],
      bloom: [0, 1, 0.05],
      fog: [0.001, 0.009, 0.0002],
      renderScale: [0.5, 1, 0.1],
      targetFps: [30,120,10],
    };
    const flightRanges = {
      turnRate: [0.1, 3, 0.02, 'rad/s'],
      turnAcceleration: [0.1, 6, 0.05, 'rad/s²'],
      maneuverSpeedMetersPerSecond: [1, 6, 0.25, 'm/s'],
      sidewaysSpeedRatio: [0.1, 1, 0.05, '×'],
      reverseSpeedRatio: [0.1, 1, 0.05, '×'],
      liftAcceleration: [2, 30, 1, 'm/s²'],
      liftSpeed: [5, 35, 1, 'm/s'],
    };
    const hearingRanges = {
      engineMovingRangeMeters: [40, 200, 5],
      cannonRangeMeters: [200, 1200, 25],
      explosionRangeMeters: [300, 1600, 25],
    };
    const tuningFields = [
      ...Object.entries({ altitudeMeters: [400, 1200, 20], speedMetersPerSecond: [100, 440, 5], periodSeconds: [150, 360, 10], scale: [1, 5, 0.25] }).map(([key, range]) => ({ key, range, target: SOLAR_SAILER, title: `Solar Sailer ${key}` })),
      ...Object.entries(hearingRanges).map(([key, range]) => ({
        key,
        range,
        target: HEARING,
        title: `Hearing ${key} (m)`,
      })),
      ...Object.entries(ranges).map(([key, range]) => ({ key, range, target: config, title: key })),
      ...Object.entries(flightRanges).map(([key, range]) => ({
        key,
        range,
        target: FLIGHT,
        title: `Recognizer ${key} (${range[3]})`,
      })),
    ];
    for (const {
      key,
      range: [min, max, stepSize],
      target,
      title,
    } of tuningFields) {
      const label = document.createElement('label');
      label.innerHTML = `<span>${title}</span><output>${target[key]}</output><input type="range" min="${min}" max="${max}" step="${stepSize}" value="${target[key]}">`;
      listen(label.querySelector('input'), 'input', (e) => {
        target[key] = Number(e.target.value);
        if (target !== SOLAR_SAILER) session.configure(
          target === config ? 'vehicle' : target === FLIGHT ? 'flight' : 'hearing',
          { [key]: target[key] },
        );
        label.querySelector('output').value = target[key];
        if (key === 'renderScale') view.resize();
      });
      $('sliders').append(label);
    }
    const aaControl=document.createElement('label');
    aaControl.innerHTML='<span>Adaptive antialiasing</span><input type="checkbox" checked>';
    listen(aaControl.querySelector('input'),'change',e=>{config.adaptiveAntialiasing=e.target.checked;view.adaptiveAA.clear();});
    $('sliders').append(aaControl);
    const tintFields=document.createElement('fieldset');
    tintFields.innerHTML='<legend>Recognizer face tints</legend>';
    const tintInputs=[];
    for(const [key,title] of [['recognizerTintColor','Default'],['arenaPatrolTintColor','Arena patrol']]){
      const label=document.createElement('label');
      label.innerHTML=`<span>${title}</span><input type="color" aria-label="${title} face tint"><select aria-label="${title} tint preset">${Object.keys(RECOGNIZER_TINTS).map(name=>`<option>${name}</option>`).join('')}</select>`;
      const input=label.querySelector('input'),select=label.querySelector('select');
      const sync=()=>{input.value='#'+config[key].toString(16).padStart(6,'0');select.value=Object.keys(RECOGNIZER_TINTS).find(name=>RECOGNIZER_TINTS[name]===config[key])??'';};
      const change=color=>{config[key]=color;session.configure('vehicle',{[key]:color});sync();};
      listen(input,'input',()=>change(parseInt(input.value.slice(1),16)));
      listen(select,'change',()=>change(RECOGNIZER_TINTS[select.value]));
      sync();tintInputs.push(sync);tintFields.append(label);
    }
    $('sliders').after(tintFields);
    listen($('reset-tuning'), 'click', () => {
      Object.assign(config, defaults, {
        aiMode: config.aiMode,
        aiSmallEncounter: config.aiSmallEncounter,
      });
      tintInputs.forEach(sync=>sync());
      Object.assign(SOLAR_SAILER, SOLAR_SAILER_DEFAULTS);
      Object.assign(FLIGHT, FLIGHT_DEFAULTS);
      Object.assign(HEARING, HEARING_DEFAULTS);
      session.configure('vehicle', config);
      session.configure('flight', FLIGHT);
      session.configure('hearing', HEARING);
      view.resize();
      aaControl.querySelector('input').checked=config.adaptiveAntialiasing;
      [...$('sliders').children].slice(0,tuningFields.length).forEach((label, i) => {
        const { target, key } = tuningFields[i],
          v = target[key];
        label.querySelector('input').value = v;
        label.querySelector('output').value = v;
      });
    });
    listen($('export-tuning'), 'click', () =>
      navigator.clipboard.writeText(
        JSON.stringify({ ...config, recognizerFlight: FLIGHT, solarSailer: SOLAR_SAILER }, null, 2),
      ),
    );
    // Development-only observability/scenario placement; outcomes still run through step().
    window.__tron = createDevelopmentTools({
      session,
      getView: () => view,
      sound,
      autoplay,
      jev,
      getMode: () => mode,
      start,
      frameTimes,
    });
  }

  function dispose() {
    multiplayer?.close();
    mcpPanel.dispose();
    homeTransition.clear();
    if (disposed) return;
    disposed = true;
    carrierDiagnostics?.dispose();
    tribute.preview.dispose();
    cycleTuning?.dispose();
    cycleRendererControl.dispose();
    exitConfirm.dispose();
    jev.dispose();
    loop.dispose();
    touchControls?.dispose();
    inputController.dispose();
    view?.dispose();
    session.dispose();
    sound.dispose();
  }
  listen(window, 'pagehide', (event) => {
    if (!event.persisted) dispose();
    else pause();
  });

  const ready = initialize();
  return {
    ready,
    dispose,
    start,
    pause,
    resume,
    get session() {
      return session;
    },
  };
}
