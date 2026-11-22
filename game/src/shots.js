// The screenshot scenes behind ?shot=start|play|end|caught. Each one plays the
// real rules forward from a fresh world, steered by a simple autopilot that
// asks the pathfinder for a route around the walls and the live vision cones,
// so the frame is what a short game really looks like and the same seed always
// gives the same frame.

import { STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_LEVEL, EVENT_OVER, EVENT_WIN } from './world.js';
import { findPath } from './pathfind.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 24;
const END_LIMIT_SECONDS = 420;
const CAUGHT_LIMIT_SECONDS = 90;
const REPLAN_EVERY = 0.5;

/** True when the point (px, py) sits inside a live vision cone — the real cone, not its circle. */
function insideAnyCone(state, px, py) {
  for (let i = 0; i < state.guards.length; i += 1) {
    const guard = state.guards[i];
    if (pointInCone(px, py, guard.x, guard.y, guard.angle, 0.62, 205)) return true;
  }
  for (let i = 0; i < state.cameras.length; i += 1) {
    const camera = state.cameras[i];
    if (camera.offLeft > 0) continue;
    if (pointInCone(px, py, camera.x, camera.y, camera.angle, 0.55, 185)) return true;
  }
  return false;
}

function pointInCone(px, py, ox, oy, angle, halfAngle, range) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}
function createPilot(world) {
  let path = null;
  let pathIndex = 0;
  let replanLeft = 0;
  let target = null;

  function pickTarget(state) {
    // Broke? Fund the tools first: the nearest coin buys the next smoke bomb.
    if (state.cash < 40) {
      let bestCoin = null;
      let bestDist = Infinity;
      for (let i = 0; i < state.coins.length; i += 1) {
        const coin = state.coins[i];
        if (coin.taken) continue;
        const dist = Math.hypot(coin.x - state.player.x, coin.y - state.player.y);
        if (dist < bestDist) {
          bestDist = dist;
          bestCoin = coin;
        }
      }
      if (bestCoin) return bestCoin;
    }
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < state.loot.length; i += 1) {
      const item = state.loot[i];
      if (item.taken) continue;
      const dist = Math.hypot(item.x - state.player.x, item.y - state.player.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = item;
      }
    }
    if (best) return best;
    return state.level.exit;
  }

  function steer(state, dt) {
    // Flee while a guard is chasing or the alarm is hot: run from the nearest guard.
    let chased = state.alarm.value > 25;
    let nearest = null;
    let nearestDist = Infinity;
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      if (guard.chaseLeft > 0) chased = true;
      const dist = Math.hypot(guard.x - state.player.x, guard.y - state.player.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = guard;
      }
    }
    if (chased && nearest) {
      const dx = state.player.x - nearest.x;
      const dy = state.player.y - nearest.y;
      const length = Math.hypot(dx, dy) || 1;
      path = null;
      return { x: dx / length, y: dy / length };
    }
    replanLeft -= dt;
    const wanted = pickTarget(state);
    if (wanted !== target || replanLeft <= 0 || !path) {
      target = wanted;
      path = findPath(state.player.x, state.player.y, wanted.x, wanted.y, state.level.walls, world.dangerZones());
      pathIndex = 0;
      replanLeft = REPLAN_EVERY;
    }
    if (!path || pathIndex >= path.length) return { x: 0, y: 0 };
    const goal = path[pathIndex];
    // Wait out a sweeping cone: hold outside it rather than walking into it.
    if (insideAnyCone(state, goal.x, goal.y) && !insideAnyCone(state, state.player.x, state.player.y)) {
      return { x: 0, y: 0 };
    }
    const dx = goal.x - state.player.x;
    const dy = goal.y - state.player.y;
    if (Math.hypot(dx, dy) < 14) {
      pathIndex += 1;
      return { x: 0, y: 0 };
    }
    const length = Math.hypot(dx, dy) || 1;
    return { x: dx / length, y: dy / length };
  }

  return { steer };
}

/**
 * Set `world` to the named scene (start, play, end or caught; any other name
 * is start) and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end' && name !== 'caught') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, { x: 0, y: 0 }, false, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'caught') {
    // Walk straight into the front of the nearest guard's cone — the thief
    // approaches from where the guard is looking, so the alarm fills for real.
    for (let index = 0; index < CAUGHT_LIMIT_SECONDS / STEP; index += 1) {
      const state = world.state;
      let guard = state.guards[0];
      let bestDist = Infinity;
      for (let i = 0; i < state.guards.length; i += 1) {
        const dist = Math.hypot(state.guards[i].x - state.player.x, state.guards[i].y - state.player.y);
        if (dist < bestDist) {
          bestDist = dist;
          guard = state.guards[i];
        }
      }
      const tx = guard.x + Math.cos(guard.angle) * 90;
      const ty = guard.y + Math.sin(guard.angle) * 90;
      const dx = tx - state.player.x;
      const dy = ty - state.player.y;
      const length = Math.hypot(dx, dy) || 1;
      const events = world.step(STEP, { x: dx / length, y: dy / length }, false, false, false);
      if (events & EVENT_CAUGHT) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }

  const pilot = createPilot(world);
  if (name === 'play') {
    for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
      const move = pilot.steer(world.state, STEP);
      const useSmoke = world.state.alarm.value > 30 && world.state.cash >= 40;
      const events = world.step(STEP, move, false, useSmoke, false);
      if (events & (EVENT_LEVEL | EVENT_OVER)) break;
    }
    return { screen: SCREEN_PLAY, best: world.state.score };
  }

  // end: play all three levels to the getaway.
  for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
    const move = pilot.steer(world.state, STEP);
    const useSmoke = world.state.alarm.value > 30 && world.state.cash >= 40;
    const useEmp = world.state.alarm.value > 45 && world.state.cash >= 60;
    const events = world.step(STEP, move, useEmp, useSmoke, false);
    if (events & EVENT_WIN) return { screen: SCREEN_WIN, best: world.state.score };
    if (events & EVENT_OVER) break;
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}
