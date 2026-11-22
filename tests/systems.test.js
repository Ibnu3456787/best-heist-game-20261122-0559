// Tests for guards, cameras, lasers, the alarm, the tools and the campaign
// state — the systems around the core loop of THE GILDED FOX.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, step } from '../game/src/world.js';
import { guardSeesThief, updateGuard } from '../game/src/guards.js';
import { cameraSeesThief, updateCamera } from '../game/src/cameras.js';
import { laserLive, updateLasers } from '../game/src/lasers.js';
import { useTool } from '../game/src/tools.js';
import {
  createGame, startHeist, bankPayout, recordBust,
  hasNextHeist, nextHeist, campaignRank,
} from '../game/src/state.js';
import { blankInput, run, gallery, clearGuards, DT } from './helpers.js';

// --- guards: patrol ---------------------------------------------------------

test('a patroller walks toward its next waypoint', () => {
  const w = gallery();
  const g = w.guards[0];
  const x0 = g.x;
  run(w, 60);
  assert.ok(g.x > x0, `x ${x0} -> ${g.x}`);
});

test('a patroller advances its waypoint index on arrival', () => {
  const w = gallery();
  const g = w.guards[0];
  // The patroller starts on waypoint 1 (1080, 180); park it just short.
  g.x = 1070;
  g.y = 180;
  g.waypointIndex = 1;
  run(w, 60);
  assert.equal(g.waypointIndex, 2);
});

// --- guards: vision ---------------------------------------------------------

test('a guard cannot see the thief through a display case', () => {
  const w = gallery();
  const g = w.guards[1]; // sentry, range 235
  g.x = 390;
  g.y = 252;
  g.angle = 0;
  w.thief.x = 600;
  w.thief.y = 252;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), false);
});

test('a guard sees the thief in an open cone', () => {
  const w = gallery();
  const g = w.guards[1];
  // Open floor: the side wall ends at x=240, the displays sit at y 220..284.
  g.x = 300;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 500;
  w.thief.y = 400;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), true);
});

test('a guard cannot see the thief outside its cone', () => {
  const w = gallery();
  const g = w.guards[1];
  g.x = 200;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 200;
  w.thief.y = 500;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), false);
});

test('a guard cannot see the thief beyond its range', () => {
  const w = gallery();
  const g = w.guards[1];
  g.x = 200;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 500;
  w.thief.y = 400;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), false);
});

test('a guard cannot see a thief hidden in smoke', () => {
  const w = gallery();
  const g = w.guards[1];
  g.x = 300;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 500;
  w.thief.y = 400;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), true);
  w.thief.hidden = true;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), false);
});

// --- guards: suspicion and chase -------------------------------------------

test('suspicion rises while a sentry watches the thief', () => {
  const w = gallery();
  const g = w.guards[1];
  g.panTime = 0; // facing right, toward the thief
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 30);
  assert.ok(g.suspicion > 10, `suspicion=${g.suspicion}`);
});

test('suspicion decays when the thief is unseen', () => {
  const w = gallery();
  const g = w.guards[1];
  g.suspicion = 50;
  w.thief.x = 120;
  w.thief.y = 680;
  run(w, 60);
  assert.ok(g.suspicion < 50, `suspicion=${g.suspicion}`);
});

test('a full suspicion meter turns a patrol into a chase', () => {
  const w = gallery();
  const g = w.guards[1];
  g.panTime = 0;
  g.suspicion = 99;
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 30);
  assert.equal(g.state, 'chase');
});

test('a chasing guard moves toward the thief', () => {
  const w = gallery();
  const g = w.guards[0];
  g.state = 'chase';
  g.suspicion = 100;
  g.x = 300;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 450;
  w.thief.y = 400;
  run(w, 30);
  assert.ok(g.x > 340, `x=${g.x}`);
});

test('a chasing guard that touches the thief busts the heist', () => {
  const w = gallery();
  const g = w.guards[0];
  g.state = 'chase';
  g.suspicion = 100;
  g.x = w.thief.x + 20;
  g.y = w.thief.y;
  g.angle = 0;
  run(w, 60);
  assert.equal(w.phase, 'busted');
  assert.equal(w.bustReason, 'caught');
});

// --- cameras ----------------------------------------------------------------

test('a camera sweeps its cone over time', () => {
  const w = gallery();
  const c = w.cameras[0];
  const a0 = c.angle;
  run(w, 60);
  assert.notEqual(c.angle, a0);
});

test('a camera sees the thief in its cone', () => {
  const w = gallery();
  const c = w.cameras[0];
  c.x = 320;
  c.y = 120;
  c.angle = Math.PI / 2; // straight down
  w.thief.x = 320;
  w.thief.y = 300;
  assert.equal(cameraSeesThief(c, w.thief, w.level.walls), true);
});

test('an EMP blinds a camera', () => {
  const w = gallery();
  const c = w.cameras[0];
  c.x = 320;
  c.y = 120;
  c.angle = Math.PI / 2;
  w.thief.x = 320;
  w.thief.y = 300;
  assert.equal(cameraSeesThief(c, w.thief, w.level.walls), true);
  assert.equal(useTool(w, 'emp', 0, 0), true);
  assert.equal(cameraSeesThief(c, w.thief, w.level.walls), false);
});

test('a camera sees again once the EMP wears off', () => {
  const w = gallery();
  const c = w.cameras[0]; // at (60, 110), sweeping around base angle 0.6
  // Put the thief on that bearing at 150px so the sweep keeps it in the
  // cone while the blind wears off.
  c.blindFor = 0.1;
  w.thief.x = 184;
  w.thief.y = 195;
  assert.equal(cameraSeesThief(c, w.thief, w.level.walls), false);
  run(w, 30);
  assert.equal(cameraSeesThief(c, w.thief, w.level.walls), true);
});

// --- lasers -----------------------------------------------------------------

test('the bank beam is live at the start of the heist', () => {
  const w = createWorld(1, 'standard');
  assert.equal(laserLive(w.lasers[0]), true);
});

test('the bank beam toggles off after its on-time', () => {
  const w = createWorld(1, 'standard');
  clearGuards(w);
  run(w, 120);
  assert.equal(laserLive(w.lasers[0]), false);
});

test('tripping a live laser adds +30 alarm', () => {
  const w = createWorld(1, 'standard');
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 400; // on bank laser 1 (y=400, x 320..960)
  run(w, 1);
  // The trip adds 30; the same tick's decay shaves off 4/s * 1/60.
  assert.ok(w.alarm > 29 && w.alarm <= 30, `alarm=${w.alarm}`);
});

test('standing on a live beam trips it only once', () => {
  const w = createWorld(1, 'standard');
  clearGuards(w);
  w.thief.x = 640;
  w.thief.y = 400;
  run(w, 60);
  assert.ok(w.alarm > 20 && w.alarm < 31, `alarm=${w.alarm}`);
});

// --- alarm ------------------------------------------------------------------

test('the alarm rises while a guard watches the thief', () => {
  const w = gallery();
  const g = w.guards[1];
  g.panTime = 0;
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 60);
  assert.ok(w.alarm > 0, `alarm=${w.alarm}`);
});

test('the alarm decays when nobody watches', () => {
  const w = gallery();
  clearGuards(w);
  w.alarm = 50;
  run(w, 60);
  assert.ok(w.alarm < 50, `alarm=${w.alarm}`);
});

test('the alarm never passes 100', () => {
  const w = gallery();
  const g = w.guards[1];
  g.panTime = 0;
  w.alarm = 99;
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 120);
  assert.ok(w.alarm <= 100, `alarm=${w.alarm}`);
});

test('alarm 100 in standard mode starts a 10s lockdown', () => {
  const w = gallery();
  const g = w.guards[1];
  g.panTime = 0;
  w.alarm = 99.9;
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 30);
  assert.equal(w.lockdown, true);
  assert.ok(w.lockdownLeft > 9 && w.lockdownLeft <= 10, `left=${w.lockdownLeft}`);
});

test('alarm 100 in ghost mode busts the heist at once', () => {
  const w = createWorld(0, 'ghost');
  const g = w.guards[1];
  g.panTime = 0;
  w.alarm = 99.9;
  w.thief.x = 640;
  w.thief.y = 260;
  run(w, 30);
  assert.equal(w.phase, 'busted');
  assert.equal(w.bustReason, 'alarm');
});

test('a lockdown that runs out busts the heist', () => {
  const w = gallery();
  w.lockdown = true;
  w.lockdownLeft = 0.1;
  run(w, 30);
  assert.equal(w.phase, 'busted');
  assert.equal(w.bustReason, 'lockdown');
});

// --- tools ------------------------------------------------------------------

test('a coin costs 25g', () => {
  const w = gallery();
  assert.equal(useTool(w, 'coin', 500, 400), true);
  assert.equal(w.purse, 125);
});

test('a coin fails when the purse is too light', () => {
  const w = gallery();
  w.purse = 10;
  assert.equal(useTool(w, 'coin', 500, 400), false);
  assert.equal(w.purse, 10);
});

test('a coin distracts a nearby guard', () => {
  const w = gallery();
  const g = w.guards[0];
  g.x = 300;
  g.y = 400;
  assert.equal(useTool(w, 'coin', 400, 400), true);
  assert.equal(g.state, 'investigate');
  assert.equal(g.investigateX, 400);
  assert.equal(g.investigateY, 400);
});

test('smoke costs 50g and makes a cloud', () => {
  const w = gallery();
  assert.equal(useTool(w, 'smoke', 400, 400), true);
  assert.equal(w.purse, 100);
  assert.equal(w.smokes.length, 1);
});

test('a thief inside smoke is hidden from guards', () => {
  const w = gallery();
  const g = w.guards[1];
  g.x = 300;
  g.y = 400;
  g.angle = 0;
  w.thief.x = 450;
  w.thief.y = 400;
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), true);
  // Smoke lands on the thief, wherever the mouse aimed.
  useTool(w, 'smoke', 0, 0);
  run(w, 1);
  assert.equal(w.thief.hidden, true);
  assert.equal(guardSeesThief(g, w.thief, w.level.walls), false);
});

test('smoke expires after 6 seconds', () => {
  const w = gallery();
  useTool(w, 'smoke', 400, 400);
  run(w, 400);
  assert.equal(w.smokes.length, 0);
});

test('an EMP costs 100g and blinds cameras', () => {
  const w = gallery();
  assert.equal(useTool(w, 'emp', 0, 0), true);
  assert.equal(w.purse, 50);
  assert.ok(w.cameras[0].blindFor > 0);
});

test('an EMP blinds a drone', () => {
  const w = createWorld(1, 'standard');
  const drone = w.guards[3];
  assert.equal(drone.kind, 'drone');
  drone.x = 400;
  drone.y = 470;
  drone.angle = 0;
  w.thief.x = 500;
  w.thief.y = 470;
  assert.equal(guardSeesThief(drone, w.thief, w.level.walls), true);
  useTool(w, 'emp', 0, 0);
  assert.equal(guardSeesThief(drone, w.thief, w.level.walls), false);
});

test('an unknown tool does nothing', () => {
  const w = gallery();
  assert.equal(useTool(w, 'grapple', 0, 0), false);
  assert.equal(w.purse, 150);
});

// --- campaign state ---------------------------------------------------------

test('campaign ranks climb with the total', () => {
  const game = createGame();
  game.campaignTotal = 0;
  assert.equal(campaignRank(game), 'STREET RAT');
  game.campaignTotal = 1499;
  assert.equal(campaignRank(game), 'STREET RAT');
  game.campaignTotal = 1500;
  assert.equal(campaignRank(game), 'PICKPOCKET');
  game.campaignTotal = 3500;
  assert.equal(campaignRank(game), 'CAT BURGLAR');
  game.campaignTotal = 6000;
  assert.equal(campaignRank(game), 'SHADOW');
  game.campaignTotal = 12500;
  assert.equal(campaignRank(game), 'LEGEND OF THE NIGHT');
});

test('banking a payout adds it to the campaign total', () => {
  const game = createGame();
  startHeist(game, 0, 'standard');
  const w = game.world;
  clearGuards(w);
  w.lootSecured = true;
  w.time = 10;
  w.thief.x = 640;
  w.thief.y = 707;
  run(w, 1);
  assert.equal(w.phase, 'payout');
  bankPayout(game);
  assert.equal(game.campaignTotal, w.payout.total);
  assert.equal(game.screen, 'payout');
});

test('the campaign advances to the next heist', () => {
  const game = createGame();
  startHeist(game, 0, 'standard');
  assert.equal(hasNextHeist(game), true);
  nextHeist(game);
  assert.equal(game.heistIndex, 1);
  assert.equal(game.screen, 'playing');
  assert.ok(game.world !== null);
});

test('recording a bust shows the busted screen with its reason', () => {
  const game = createGame();
  startHeist(game, 0, 'standard');
  game.world.phase = 'busted';
  game.world.bustReason = 'caught';
  game.world.bustGuard = 'Patroller';
  recordBust(game);
  assert.equal(game.screen, 'busted');
  assert.equal(game.bustReason, 'caught');
  assert.equal(game.bustGuard, 'Patroller');
});
