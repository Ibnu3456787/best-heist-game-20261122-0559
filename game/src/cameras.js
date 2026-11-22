// Cameras: fixed sweepers that feed the alarm directly. They never chase,
// but a camera that sees the thief pushes the alarm up fast. An EMP blinds
// them for its duration; while blind their cone is dark and they see nothing.

import { CAMERA } from './config.js';
import { inVisionCone } from './geometry.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    baseAngle: def.angle,
    angle: def.angle,
    sweep: def.sweep,
    period: def.period,
    range: CAMERA.range,
    cone: CAMERA.cone,
    time: 0,
    // Seconds of EMP blindness left.
    blindFor: 0,
  };
}

export function updateCamera(cam, dt) {
  cam.time += dt;
  if (cam.blindFor > 0) cam.blindFor -= dt;
  // The gaze sweeps sinusoidally around its mounting angle.
  cam.angle = cam.baseAngle + Math.sin((cam.time / cam.period) * Math.PI * 2) * cam.sweep;
}

export function cameraSeesThief(cam, thief, walls) {
  if (cam.blindFor > 0) return false;
  if (thief.hidden) return false;
  return inVisionCone(cam.x, cam.y, cam.angle, cam.range, cam.cone, thief.x, thief.y, walls);
}

export function anyCameraSees(world) {
  return world.cameras.some((c) => cameraSeesThief(c, world.thief, world.level.walls));
}

// Blind every camera and every drone for `seconds`.
export function empBlast(world, seconds) {
  for (const c of world.cameras) c.blindFor = seconds;
  for (const g of world.guards) {
    if (g.kind === 'drone') g.blindFor = seconds;
  }
  world.events.push({ type: 'emp' });
}
