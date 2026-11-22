// Security cameras: bolted to a wall, sweeping their cone back and forth on a
// fixed rhythm. A camera never moves and never chases, but its cone is always
// honest — an EMP burst switches it off for a few seconds, and a thief who
// times the sweep can walk straight under it.

import { CAMERA } from './config.js';
import { lineBlockedByWalls } from './world.js';

export function createCamera(def, index) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.angle,
    angle: def.angle,
    phase: index * 1.7,
    offLeft: 0,
  };
}

/** Advance one camera a step: swing its cone, count down any EMP shutdown. */
export function updateCamera(camera, dt, time) {
  if (camera.offLeft > 0) camera.offLeft = Math.max(0, camera.offLeft - dt);
  const swing = Math.sin((time / CAMERA.sweepPeriod) * Math.PI * 2 + camera.phase);
  camera.angle = camera.baseAngle + swing * CAMERA.sweepSwing;
}

/** True when a live camera can see the point (px, py). */
export function cameraSees(camera, px, py, walls) {
  if (camera.offLeft > 0) return false;
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.sight) return false;
  let diff = Math.atan2(dy, dx) - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.halfAngle) return false;
  return !lineBlockedByWalls(camera.x, camera.y, px, py, walls);
}
