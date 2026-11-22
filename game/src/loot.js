// Loot and tools. Loot is what the heist is for: paintings, gold, a diamond, a
// crown — each with a value that feeds the score. Coins are the working cash:
// spend them on an EMP burst that kills every camera for a few seconds, or on
// a smoke bomb that hides the thief inside its cloud. The exit stays locked
// until the level's main target is in the bag.

import { TOOLS } from './config.js';

export function createLoot(def) {
  return { x: def.x, y: def.y, kind: def.kind, name: def.name, value: def.value, main: !!def.main, taken: false };
}

export function createCoin(def) {
  return { x: def.x, y: def.y, taken: false };
}

/** The main target of this level, or null when it is already taken. */
export function mainTarget(loot) {
  for (let i = 0; i < loot.length; i += 1) if (loot[i].main) return loot[i];
  return null;
}

/** True when the exit may open: the main target is in the bag. */
export function exitOpen(loot) {
  const target = mainTarget(loot);
  return target === null || target.taken;
}

/** Loot value carried so far, in dollars. */
export function lootValue(loot) {
  let sum = 0;
  for (let i = 0; i < loot.length; i += 1) if (loot[i].taken) sum += loot[i].value;
  return sum;
}

export function lootTakenCount(loot) {
  let count = 0;
  for (let i = 0; i < loot.length; i += 1) if (loot[i].taken) count += 1;
  return count;
}

/**
 * Try to buy an EMP burst. Returns true when the coins were spent and every
 * camera goes dark for TOOLS.empTime seconds.
 */
export function buyEmp(state) {
  if (state.cash < TOOLS.empCost) return false;
  state.cash -= TOOLS.empCost;
  for (let i = 0; i < state.cameras.length; i += 1) state.cameras[i].offLeft = TOOLS.empTime;
  state.empLeft = TOOLS.empTime;
  return true;
}

/** Try to buy a smoke bomb. Returns true when the coins were spent and the thief is hidden. */
export function buySmoke(state) {
  if (state.cash < TOOLS.smokeCost) return false;
  state.cash -= TOOLS.smokeCost;
  state.smokeLeft = state.playerSmokeTime;
  return true;
}
