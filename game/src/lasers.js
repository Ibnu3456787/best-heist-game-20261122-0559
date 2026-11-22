// THE GILDED FOX — laser grids. Beams across a corridor blink on and off on
// a fixed cycle: cross while a beam is dark and nothing happens; cross while
// it is live and the alarm spikes. The cycle is visible and fair — the beam
// fades in before it goes live, so a careful thief is never punished blind.
import { ALARM } from './config.js';
import { segmentHitsRect } from './cones.js';

/** Build live laser objects from a heist's laser list. */
export function makeLasers(heist) {
  return (heist.lasers ?? []).map((def, index) => ({
    id: index,
    x1: def.x1,
    y1: def.y1,
    x2: def.x2,
    y2: def.y2,
    period: def.period,
    phase: def.phase,
    live: false,
    warming: false,
    tripped: false,
  }));
}

/**
 * Step every laser: a beam is live for the first half of its cycle, warming
 * (fading in) for the half-second before. Crossing a live beam trips it once
 * per crossing and spikes the alarm.
 */
export function updateLasers(lasers, dt, ctx) {
  const { thief, time } = ctx;
  for (const laser of lasers) {
    const cycle = ((time + laser.phase) % laser.period) / laser.period;
    laser.live = cycle < 0.5;
    laser.warming = !laser.live && cycle > 0.5 - 0.5 / laser.period;
    const body = { x: thief.x - thief.radius, y: thief.y - thief.radius, w: thief.radius * 2, h: thief.radius * 2 };
    const crossing = segmentHitsRect(laser.x1, laser.y1, laser.x2, laser.y2, body);
    if (laser.live && crossing && !laser.tripped) {
      laser.tripped = true;
      ctx.events.push({ type: 'laser-trip', laser, amount: ALARM.laserTrip });
    } else if (!crossing) {
      laser.tripped = false;
    }
  }
}
