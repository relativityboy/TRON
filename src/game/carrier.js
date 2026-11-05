import { DEFAULT_WORLD } from '../levels/scenario.js';
import { defaults } from './config.js';
const { SPAWN, HALF } = DEFAULT_WORLD;

// Background transit in world meters. Source long axis is X; preserve its
// roughly 1,225-meter length. Simulation time makes pause/restart deterministic.
// Preserve the original transit route after halving Clu's approach distance.
const transitDistance = 2 * HALF,
  lateralOffset = 3000;
export const CARRIER = {
  searchlightsEnabled: false,
  materializationFadeSeconds: 2,
  materializationWireColorLinear: [1.5, 0, 0], // Restrained red, with less bloom.
  altitude: 360,
  speed: defaults.maxSpeed,
  startX: SPAWN.x - Math.sin(SPAWN.yaw) * transitDistance - Math.cos(SPAWN.yaw) * lateralOffset,
  s: SPAWN.s + Math.cos(SPAWN.yaw) * transitDistance - Math.sin(SPAWN.yaw) * lateralOffset,
};

export function carrierFor(world = DEFAULT_WORLD) {
  const { SPAWN, HALF } = world,
    transitDistance = 2 * HALF;
  return {
    ...CARRIER,
    startX: SPAWN.x - Math.sin(SPAWN.yaw) * transitDistance - Math.cos(SPAWN.yaw) * lateralOffset,
    s: SPAWN.s + Math.cos(SPAWN.yaw) * transitDistance - Math.sin(SPAWN.yaw) * lateralOffset,
  };
}
export const AIR_ESCORT_COUNT = 2;
export function airEscortSlot(index, time, world = DEFAULT_WORLD) {
  const CARRIER = carrierFor(world);
  return { x: CARRIER.startX + CARRIER.speed * time + 120, s: CARRIER.s + (index ? 180 : -180) };
}
