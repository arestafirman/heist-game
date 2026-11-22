// Guards: they walk their patrol, pause at each waypoint, and watch a cone
// ahead of them. A thief inside the cone with a clear line of sight is spotted:
// the guard turns toward the thief, chases for a while, and the alarm climbs.
// A wall between guard and thief breaks the sight line, so cover always works.

import { GUARD } from './config.js';
import { lineBlockedByWalls, moveCircle } from './world.js';

export function createGuard(def) {
  const first = def.waypoints[0];
  return {
    x: first.x,
    y: first.y,
    angle: 0,
    waypoints: def.waypoints,
    target: 1,
    pause: def.pause || 1,
    pauseLeft: 0,
    chaseLeft: 0,
    alert: 0,
    seen: false,
  };
}

/** True when `guard` can see the point (px, py): inside the cone, in range, no wall between. */
export function guardSees(guard, px, py, walls) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.sight) return false;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.halfAngle) return false;
  return !lineBlockedByWalls(guard.x, guard.y, px, py, walls);
}

/** Advance one guard a step. Returns true while the guard is actively spotting the thief. */
export function updateGuard(guard, dt, player, walls, spotted) {
  guard.seen = false;
  if (spotted) {
    guard.chaseLeft = GUARD.memory;
    guard.alert = Math.min(1, guard.alert + dt * 3);
  } else if (guard.chaseLeft > 0) {
    guard.chaseLeft -= dt;
    guard.alert = Math.max(0, guard.alert - dt * 0.5);
  } else {
    guard.alert = Math.max(0, guard.alert - dt * 0.8);
  }

  if (guard.chaseLeft > 0) {
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const dist = Math.hypot(dx, dy) || 1;
    guard.angle = Math.atan2(dy, dx);
    moveCircle(guard, (dx / dist) * GUARD.chaseSpeed * dt, (dy / dist) * GUARD.chaseSpeed * dt, GUARD.radius, walls);
    guard.seen = true;
    return true;
  }

  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    return false;
  }
  const goal = guard.waypoints[guard.target];
  const dx = goal.x - guard.x;
  const dy = goal.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 6) {
    guard.target = (guard.target + 1) % guard.waypoints.length;
    guard.pauseLeft = guard.pause;
    return false;
  }
  guard.angle = Math.atan2(dy, dx);
  moveCircle(guard, (dx / dist) * GUARD.patrolSpeed * dt, (dy / dist) * GUARD.patrolSpeed * dt, GUARD.radius, walls);
  return false;
}
