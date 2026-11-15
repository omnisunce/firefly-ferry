// Synthesised sound for Firefly Ferry — no audio files, no network.
// One job: tiny WebAudio plucks and thuds, created on first player input.

export function createAudio() {
  let context = null;
  let muted = false;
  let master = null;

  function ensure() {
    if (context) return true;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = 0.16;
      master.connect(context.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, slideTo, volume) {
    if (muted || !ensure()) return;
    if (context.state === 'suspended') context.resume();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
    gain.gain.setValueAtTime(volume ?? 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
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
    collect(combo) {
      const base = 660 + Math.min(combo, 5) * 70;
      tone(base, 0.16, 'sine', base * 1.5, 0.5);
      tone(base * 2, 0.1, 'triangle', null, 0.18);
    },
    deliver() {
      tone(523, 0.14, 'triangle', null, 0.5);
      setTimeout(() => tone(659, 0.14, 'triangle', null, 0.5), 90);
      setTimeout(() => tone(784, 0.28, 'triangle', null, 0.55), 180);
    },
    bump() {
      tone(140, 0.22, 'sawtooth', 70, 0.5);
    },
    dash() {
      tone(300, 0.18, 'sine', 900, 0.3);
    },
    levelUp() {
      tone(440, 0.12, 'triangle', null, 0.45);
      setTimeout(() => tone(587, 0.12, 'triangle', null, 0.45), 100);
      setTimeout(() => tone(880, 0.24, 'triangle', null, 0.5), 200);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', null, 0.5), i * 130));
    },
    lose() {
      tone(330, 0.3, 'sine', 220, 0.45);
      setTimeout(() => tone(220, 0.5, 'sine', 147, 0.45), 220);
    },
  };
}
