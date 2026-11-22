// The alarm meter. Being watched fills it fast; hiding lets it drain slowly.
// At 100 the run of the level is over: the thief is caught, loses a life, and
// restarts the level from its door with the meter empty. The meter remembers
// its peak, because the final rating is graded on the loudest moment.

import { ALARM } from './config.js';

export function createAlarm() {
  return { value: 0, peak: 0, caught: 0 };
}

/**
 * Advance the meter one step. `seenByGuard` and `seenByCamera` say whether any
 * guard or camera has the thief in sight right now. Returns 'caught' the
 * moment the meter fills, otherwise null.
 */
export function updateAlarm(alarm, dt, seenByGuard, seenByCamera) {
  if (seenByGuard) alarm.value += ALARM.guardRate * dt;
  if (seenByCamera) alarm.value += ALARM.cameraRate * dt;
  if (!seenByGuard && !seenByCamera) alarm.value -= ALARM.decay * dt;
  if (alarm.value < 0) alarm.value = 0;
  if (alarm.value > alarm.peak) alarm.peak = alarm.value;
  if (alarm.value >= ALARM.caughtAt) {
    alarm.value = ALARM.caughtAt;
    alarm.caught += 1;
    return 'caught';
  }
  return null;
}

/** The thief's final rating from the whole run: how loud the loudest moment was. */
export function finalRating(peak, caught) {
  if (caught > 0) return 'CAUGHT';
  if (peak < 25) return 'GHOST';
  if (peak < 60) return 'SHADOW';
  return 'LOUD';
}
