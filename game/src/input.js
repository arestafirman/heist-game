// Keyboard and pointer input. Held keys give a steering direction; one-shot
// presses (start, pause, EMP, smoke) are queued as bit flags and taken once by
// the loop, so a press between two frames is never lost and never counted
// twice. Clicking the floor steers the thief toward that spot instead.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_EMP = 4;
export const ACTION_SMOKE = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const EMP = new Set(['Digit1']);
const SMOKE = new Set(['Digit2']);

export function createInput(target, toWorld) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let actions = 0;
  let clickTarget = null;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (EMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_EMP;
    } else if (SMOKE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_SMOKE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
  });
  target.addEventListener('pointerdown', (event) => {
    const point = toWorld(event.clientX, event.clientY);
    if (point) clickTarget = point;
    actions |= ACTION_CONFIRM;
  });

  return {
    /** Steering direction {x, y}, each in -1..1: keys first, else toward the last click. */
    direction(player) {
      const kx = (right ? 1 : 0) - (left ? 1 : 0);
      const ky = (down ? 1 : 0) - (up ? 1 : 0);
      if (kx !== 0 || ky !== 0) {
        clickTarget = null;
        return { x: kx, y: ky };
      }
      if (clickTarget) {
        const dx = clickTarget.x - player.x;
        const dy = clickTarget.y - player.y;
        if (Math.hypot(dx, dy) < 12) {
          clickTarget = null;
          return { x: 0, y: 0 };
        }
        return { x: dx, y: dy };
      }
      return { x: 0, y: 0 };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
