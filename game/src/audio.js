// Sound, synthesised in the browser with WebAudio — no audio files.
// The context is created on the first user gesture, so the game stays
// silent until the player touches it. Every effect is a short oscillator
// phrase; the alarm is a slow two-tone swell while the meter is hot.

let ctx = null;
let muted = false;
let alarmNodes = null;

export function setMuted(m) {
  muted = m;
  if (muted) stopAlarm();
}

export function isMuted() {
  return muted;
}

function audio() {
  if (ctx === null) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when) {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (when || 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function sfxClick() {
  tone(660, 0.07, 'triangle', 0.08);
}

export function sfxCoin() {
  tone(1180, 0.09, 'sine', 0.1);
  tone(1560, 0.12, 'sine', 0.08, 0.07);
}

export function sfxSmoke() {
  const ac = audio();
  if (!ac || muted) return;
  const t0 = ac.currentTime;
  const src = ac.createBufferSource();
  const buf = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.08, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
  src.connect(g);
  g.connect(ac.destination);
  src.start(t0);
}

export function sfxEmp() {
  tone(220, 0.3, 'sawtooth', 0.07);
  tone(110, 0.4, 'square', 0.05, 0.05);
}

export function sfxLaser() {
  tone(180, 0.25, 'square', 0.09);
  tone(90, 0.3, 'sawtooth', 0.06, 0.08);
}

export function sfxPick() {
  tone(880, 0.05, 'triangle', 0.07);
}

export function sfxLoot() {
  tone(523, 0.12, 'sine', 0.1);
  tone(659, 0.12, 'sine', 0.1, 0.1);
  tone(784, 0.22, 'sine', 0.12, 0.2);
}

export function sfxChase() {
  tone(196, 0.18, 'sawtooth', 0.08);
  tone(147, 0.22, 'sawtooth', 0.08, 0.14);
}

export function sfxBust() {
  tone(110, 0.5, 'sawtooth', 0.12);
  tone(82, 0.7, 'square', 0.09, 0.2);
}

export function sfxEscape() {
  tone(523, 0.14, 'triangle', 0.1);
  tone(659, 0.14, 'triangle', 0.1, 0.12);
  tone(784, 0.14, 'triangle', 0.1, 0.24);
  tone(1047, 0.3, 'triangle', 0.12, 0.36);
}

// The alarm swell: two detuned oscillators that start when the meter is hot
// and stop when it cools. Called once per frame with the hot flag.
export function alarmSwell(hot) {
  const ac = audio();
  if (!ac || muted) {
    stopAlarm();
    return;
  }
  if (hot && !alarmNodes) {
    const o1 = ac.createOscillator();
    const o2 = ac.createOscillator();
    const g = ac.createGain();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.value = 440;
    o2.frequency.value = 466;
    g.gain.value = 0.02;
    o1.connect(g);
    o2.connect(g);
    g.connect(ac.destination);
    o1.start();
    o2.start();
    alarmNodes = { o1, o2, g };
  } else if (!hot && alarmNodes) {
    stopAlarm();
  }
}

export function stopAlarm() {
  if (!alarmNodes) return;
  try {
    alarmNodes.o1.stop();
    alarmNodes.o2.stop();
  } catch {
    // Already stopped.
  }
  alarmNodes = null;
}
