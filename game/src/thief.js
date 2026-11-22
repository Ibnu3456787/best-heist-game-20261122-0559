// The thief: movement, sneaking, sprinting, hiding and the lockpick.
// The thief moves with the keyboard; Shift sneaks (slower, harder to spot),
// Space sprints (faster, louder). Vents hide the thief completely but slow
// the walk to a crawl. The lockpick needs the thief standing still beside
// the case, holding E, for the full pick time.

import { LOCKPICK_SECONDS, SPEEDS, THIEF_RADIUS } from './config.js';
import { clamp, dist, pointInRect, resolveCircleRects } from './geometry.js';

export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: -Math.PI / 2,
    sneaking: false,
    sprinting: false,
    moving: false,
    // Hiding: inside a vent, or inside a smoke cloud.
    hidden: false,
    inVent: false,
    inSmoke: false,
    inShadow: false,
    // Lockpick progress in seconds, 0..LOCKPICK_SECONDS.
    pickProgress: 0,
    picking: false,
  };
}

function insideVent(thief, vents) {
  return vents.some((v) => pointInRect(thief.x, thief.y, v));
}

function insideShadow(thief, shadows) {
  return shadows.some((s) => dist(thief.x, thief.y, s.x, s.y) < s.r);
}

function insideSmoke(thief, smokes) {
  return smokes.some((s) => dist(thief.x, thief.y, s.x, s.y) < s.radius);
}

export function updateThief(world, input, dt) {
  const thief = world.thief;
  const level = world.level;

  // Read the movement keys into a direction vector.
  let dx = 0;
  let dy = 0;
  if (input.left) dx -= 1;
  if (input.right) dx += 1;
  if (input.up) dy -= 1;
  if (input.down) dy += 1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
  }
  thief.moving = len > 0;

  thief.sneaking = !!input.sneak;
  thief.sprinting = !!input.sprint && !thief.sneaking;

  const inVent = insideVent(thief, level.vents);
  thief.inVent = inVent;
  thief.inShadow = insideShadow(thief, level.shadows);
  thief.inSmoke = insideSmoke(thief, world.smokes);
  thief.hidden = inVent || thief.inSmoke;

  let speed = thief.sprinting ? SPEEDS.sprint : thief.sneaking ? SPEEDS.sneak : SPEEDS.walk;
  if (inVent) speed = SPEEDS.vent;

  if (thief.moving) {
    thief.angle = Math.atan2(dy, dx);
    const nx = thief.x + dx * speed * dt;
    const ny = thief.y + dy * speed * dt;
    const fixed = resolveCircleRects(nx, ny, THIEF_RADIUS, level.walls);
    thief.x = clamp(fixed.x, 10 + THIEF_RADIUS, 1270 - THIEF_RADIUS);
    thief.y = clamp(fixed.y, 74 + THIEF_RADIUS, 724 - THIEF_RADIUS);
  }

  // Lockpick: hold E, standing still, beside the case.
  const c = level.casePos;
  const caseCx = c.x + c.w / 2;
  const caseCy = c.y + c.h / 2;
  const nearCase = dist(thief.x, thief.y, caseCx, caseCy) < 78;
  thief.picking = false;
  if (world.lootSecured) {
    thief.pickProgress = LOCKPICK_SECONDS;
  } else if (nearCase && input.pick && !thief.moving) {
    thief.picking = true;
    thief.pickProgress += dt;
    if (thief.pickProgress >= LOCKPICK_SECONDS) {
      world.lootSecured = true;
      world.events.push({ type: 'loot' });
      world.banner = {
        text: `${level.prize.toUpperCase()} SECURED — GET TO THE EXIT!`,
        until: world.time + 3,
      };
    }
  } else {
    thief.pickProgress = Math.max(0, thief.pickProgress - dt * 2);
  }
}
