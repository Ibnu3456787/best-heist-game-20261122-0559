// THE GILDED FOX — boot and the main loop. Parses ?shot= to stage a
// screenshot scene, otherwise runs the game: a fixed-step simulation fed by
// polled input, a screen state machine for the menus, and event-to-sound
// mapping so every moment has a voice. The loop never advances the world
// while a menu is up, and a staged shot never advances at all — the frame
// the screenshot takes is the frame the scene staged.
import { STEP } from './config.js';
import { World, STATUS_PLAYING } from './world.js';
import { stageShot } from './shots.js';
import { drawPlayfield } from './render.js';
import { drawHud, toolBeltRects } from './hud.js';
import {
  drawBriefing,
  drawBusted,
  drawEscaped,
  drawPaused,
  drawTitle,
  drawVictory,
} from './screens.js';
import {
  SCREEN_BRIEFING,
  SCREEN_BUSTED,
  SCREEN_ESCAPED,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  SCREEN_VICTORY,
  bankEscape,
  campaignComplete,
  currentHeist,
  makeAppState,
} from './state.js';
import { inRect, keyDown, makeInput, moveVector } from './input.js';
import { isMuted, playSound, setMuted, startAudio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const input = makeInput(canvas);
const app = makeAppState();

const params = new URLSearchParams(globalThis.location.search);
const shotName = params.get('shot');
const shotSeed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

let world = null;
let layout = null; // click rects of the screen currently drawn
let prevKeys = new Set();
let accumulator = 0;
let lastTime = 0;

const SOUND_FOR_EVENT = {
  'tool-coin': 'coin',
  'tool-smoke': 'smoke',
  'tool-emp': 'emp',
  'case-open': 'case-open',
  loot: 'loot',
  suspicious: 'suspicious',
  alert: 'alert',
  'camera-sees': 'suspicious',
  'laser-trip': 'laser',
  lockdown: 'lockdown',
  escaped: 'escaped',
  busted: 'busted',
};

function setStatus(text) {
  if (statusLine) statusLine.textContent = text;
}

function startHeist(index) {
  app.heistIndex = index;
  app.selectedHeist = index;
  world = new World(currentHeist(app), app.mode, 1);
  app.screen = SCREEN_PLAY;
  setStatus(`Heist ${index + 1}: ${currentHeist(app).name}. Steal the ${world.loot.name}.`);
}

function newlyPressed(key) {
  return input.keys.has(key) && !prevKeys.has(key);
}

function handleEvents(events) {
  for (const event of events) {
    const sound = SOUND_FOR_EVENT[event.type];
    if (sound) playSound(sound);
    if (event.type === 'tool-denied') setStatus(`Not enough gold for the ${event.tool}.`);
    if (event.type === 'escaped') {
      if (app.mode === 'ghost') {
        for (const line of world.result.lines) line.amount *= 2;
        world.result.total *= 2;
      }
      bankEscape(app, world.result);
      app.screen = SCREEN_ESCAPED;
      setStatus(`Escaped with the ${world.loot.name}. Payout ${world.result.total}g.`);
    }
    if (event.type === 'busted') {
      app.screen = SCREEN_BUSTED;
      setStatus(`Busted: ${world.bustedReason}.`);
    }
  }
}

function frameInput() {
  const mv = moveVector(input);
  const frame = {
    dx: mv.dx,
    dy: mv.dy,
    sneak: keyDown(input, 'shift'),
    sprint: keyDown(input, ' '),
    interact: keyDown(input, 'e'),
    tool: null,
    toolTarget: null,
  };
  if (newlyPressed('1')) {
    frame.tool = 'coin';
    frame.toolTarget = { x: input.mouseX, y: input.mouseY };
  } else if (newlyPressed('2')) {
    frame.tool = 'smoke';
  } else if (newlyPressed('3')) {
    frame.tool = 'emp';
  }
  return frame;
}

function handlePlayClick() {
  // Clicking a tool belt box spends that tool (coin aims at the mouse).
  const rects = toolBeltRects();
  const tools = ['coin', 'smoke', 'emp'];
  for (let i = 0; i < rects.length; i += 1) {
    if (inRect(input.clickX, input.clickY, rects[i])) {
      const frame = { dx: 0, dy: 0, sneak: false, sprint: false, interact: false, tool: tools[i], toolTarget: { x: input.mouseX, y: input.mouseY } };
      handleEvents(world.step(STEP, frame));
      return;
    }
  }
}

function handleClick() {
  startAudio();
  if (app.screen === SCREEN_TITLE && layout) {
    if (inRect(input.clickX, input.clickY, layout.start)) {
      playSound('click');
      app.screen = SCREEN_BRIEFING;
    } else if (inRect(input.clickX, input.clickY, layout.modes.standard)) {
      app.mode = 'standard';
      playSound('click');
    } else if (inRect(input.clickX, input.clickY, layout.modes.ghost)) {
      app.mode = 'ghost';
      playSound('click');
    } else {
      for (const card of layout.heists) {
        if (inRect(input.clickX, input.clickY, card)) {
          app.selectedHeist = card.index;
          playSound('click');
        }
      }
    }
  } else if (app.screen === SCREEN_BRIEFING && layout) {
    if (inRect(input.clickX, input.clickY, layout.begin)) {
      playSound('click');
      startHeist(app.selectedHeist);
    } else if (inRect(input.clickX, input.clickY, layout.back)) {
      playSound('click');
      app.screen = SCREEN_TITLE;
    }
  } else if (app.screen === SCREEN_PLAY) {
    handlePlayClick();
  } else if (app.screen === SCREEN_PAUSED && layout) {
    if (inRect(input.clickX, input.clickY, layout.resume)) {
      app.screen = SCREEN_PLAY;
      playSound('click');
    } else if (inRect(input.clickX, input.clickY, layout.restart)) {
      playSound('click');
      startHeist(app.heistIndex);
    } else if (inRect(input.clickX, input.clickY, layout.quit)) {
      playSound('click');
      app.screen = SCREEN_TITLE;
    }
  } else if (app.screen === SCREEN_ESCAPED && layout) {
    if (inRect(input.clickX, input.clickY, layout.next)) {
      playSound('click');
      if (campaignComplete(app)) {
        app.screen = SCREEN_VICTORY;
      } else {
        const next = (app.heistIndex + 1) % 3;
        app.selectedHeist = next;
        app.screen = SCREEN_BRIEFING;
      }
    } else if (inRect(input.clickX, input.clickY, layout.replay)) {
      playSound('click');
      startHeist(app.heistIndex);
    } else if (inRect(input.clickX, input.clickY, layout.title)) {
      playSound('click');
      app.screen = SCREEN_TITLE;
    }
  } else if (app.screen === SCREEN_BUSTED && layout) {
    if (inRect(input.clickX, input.clickY, layout.retry)) {
      playSound('click');
      startHeist(app.heistIndex);
    } else if (inRect(input.clickX, input.clickY, layout.title)) {
      playSound('click');
      app.screen = SCREEN_TITLE;
    }
  } else if (app.screen === SCREEN_VICTORY && layout) {
    if (inRect(input.clickX, input.clickY, layout.title)) {
      playSound('click');
      app.screen = SCREEN_TITLE;
    }
  }
  input.clicked = false;
}

function draw() {
  if (app.screen === SCREEN_TITLE) {
    layout = drawTitle(ctx, app);
    return;
  }
  if (app.screen === SCREEN_BRIEFING) {
    layout = drawBriefing(ctx, app);
    return;
  }
  if (app.screen === SCREEN_VICTORY) {
    layout = drawVictory(ctx, app);
    return;
  }
  // Every other screen draws the playfield first, then its overlay.
  drawPlayfield(ctx, world);
  drawHud(ctx, world, app);
  if (app.screen === SCREEN_PAUSED) layout = drawPaused(ctx);
  else if (app.screen === SCREEN_ESCAPED) layout = drawEscaped(ctx, world, app);
  else if (app.screen === SCREEN_BUSTED) layout = drawBusted(ctx, world);
  else layout = null;
}

function tick(timestamp) {
  const now = timestamp / 1000;
  const delta = Math.min(0.1, now - (lastTime || now));
  lastTime = now;

  if (input.clicked) handleClick();
  if (newlyPressed('m')) {
    setMuted(!isMuted());
    setStatus(isMuted() ? 'Sound off.' : 'Sound on.');
  }
  if (app.screen === SCREEN_PLAY && (newlyPressed('p') || newlyPressed('escape'))) {
    app.screen = SCREEN_PAUSED;
    playSound('click');
  } else if (app.screen === SCREEN_PAUSED && (newlyPressed('p') || newlyPressed('escape'))) {
    app.screen = SCREEN_PLAY;
    playSound('click');
  }

  if (app.screen === SCREEN_PLAY && world && world.status === STATUS_PLAYING) {
    accumulator += delta;
    let guard = 0;
    while (accumulator >= STEP && guard < 8) {
      accumulator -= STEP;
      guard += 1;
      handleEvents(world.step(STEP, frameInput()));
      if (world.status !== STATUS_PLAYING) break;
    }
  }
  prevKeys = new Set(input.keys);
  draw();
  globalThis.requestAnimationFrame(tick);
}

// Shot mode: stage the scene once and hold the frame. The world does not
// advance — the screenshot takes exactly the staged moment.
if (shotName) {
  const staged = stageShot(shotName, shotSeed);
  world = staged.world;
  app.screen = staged.screen;
  if (staged.screen === SCREEN_TITLE) {
    app.selectedHeist = 1;
  }
  // Keep the alarm warm on the cover: the pilot earned what it earned, and
  // the frame shows the meter honestly.
  draw();
  globalThis.requestAnimationFrame(function hold() {
    draw();
    globalThis.requestAnimationFrame(hold);
  });
} else {
  globalThis.requestAnimationFrame(tick);
}
