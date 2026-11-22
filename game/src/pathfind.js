// Grid pathfinding for the autopilot (and any thief that asks for a route).
// The playfield is cut into TILE cells; a cell is blocked when a wall covers its
// centre, and a cell inside a live vision cone costs extra, so the route prefers
// the shadows. Plain breadth-first search, cheapest route first by steps.

import { FIELD, TILE } from './config.js';

const COLS = Math.ceil(FIELD.width / TILE);
const ROWS = Math.ceil(FIELD.height / TILE);

function cellBlocked(walls, col, row) {
  const cx = col * TILE + TILE / 2;
  const cy = row * TILE + TILE / 2;
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    // Non-strict: a cell centre exactly on a wall edge counts as inside the wall.
    if (cx >= w.x && cx <= w.x + w.w && cy >= w.y && cy <= w.y + w.h) return true;
  }
  return false;
}

/** True when the segment from (x1, y1) to (x2, y2) passes too close to any wall for a body to follow. */
function lineHitsWall(x1, y1, x2, y2, walls) {
  const CLEAR = 12;
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let s = 1; s < steps; s += 1) {
    const px = x1 + ((x2 - x1) * s) / steps;
    const py = y1 + ((y2 - y1) * s) / steps;
    for (let i = 0; i < walls.length; i += 1) {
      const w = walls[i];
      if (px > w.x - CLEAR && px < w.x + w.w + CLEAR && py > w.y - CLEAR && py < w.y + w.h + CLEAR) return true;
    }
  }
  return false;
}

function cellDanger(danger, col, row) {
  if (!danger) return 0;
  const cx = col * TILE + TILE / 2;
  const cy = row * TILE + TILE / 2;
  let cost = 0;
  for (let i = 0; i < danger.length; i += 1) {
    const d = danger[i];
    const dx = cx - d.x;
    const dy = cy - d.y;
    if (dx * dx + dy * dy < d.radius * d.radius) cost += d.weight;
  }
  return cost;
}

/**
 * Find a walkable route from (sx, sy) to (tx, ty). `walls` are the level's wall
 * rectangles; `danger` is an optional list of {x, y, radius, weight} vision
 * cones to steer around. Returns pixel waypoints, or null when no route exists.
 */
export function findPath(sx, sy, tx, ty, walls, danger) {
  const startCol = Math.max(0, Math.min(COLS - 1, Math.floor(sx / TILE)));
  const startRow = Math.max(0, Math.min(ROWS - 1, Math.floor(sy / TILE)));
  const goalCol = Math.max(0, Math.min(COLS - 1, Math.floor(tx / TILE)));
  const goalRow = Math.max(0, Math.min(ROWS - 1, Math.floor(ty / TILE)));
  const startKey = startRow * COLS + startCol;
  const goalKey = goalRow * COLS + goalCol;
  if (startKey === goalKey) return [{ x: tx, y: ty }];

  const cameFrom = new Int32Array(COLS * ROWS).fill(-1);
  const costSoFar = new Float64Array(COLS * ROWS).fill(Infinity);
  const queue = [startKey];
  const queued = new Uint8Array(COLS * ROWS);
  queued[startKey] = 1;
  costSoFar[startKey] = 0;
  let head = 0;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  while (head < queue.length) {
    const current = queue[head];
    head += 1;
    if (current === goalKey) break;
    const col = current % COLS;
    const row = Math.floor(current / COLS);
    for (let d = 0; d < DIRS.length; d += 1) {
      const nc = col + DIRS[d][0];
      const nr = row + DIRS[d][1];
      if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
      const next = nr * COLS + nc;
      if (queued[next] || cellBlocked(walls, nc, nr)) continue;
      const stepCost = 1 + cellDanger(danger, nc, nr);
      const nextCost = costSoFar[current] + stepCost;
      if (nextCost >= costSoFar[next]) continue;
      costSoFar[next] = nextCost;
      cameFrom[next] = current;
      queued[next] = 1;
      queue.push(next);
    }
  }
  if (!queued[goalKey] || cameFrom[goalKey] === -1) return null;

  const cells = [];
  let cursor = goalKey;
  while (cursor !== startKey) {
    cells.push(cursor);
    cursor = cameFrom[cursor];
  }
  cells.reverse();
  const points = cells.map((key) => ({
    x: (key % COLS) * TILE + TILE / 2,
    y: Math.floor(key / COLS) * TILE + TILE / 2,
  }));
  points.push({ x: tx, y: ty });
  // Straighten the route: drop a waypoint when the next one is reachable in a
  // line. The walker's own spot is the first point, so the first leg is
  // checked too — a route that cuts a wall corner would strand the walker
  // pushing at the wall forever.
  const raw = [{ x: sx, y: sy }, ...points];
  const straight = [raw[0]];
  for (let i = 1; i < raw.length; i += 1) {
    const last = straight[straight.length - 1];
    const next = raw[i];
    if (lineHitsWall(last.x, last.y, next.x, next.y, walls)) straight.push(raw[i - 1]);
  }
  straight.push(raw[raw.length - 1]);
  straight.shift();
  return straight;
}
