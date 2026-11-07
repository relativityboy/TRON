import {CluCannonBolts} from './clu-cannon-bolts.js';
import {CluHaze,CLU_HAZE} from './clu-haze.js';
import {recognizerPose} from './recognizer-pose.js';
import {yieldToBrowser} from '../loading/yield-to-browser.js';
import {CycleRendererGuard} from './cycle-renderer-guard.js';
import {AdaptiveAA,ADAPTIVE_AA,supportedSamples} from './adaptive-aa.js';
import {MazeWallDamage} from './maze-wall-damage.js';
import {GAME_LIGHTING,createGameLights} from './game-lighting.js';
import {interpolateCycleRace} from './cycle-poses.js';
import {SurfaceImpacts} from './surface-impacts.js';
import { createActiveTeleportPads as createTeleportPads } from '../levels/teleporters.js';
import { carrierFor } from '../game/carrier.js';
import { CarrierMaterialization } from './carrier-materialization.js';
import { occludeProjectedShadow } from './maze-light-visibility.js';
import { disposeSceneResources } from './scene-resources.js';
import { CameraRig } from './camera-rig.js';
import { DEFAULT_WORLD } from '../levels/scenario.js';
import { createTeleporters } from './teleporters.js';
import { vehicleTeleportPad } from '../simulation/teleporters.js';
import { Materialization } from './materialization.js';
import { Horizon } from './horizon.js';
import { CarrierShadows } from './carrier-shadows.js';
import { MazeShadows } from './maze-shadows.js';
import { RecognizerShadows } from './recognizer-shadows.js';
import { DataBeams } from './data-beams.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { gunnerSolution } from '../simulation/gunner-solution.js';
import { recognizerStarts } from '../game/recognizer-roster.js';
import { mouseTarget } from './mouse-target.js';
import { groundTankCount, bossTankIndices } from '../simulation/ground-tanks.js';
import { Searchlights } from './searchlights.js';
import { updateCarrier } from './carrier.js';
import { SceneryClock } from './scenery-clock.js';
import { applyCycleOpeningCarrier, CYCLE_OPENING } from './cycle-opening.js';
import { Breakups } from './breakup.js';
import { createMuzzleFlash } from './muzzle-flash.js';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { AntialiasedScenePass } from './antialiased-scene-pass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {createFilmFinishPass} from './film-finish.js';
import { createWorld } from './world.js';
import { createRecognizer, cloneEnemyTank } from './models.js';
import { config, RECOGNIZER_SCALE, angleDelta } from '../game/config.js';


const TURBO_GLOW = Object.freeze({ base: 1.8, pulse: 1.2, hz: 2, response: 10 });

const AIRCRAFT_SHADOWS = Object.freeze({ maxCasters: 12, arenaWallDarkness: .88 });
export class View {
  async setCycleRenderer(mode){
    if(!['normal','pov'].includes(mode))throw Error('Unknown cycle renderer');
    this.cycleRendererReason=null;
    const request=this.cycleRendererRequest=(this.cycleRendererRequest??0)+1;
    this.povCycles?.dispose();this.povCycles=null;this.cycleRendererMode='normal';
    if(this.normalAdaptiveAA){this.adaptiveAA=this.normalAdaptiveAA;this.normalAdaptiveAA=null;this.adaptiveAA.clear();this.resize();}
    if(mode==='normal')return 'normal';
    if(!this.arena)throw Error('The arena is still loading');
    const {PovCycles}=await import('./pov-cycles.js');
    if(this.renderDisposed||request!==this.cycleRendererRequest)return this.cycleRendererMode;
    const candidate=new PovCycles(this.arena.userData.cycleRace,{aircraftShadows:()=>this.recognizerShadows});
    try{await candidate.warm(this.renderer,this.camera);}catch(error){candidate.dispose();throw error;}
    if(this.renderDisposed||request!==this.cycleRendererRequest){candidate.dispose();return this.cycleRendererMode;}
    this.normalAdaptiveAA=this.adaptiveAA;
    this.povAdaptiveAA??=new AdaptiveAA(supportedSamples(this.renderer.getContext()));
    this.adaptiveAA=this.povAdaptiveAA;this.adaptiveAA.clear();this.resize();
    this.cycleRendererGuard=new CycleRendererGuard();
    this.povCycles=candidate;this.cycleRendererMode='pov';return 'pov';
  }
  monitorCycleRenderer(dt,active){
    if(this.povCycles&&this.cycleRendererGuard.sample(dt,active,config.targetFps)){
      void this.setCycleRenderer('normal');this.cycleRendererReason='performance';
      console.info('POV-Ray cycles: sustained low frame rate; using normal renderer. Shift-R can retry manually.');
    }
  }
  attachSolarSailer(model,SolarSailer){this.solarSailer=new SolarSailer(model,this.scene,this.map);}
  attachArena(arena){
    if(!arena)return;
    this.arena=arena;this.arenaFloor=arena.getObjectByName('Procedural_arena_floor');
    this.world.floor.userData.arenaFootprint.value.set(arena.position.x,arena.position.z,466);
    this.scene.add(arena);
    this.recognizerShadows.addReceivers(arena.userData.recognizerShadowReceivers);
  }
  static async create(...args){
    const view=new View();
    await view.initialize(...args);
    return view;
  }
  async initialize(
    canvas,
    tank,
    recognizer,
    carrier = null,
    cloud = null,
    map = DEFAULT_WORLD,
    physics = null,
    arena = null,
    boss = null,
  ) {
    this.map = map;
    const groundShadowOption=new URLSearchParams(globalThis.location?.search||'').get('groundShadows');
    if(groundShadowOption==='sharp'||groundShadowOption==='diffuse')config.diffuseGroundShadows=groundShadowOption==='diffuse';
    const RECOGNIZER_STARTS = recognizerStarts(map),
      GROUND_TANK_COUNT = groundTankCount(map);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      stencil: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.info.autoReset = false;
    this.renderer.toneMapping = GAME_LIGHTING.toneMapping;
    this.renderer.toneMappingExposure = GAME_LIGHTING.exposure;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x03050c);
    this.horizon = new Horizon(this.scene, map);
    this.scene.fog = new THREE.FogExp2(0x090d1d, config.fog);
    this.cluHaze=new CluHaze();
    this.baseFogColor=this.scene.fog.color.clone();
    this.canyonFogColor=new THREE.Color(CLU_HAZE.enclosedColor);
    this.cameraRig = new CameraRig(map);
    this.camera = this.cameraRig.camera;
    this.scene.add(createGameLights());
    await yieldToBrowser();
    this.world = createWorld(this.scene, map, arena);
    this.arena = arena;
    this.arenaFloor = arena?.getObjectByName('Procedural_arena_floor');
    if (arena) this.scene.add(arena);
    await yieldToBrowser();
    this.dataBeams = new DataBeams(this.scene, map);
    this.teleportPads = createTeleporters(this.world.floor.material, createTeleportPads(map.MAZE_INSTANCES, map.WALL_HEIGHT));
    this.solarSailer = null;
    this.carrier = carrier;
    if (carrier) {
      carrier.userData.rez = new CarrierMaterialization(carrier);
      carrier.userData.rez.updateTransit(0, carrierFor(map).speed);
      this.scene.add(carrier);
    }
    await yieldToBrowser();
    this.clouds = null;
    this.tank = tank;
    this.scene.add(this.tank.root);
    this.muzzleFlash = createMuzzleFlash();
    this.scene.add(this.muzzleFlash);
    if(boss){boss.root.visible=false;this.scene.add(boss.root);}
    this.enemyTanks = Array.from({ length: GROUND_TANK_COUNT }, (_,index) => {
      const craft = cloneEnemyTank(bossTankIndices(map).includes(index)&&boss?boss:tank);
      this.scene.add(craft.root);
      return craft;
    });
    this.recognizers = [];
    for(let i=0;i<RECOGNIZER_STARTS.length;i++){
      await yieldToBrowser();
      const craft = createRecognizer(recognizer);
      craft.id = i;
      craft.rez = new Materialization(craft.root);
      craft.root.scale.setScalar(RECOGNIZER_SCALE);
      this.scene.add(craft.root);
      this.recognizers.push(craft);
    }
    for (const craft of [this.tank, ...this.enemyTanks]){
      await yieldToBrowser();craft.rez = new Materialization(craft.root);
    }
    await yieldToBrowser();
    this.recognizerTemplate = recognizer;
    this.recognizerShadows = new RecognizerShadows(
      this.recognizers,
      [this.world.slabs, this.world.seams, this.world.floor,...(this.arena?.userData.recognizerShadowReceivers??[])],
      5,
      { maxCrafts: AIRCRAFT_SHADOWS.maxCasters, darknessForReceiver:receiver=>receiver.userData.arenaAircraftShadow?AIRCRAFT_SHADOWS.arenaWallDarkness:undefined },
    );
    await yieldToBrowser();
    this.requestedGroundShadowMode=null;
    this.mazeShadows = new MazeShadows(
      this.world,
      [
        this.tank.root,
        ...this.enemyTanks.map((c) => c.root),
        ...this.recognizers.map((c) => c.root),
        ...(this.carrier ? [this.carrier] : []),
      ],
      this.map,
      {sharpReceiver:this.tank.root},
    );
    this.carrierShadows = carrier
      ? new CarrierShadows(carrier, this.world, [
          this.tank.root,
          ...this.enemyTanks.map((c) => c.root),
          ...this.recognizers.map((c) => c.root),
        ])
      : null;
    await yieldToBrowser();
    this.surfaceImpacts = new SurfaceImpacts(this.scene);
    this.wallDamage=new MazeWallDamage(this.scene,this.world.slabs,this.world.seams);
    this.breakups = new Breakups(this.scene, map, physics);
    this.connectMazeOcclusion();
    this.searchlights = new Searchlights(this.scene, this.recognizers.length, undefined, this.map);
    this.carrierLights = new Searchlights(
      this.scene,
      2,
      (light) => ({
        origin: new THREE.Vector3(light.x, light.y, -light.s),
        direction: new THREE.Vector3(light.dx, light.dy, -light.ds),
        strength: light.strength,
        range: Math.min(1200, light.y / Math.max(0.1, -light.dy) + 30),
        halfWidth: 24,
        sourceRadius: 2,
      }),
      map,
    );
    await yieldToBrowser();
    this.shots = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.25, 6, 4),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd2a3).multiplyScalar(4) }),
      80,
    );
    this.shots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.shots.frustumCulled = false;
    this.shots.count = 0;
    this.scene.add(this.shots);
    this.cluCannonBolts=new CluCannonBolts(this.scene);
    this.debris = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0xf67556).multiplyScalar(1.6) }),
      140,
    );
    this.debris.frustumCulled = false;
    this.debris.count = 0;
    this.scene.add(this.debris);
    this.particles = [];
    this.matrixObject = new THREE.Object3D();
    await yieldToBrowser();
    this.adaptiveAA=new AdaptiveAA(supportedSamples(this.renderer.getContext()));
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 0,
    });
    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.scenePass=new AntialiasedScenePass(this.scene,this.camera,this.adaptiveAA.quality.samples);
    this.composer.addPass(this.scenePass);
    this.enemyOutline = new OutlinePass(new THREE.Vector2(1, 1), this.scene, this.camera);
    this.enemyOutline.visibleEdgeColor.setHex(0x70bfd6);
    this.enemyOutline.hiddenEdgeColor.setHex(0x000000);
    this.enemyOutline.edgeStrength = 1.6;
    this.enemyOutline.edgeGlow = 0.35;
    this.enemyOutline.edgeThickness = 1;
    this.enemyOutline.enabled = false;
    this.composer.addPass(this.enemyOutline);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), config.bloom, 0.5, 0.85);
    this.composer.addPass(this.bloom);
    this.smaa = new SMAAPass();
    this.composer.addPass(this.smaa);
    this.output = new OutputPass();
    this.composer.addPass(this.output);
    this.film = createFilmFinishPass();
    this.composer.addPass(this.film);
    this.elapsed = 0;
    this.lowQuality = false;
    this.resize();
  }

  resize() {
    const w = window.innerWidth,
      h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const quality=this.adaptiveAA.quality;
    const ratio=this.lowQuality?1:Math.min(quality.ratio,ADAPTIVE_AA.maxPixelRatio,
      Math.max(1,Math.sqrt(ADAPTIVE_AA.pixelBudget/(w*h))),
      this.renderer.capabilities.maxTextureSize/Math.max(w,h));
    // Sample count changes require new framebuffer attachments, not a new context.
    this.scenePass.setSamples(quality.samples);
    this.renderer.setPixelRatio(ratio);
    this.composer.setPixelRatio(ratio);
    this.renderer.setSize(w * config.renderScale, h * config.renderScale, false);
    this.composer.setSize(w * config.renderScale, h * config.renderScale);

  }

  updateAntialiasing(dt,active){
    const shadows=this.mazeShadows;
    if(shadows){
      const requested=config.diffuseGroundShadows?'diffuse':'sharp';
      if(this.requestedGroundShadowMode!==requested){shadows.setGroundShadowMode(requested);this.requestedGroundShadowMode=requested;}
      shadows.monitorGroundShadows(dt,active,config.autoGroundShadowFallback,config.targetFps);
    }
    if(this.adaptiveAA.sample(dt,active&&!this.lowQuality&&config.adaptiveAntialiasing,config.targetFps))this.resize();
  }

  reset() {
    this.sceneryClock?.reset();
    this.cluHaze.reset();
    this.cameraRig.reset();
    this.gunnerHit = null;
    this.nextGunnerSolution = 0;
    this.damageSparkTimes = new Map();
    this.searchlights.reset();
    this.carrierLights.reset();
    this.breakups.clear();
    this.surfaceImpacts.clear();
    this.wallDamage.clear();
    this.particles.length = 0;
  }

  event(event) {
    if (!['hit', 'destroyed'].includes(event.type)) return;
    if(event.type==='hit'){
      const craft=event.subject==='tank'?this.tank:event.subject==='enemyTank'?this.enemyTanks[event.id-100]:this.recognizers.find(c=>c.id===event.id);
      this.surfaceImpacts.spawn(event,craft?.root);
      this.wallDamage.hit(event);
    }
    if (event.type === 'destroyed' && event.subject === 'tank') {
      this.tank.turret.rotation.y = event.turretYaw;
      this.breakups.spawn(this.tank, event);
      return;
    }
    if (event.type === 'destroyed' && event.subject === 'enemyTank') {
      const craft = this.enemyTanks[event.id - 100];
      if (craft) {
        craft.turret.rotation.y = event.turretYaw;
        this.breakups.spawn(craft, event);
      }
      return;
    }
    if (event.type === 'destroyed') {
      const craft = this.recognizers.find((c) => c.id === event.id);
      if (craft) {
        this.breakups.spawn(craft, event);
        return;
      }
    }
    const count = event.type === 'destroyed' ? 80 : 12;
    for (let i = 0; i < count && this.particles.length < 140; i++) {
      this.particles.push({
        x: event.x,
        y: event.y,
        z: -event.s,
        vx: Math.sin(i * 5.7) * (event.type === 'destroyed' ? 20 : 8),
        vy: 5 + (i % 9) * 1.8,
        vz: Math.cos(i * 8.3) * 18,
        age: 0,
        life: 1 + (i % 7) * 0.23,
        scale: event.type === 'destroyed' ? 0.8 + (i % 4) * 0.5 : 0.25,
      });
    }
  }

  render(run, previous, alpha, dt, mode) {
    const { wallIntersection, lineOfSight } = this.map;
    this.elapsed += dt;
    this.arena?.userData.breaches.update(run.cycleRace);
    const cycleRace=interpolateCycleRace(run.cycleRace,alpha);
    const opening=this.cameraRig.cycleOpening;
    this.arena?.userData.cycleRace.update(cycleRace,opening===null?null:Math.max(0,(opening-1)*CYCLE_OPENING.durationSeconds));


    if (this.teleportRevision !== run.teleportRevision) {
      this.cameraRig.freshCamera = true;
      this.cameraRig.gunnerTransition = null;
      this.teleportRevision = run.teleportRevision;
      previous = { ...run };
    }
    this.teleportPads.visible = mode !== 'ready';
    this.teleportPads.update(run.teleportPads, run.time);
    const { cinematic, aerialMix:modeAerialMix, preview, gunner } = this.cameraRig.begin(run, dt, mode);
    const aerialMix=this.cameraRig.cluAerialFraming(modeAerialMix).mix;
    const sceneryTime=(this.sceneryClock??=new SceneryClock()).sample(run,previous,alpha,dt);
    this.clouds?.update(sceneryTime, run.seed, !preview);
    this.solarSailer?.update(sceneryTime, !preview);
    if (this.carrier) {
      this.carrier.visible = !preview;
      updateCarrier(
        this.carrier,
        sceneryTime,
        run.carrierHealth,
        Math.max(0, 1 - (run.time - run.carrierHitAt) / 1.2),
        this.map,
      );
      if(this.cameraRig.cycleOpening!==null&&run.cycleRace)applyCycleOpeningCarrier(this.carrier,this.cameraRig.cycleOpening,run.cycleRace.site);
      if(run.playerVehicle==='cycle'||run.cycleEntryRequested)this.carrier.userData.rez.update();
      else this.carrier.userData.rez.updateTransit(sceneryTime, carrierFor(this.map).speed);
    }
    if (run.teleport) previous = { ...run };
    const x = previous.x + (run.x - previous.x) * alpha;
    const s = previous.s + (run.s - previous.s) * alpha;
    const yaw = previous.yaw + angleDelta(previous.yaw, run.yaw) * alpha;
    this.tank.root.position.set(x, 0, -s);
    this.tank.root.visible = !run.crushed && !gunner;
    this.tank.root.scale.y = 1;
    this.tank.root.rotation.set(0, yaw, 0);
    this.tank.turret.rotation.y =
      previous.turretYaw + angleDelta(previous.turretYaw, run.turretYaw) * alpha;
    this.tank.barrel.rotation.x = 0;
    this.tank.barrel.position.z = run.recoil * 0.35;
    this.tank.flash.visible = false;
    this.tank.rez.update(null, vehicleTeleportPad({ ...run, x, s }, run.teleportPads));
    const turboTarget = run.turboRemaining > 0 && !run.crushed ? 1 : 0;
    this.turboGlow = THREE.MathUtils.damp(
      this.turboGlow || 0,
      turboTarget,
      TURBO_GLOW.response,
      mode === 'paused' ? 0 : dt,
    );
    const pulse = this.cameraRig.reducedMotion
      ? 0.5
      : 0.5 + 0.5 * Math.sin(run.time * Math.PI * 2 * TURBO_GLOW.hz);
    for (const material of this.tank.turboTrim || []) {
      material.emissive.setHex(0xff0301);
      material.emissiveIntensity = this.turboGlow * (TURBO_GLOW.base + TURBO_GLOW.pulse * pulse);
    }

    this.tank.tracks.forEach((t, i) => {
      t.material = this.tank.tracks[0].material;
      t.visible = (Math.floor(run.s * 3) + i) % 3 !== 0;
    });

    this.arenaFloor?.material.uniforms.fadeRange.value.set(160 + 1640 * aerialMix, 650 + 2350 * aerialMix);
    this.world.floor.position.set(x, -0.06, -s);
    this.world.floor.scale.setScalar(aerialMix > 0 ? Math.max(1,this.cameraRig.cluAerialFraming(modeAerialMix).scale) : 1);
    this.ensureRecognizers(run.recognizers.length);
    this.recognizers.forEach((c, i) => {
      if (!run.recognizers[i]) {
        c.root.visible = false;
        c.rez?.update();
      }
    });
    run.recognizers.forEach((e, i) => {
      const craft = this.recognizers[i];
      craft.id = e.id;
      craft.root.visible = e.state !== 'destroyed';
      const pose=recognizerPose(e,previous.recognizers?.find(old=>old.id===e.id),alpha);
      craft.root.position.set(pose.x, pose.y, -pose.s);
      craft.root.rotation.set(0, pose.yaw, 0);
      craft.pose(pose.fold || 0);
      craft.setEyeColor(e.eyeColor??config.recognizerEyeColor);
      craft.setTintColor(e.tintColor ?? (e.role==='arena-patrol'?config.arenaPatrolTintColor:config.recognizerTintColor));
      craft.rez?.update(
        e.state === 'materializing' ? run.time - e.rezStarted : null,
        vehicleTeleportPad(e, run.teleportPads, true),
      );
      craft.material.emissive.setRGB(e.hit * 0.65, e.hit * 0.16, e.hit * 0.08);
    });
    this.enemyTanks.forEach((c, i) => {
      if (!run.enemyTanks[i]) {
        c.root.visible = false;
        c.rez.update();
      }
    });
    run.enemyTanks.forEach((e, i) => {
      const craft = this.enemyTanks[i];
      craft.root.visible = !preview && e.state !== 'destroyed';
      craft.root.position.set(e.x, 0, -e.s);
      craft.root.rotation.set(0, e.yaw, 0);
      craft.turret.rotation.y = e.turretYaw;
      craft.barrel.position.z = e.recoil * 0.35;
      craft.flash.visible = !e.teleport && e.recoil > 0.75;
      craft.rez.update(null, vehicleTeleportPad(e, run.teleportPads));
    });
    const enemyShots=run.projectiles.filter(p=>p.faction==='enemy');
    this.shots.count = Math.min(80, enemyShots.length);
    enemyShots.slice(0, 80).forEach((p, i) => {
      this.matrixObject.position.set(p.x, p.y, -p.s);
      this.matrixObject.rotation.set(0, 0, 0);
      this.matrixObject.scale.set(1, 1, 3);
      this.matrixObject.lookAt(p.x + p.vx, p.y + p.vy, -p.s - p.vs);
      this.matrixObject.updateMatrix();
      this.shots.setMatrixAt(i, this.matrixObject.matrix);
    });
    this.shots.instanceMatrix.needsUpdate = true;
    const particleDt = mode === 'paused' ? 0 : dt;
    this.damageSparkTimes ??= new Map();
    if (particleDt > 0 && !preview)
      for (const enemy of [...run.recognizers, ...run.enemyTanks]) {
        if (enemy.state === 'destroyed') continue;
        const tick = Math.floor(run.time * 4);
        if (this.damageSparkTimes.get(enemy.id) === tick) continue;
        this.damageSparkTimes.set(enemy.id, tick);
        for (const [part, hits] of Object.entries(enemy.partHits || {})) {
          if (!((part.endsWith('-track') && hits >= 1) || (part.endsWith('-leg') && hits >= 2)))
            continue;
          const ground = enemy.kind === 'ground',
            side = part.startsWith('left') ? -1 : 1;
          const localX = side * (ground ? 3 : (14 - (enemy.fold || 0) * 13) * RECOGNIZER_SCALE);
          for (let i = 0; i < 2 && this.particles.length < 140; i++)
            this.particles.push({
              x: enemy.x + Math.cos(enemy.yaw) * localX,
              y: ground ? 1 : enemy.y - 12 * RECOGNIZER_SCALE,
              z: -enemy.s - Math.sin(enemy.yaw) * localX,
              vx: Math.sin(tick * 2.3 + i) * 2,
              vy: 1.5 + i,
              vz: Math.cos(tick * 3.1 + i) * 2,
              age: 0,
              life: 0.45 + i * 0.1,
              scale: 0.12,
            });
        }
      }

    this.particles = this.particles.filter((p) => p.age < p.life);
    this.debris.count = this.particles.length;
    this.particles.forEach((p, i) => {
      p.age += particleDt;
      p.x += p.vx * particleDt;
      p.y += p.vy * particleDt;
      p.z += p.vz * particleDt;
      p.vy -= particleDt * 14;
      this.matrixObject.position.set(p.x, Math.max(0.1, p.y), p.z);
      this.matrixObject.rotation.set(p.age * 3, i + p.age, p.age * 2);
      this.matrixObject.scale.setScalar(p.scale * Math.max(0.02, 1 - p.age / p.life));
      this.matrixObject.updateMatrix();
      this.debris.setMatrixAt(i, this.matrixObject.matrix);
    });
    this.debris.instanceMatrix.needsUpdate = true;

    const fragments = this.breakups.bursts
      .filter((b) => b.age < 3)
      .map((b) => {
        const center = new THREE.Vector3();
        for (const p of b.pieces) center.add(p.group.position);
        center.multiplyScalar(1 / b.pieces.length);
        return { x: center.x, s: -center.z, y: center.y, state: 'debris' };
      });
    const cameraResult = this.cameraRig.update(run, previous, alpha, dt, mode, {
      x,
      s,
      yaw,
      turretYaw: this.tank.turret.rotation.y,
      fragments,
      cycleRace,
    });
    this.cluCannonBolts.update(run.projectiles,this.camera);
    for(const [id,bike] of (this.arena?.userData.cycleRace.bikes??[]).entries()){
      const mix=run.playerVehicle==='cycle'&&!run.cycleSpectating&&id===cycleRace?.playerId?1-this.cameraRig.cycleVisibility:0;
      bike.userData.cockpitMix=mix;
      if(mix>.999)bike.visible=false;
      bike.traverse(o=>{if(o.isMesh)for(const material of [].concat(o.material)){
        if(mix>0){
          material.userData.cockpitOriginal??={opacity:material.opacity,transparent:material.transparent,depthWrite:material.depthWrite};
          material.opacity=material.userData.cockpitOriginal.opacity*(1-mix);material.transparent=true;material.depthWrite=false;
        }else if(material.userData.cockpitOriginal){Object.assign(material,material.userData.cockpitOriginal);delete material.userData.cockpitOriginal;}
      }});
    }
    this.tank.root.visible = cameraResult.tankVisible && run.playerVehicle!=='cycle';
    if (gunner && this.cameraRig.mouseLook)
      this.mouseTarget = mouseTarget(run, this.cameraRig.mouseLook, this.camera, [
        this.world.slabs,
        this.world.floor,
        this.carrier,
        ...this.recognizers.map((c) => c.root),
        ...this.enemyTanks.map((c) => c.root),
      ]);
    const adaptiveCluHaze=run.playerVehicle!=='cycle'&&!this.cameraRig.referenceCamera&&!preview;
    const hazeScale=adaptiveCluHaze?this.cluHaze.update(this.map,x,s,mode==='running'||mode==='entering'?dt:0):1;
    this.world.canyonEnclosure.value=adaptiveCluHaze?this.cluHaze.enclosure:0;
    this.scene.fog.color.copy(this.baseFogColor);
    if(adaptiveCluHaze)this.scene.fog.color.lerp(this.canyonFogColor,this.cluHaze.enclosure);
    this.scene.fog.density =
      config.fog * hazeScale *
      (this.cameraRig.referenceCamera?.fogScale ??
        (this.cameraRig.opening != null
          ? THREE.MathUtils.lerp(0.06, 1, this.cameraRig.opening)
          : THREE.MathUtils.lerp(1, 0.06, aerialMix)));
    this.world.aerialView.value =
      this.cameraRig.opening != null
        ? 1 - this.cameraRig.opening
        : !this.cameraRig.referenceCamera
          ? aerialMix
          : 0;
    this.dataBeams.update(run, !preview && ['running', 'entering', 'paused'].includes(mode));
    this.enemyOutline.enabled = gunner;
    if (gunner) {
      this.enemyOutline.selectedObjects = run.enemyTanks.flatMap((enemy, i) =>
        enemy.state === 'destroyed' ? [] : [this.enemyTanks[i].root],
      );
      if (run.time >= (this.nextGunnerSolution || 0)) {
        this.gunnerHit = gunnerSolution(run);
        this.nextGunnerSolution = run.time + 0.08;
      }
    } else {
      this.gunnerHit = null;
      this.nextGunnerSolution = 0;
      this.enemyOutline.selectedObjects = [];
    }
    this.smaa.enabled = !this.lowQuality;
    this.bloom.strength = config.bloom;
    this.bloom.enabled = !this.lowQuality;
    this.film.enabled = !this.lowQuality;
    this.film.uniforms.time.value = this.elapsed;
    this.searchlights.update(
      run.recognizers,
      run.time,
      this.camera,
      mode === 'paused' ? 0 : dt,
      !preview,
    );
    this.carrierLights.update(
      run.carrierSearch.lights,
      run.time,
      this.camera,
      mode === 'paused' ? 0 : dt,
      !preview && !!this.carrier,
    );
    const muzzleAge = (1 - run.recoil) / 4;
    this.muzzleFlash.visible =
      !gunner && !this.cameraRig.gunnerTransition && !run.crushed && !preview && muzzleAge < 0.17;
    if (this.muzzleFlash.visible) {
      this.muzzleFlash.material.uniforms.age.value = muzzleAge;
      this.muzzleFlash.material.uniforms.seed.value = run.shots * 2.399;
      this.tank.root.updateMatrixWorld(true);
      this.tank.flash.getWorldPosition(this.muzzleFlash.position);
      this.muzzleFlash.quaternion.copy(this.camera.quaternion);
      this.muzzleFlash.scale.setScalar(1);
    }
    for (const burst of this.breakups.bursts)
      burst.optical?.mesh.quaternion.copy(this.camera.quaternion);
    this.surfaceImpacts.update(mode==='running'?dt:0);
    this.wallDamage.update(mode==='running'?dt:0);
    this.mazeShadows.refreshDamage(this.world.slabs,this.wallDamage.revision);
    this.horizon.update(this.camera, !preview && !this.cameraRig.referenceCamera);
    this.renderer.info.reset();
    this.arena?.userData.cycleRace.wallShadows.update(this.renderer);
    this.arena?.userData.cycleRace.perimeterFloorShadows.update();
    this.arena?.userData.cycleRace.trailShadows.update();
    this.mazeShadows.update(this.renderer);
    this.recognizerShadows.update(this.renderer, this.breakups.bursts, this.camera.position);
    this.carrierShadows?.update(this.renderer);
    if(run.cycleRace&&run.cycleRace.phase!=='idle')this.arena?.userData.cycleRace.shadows.update(this.renderer,[],this.camera.position);
    if(this.povCycles){
      this.povCycles.prepare();
      try{this.povCycles.edges.render(this.renderer,this.povCycles.root,this.camera);this.composer.render(dt);}finally{this.povCycles.restore();}
    }else this.composer.render(dt);
  }

  connectMazeOcclusion() {
    this.recognizerShadows.setOcclusion(this.mazeShadows);
    this.carrierShadows?.setOcclusion(this.mazeShadows);
    const patched = new Set();
    for (const craft of this.recognizers) craft.root.traverse(mesh => {
      if (mesh.name === 'recognizer-ground-shadow' && !patched.has(mesh.material)) {
        patched.add(mesh.material);occludeProjectedShadow(mesh.material,this.mazeShadows);
      }
    });
    this.breakups.mazeOcclusion = this.mazeShadows;
    for (const burst of this.breakups.bursts) occludeProjectedShadow(burst.groundShadow,this.mazeShadows);
  }
  ensureRecognizers(count) {
    if (count <= this.recognizers.length) return;
    // Undo shader wrappers in reverse order before rebuilding receiver lists.
    this.carrierShadows?.dispose();
    this.mazeShadows.dispose();
    this.recognizerShadows.dispose();
    const extra = count - this.recognizers.length;
    while (this.recognizers.length < count) {
      const craft = createRecognizer(this.recognizerTemplate);
      craft.rez = new Materialization(craft.root);
      craft.root.scale.setScalar(RECOGNIZER_SCALE);
      this.scene.add(craft.root);
      this.recognizers.push(craft);
    }
    this.searchlights.beams.push(...new Searchlights(this.scene, extra, undefined, this.map).beams);
    this.recognizerShadows = new RecognizerShadows(
      this.recognizers,
      [this.world.slabs, this.world.seams, this.world.floor,...(this.arena?.userData.recognizerShadowReceivers??[])],
      5,
      { maxCrafts: AIRCRAFT_SHADOWS.maxCasters, darknessForReceiver:receiver=>receiver.userData.arenaAircraftShadow?AIRCRAFT_SHADOWS.arenaWallDarkness:undefined },
    );
    const vehicles = [
      this.tank.root,
      ...this.enemyTanks.map((c) => c.root),
      ...this.recognizers.map((c) => c.root),
    ];
    this.requestedGroundShadowMode=null;
    this.mazeShadows = new MazeShadows(
      this.world,
      [...vehicles, ...(this.carrier ? [this.carrier] : [])],
      this.map,
      {sharpReceiver:this.tank.root},
    );
    this.carrierShadows = this.carrier
      ? new CarrierShadows(this.carrier, this.world, vehicles)
      : null;
    this.connectMazeOcclusion();
  }

  dispose() {
    this.renderDisposed=true;this.cycleRendererRequest=(this.cycleRendererRequest??0)+1;this.povCycles?.dispose();this.povCycles=null;
    if (this.disposed) return;
    this.disposed = true;
    this.carrierShadows?.dispose();
    this.mazeShadows.dispose();
    this.recognizerShadows.dispose();
    for (const craft of [this.tank, ...this.enemyTanks, ...this.recognizers]) craft.rez?.dispose();
    this.recognizerTemplate.traverse((o) => o.material?.dispose());
    this.carrier?.userData.rez?.dispose();
    this.breakups.dispose();
    this.surfaceImpacts.dispose();
    this.wallDamage.dispose();
    this.clouds?.dispose();
    this.arena?.userData.cycleRace.perimeterFloorShadows.dispose();
    this.arena?.userData.cycleRace.trailShadows.dispose();
    this.arena?.userData.cycleRace.wallShadows.dispose();
    this.arena?.userData.cycleRace.shadows.dispose();
    this.arena?.userData.cycleRace.tireTraces.dispose();
    this.arena?.userData.cycleRace.materializations.forEach(rez=>rez.dispose());
    this.arena?.userData.breaches.dispose();
    this.arena?.userData.arenaStyle.dispose();
    disposeSceneResources(this.scene);
    for (const pass of this.composer.passes) pass.dispose?.();
    this.composer.dispose();
    this.renderer.dispose();
  }
}
