// Guards: patrol, suspicion, chase, investigate, return.
// A guard is a state machine. While it can see the thief its suspicion
// fills; a full meter turns the patrol into a chase. A chase that touches
// the thief busts the heist. A thrown coin sends the nearest guards to look.

import { GUARD_KINDS } from './config.js';
import { angleDiff, clamp, dist, inVisionCone, lineBlocked, resolveCircleRects } from './geometry.js';

export const GUARD_RADIUS = 14;

// Build a guard from a level definition: { kind, x, y, waypoints }.
export function makeGuard(def) {
  const kind = GUARD_KINDS[def.kind];
  return {
    kind: def.kind,
    label: kind.label,
    x: def.x,
    y: def.y,
    angle: 0,
    speed: kind.speed,
    range: kind.range,
    cone: kind.cone,
    suspicionRate: kind.suspicion,
    chaseSpeed: kind.chase,
    color: kind.color,
    waypoints: def.waypoints,
    waypointIndex: 1 % def.waypoints.length,
    state: 'patrol',
    suspicion: 0,
    // Seconds since the guard last saw the thief.
    unseenFor: 99,
    investigateX: 0,
    investigateY: 0,
    investigateFor: 0,
    // Facing used while standing still (sentries pan around it).
    baseAngle: 0,
    panTime: 0,
  };
}

// Can this guard see the thief right now? Walls block sight; vents and
// smoke hide the thief completely; shadows and sneaking slow the fill.
// An EMP-blinded drone sees nothing until its blindness wears off.
export function guardSeesThief(g, thief, walls) {
  if (thief.hidden) return false;
  if (g.kind === 'drone' && g.blindFor > 0) return false;
  return inVisionCone(g.x, g.y, g.angle, g.range, g.cone, thief.x, thief.y, walls);
}

// How fast this guard's suspicion fills while it sees the thief:
// closer is faster, sneaking and shadows slow it, sprinting hurries it.
export function suspicionFill(g, thief) {
  const d = dist(g.x, g.y, thief.x, thief.y);
  const closeness = 1.7 - (d / g.range);
  let factor = closeness;
  if (thief.sneaking) factor *= 0.55;
  if (thief.sprinting) factor *= 1.6;
  if (thief.inShadow) factor *= 0.55;
  return g.suspicionRate * Math.max(0.25, factor);
}

function moveToward(g, tx, ty, speed, dt, walls) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 1) return true;
  const step = Math.min(d, speed * dt);
  const nx = g.x + (dx / d) * step;
  const ny = g.y + (dy / d) * step;
  const fixed = resolveCircleRects(nx, ny, GUARD_RADIUS, walls);
  g.x = fixed.x;
  g.y = fixed.y;
  g.angle = Math.atan2(dy, dx);
  return d - step < 2;
}

export function updateGuard(g, world, dt) {
  const thief = world.thief;
  const walls = world.level.walls;
  if (g.blindFor > 0) g.blindFor -= dt;
  const sees = guardSeesThief(g, thief, walls);

  if (sees) {
    g.unseenFor = 0;
    g.suspicion = clamp(g.suspicion + suspicionFill(g, thief) * dt, 0, 100);
  } else {
    g.unseenFor += dt;
    // Suspicion cools off only while the thief is out of sight.
    g.suspicion = clamp(g.suspicion - 12 * dt, 0, 100);
  }

  if (g.state === 'patrol') {
    if (g.suspicion >= 100) {
      g.state = 'chase';
      world.events.push({ type: 'chase', guard: g });
    } else {
      patrolStep(g, world, dt);
    }
  } else if (g.state === 'chase') {
    if (g.suspicion <= 0 && g.unseenFor > 3) {
      g.state = 'return';
    } else {
      moveToward(g, thief.x, thief.y, g.chaseSpeed, dt, walls);
      // Caught: a chasing guard that touches the thief ends the heist.
      if (dist(g.x, g.y, thief.x, thief.y) < GUARD_RADIUS + 13) {
        world.phase = 'busted';
        world.bustReason = 'caught';
        world.bustGuard = g.label;
      }
    }
  } else if (g.state === 'investigate') {
    g.investigateFor -= dt;
    const arrived = moveToward(g, g.investigateX, g.investigateY, g.speed * 1.25, dt, walls);
    if (arrived || g.investigateFor <= 0) {
      g.state = 'return';
    }
  } else if (g.state === 'return') {
    const target = g.waypoints[g.waypointIndex];
    const arrived = moveToward(g, target[0], target[1], g.speed, dt, walls);
    if (arrived) {
      g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
      g.state = 'patrol';
    }
  }

  // A guard that spots the thief while investigating still chases.
  if (g.state !== 'chase' && g.suspicion >= 100 && g.state !== 'investigate') {
    g.state = 'chase';
  }
}

// Walk the patrol loop. Sentries (two waypoints close together) drift
// slowly and pan their gaze; everyone else walks waypoint to waypoint.
function patrolStep(g, world, dt) {
  const target = g.waypoints[g.waypointIndex];
  const arrived = moveToward(g, target[0], target[1], g.speed, dt, world.level.walls);
  if (arrived) {
    g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
  }
  // Sentries pan: their gaze sweeps ±50 degrees around their facing.
  if (g.kind === 'sentry') {
    g.panTime += dt;
    g.angle = g.baseAngle + Math.sin(g.panTime * 0.9) * 0.9;
  }
}

// Send every guard within earshot to look at a thrown coin.
export function distractGuards(world, x, y) {
  for (const g of world.guards) {
    if (g.state === 'chase') continue;
    if (dist(g.x, g.y, x, y) < 320) {
      g.state = 'investigate';
      g.investigateX = x;
      g.investigateY = y;
      g.investigateFor = 4;
      g.suspicion = Math.max(0, g.suspicion - 30);
    }
  }
}

// Is any guard currently chasing the thief?
export function anyChase(world) {
  return world.guards.some((g) => g.state === 'chase');
}

// Is any guard able to see the thief right now?
export function anyGuardSees(world) {
  return world.guards.some((g) => guardSeesThief(g, world.thief, world.level.walls));
}
