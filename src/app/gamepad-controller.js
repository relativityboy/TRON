// Standard Gamepad mapping (Xbox, PlayStation and compatible browser controllers).
export const GAMEPAD = Object.freeze({deadZone:0.2,turnThreshold:0.55,triggerThreshold:0.25});
export function gamepadAxis(value=0){return Math.abs(value)<=GAMEPAD.deadZone?0:Math.sign(value)*(Math.min(1,Math.abs(value))-GAMEPAD.deadZone)/(1-GAMEPAD.deadZone);}
export class GamepadController {
 constructor(){this.previous=new Set();this.blocked=true;this.index=null;}
 poll(pads,{active=true,cycle=false,playing=false}={}){
  const pad=Array.from(pads??[]).find(p=>p?.connected&&p.mapping==='standard'&&(this.index===null||p.index===this.index));
  if(!pad){this.index=null;this.previous.clear();this.blocked=true;return {held:new Set(),pressed:[],axes:{},active:false};}
  this.index=pad.index;
  const down=i=>(pad.buttons[i]?.value??0)>GAMEPAD.triggerThreshold||pad.buttons[i]?.pressed;
  const x=gamepadAxis(pad.axes[0]),y=gamepadAxis(pad.axes[1]),rx=gamepadAxis(pad.axes[2]),ry=gamepadAxis(pad.axes[3]);
  const held=new Set(),add=(key,on)=>{if(on)held.add(key);};
  add('ArrowLeft',down(14)||x<-GAMEPAD.turnThreshold);add('ArrowRight',down(15)||x>GAMEPAD.turnThreshold);
  add('ArrowUp',down(12)||y<-GAMEPAD.turnThreshold);add('ArrowDown',down(13)||y>GAMEPAD.turnThreshold);
  if(playing){
   if(cycle){add('KeyW',down(7));add('KeyS',down(6));}
   else {add('Space',down(7)||down(0));add('ShiftLeft',down(4));}
  }
  const actions=new Set();
  for(const [button,key] of [[0,playing?'Space':'Enter'],[1,'Escape'],[2,'KeyF'],[3,'KeyP'],[5,'KeyO'],[8,'KeyY'],[9,'Enter'],[10,'KeyV']])if(down(button))actions.add(key);
  // Direction edges drive menus and discrete arena turns; continuous controls use held channels.
  for(const key of held)if(key.startsWith('Arrow'))actions.add(key);
  if(playing&&!cycle){for(const [key,button] of [['ArrowLeft',14],['ArrowRight',15],['ArrowUp',12],['ArrowDown',13]])if(!down(button))held.delete(key);}
  const all=new Set([...held,...actions]);
  if(!active)this.blocked=true;
  if(this.blocked){this.previous=all;if(!pad.buttons.some((_,i)=>down(i))&&!x&&!y&&!rx&&!ry)this.blocked=false;return {held:new Set(),pressed:[],axes:{},active:false};}
  const pressed=[...actions].filter(key=>!this.previous.has(key));this.previous=all;
  return {held,pressed,axes:{steer:x,throttle:-y,turret:rx,aimPitch:-ry},active:all.size>0||!!(x||y||rx||ry)};
 }
}
