/**
 * Duolingo-style Sound Synthesizer via Native Web Audio API
 * 100% zero-dependency, zero network latency, works offline across mobile & web.
 */

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

/**
 * Signature Duolingo-style ascending success chime:
 * Plays an upbeat, energetic major arpeggio (C5 -> E5 -> G5 -> C6) with warm bell harmonics.
 */
export const playCorrectSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, time: 0.00, dur: 0.12 }, // C5
      { freq: 659.25, time: 0.09, dur: 0.12 }, // E5
      { freq: 783.99, time: 0.18, dur: 0.14 }, // G5
      { freq: 1046.50, time: 0.27, dur: 0.35 } // C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      // Attack and release envelope
      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (e) {
    console.warn('[duoAudio] Correct sound error:', e);
  }
};

/**
 * Gentle two-tone incorrect drop (not harsh or jarring):
 * Plays a muted F4 -> Db4 descending tone with subtle low-pass warmth.
 */
export const playWrongSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const notes = [
      { freq: 349.23, time: 0.00, dur: 0.14 }, // F4
      { freq: 277.18, time: 0.12, dur: 0.26 }  // Db4
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.28, now + time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (e) {
    console.warn('[duoAudio] Wrong sound error:', e);
  }
};

/**
 * Heart Lost / Break sound: Hollow pop + descending shimmer
 */
export const playHeartLostSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn('[duoAudio] Heart sound error:', e);
  }
};

/**
 * Combo Fire sound: High energy sparkly chime for 3+ in a row
 */
export const playComboSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (idx * 0.05));

      gain.gain.setValueAtTime(0.001, now + (idx * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.3, now + (idx * 0.05) + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (idx * 0.05) + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + (idx * 0.05));
      osc.stop(now + (idx * 0.05) + 0.25);
    });
  } catch (e) {
    console.warn('[duoAudio] Combo sound error:', e);
  }
};

/**
 * End-of-Lesson Celebration Fanfare:
 * Triumphant chords with sparkle for the victory screen.
 */
export const playCelebrationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const sequence = [
      { freq: 523.25, time: 0.00, dur: 0.15 }, // C5
      { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
      { freq: 783.99, time: 0.24, dur: 0.15 }, // G5
      { freq: 1046.50, time: 0.38, dur: 0.45 }, // C6
      { freq: 1318.51, time: 0.50, dur: 0.55 }  // E6
    ];

    sequence.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + time);

      gain.gain.setValueAtTime(0.001, now + time);
      gain.gain.exponentialRampToValueAtTime(0.35, now + time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (e) {
    console.warn('[duoAudio] Celebration sound error:', e);
  }
};

