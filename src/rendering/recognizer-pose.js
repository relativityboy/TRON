import {angleDelta,clamp} from '../game/config.js';

// Render between fixed simulation poses, without modifying navigation state.
export function recognizerPose(current,previous,alpha){
 if(!previous||previous.id!==current.id||previous.state!==current.state||
    previous.teleport||current.teleport||alpha>=1)return current;
 const t=clamp(alpha,0,1);
 return {
  x:previous.x+(current.x-previous.x)*t,
  y:previous.y+(current.y-previous.y)*t,
  s:previous.s+(current.s-previous.s)*t,
  yaw:previous.yaw+angleDelta(previous.yaw,current.yaw)*t,
  fold:(previous.fold||0)+((current.fold||0)-(previous.fold||0))*t,
 };
}
