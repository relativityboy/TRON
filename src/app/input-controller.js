/** Held manual channels and owned browser listeners. Application actions remain callbacks. */
export class InputController {
  constructor() {
    this.keys = new Set();
    this.touchKeys = new Set();
    this.cleanups = [];
    this.clear();
  }
  listen(object, event, handler, options) {
    object.addEventListener(event, handler, options);
    this.cleanups.push(() => object.removeEventListener(event, handler, options));
  }
  clearKeys(){this.keys.clear();this.touchKeys.clear();this.turretCenterChord=false;}
  clear() {
    this.clearKeys();
    this.mouseFire = false;
    this.fireQueued = false;
    this.cycleTurns = [];
    this.cycleReverseQueued = false;
    this.mouseTarget = null;
  }
  queueCycleTurn(turn,pendingTurns=0){
    if(this.cycleTurns.length+pendingTurns<2)this.cycleTurns.push(Math.sign(turn));
  }
  release(key){
    this.keys.delete(key);
    if(!this.keys.has('KeyJ')&&!this.keys.has('KeyL'))this.turretCenterChord=false;
  }
  consume() {
    this.fireQueued = false;
    this.cycleTurns.shift();
    this.cycleReverseQueued = false;
    this.mouseTarget = null;
  }
  command(run, { mouseLook, mouseTarget } = {}) {
    const held = (...keys) => keys.some((key) => this.keys.has(key)||this.touchKeys.has(key));
    const road=run.playerVehicle==='cycle'&&run.cycleRace?.cycles[run.cycleRace.playerId]?.escaped;
    return {
      cycleTurn:this.cycleTurns[0]??0,
      cycleRoad:road?{cruise:true,speedAdjust:Number(held('KeyW','ArrowUp')),reverse:this.cycleReverseQueued,turbo:held('KeyW','ArrowUp')&&!held('KeyS','ArrowDown'),brake:held('KeyS','ArrowDown'),steer:Number(held('KeyD','ArrowRight'))-Number(held('KeyA','ArrowLeft'))}:{},
      cycleTurbo:run.playerVehicle==='cycle'&&held('KeyW','ArrowUp')&&!held('KeyS','ArrowDown'),
      cycleSlow:run.playerVehicle==='cycle'&&held('KeyS','ArrowDown'),
      throttle: held('KeyS', 'ArrowDown')
        ? -1
        : Number(run.cruiseThrottle || held('KeyW', 'ArrowUp')),
      steer: Number(held('KeyD', 'ArrowRight')) - Number(held('KeyA', 'ArrowLeft')),
      mouseTarget: mouseLook ? mouseTarget : this.mouseTarget,
      firePressed: this.fireQueued,
      fire: held('Space') || this.mouseFire || this.fireQueued,
      turret: this.turretCenterChord?0:Number(held('KeyL')) - Number(held('KeyJ')),
      aimPitch: run.gunner ? Number(held('KeyI')) - Number(held('KeyK')) : 0,
    };
  }
  dispose() {
    for (const remove of this.cleanups.splice(0)) remove();
    this.clear();
  }
}
