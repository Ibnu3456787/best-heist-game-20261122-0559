// THE GILDED FOX — the world. One fixed-timestep simulation owns every
// system: the thief, the guards, the cameras, the lasers, the loot, the alarm
// and the tools. `step` takes the player's input for one tick and returns the
// events the frame produced, so the renderer and the sound stay dumb and the
// simulation stays testable in plain Node with no browser at all.
import { STEP, TOOLS } from './config.js';
import { makeAlarm, spikeAlarm, updateAlarm } from './alarm.js';
import { empCameras, makeCameras, updateCameras } from './cameras.js';
import { guardAlertCounts, makeGuards, updateGuards } from './guards.js';
import { makeLasers, updateLasers } from './lasers.js';
import { atExit, makeLoot, nearLoot, nearVault, payout } from './loot.js';
import { empActive, fireEmp, dropSmoke, makeTools, throwCoin, updateTools } from './tools.js';
import { makeThief, moveThief, thiefHidden, updateThiefStealth } from './thief.js';
import { mulberry32 } from './random.js';

export const STATUS_PLAYING = 'playing';
export const STATUS_ESCAPED = 'escaped';
export const STATUS_BUSTED = 'busted';

/**
 * A heist in progress. `mode` is 'standard' or 'ghost'; `seed` drives the
 * ambient variation so a staged scene replays identically.
 */
export class World {
  constructor(heist, mode, seed = 1) {
    this.heist = heist;
    this.mode = mode;
    this.seed = seed;
    this.rng = mulberry32(seed);
    this.reset();
  }

  reset() {
    this.time = 0;
    this.elapsed = 0;
    this.status = STATUS_PLAYING;
    this.events = [];
    this.message = null;
    this.messageUntil = 0;
    this.thief = makeThief(this.heist);
    this.guards = makeGuards(this.heist);
    this.cameras = makeCameras(this.heist);
    this.lasers = makeLasers(this.heist);
    this.loot = makeLoot(this.heist);
    this.alarm = makeAlarm();
    this.tools = makeTools();
    this.result = null;
    this.escapedDuringLockdown = false;
    this.bustedReason = '';
    this.bustedDetail = '';
  }

  /** The exit only opens once the loot is in hand. */
  get exitOpen() {
    return this.loot.taken;
  }

  showMessage(text, seconds = 2.5) {
    this.message = text;
    this.messageUntil = this.time + seconds;
  }

  /**
   * One fixed step. `input` is { dx, dy, sneak, sprint, interact, tool,
   * toolTarget } — tool is 'coin' | 'smoke' | 'emp' | null for this tick.
   * Returns the events this step produced.
   */
  step(dt, input) {
    this.events = [];
    if (this.status !== STATUS_PLAYING) return this.events;
    this.time += dt;
    this.elapsed += dt;

    updateTools(this.tools, this.time);

    // Tools: one use per tick, paid from the purse.
    if (input.tool === 'coin' && input.toolTarget) {
      if (throwCoin(this.tools, input.toolTarget.x, input.toolTarget.y, this.time)) {
        this.events.push({ type: 'tool-coin' });
      } else this.events.push({ type: 'tool-denied', tool: 'coin' });
    } else if (input.tool === 'smoke') {
      if (dropSmoke(this.tools, this.thief.x, this.thief.y, this.time)) {
        this.events.push({ type: 'tool-smoke' });
      } else this.events.push({ type: 'tool-denied', tool: 'smoke' });
    } else if (input.tool === 'emp') {
      if (fireEmp(this.tools, this.time)) {
        empCameras(this.cameras, this.time, TOOLS.emp.seconds);
        this.events.push({ type: 'tool-emp' });
      } else this.events.push({ type: 'tool-denied', tool: 'emp' });
    }

    moveThief(this.thief, input, dt, this.heist.walls);
    updateThiefStealth(this.thief, this.heist, this.tools.smoke);
    const hidden = thiefHidden(this.thief);

    // Lockpicking: hold E at the case, standing still. Moving breaks it.
    if (!this.loot.caseOpen && nearVault(this.thief, this.heist) && input.interact && !this.thief.moving) {
      this.thief.lockpicking += dt / TOOLS.lockpickSeconds;
      if (this.thief.lockpicking >= 1) {
        this.loot.caseOpen = true;
        this.thief.lockpicking = 0;
        this.events.push({ type: 'case-open' });
        this.showMessage('CASE OPEN — TAKE THE ' + this.loot.name.toUpperCase());
      }
    } else {
      this.thief.lockpicking = Math.max(0, this.thief.lockpicking - dt * 2);
    }

    const ctx = {
      thief: this.thief,
      walls: this.heist.walls,
      hidden,
      time: this.time,
      lockdown: this.alarm.lockdown,
      coinPoint: this.tools.coin ? { x: this.tools.coin.x, y: this.tools.coin.y } : null,
      smoke: this.tools.smoke,
      empActive: empActive(this.tools, this.time),
      events: this.events,
    };
    updateGuards(this.guards, dt, ctx);
    const camerasSeeing = updateCameras(this.cameras, dt, ctx);
    updateLasers(this.lasers, dt, ctx);

    // Laser trips spike the meter at once.
    for (const event of this.events) {
      if (event.type === 'laser-trip') {
        spikeAlarm(this.alarm, event.amount);
        this.showMessage('LASER TRIPPED! +' + event.amount + ' ALARM');
      }
    }

    const counts = guardAlertCounts(this.guards);
    updateAlarm(
      this.alarm,
      { suspicious: counts.suspicious, alert: counts.alert, cameras: camerasSeeing },
      dt,
      this.mode,
      this.time,
      this.events,
    );

    // The grab: walk over the prize once its case is open.
    if (this.loot.caseOpen && !this.loot.taken && nearLoot(this.thief, this.loot)) {
      this.loot.taken = true;
      this.thief.carrying = true;
      this.events.push({ type: 'loot' });
      this.showMessage(this.loot.name.toUpperCase() + ' SECURED — GET TO THE EXIT!', 3.5);
    }

    // The getaway: reach the open exit with the loot.
    if (this.loot.taken && atExit(this.thief, this.heist)) {
      this.status = STATUS_ESCAPED;
      this.escapedDuringLockdown = this.alarm.lockdown;
      this.result = payout(this.heist, {
        elapsed: this.elapsed,
        peakAlarm: this.alarm.peak,
        purseLeft: this.tools.purse,
        escapedDuringLockdown: this.escapedDuringLockdown,
      });
      this.events.push({ type: 'escaped', result: this.result });
      return this.events;
    }

    // The bust: caught in the open, or the alarm did it.
    for (const event of this.events) {
      if (event.type === 'caught') {
        this.bust('CAUGHT RED-HANDED', 'A guard laid hands on you while the alarm was up. Break line of sight before they close in.');
        return this.events;
      }
      if (event.type === 'busted-alarm') {
        this.bust('GHOST BLOWN', 'The alarm hit 100 in Ghost mode. One clean run, no second chances.');
        return this.events;
      }
      if (event.type === 'busted-lockdown') {
        this.bust('LOCKDOWN SEALED', 'The building sealed before you reached the exit. Ten seconds is all a lockdown gives.');
        return this.events;
      }
      if (event.type === 'lockdown') {
        this.showMessage('LOCKDOWN! REACH THE EXIT IN 10 SECONDS!', 3.5);
      }
    }
    return this.events;
  }

  bust(reason, detail) {
    this.status = STATUS_BUSTED;
    this.bustedReason = reason;
    this.bustedDetail = detail;
    this.events.push({ type: 'busted', reason });
  }

  /** Advance the world `seconds` with the same input every step (for staging). */
  fastForward(seconds, input) {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      this.step(STEP, input);
      if (this.status !== STATUS_PLAYING) break;
    }
  }
}
