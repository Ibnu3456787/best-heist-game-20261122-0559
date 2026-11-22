// THE GILDED FOX — vision cones and line of sight. Every watcher (guard,
// camera, drone) sees through the same two questions: is the target inside
// the cone, and does any wall block the view? Walls block sight; shadow
// pools, smoke and vents shorten or cut it (handled by the caller).

/** Angle from (x1, y1) to (x2, y2), in canvas radians (y grows downward). */
export function angleTo(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Smallest absolute difference between two angles, in [0, PI]. */
export function angleDiff(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when (tx, ty) lies inside the cone from (ox, oy) facing `angle`. */
export function inCone(ox, oy, angle, halfAngle, range, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const distSq = dx * dx + dy * dy;
  if (distSq > range * range) return false;
  if (distSq < 1) return true;
  return angleDiff(Math.atan2(dy, dx), angle) <= halfAngle;
}

/** True when segment (x1,y1)-(x2,y2) intersects rectangle `r`. */
export function segmentHitsRect(x1, y1, x2, y2, r) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  if (maxX < r.x || minX > r.x + r.w || maxY < r.y || minY > r.y + r.h) return false;
  if (pointInRect(x1, y1, r) || pointInRect(x2, y2, r)) return true;
  return (
    segmentsCross(x1, y1, x2, y2, r.x, r.y, r.x + r.w, r.y) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x + r.w, r.y + r.h, r.x, r.y + r.h) ||
    segmentsCross(x1, y1, x2, y2, r.x, r.y + r.h, r.x, r.y)
  );
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** True when segment (x1,y1)-(x2,y2) passes through circle (cx, cy, r). */
export function segmentHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return Math.hypot(x1 - cx, y1 - cy) <= r;
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx;
  const py = y1 + t * dy;
  return Math.hypot(px - cx, py - cy) <= r;
}

/** True when any smoke cloud in `clouds` blocks the view from (x1,y1) to (x2,y2). */
export function smokeBlocks(x1, y1, x2, y2, clouds) {
  for (const cloud of clouds ?? []) {
    if (segmentHitsCircle(x1, y1, x2, y2, cloud.x, cloud.y, cloud.radius)) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = direction(cx, cy, dx, dy, ax, ay);
  const d2 = direction(cx, cy, dx, dy, bx, by);
  const d3 = direction(ax, ay, bx, by, cx, cy);
  const d4 = direction(ax, ay, bx, by, dx, dy);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function direction(px, py, qx, qy, rx, ry) {
  return (rx - px) * (qy - py) - (ry - py) * (qx - px);
}

/** True when no wall in `walls` blocks the view from (x1, y1) to (x2, y2). */
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

/**
 * The visible cone as a polygon, clipped by walls: cast rays across the
 * cone's arc and stop each at the first wall (or the range). Used for
 * rendering the cone honestly — what you see is what the guard sees.
 */
export function conePolygon(ox, oy, angle, halfAngle, range, walls, rays = 24) {
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= rays; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const end = raycast(ox, oy, a, range, walls);
    points.push(end);
  }
  return points;
}

/** Walk a ray from (ox, oy) at angle `a` until it hits a wall or `range`. */
export function raycast(ox, oy, a, range, walls) {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  let best = range;
  for (const wall of walls) {
    const t = rayRect(ox, oy, dx, dy, wall);
    if (t !== null && t < best) best = t;
  }
  return { x: ox + dx * best, y: oy + dy * best };
}

function rayRect(ox, oy, dx, dy, r) {
  let tMin = 0;
  let tMax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return null;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return null;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}
