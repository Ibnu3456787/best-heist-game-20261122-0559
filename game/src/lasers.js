// Laser grids: beams that toggle on a cycle. A live beam the thief crosses
// trips the alarm. A beam re-arms once it switches off or the thief steps
// clear, so one crossing is one trip, never a stream of them.

import { ALARM } from './config.js';
import { pointToSegment } from './geometry.js';

export const LASER_TRIP_DISTANCE = 7;

export function makeLaser(def) {
  return {
    x1: def.x1,
    y1: def.y1,
    x2: def.x2,
    y2: def.y2,
    period: def.period,
    onFraction: def.onFraction,
    phase: def.phase,
    time: def.phase,
    armed: true,
  };
}

// Is the beam live right now?
export function laserLive(laser) {
  const t = laser.time % laser.period;
  return t < laser.period * laser.onFraction;
}

export function updateLasers(world, dt) {
  for (const laser of world.lasers) {
    laser.time += dt;
    const live = laserLive(laser);
    const thief = world.thief;
    const near = pointToSegment(thief.x, thief.y, laser.x1, laser.y1, laser.x2, laser.y2);
    if (live && laser.armed && near < LASER_TRIP_DISTANCE) {
      laser.armed = false;
      world.alarm = Math.min(100, world.alarm + ALARM.laserTrip);
      world.events.push({ type: 'laser', alarm: world.alarm });
      world.banner = { text: 'LASER TRIPPED! +30 ALARM', until: world.time + 2.2 };
    }
    if (!live || near >= LASER_TRIP_DISTANCE + 12) {
      laser.armed = true;
    }
  }
}
