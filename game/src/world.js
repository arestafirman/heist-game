// The game's rules and state, with no drawing and no browser in it: the thief,
// the level's walls, guards, cameras, loot and coins, the alarm meter, lives
// and score. step() advances one fixed step and returns what happened as bit
// flags, so the caller can react without the world knowing about screens or
// sound. Nothing here allocates after createWorld returns.

import { ALARM, FIELD, GUARD, LIVES, PLAYER, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { createAlarm, updateAlarm } from './alarm.js';
import { buyEmp, buySmoke, createCoin, createLoot, exitOpen, lootValue } from './loot.js';
import { cameraSees, createCamera, updateCamera } from './cameras.js';
import { createGuard, guardSees, updateGuard } from './guards.js';

export const EVENT_LOOT = 1;
export const EVENT_COIN = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;
export const EVENT_TOOL = 64;

/** True when the segment from (x1, y1) to (x2, y2) crosses any wall rectangle. */
export function lineBlockedByWalls(x1, y1, x2, y2, walls) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let s = 1; s < steps; s += 1) {
    const px = x1 + ((x2 - x1) * s) / steps;
    const py = y1 + ((y2 - y1) * s) / steps;
    for (let i = 0; i < walls.length; i += 1) {
      const w = walls[i];
      if (px > w.x && px < w.x + w.w && py > w.y && py < w.y + w.h) return true;
    }
  }
  return false;
}

function circleHitsWall(x, y, radius, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    const nearestX = Math.max(w.x, Math.min(x, w.x + w.w));
    const nearestY = Math.max(w.y, Math.min(y, w.y + w.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/** Move a circle by (dx, dy), sliding along walls instead of passing through them. */
export function moveCircle(body, dx, dy, radius, walls) {
  const nextX = body.x + dx;
  if (!circleHitsWall(nextX, body.y, radius, walls)) body.x = nextX;
  const nextY = body.y + dy;
  if (!circleHitsWall(body.x, nextY, radius, walls)) body.y = nextY;
}

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: LEVELS[0],
    player: { x: 0, y: 0 },
    guards: [],
    cameras: [],
    loot: [],
    coins: [],
    alarm: createAlarm(),
    score: 0,
    scoreAtLevelStart: 0,
    coins: 50,
    lives: LIVES,
    time: 0,
    levelTime: 0,
    empLeft: 0,
    smokeLeft: 0,
    playerSmokeTime: PLAYER.smokeTime,
    totalLoot: 0,
    levelsCleared: 0,
    message: '',
    messageLeft: 0,
  };

  function loadLevel(index) {
    const def = LEVELS[index];
    state.levelIndex = index;
    state.level = def;
    state.player.x = def.spawn.x;
    state.player.y = def.spawn.y;
    state.guards = def.guards.map((g) => createGuard(g));
    state.cameras = def.cameras.map((c, i) => createCamera(c, i));
    state.loot = def.loot.map((l) => createLoot(l));
    state.coins = def.coins.map((c) => createCoin(c));
    state.alarm.value = 0;
    state.levelTime = 0;
    state.empLeft = 0;
    state.smokeLeft = 0;
    state.scoreAtLevelStart = state.score;
    state.message = def.hint;
    state.messageLeft = 6;
  }

  function reset() {
    state.score = 0;
    state.cash = 50;
    state.lives = LIVES;
    state.time = 0;
    state.totalLoot = 0;
    state.levelsCleared = 0;
    state.alarm = createAlarm();
    loadLevel(0);
  }

  function say(text, seconds) {
    state.message = text;
    state.messageLeft = seconds;
  }

  /** Vision cones as circles, for the autopilot's pathfinding to steer around. */
  function dangerZones() {
    const zones = [];
    for (let i = 0; i < state.guards.length; i += 1) {
      const g = state.guards[i];
      zones.push({
        x: g.x + Math.cos(g.angle) * GUARD.sight * 0.55,
        y: g.y + Math.sin(g.angle) * GUARD.sight * 0.55,
        radius: GUARD.sight * 0.62,
        weight: 40,
      });
    }
    for (let i = 0; i < state.cameras.length; i += 1) {
      const c = state.cameras[i];
      if (c.offLeft > 0) continue;
      zones.push({
        x: c.x + Math.cos(c.angle) * 185 * 0.55,
        y: c.y + Math.sin(c.angle) * 185 * 0.55,
        radius: 185 * 0.62,
        weight: 40,
      });
    }
    return zones;
  }

  /**
   * One fixed step. `move` is {x, y} in -1..1; `useEmp` and `useSmoke` are
   * one-shot tool requests. With `harmless` set (the title screen's backdrop)
   * the thief still walks, but nothing is spotted, scored or caught.
   */
  function step(dt, move, useEmp, useSmoke, harmless) {
    let events = 0;
    const walls = state.level.walls;
    state.time += dt;
    state.levelTime += dt;
    if (state.messageLeft > 0) state.messageLeft -= dt;
    if (state.empLeft > 0) state.empLeft -= dt;
    if (state.smokeLeft > 0) state.smokeLeft -= dt;

    const length = Math.hypot(move.x, move.y) || 1;
    const nx = move.x / length;
    const ny = move.y / length;
    const speed = PLAYER.speed * (Math.hypot(move.x, move.y) > 0.1 ? 1 : 0);
    moveCircle(state.player, nx * speed * dt, ny * speed * dt, PLAYER.radius, walls);

    if (!harmless) {
      if (useEmp && buyEmp(state)) {
        events |= EVENT_TOOL;
        say('EMP burst — every camera is dark.', 2.5);
      }
      if (useSmoke && buySmoke(state)) {
        events |= EVENT_TOOL;
        say('Smoke — you are hidden while it lasts.', 2.5);
      }
    }

    const hidden = state.smokeLeft > 0;
    let seenByGuard = false;
    let seenByCamera = false;
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      const sees = !hidden && !harmless && guardSees(guard, state.player.x, state.player.y, walls);
      updateGuard(guard, dt, state.player, walls, sees);
      if (sees) seenByGuard = true;
    }
    for (let i = 0; i < state.cameras.length; i += 1) {
      const camera = state.cameras[i];
      updateCamera(camera, dt, state.time);
      if (!hidden && !harmless && cameraSees(camera, state.player.x, state.player.y, walls)) seenByCamera = true;
    }

    if (!harmless) {
      if (updateAlarm(state.alarm, dt, seenByGuard, seenByCamera) === 'caught') {
        events |= EVENT_CAUGHT;
        state.lives -= 1;
        if (state.lives <= 0) {
          events |= EVENT_OVER;
          return events;
        }
        state.score = state.scoreAtLevelStart;
        loadLevel(state.levelIndex);
        say('CAUGHT! The crew drags you back to the door.', 3);
        return events;
      }
    }

    if (!harmless) {
      for (let i = 0; i < state.loot.length; i += 1) {
        const item = state.loot[i];
        if (item.taken) continue;
        const dx = item.x - state.player.x;
        const dy = item.y - state.player.y;
        if (dx * dx + dy * dy < 30 * 30) {
          item.taken = true;
          state.score += item.value;
          events |= EVENT_LOOT;
          say(item.main ? `TARGET SECURED — ${item.name}! Get to the exit.` : `${item.name} +$${item.value}`, 2.5);
        }
      }
      for (let i = 0; i < state.coins.length; i += 1) {
        const coin = state.coins[i];
        if (coin.taken) continue;
        const dx = coin.x - state.player.x;
        const dy = coin.y - state.player.y;
        if (dx * dx + dy * dy < 26 * 26) {
          coin.taken = true;
          state.cash += TOOLS.coinValue;
          events |= EVENT_COIN;
        }
      }
      const exit = state.level.exit;
      const edx = exit.x - state.player.x;
      const edy = exit.y - state.player.y;
      if (edx * edx + edy * edy < 30 * 30) {
        if (!exitOpen(state.loot)) {
          say('Locked — the main target is still inside.', 1.5);
        } else {
          const bonus = Math.max(0, Math.round((state.level.par - state.levelTime) * 10));
          state.score += bonus;
          state.totalLoot += lootValue(state.loot);
          state.levelsCleared += 1;
          events |= EVENT_LEVEL;
          if (state.levelIndex + 1 >= LEVELS.length) {
            events |= EVENT_WIN;
            return events;
          }
          loadLevel(state.levelIndex + 1);
          say(`Clean getaway — time bonus +$${bonus}.`, 3);
          return events;
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, loadLevel, dangerZones };
}
