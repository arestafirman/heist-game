// Sound, synthesised with WebAudio — no audio files. Short blips for loot and
// coins, a low alarm pulse while the meter is high, and a two-note sting when
// the thief is caught. Everything is quiet until the first user gesture.

export function createAudio() {
  let context = null;
  let muted = false;
  let alarmTimer = null;

  function ensure() {
    if (!context) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        context = new AudioContext();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume();
    return context;
  }

  function tone(freq, seconds, type, gain) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain || 0.08, ctx.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    coin() {
      tone(1180, 0.09, 'sine', 0.05);
      setTimeout(() => tone(1560, 0.12, 'sine', 0.05), 60);
    },
    loot() {
      tone(660, 0.12, 'triangle', 0.08);
      setTimeout(() => tone(880, 0.16, 'triangle', 0.08), 90);
      setTimeout(() => tone(1320, 0.2, 'triangle', 0.07), 180);
    },
    tool() {
      tone(220, 0.25, 'square', 0.04);
      setTimeout(() => tone(440, 0.2, 'square', 0.04), 120);
    },
    caught() {
      tone(196, 0.4, 'sawtooth', 0.09);
      setTimeout(() => tone(147, 0.5, 'sawtooth', 0.09), 250);
    },
    levelClear() {
      tone(523, 0.14, 'triangle', 0.08);
      setTimeout(() => tone(659, 0.14, 'triangle', 0.08), 130);
      setTimeout(() => tone(784, 0.22, 'triangle', 0.08), 260);
    },
    /** A soft pulse every 0.7 s while the alarm is hot; call with the meter value. */
    alarmPulse(value) {
      if (value < 40 || muted) return;
      const now = Date.now();
      if (alarmTimer && now - alarmTimer < 700) return;
      alarmTimer = now;
      tone(value > 75 ? 880 : 660, 0.1, 'square', 0.03);
    },
  };
}
