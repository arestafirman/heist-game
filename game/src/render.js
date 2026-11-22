// Drawing only: the world's state and the current screen in, pixels out. The
// 1280x720 playfield is scaled to fit the window and centred. Vision cones are
// painted under the walls, so cover reads as cover; the HUD always shows the
// level, the loot, the coins, the tools and the alarm meter, because a heist
// is won by reading those numbers before moving.

import { CAMERA, FIELD, FONT, GUARD, PALETTE, PLAYER, TILE, TOOLS } from './config.js';
import { exitOpen } from './loot.js';
import { finalRating } from './alarm.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const PANEL = { width: 660, top: 150, line: 32, bottom: 76 };

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('SCORE $');
  const coinLabel = cachedLabel('◉ ');
  const lootLabel = cachedLabel('LOOT ');
  const alarmLabel = cachedLabel('');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, bold) {
    const key = size + (bold ? 'b' : '');
    if (!fonts.has(key)) fonts.set(key, `${bold ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.fillText(value, x, y);
  }

  function cone(x, y, angle, halfAngle, range, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(x, y);
    context.arc(x, y, range, angle - halfAngle, angle + halfAngle);
    context.closePath();
    context.fill();
  }

  function drawFloor(state) {
    for (let row = 0; row < FIELD.height / TILE; row += 1) {
      for (let col = 0; col < FIELD.width / TILE; col += 1) {
        context.fillStyle = (row + col) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        context.fillRect(col * TILE, row * TILE, TILE, TILE);
      }
    }
    context.strokeStyle = PALETTE.floorTrim;
    context.lineWidth = 1;
    for (let x = 0; x <= FIELD.width; x += TILE) {
      context.beginPath();
      context.moveTo(x + 0.5, 0);
      context.lineTo(x + 0.5, FIELD.height);
      context.stroke();
    }
    for (let y = 0; y <= FIELD.height; y += TILE) {
      context.beginPath();
      context.moveTo(0, y + 0.5);
      context.lineTo(FIELD.width, y + 0.5);
      context.stroke();
    }
  }

  function drawCones(state) {
    for (let i = 0; i < state.cameras.length; i += 1) {
      const camera = state.cameras[i];
      if (camera.offLeft > 0) continue;
      cone(camera.x, camera.y, camera.angle, CAMERA.halfAngle, CAMERA.sight, PALETTE.coneCamera);
    }
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      const fill = guard.alert > 0.4 ? PALETTE.coneAlert : PALETTE.coneCalm;
      cone(guard.x, guard.y, guard.angle, GUARD.halfAngle, GUARD.sight, fill);
    }
  }

  function drawWalls(state) {
    const walls = state.level.walls;
    for (let i = 0; i < walls.length; i += 1) {
      const w = walls[i];
      context.fillStyle = PALETTE.wall;
      context.fillRect(w.x, w.y, w.w, w.h);
      context.fillStyle = PALETTE.wallTop;
      context.fillRect(w.x, w.y, w.w, 4);
      context.strokeStyle = PALETTE.wallEdge;
      context.lineWidth = 1;
      context.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
    }
  }

  function drawExit(state) {
    const exit = state.level.exit;
    const open = exitOpen(state.loot);
    context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    context.beginPath();
    context.arc(exit.x, exit.y, 26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#0b0d12';
    context.beginPath();
    context.arc(exit.x, exit.y, 19, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = open ? PALETTE.exit : PALETTE.exitLocked;
    context.beginPath();
    context.arc(exit.x, exit.y, 14, 0, Math.PI * 2);
    context.fill();
    text(open ? 'EXIT' : 'LOCK', exit.x, exit.y - 34, 15, open ? PALETTE.exit : PALETTE.muted, 'center', true);
    if (!open) text('take the target', exit.x, exit.y + 44, 12, PALETTE.muted, 'center');
  }

  function drawLoot(state) {
    for (let i = 0; i < state.loot.length; i += 1) {
      const item = state.loot[i];
      if (item.taken) continue;
      if (item.kind === 'painting') {
        context.fillStyle = '#8a6d2f';
        context.fillRect(item.x - 20, item.y - 14, 40, 28);
        context.fillStyle = item.main ? '#ff5db1' : '#7fb3ff';
        context.fillRect(item.x - 16, item.y - 10, 32, 20);
        context.strokeStyle = PALETTE.loot;
        context.lineWidth = 2;
        context.strokeRect(item.x - 20, item.y - 14, 40, 28);
      } else if (item.kind === 'diamond') {
        context.fillStyle = '#b8f4ff';
        context.beginPath();
        context.moveTo(item.x, item.y - 16);
        context.lineTo(item.x + 14, item.y);
        context.lineTo(item.x, item.y + 16);
        context.lineTo(item.x - 14, item.y);
        context.closePath();
        context.fill();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2;
        context.stroke();
      } else if (item.kind === 'gold') {
        context.fillStyle = PALETTE.loot;
        context.fillRect(item.x - 14, item.y - 7, 28, 14);
        context.fillStyle = '#fff3b0';
        context.fillRect(item.x - 14, item.y - 7, 28, 4);
      } else {
        context.fillStyle = PALETTE.loot;
        context.beginPath();
        context.moveTo(item.x - 14, item.y + 8);
        context.lineTo(item.x - 14, item.y - 6);
        context.lineTo(item.x - 7, item.y - 12);
        context.lineTo(item.x, item.y - 4);
        context.lineTo(item.x + 7, item.y - 12);
        context.lineTo(item.x + 14, item.y - 6);
        context.lineTo(item.x + 14, item.y + 8);
        context.closePath();
        context.fill();
      }
      if (item.main) {
        text('★ TARGET', item.x, item.y - 26, 13, PALETTE.lootMain, 'center', true);
      } else {
        text(`$${item.value}`, item.x, item.y + 30, 12, PALETTE.muted, 'center');
      }
    }
    for (let i = 0; i < state.coins.length; i += 1) {
      const coin = state.coins[i];
      if (coin.taken) continue;
      context.fillStyle = PALETTE.coin;
      context.beginPath();
      context.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff3b0';
      context.beginPath();
      context.arc(coin.x - 2, coin.y - 2, 2.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawGuards(state) {
    for (let i = 0; i < state.guards.length; i += 1) {
      const guard = state.guards[i];
      context.strokeStyle = 'rgba(255, 180, 84, 0.35)';
      context.setLineDash([4, 6]);
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(guard.waypoints[0].x, guard.waypoints[0].y);
      for (let p = 1; p < guard.waypoints.length; p += 1) context.lineTo(guard.waypoints[p].x, guard.waypoints[p].y);
      context.stroke();
      context.setLineDash([]);
      const body = guard.alert > 0.4 ? PALETTE.guard : PALETTE.guardCalm;
      context.fillStyle = body;
      context.beginPath();
      context.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#1a1d24';
      context.beginPath();
      context.arc(guard.x + Math.cos(guard.angle) * 7, guard.y + Math.sin(guard.angle) * 7, 5, 0, Math.PI * 2);
      context.fill();
      if (guard.alert > 0.4) text('!', guard.x, guard.y - 22, 20, PALETTE.danger, 'center', true);
    }
  }

  function drawCameras(state) {
    for (let i = 0; i < state.cameras.length; i += 1) {
      const camera = state.cameras[i];
      context.fillStyle = camera.offLeft > 0 ? '#5a6274' : PALETTE.camera;
      context.beginPath();
      context.arc(camera.x, camera.y, 10, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#1a1d24';
      context.beginPath();
      context.arc(camera.x + Math.cos(camera.angle) * 5, camera.y + Math.sin(camera.angle) * 5, 4, 0, Math.PI * 2);
      context.fill();
      if (camera.offLeft > 0) text('OFF', camera.x, camera.y - 16, 11, PALETTE.muted, 'center', true);
    }
  }

  function drawPlayer(state) {
    const player = state.player;
    if (state.smokeLeft > 0) {
      context.fillStyle = PALETTE.smoke;
      context.beginPath();
      context.arc(player.x, player.y, 34, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = PALETTE.player;
    context.beginPath();
    context.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = PALETTE.playerRing;
    context.lineWidth = 2;
    context.stroke();
    context.fillStyle = '#0b0d12';
    context.beginPath();
    context.arc(player.x - 4, player.y - 3, 2.5, 0, Math.PI * 2);
    context.arc(player.x + 4, player.y - 3, 2.5, 0, Math.PI * 2);
    context.fill();
  }

  function drawHud(state) {
    context.fillStyle = 'rgba(11, 13, 18, 0.92)';
    context.fillRect(0, 0, FIELD.width, 56);
    context.fillStyle = PALETTE.panelEdge;
    context.fillRect(0, 56, FIELD.width, 2);
    context.textBaseline = 'top';
    const level = state.level;
    text(`LV ${level.id} · ${level.name}`, 20, 12, 20, PALETTE.text, 'left', true);
    text(level.sub, 20, 36, 13, PALETTE.muted, 'left');
    const taken = state.loot.filter((l) => l.taken).length;
    text(lootLabel(`${taken}/${state.loot.length}`), 470, 16, 18, PALETTE.loot, 'left', true);
    // Alarm meter, centre-right.
    const meterX = 640;
    const meterW = 240;
    text('ALARM', meterX, 14, 14, state.alarm.value > 60 ? PALETTE.alarm : PALETTE.muted, 'left', true);
    context.fillStyle = PALETTE.alarmTrack;
    context.fillRect(meterX + 62, 14, meterW, 16);
    const fillW = Math.max(0, Math.min(1, state.alarm.value / 100)) * meterW;
    context.fillStyle = state.alarm.value > 60 ? PALETTE.alarm : state.alarm.value > 25 ? '#ffb454' : PALETTE.good;
    context.fillRect(meterX + 62, 14, fillW, 16);
    context.strokeStyle = PALETTE.panelEdge;
    context.strokeRect(meterX + 62, 14, meterW, 16);
    text(`${Math.round(state.alarm.value)}%`, meterX + 62 + meterW + 8, 14, 15, PALETTE.text, 'left', true);
    text(coinLabel(state.cash), 1060, 12, 20, PALETTE.coin, 'left', true);
    text(scoreLabel(state.score), 1060, 34, 14, PALETTE.muted, 'left');
    // Lives.
    for (let i = 0; i < 3; i += 1) {
      context.fillStyle = i < state.lives ? '#ff5d7a' : PALETTE.alarmTrack;
      context.beginPath();
      context.arc(1230 - i * 26, 24, 8, 0, Math.PI * 2);
      context.fill();
    }
    // Tools, bottom-left.
    context.textBaseline = 'top';
    const empOk = state.cash >= TOOLS.empCost;
    const smokeOk = state.cash >= TOOLS.smokeCost;
    text(`[1] EMP $${TOOLS.empCost} — cameras dark ${TOOLS.empTime}s`, 20, FIELD.height - 52, 15, empOk ? PALETTE.text : PALETTE.muted, 'left', empOk);
    text(`[2] SMOKE $${TOOLS.smokeCost} — hidden ${PLAYER.smokeTime}s`, 20, FIELD.height - 30, 15, smokeOk ? PALETTE.text : PALETTE.muted, 'left', smokeOk);
    if (state.empLeft > 0) text(`EMP ${Math.ceil(state.empLeft)}s`, 330, FIELD.height - 52, 15, PALETTE.camera, 'left', true);
    if (state.smokeLeft > 0) text(`SMOKE ${Math.ceil(state.smokeLeft)}s`, 330, FIELD.height - 30, 15, PALETTE.player, 'left', true);
    // Message, bottom-centre.
    if (state.messageLeft > 0) {
      text(state.message, FIELD.width / 2, FIELD.height - 44, 16, PALETTE.text, 'center', true);
    }
    context.textBaseline = 'alphabetic';
  }

  function drawPanel(title, lines, prompt, accent) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(8, 10, 14, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = accent || PALETTE.panelEdge;
    context.lineWidth = 2;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.text, 'center', true);
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 22, PALETTE.loot, 'center', true);
  }

  const TITLE_LINES = [
    'Three rooms. Three targets. One quiet crew of one.',
    'Slip past the guards and the sweeping cameras —',
    'grab the loot, reach the exit before the alarm fills.',
    'Move WASD / arrows, or click the floor. 1 = EMP, 2 = smoke.',
    'Pause P · Mute M · Best score below.',
    '',
  ];

  /** Paint one frame: the room, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best, extra) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawFloor(state);
    drawCones(state);
    drawWalls(state);
    drawExit(state);
    drawLoot(state);
    drawGuards(state);
    drawCameras(state);
    drawPlayer(state);
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[5] = `Best $${best}`;
      drawPanel('VAULTBREAK', TITLE_LINES, 'Press Space or click to start the heist');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The guards will wait for you.'], 'Press P to keep stealing');
    } else if (screen === SCREEN_OVER) {
      const lines = [
        `Caught ${state.alarm.caught} time${state.alarm.caught === 1 ? '' : 's'} — the crew left you behind.`,
        `Score $${state.score} · Loot $${state.totalLoot} · Best $${best}`,
        '',
      ];
      drawPanel('BUSTED', lines, 'Press Space or click to try again', PALETTE.danger);
    } else if (screen === SCREEN_WIN) {
      const rating = finalRating(state.alarm.peak, state.alarm.caught);
      const lines = [
        `Rating  ${rating}   ·   Loudest alarm ${Math.round(state.alarm.peak)}%`,
        `Loot $${state.totalLoot} · Score $${state.score} · Best $${best}`,
        'All three targets secured. The crew is gone before dawn.',
        '',
      ];
      drawPanel('CLEAN GETAWAY', lines, 'Press Space or click to run it again', PALETTE.good);
    }
    if (extra && extra.flash) {
      context.fillStyle = `rgba(255, 40, 40, ${extra.flash})`;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, view };
}
