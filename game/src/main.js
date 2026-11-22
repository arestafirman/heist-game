// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between five screens: title, play,
// paused, busted and clean getaway.
//
// ?seed=N fixes the game. ?shot=start|play|end|caught (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { EVENT_CAUGHT, EVENT_COIN, EVENT_LEVEL, EVENT_LOOT, EVENT_OVER, EVENT_TOOL, EVENT_WIN, createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_EMP, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, null);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (clientX, clientY) => {
    const ratio = window.devicePixelRatio || 1;
    const view = renderer.view;
    return {
      x: (clientX * ratio - view.x) / view.scale,
      y: (clientY * ratio - view.y) / view.scale,
    };
  });
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  // Tool presses are stashed here: handleActions takes them once, step() spends them.
  let pendingTools = 0;

  // Screen readers (and anyone watching the page's text) hear the screen changes and each catch.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Playing. Three levels. Steal the targets and reach the exit.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(won ? `Clean getaway. Score ${world.state.score}.` : `Busted. Score ${world.state.score}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    pendingTools |= actions & (ACTION_EMP | ACTION_SMOKE);
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, false, false, true);
      return;
    }
    const actions = pendingTools;
    pendingTools = 0;
    const move = input.direction(world.state.player);
    const events = world.step(STEP, move, !!(actions & ACTION_EMP), !!(actions & ACTION_SMOKE), false);
    audio.alarmPulse(world.state.alarm.value);
    if (events & EVENT_LOOT) audio.loot();
    else if (events & EVENT_COIN) audio.coin();
    else if (events & EVENT_TOOL) audio.tool();
    if (events & EVENT_CAUGHT) {
      audio.caught();
      announce('Caught! The alarm filled. A life is gone.');
    }
    if (events & EVENT_LEVEL) audio.levelClear();
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    const alarm = world.state.alarm.value;
    const flash = screen === SCREEN_PLAY && alarm > 65 ? (alarm - 65) / 100 * 0.28 : 0;
    renderer.draw(world.state, screen, best, flash ? { flash } : null);
  }

  // Leaving the tab pauses a running game rather than letting the alarm fill unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyM') {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
  });

  announce('VAULTBREAK. Press Space or click to start the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
