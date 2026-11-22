// THE GILDED FOX — security cameras. Wall-mounted, sweeping their cones on
// a fixed cycle, and the only watcher that never blinks: a camera that sees
// you feeds the alarm meter directly. An EMP pulse takes every camera (and
// drone) offline for a few seconds — the window a good thief plans around.
import { CAMERA, SIGHT } from './config.js';
import { hasLineOfSight, inCone, smokeBlocks } from './cones.js';

/** Build live camera objects from a heist's camera list. */
export function makeCameras(heist) {
  return heist.cameras.map((def, index) => ({
    id: index,
    kind: 'camera',
    x: def.x,
    y: def.y,
    angle: def.baseAngle,
    baseAngle: def.baseAngle,
    sweep: def.sweep,
    phase: def.phase ?? 0,
    offlineUntil: 0,
    seeing: false,
  }));
}

/** Step every camera: sweep the cone, check the thief, report sightings. */
export function updateCameras(cameras, dt, ctx) {
  const { thief, walls, hidden, time } = ctx;
  let seeing = 0;
  for (const camera of cameras) {
    camera.angle = camera.baseAngle + Math.sin((time / CAMERA.sweepSeconds) * Math.PI * 2 + camera.phase * Math.PI * 2) * camera.sweep;
    const offline = time < camera.offlineUntil;
    let sees = false;
    if (!offline && !hidden) {
      let range = SIGHT.camera.range;
      if (thief.inShadow) range *= 0.55;
      if (thief.sneaking) range *= 0.7;
      if (thief.sprinting) range *= 1.25;
      sees =
        inCone(camera.x, camera.y, camera.angle, SIGHT.camera.halfAngle, range, thief.x, thief.y) &&
        !smokeBlocks(camera.x, camera.y, thief.x, thief.y, ctx.smoke) &&
        hasLineOfSight(camera.x, camera.y, thief.x, thief.y, walls);
    }
    if (sees && !camera.seeing) ctx.events.push({ type: 'camera-sees', camera });
    camera.seeing = sees;
    if (sees) seeing += 1;
  }
  return seeing;
}

/** Knock every camera offline until `time + seconds` (EMP pulse). */
export function empCameras(cameras, time, seconds) {
  for (const camera of cameras) camera.offlineUntil = time + seconds;
}
