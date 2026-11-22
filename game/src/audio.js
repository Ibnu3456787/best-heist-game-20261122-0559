// THE GILDED FOX — sound. Everything is synthesized with WebAudio: no
// audio files, no network. A soft bass pulse keeps the night tense, and
// each event has its own voice — the coin's clink, the case's click, the
// alarm's sting. Audio starts on the first user gesture (browsers insist)
// and M mutes it. With no AudioContext the game plays silent, never broken.
let context = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A low, minor bass line — the night's pulse. Frequencies are A1, C2, E2, G1.
const BASS = [55, 65.41, 82.41, 49];

function ensureContext() {
  if (context) return context;
  const AudioContextClass = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  try {
    context = new AudioContextClass();
  } catch {
    context = null;
  }
  return context;
}

/** Start audio (call from a user gesture) and begin the bass pulse. */
export function startAudio() {
  const ctx = ensureContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  if (musicTimer !== null) return;
  musicTimer = globalThis.setInterval(() => {
    if (muted || !context) return;
    tone(BASS[musicStep % BASS.length], 0.42, 'sine', 0.05);
    musicStep += 1;
  }, 480);
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function tone(frequency, seconds, type, gain, when = 0) {
  const ctx = ensureContext();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  const t = ctx.currentTime + when;
  amp.gain.setValueAtTime(0.0001, t);
  amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0002), t + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.05);
}

/** Play one named effect. Unknown names do nothing. */
export function playSound(name) {
  if (muted) return;
  switch (name) {
    case 'click':
      tone(660, 0.07, 'triangle', 0.06);
      break;
    case 'coin':
      tone(1568, 0.09, 'sine', 0.08);
      tone(2093, 0.12, 'sine', 0.06, 0.07);
      break;
    case 'smoke':
      tone(220, 0.25, 'sawtooth', 0.03);
      break;
    case 'emp':
      tone(1200, 0.1, 'square', 0.05);
      tone(300, 0.25, 'square', 0.05, 0.08);
      break;
    case 'case-open':
      tone(880, 0.1, 'triangle', 0.08);
      tone(1174, 0.14, 'triangle', 0.08, 0.09);
      break;
    case 'loot':
      tone(784, 0.12, 'triangle', 0.09);
      tone(988, 0.12, 'triangle', 0.09, 0.1);
      tone(1319, 0.2, 'triangle', 0.09, 0.2);
      break;
    case 'suspicious':
      tone(440, 0.14, 'square', 0.04);
      break;
    case 'alert':
      tone(392, 0.12, 'square', 0.06);
      tone(311, 0.16, 'square', 0.06, 0.11);
      break;
    case 'laser':
      tone(1800, 0.16, 'sawtooth', 0.05);
      break;
    case 'lockdown':
      tone(233, 0.3, 'sawtooth', 0.07);
      tone(233, 0.3, 'sawtooth', 0.07, 0.35);
      break;
    case 'escaped':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.09, i * 0.12));
      break;
    case 'busted':
      tone(220, 0.4, 'sawtooth', 0.07);
      tone(165, 0.5, 'sawtooth', 0.07, 0.3);
      break;
    default:
      break;
  }
}
