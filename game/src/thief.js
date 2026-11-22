// THE GILDED FOX — the thief. Moves with the keys, sneaks with Shift and
// sprints with Space, and carries the loot once it is grabbed. Movement is
// axis-separated against the room's walls, so the thief slides along a wall
// instead of sticking to it. Stealth state (shadow, vent, smoke, sneak,
// sprint) is recomputed every step and read by every watcher.
import { ROOM, THIEF } from './config.js';

/** A fresh thief at the heist's start point. */
export function makeThief(heist) {
  return {
    x: heist.start.x,
    y: heist.start.y,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    moving: false,
    sneaking: false,
    sprinting: false,
    inShadow: false,
    inVent: false,
    inSmoke: false,
    carrying: false,
    lockpicking: 0, // 0..1 progress while holding E at the vault
    lockpickTarget: null,
  };
}

/** True when the circle at (x, y, r) overlaps any wall rect. */
export function hitsWall(x, y, r, walls) {
  for (const wall of walls) {
    const cx = Math.max(wall.x, Math.min(x, wall.x + wall.w));
    const cy = Math.max(wall.y, Math.min(y, wall.y + wall.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

/**
 * Move the thief one step from `input` ({ dx, dy, sneak, sprint }). The
 * thief object is updated in place; nothing is returned.
 */
export function moveThief(thief, input, dt, walls) {
  thief.sneaking = input.sneak && !input.sprint;
  thief.sprinting = input.sprint && !input.sneak;
  const speed = thief.inVent
    ? THIEF.walkSpeed * 0.6
    : thief.sneaking
      ? THIEF.sneakSpeed
      : thief.sprinting
        ? THIEF.sprintSpeed
        : THIEF.walkSpeed;
  const len = Math.hypot(input.dx, input.dy);
  thief.moving = len > 0;
  if (len === 0) return;
  const nx = input.dx / len;
  const ny = input.dy / len;
  thief.facing = Math.atan2(ny, nx);
  // Axis-separated: try x, then y, so walls slide instead of snag.
  const stepX = nx * speed * dt;
  if (!hitsWall(thief.x + stepX, thief.y, thief.radius, walls)) thief.x += stepX;
  const stepY = ny * speed * dt;
  if (!hitsWall(thief.x, thief.y + stepY, thief.radius, walls)) thief.y += stepY;
  thief.x = Math.max(ROOM.minX + thief.radius, Math.min(ROOM.maxX - thief.radius, thief.x));
  thief.y = Math.max(ROOM.minY + thief.radius, Math.min(ROOM.maxY - thief.radius, thief.y));
}

/** Refresh the thief's stealth flags from the room's shadow pools and vents. */
export function updateThiefStealth(thief, heist, smokeClouds) {
  thief.inShadow = false;
  for (const pool of heist.shadows) {
    if (Math.hypot(thief.x - pool.x, thief.y - pool.y) < pool.r) {
      thief.inShadow = true;
      break;
    }
  }
  thief.inVent = false;
  for (const vent of heist.vents) {
    if (thief.x >= vent.x && thief.x <= vent.x + vent.w && thief.y >= vent.y && thief.y <= vent.y + vent.h) {
      thief.inVent = true;
      break;
    }
  }
  thief.inSmoke = false;
  for (const cloud of smokeClouds) {
    if (Math.hypot(thief.x - cloud.x, thief.y - cloud.y) < cloud.radius) {
      thief.inSmoke = true;
      break;
    }
  }
}

/** True when no watcher can see the thief at all right now. */
export function thiefHidden(thief) {
  return thief.inVent || thief.inSmoke;
}
