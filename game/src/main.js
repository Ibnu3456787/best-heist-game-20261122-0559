// THE GILDED FOX — boot and game loop.
// With ?shot=1-cover (or 2-briefing, 3-getaway, 4-caught) the pilot stages
// one frame and the game paints it once, for the screenshots. Otherwise the
// game runs live: title screen, three heists, payout, busted, pause.

import { VIEW } from './config.js';
import { createGame, startHeist, bankPayout, recordBust, nextHeist, backToTitle, hasNextHeist } from './state.js';
import { step } from './world.js';
import { useTool } from './tools.js';
import { drawWorld } from './render.js';
import { drawTopBar, drawBottomBar, drawBanner } from './hud.js';
import { drawTitle, drawPayout, drawBusted, drawPaused } from './screens.js';
import { createInput, takeClick, inside, pressed } from './input.js';
import { stageShot } from './shots.js';
import {
  setMuted, alarmSwell, sfxClick, sfxCoin, sfxSmoke, sfxEmp, sfxLaser,
  sfxLoot, sfxChase, sfxBust, sfxEscape, sfxPick,
} from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const game = createGame();
const input = createInput(canvas);
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

const DT = 1 / 60;

function playEventSounds(world) {
  for (const e of world.events) {
    if (e.type === 'coin') sfxCoin();
    else if (e.type === 'smoke') sfxSmoke();
    else if (e.type === 'emp') sfxEmp();
    else if (e.type === 'laser') sfxLaser();
    else if (e.type === 'loot') sfxLoot();
    else if (e.type === 'chase') sfxChase();
    else if (e.type === 'lockdown') sfxChase();
    else if (e.type === 'escape') sfxEscape();
  }
  world.events.length = 0;
  if (world.thief.picking) sfxPick();
}

function render() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  if (game.screen === 'title') {
    drawTitle(ctx, game);
  } else if (game.world) {
    drawWorld(ctx, game.world);
    drawTopBar(ctx, game);
    drawBottomBar(ctx, game);
    drawBanner(ctx, game);
    if (game.screen === 'payout') drawPayout(ctx, game);
    else if (game.screen === 'busted') drawBusted(ctx, game);
    else if (game.screen === 'paused') drawPaused(ctx);
  }
}

function handleClicks() {
  let click = takeClick(input);
  while (click) {
    if (game.screen === 'title' && game.titleButtons) {
      const b = game.titleButtons;
      if (inside(click, b.standard)) {
        game.mode = 'standard';
        sfxClick();
      } else if (inside(click, b.ghost)) {
        game.mode = 'ghost';
        sfxClick();
      } else if (inside(click, b.begin)) {
        startHeist(game, game.titleSelection, game.mode);
        sfxClick();
      } else {
        for (const job of b.jobs) {
          if (inside(click, job)) {
            game.titleSelection = job.heist;
            sfxClick();
          }
        }
      }
    } else if (game.screen === 'payout' && game.payoutButtons) {
      if (inside(click, game.payoutButtons.next)) {
        sfxClick();
        if (hasNextHeist(game)) nextHeist(game);
        else backToTitle(game);
      }
    } else if (game.screen === 'busted' && game.bustedButtons) {
      if (inside(click, game.bustedButtons.retry)) {
        sfxClick();
        startHeist(game, game.heistIndex, game.mode);
      } else if (inside(click, game.bustedButtons.title)) {
        sfxClick();
        backToTitle(game);
      }
    }
    click = takeClick(input);
  }
}

function handleKeys() {
  if (pressed(input, 'KeyM')) {
    game.muted = !game.muted;
    setMuted(game.muted);
  }
  if (game.screen === 'title' && pressed(input, 'Enter')) {
    startHeist(game, game.titleSelection, game.mode);
  }
  if (game.screen === 'playing' && (pressed(input, 'KeyP') || pressed(input, 'Escape'))) {
    game.screen = 'paused';
  } else if (game.screen === 'paused' && (pressed(input, 'KeyP') || pressed(input, 'Escape'))) {
    game.screen = 'playing';
  }
  if (game.screen === 'title') {
    if (pressed(input, 'ArrowLeft') || pressed(input, 'KeyA')) {
      game.titleSelection = (game.titleSelection + 2) % 3;
    }
    if (pressed(input, 'ArrowRight') || pressed(input, 'KeyD')) {
      game.titleSelection = (game.titleSelection + 1) % 3;
    }
    if (pressed(input, 'Digit1')) game.mode = 'standard';
    if (pressed(input, 'Digit2')) game.mode = 'ghost';
  }
}

function frame() {
  handleKeys();
  handleClicks();
  if (game.screen === 'playing' && game.world) {
    const world = game.world;
    // Tools fire once per key press, aimed with the mouse.
    if (input.tool) {
      useTool(world, input.tool, input.aimX, input.aimY);
      input.tool = null;
    }
    step(world, input, DT);
    playEventSounds(world);
    alarmSwell(world.alarmHot || world.lockdown);
    if (world.phase === 'payout') {
      bankPayout(game);
      sfxEscape();
    } else if (world.phase === 'busted') {
      recordBust(game);
      sfxBust();
      alarmSwell(false);
    }
  } else if (game.screen === 'title') {
    game.titleTime += DT;
  }
  render();
}

// Screenshot mode: stage one frame and paint it once, then stop. The
// headless browser's screenshot catches exactly this frame.
if (shotName) {
  stageShot(game, shotName);
  render();
} else {
  const loop = () => {
    frame();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
