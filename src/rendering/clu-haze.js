// Presentation only: meters, seconds and multipliers of the existing fog density.
export const CLU_HAZE=Object.freeze({rayCount:16,reachMeters:180,eyeHeightMeters:3,sampleSeconds:.2,buildSeconds:3,clearSeconds:5,openDensityScale:.45,enclosedDensityScale:1.8,enclosedColor:0x010208});
export function mazeEnclosure(world,x,s){
 const c=CLU_HAZE,origin={x,s,y:c.eyeHeightMeters};let score=0;
 for(let i=0;i<c.rayCount;i++){
  const angle=i*Math.PI*2/c.rayCount;
  const hit=world.wallIntersection(origin,{x:x+Math.cos(angle)*c.reachMeters,s:s+Math.sin(angle)*c.reachMeters,y:c.eyeHeightMeters});
  if(hit!==null)score+=Math.sqrt(Math.max(0,1-hit));
 }
 return Math.max(0,Math.min(1,(score/c.rayCount-.2)/.55));
}
export class CluHaze {
 constructor(){this.reset();}
 reset(){this.enclosure=0;this.target=0;this.untilSample=0;}
 update(world,x,s,dt){
  dt=Math.max(0,Math.min(.25,dt));this.untilSample-=dt;
  if(this.untilSample<=0){this.target=mazeEnclosure(world,x,s);this.untilSample=CLU_HAZE.sampleSeconds;}
  const seconds=this.target>this.enclosure?CLU_HAZE.buildSeconds:CLU_HAZE.clearSeconds;
  this.enclosure+=(this.target-this.enclosure)*(1-Math.exp(-dt/seconds));
  return CLU_HAZE.openDensityScale+(CLU_HAZE.enclosedDensityScale-CLU_HAZE.openDensityScale)*this.enclosure;
 }
}
