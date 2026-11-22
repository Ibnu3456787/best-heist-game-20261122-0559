// THE GILDED FOX — the screenshot scenes behind ?shot=cover|briefing|
// getaway|caught. Each one plays the real rules forward from a fresh world
// with a scripted pilot (waypoints, sprint, lockpick), so the frame is what
// a real game looks like at that moment — never posed, never composited —
// and the same seed always stages the same frame.
import { STEP } from './config.js';
import { heistByIndex } from './heists.js';
import { World, STATUS_BUSTED, STATUS_PLAYING } from './world.js';
import { nearVault } from './loot.js';
import { SCREEN_BUSTED, SCREEN_PLAY, SCREEN_TITLE } from './state.js';

const IDLE = { dx: 0, dy: 0, sneak: false, sprint: false, interact: false, tool: null, toolTarget: null };

/** A pilot that walks a waypoint list, picking the lock when it reaches one. */
class Pilot {
  constructor(waypoints, options = {}) {
    this.waypoints = waypoints;
    this.index = 0;
    this.sprint = options.sprint ?? false;
    this.sprintWithLoot = options.sprintWithLoot ?? false;
    this.pickLock = options.pickLock ?? false;
    this.actions = options.actions ?? []; // [{ atIndex, tool, target }] fired once
    this.firedActions = new Set();
    this.lastX = null;
    this.lastY = null;
    this.stuckSteps = 0;
    this.sidestepSide = 1;
  }

  get done() {
    return this.index >= this.waypoints.length;
  }

  /** The input for this step, from the thief's current position. */
  inputFor(world) {
    const input = { ...IDLE, sprint: this.sprint || (this.sprintWithLoot && world.loot.taken) };
    if (this.done) return input;
    const thief = world.thief;
    // Stuck against a wall corner: sidestep perpendicular to the goal until
    // the way clears, then carry on. Keeps the pilot off furniture.
    if (this.lastX !== null && Math.hypot(thief.x - this.lastX, thief.y - this.lastY) < 0.5) {
      this.stuckSteps += 1;
    } else {
      this.stuckSteps = 0;
    }
    this.lastX = thief.x;
    this.lastY = thief.y;
    const [wx, wy] = this.waypoints[this.index];
    const dx = wx - thief.x;
    const dy = wy - thief.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 18) {
      // Fire any tool action scheduled for this waypoint, once.
      for (let i = 0; i < this.actions.length; i += 1) {
        const action = this.actions[i];
        if (action.atIndex === this.index && !this.firedActions.has(i)) {
          this.firedActions.add(i);
          input.tool = action.tool;
          input.toolTarget = action.target ? { x: action.target[0], y: action.target[1] } : null;
        }
      }
      this.index += 1;
      this.stuckSteps = 0;
      return input;
    }
    // At the vault with the lock to pick: stand still and hold E.
    if (this.pickLock && !world.loot.caseOpen && nearVault(thief, world.heist)) {
      input.interact = true;
      return input;
    }
    if (this.stuckSteps > 30) {
      // Slide sideways around the corner, then re-aim.
      const px = -dy / dist;
      const py = dx / dist;
      input.dx = px * this.sidestepSide;
      input.dy = py * this.sidestepSide;
      if (this.stuckSteps > 90) {
        this.sidestepSide *= -1;
        this.stuckSteps = 0;
      }
      return input;
    }
    input.dx = dx / dist;
    input.dy = dy / dist;
    return input;
  }
}

function runPilot(world, pilot, maxSeconds) {
  const steps = Math.round(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, pilot.inputFor(world));
    if (world.status !== STATUS_PLAYING) break;
    if (pilot.done) break;
  }
}

/**
 * Stage the named scene and return { world, screen, app } ready to render.
 * Unknown names stage the cover. `seed` replays the same scene every time.
 */
export function stageShot(name, seed = 1) {
  if (name === 'briefing') {
    return { world: null, screen: SCREEN_TITLE, app: null };
  }
  if (name === 'getaway') {
    const world = new World(heistByIndex(0), 'standard', seed);
    // Start -> vault (pick the case, grab the mask) -> sprint for the exit,
    // stopping just short of the door with the alarm up and guards closing in.
    // A coin tossed west pulls the patroller off the vault approach; the
    // sprint starts only once the mask is in hand.
    const pilot = new Pilot(
      [
        [300, 620],
        [300, 380],
        [500, 380],
        [560, 200],
        [640, 150],
        [900, 300],
        [1080, 520],
        [1060, 640],
      ],
      {
        sprintWithLoot: true,
        pickLock: true,
        actions: [{ atIndex: 2, tool: 'coin', target: [250, 250] }],
      },
    );
    runPilot(world, pilot, 60);
    // If the pilot got caught anyway, leave the frame as the escape attempt.
    return { world, screen: world.status === STATUS_BUSTED ? SCREEN_BUSTED : SCREEN_PLAY, app: null };
  }
  if (name === 'caught') {
    const world = new World(heistByIndex(0), 'standard', seed);
    // Walk into the sentry's stare (around the statue) and stand there: the
    // alarm fills, lockdown starts, and the building seals. A fair bust,
    // fully earned.
    const pilot = new Pilot([[640, 560], [560, 400], [640, 300]]);
    runPilot(world, pilot, 30);
    // Stand still in the cone until the bust lands (lockdown runs 10s).
    const idleSteps = Math.round(40 / STEP);
    for (let i = 0; i < idleSteps && world.status === STATUS_PLAYING; i += 1) {
      world.step(STEP, IDLE);
    }
    return { world, screen: world.status === STATUS_BUSTED ? SCREEN_BUSTED : SCREEN_PLAY, app: null };
  }
  // Cover: the bank vault, mid-heist. The thief slips up the west vent,
  // crosses the open floor under the cameras, clips a laser and the
  // sentry's sweep edge on the way, and pauses inside the south-east
  // shadow pool — the whole heist in one frame, alarm already warm.
  const world = new World(heistByIndex(1), 'standard', seed);
  const pilot = new Pilot([
    [68, 560],
    [68, 230],
    [180, 200],
    [400, 290],
    [560, 250],
    [680, 480],
  ]);
  runPilot(world, pilot, 45);
  // A cover never shows an end screen: if the pilot escaped or was busted,
  // the playfield still renders the moment honestly underneath.
  return { world, screen: SCREEN_PLAY, app: null };
}
