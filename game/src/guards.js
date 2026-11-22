// THE GILDED FOX — guard AI: five kinds, one brain. A guard patrols its
// route, grows suspicious when the thief crosses its vision cone, stares to
// make sure ("?"), then chases ("!") — and forgets when the trail goes cold.
// The caught moment is fair on purpose: suspicion has to fill before a chase
// starts, and breaking line of sight always cools it down.
import { GUARD, SIGHT, THIEF, TOOLS } from './config.js';
import { angleDiff, angleTo, hasLineOfSight, inCone, smokeBlocks } from './cones.js';

export const STATE_PATROL = 'patrol';
export const STATE_STARE = 'stare';
export const STATE_CHASE = 'chase';
export const STATE_INVESTIGATE = 'investigate';
export const STATE_RETURN = 'return';

/** Build live guard objects from a heist's guard list. */
export function makeGuards(heist) {
  return heist.guards.map((def, index) => ({
    id: index,
    kind: def.kind,
    x: def.x,
    y: def.y,
    angle: def.baseAngle ?? 0,
    baseAngle: def.baseAngle ?? 0,
    sweep: def.sweep ?? 0,
    route: def.route,
    routeIndex: 0,
    flies: def.flies === true,
    speed: def.kind === 'hound' ? GUARD.patrolSpeed * 1.35 : GUARD.patrolSpeed,
    state: STATE_PATROL,
    suspicion: 0,
    stateTime: 0,
    lastSeen: null,
    target: null,
    spotted: false, // true while the thief is in this guard's cone right now
  }));
}

/**
 * How far this watcher can see the thief right now, after stealth modifiers:
 * shadows and sneaking shrink it, sprinting stretches it. Vents and smoke
 * hide the thief outright (checked by the caller through `hidden`).
 */
export function sightRange(kind, thief) {
  let range = SIGHT[kind].range;
  if (thief.inShadow) range *= 0.55;
  if (thief.sneaking) range *= THIEF.sneakDetect;
  if (thief.sprinting) range *= THIEF.sprintDetect;
  return range;
}

/** True when `watcher` can see the thief this step. */
export function watcherSeesThief(watcher, thief, walls, hidden, smoke) {
  if (hidden) return false;
  const range = sightRange(watcher.kind, thief);
  if (!inCone(watcher.x, watcher.y, watcher.angle, SIGHT[watcher.kind].halfAngle, range, thief.x, thief.y)) {
    return false;
  }
  if (smokeBlocks(watcher.x, watcher.y, thief.x, thief.y, smoke)) return false;
  return hasLineOfSight(watcher.x, watcher.y, thief.x, thief.y, walls);
}

function turnToward(guard, targetAngle, dt, rate = 6) {
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = Math.max(-rate * dt, Math.min(rate * dt, diff));
  guard.angle += step;
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, Math.atan2(dy, dx), dt);
  return step >= dist - 0.01;
}

/**
 * Step every guard one tick. `ctx` carries the thief, the walls, whether the
 * thief is hidden (vent / smoke), the coin distraction point, the time, and
 * an `events` array this fills with { type, guard } records.
 */
export function updateGuards(guards, dt, ctx) {
  const { thief, walls, hidden, time, coinPoint } = ctx;
  for (const guard of guards) {
    // An EMP pulse freezes drones solid: no sight, no movement, no memory.
    if (guard.kind === 'drone' && ctx.empActive) {
      guard.spotted = false;
      continue;
    }
    guard.stateTime += dt;
    const seen = watcherSeesThief(guard, thief, walls, hidden, ctx.smoke);
    guard.spotted = seen;

    // Suspicion fills on sight, drains in the dark. Sprinting fills it faster.
    if (seen) {
      const rate = SIGHT[guard.kind].fill * (thief.sprinting ? 1.5 : 1);
      guard.suspicion = Math.min(100, guard.suspicion + rate * dt);
      guard.lastSeen = { x: thief.x, y: thief.y };
    } else {
      guard.suspicion = Math.max(0, guard.suspicion - GUARD.suspicionDecay * dt);
    }

    // A coin landing nearby pulls a calm guard off its route to look.
    if (coinPoint && guard.state === STATE_PATROL && guard.suspicion < GUARD.suspiciousAt) {
      const d = Math.hypot(coinPoint.x - guard.x, coinPoint.y - guard.y);
      if (d < TOOLS.coin.radius) {
        guard.state = STATE_INVESTIGATE;
        guard.target = { x: coinPoint.x, y: coinPoint.y };
        guard.stateTime = 0;
        ctx.events.push({ type: 'distracted', guard });
      }
    }

    // Lockdown: the alarm tells every guard exactly where the thief is.
    // They all converge — the ten-second dash to the exit is a real chase.
    // Breaking into a vent or smoke still shakes them off: they lose the
    // live position and hunt the last place they knew.
    if (ctx.lockdown && !hidden) {
      guard.suspicion = 100;
      guard.lastSeen = { x: thief.x, y: thief.y };
      if (guard.state !== STATE_CHASE) {
        guard.state = STATE_CHASE;
        guard.stateTime = 0;
      }
    }

    if (guard.state === STATE_PATROL) {
      if (guard.suspicion >= GUARD.alertAt) {
        guard.state = STATE_CHASE;
        guard.stateTime = 0;
        ctx.events.push({ type: 'alert', guard });
      } else if (guard.suspicion >= GUARD.suspiciousAt) {
        guard.state = STATE_STARE;
        guard.stateTime = 0;
        ctx.events.push({ type: 'suspicious', guard });
      } else {
        patrolStep(guard, dt, time);
      }
    } else if (guard.state === STATE_STARE) {
      if (guard.lastSeen) turnToward(guard, angleTo(guard.x, guard.y, guard.lastSeen.x, guard.lastSeen.y), dt);
      if (guard.kind === 'hound' && guard.lastSeen) {
        moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, guard.speed, dt);
      }
      if (guard.suspicion >= GUARD.alertAt) {
        guard.state = STATE_CHASE;
        guard.stateTime = 0;
        ctx.events.push({ type: 'alert', guard });
      } else if (!seen && guard.stateTime > GUARD.stareSeconds) {
        guard.state = STATE_PATROL;
        guard.stateTime = 0;
      }
    } else if (guard.state === STATE_CHASE) {
      const speed = guard.kind === 'hound' ? GUARD.houndChaseSpeed : GUARD.chaseSpeed;
      const target = guard.lastSeen ?? { x: guard.x, y: guard.y };
      const arrived = moveToward(guard, target.x, target.y, speed, dt);
      const touch = Math.hypot(thief.x - guard.x, thief.y - guard.y);
      if (touch < GUARD.touchBust && seen) {
        ctx.events.push({ type: 'caught', guard });
      } else if ((arrived && !seen) || guard.suspicion <= 0) {
        guard.state = STATE_RETURN;
        guard.stateTime = 0;
      }
    } else if (guard.state === STATE_INVESTIGATE) {
      const arrived = moveToward(guard, guard.target.x, guard.target.y, GUARD.returnSpeed, dt);
      if (guard.suspicion >= GUARD.alertAt) {
        guard.state = STATE_CHASE;
        guard.stateTime = 0;
        ctx.events.push({ type: 'alert', guard });
      } else if (arrived || guard.stateTime > GUARD.investigateSeconds) {
        guard.state = STATE_RETURN;
        guard.stateTime = 0;
      }
    } else if (guard.state === STATE_RETURN) {
      const home = guard.route[guard.routeIndex];
      if (moveToward(guard, home[0], home[1], GUARD.returnSpeed, dt)) {
        guard.state = STATE_PATROL;
        guard.stateTime = 0;
      }
    }
  }
}

function patrolStep(guard, dt, time) {
  if (guard.kind === 'sentry') {
    // A sentry stands its post and sweeps its cone back and forth.
    guard.angle = guard.baseAngle + Math.sin(time * 0.9) * guard.sweep;
    return;
  }
  const waypoint = guard.route[guard.routeIndex];
  if (moveToward(guard, waypoint[0], waypoint[1], guard.speed, dt)) {
    guard.routeIndex = (guard.routeIndex + 1) % guard.route.length;
  }
}

/** How many guards are suspicious or alert right now (drives the alarm). */
export function guardAlertCounts(guards) {
  let suspicious = 0;
  let alert = 0;
  for (const guard of guards) {
    if (guard.state === STATE_CHASE) alert += 1;
    else if (guard.state === STATE_STARE) suspicious += 1;
  }
  return { suspicious, alert };
}

/** The nearest guard to a point, for the HUD's "nearest threat" hint. */
export function nearestGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const guard of guards) {
    const d = Math.hypot(guard.x - x, guard.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = guard;
    }
  }
  return { guard: best, distance: bestDist };
}
