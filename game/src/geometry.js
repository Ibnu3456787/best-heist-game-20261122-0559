// Small 2D geometry helpers for THE GILDED FOX.
// Everything here is pure math: no canvas, no DOM, so the headless tests can
// import this module in Node and exercise the same code the game runs.

// Clamp a value into [lo, hi].
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Distance between two points.
export function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}

// Shortest angle between a and b, in radians, in [-PI, PI].
export function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Do the segments (ax,ay)-(bx,by) and (cx,cy)-(dx,dy) intersect?
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = cross(dx - cx, dy - cy, ax - cx, ay - cy);
  const d2 = cross(dx - cx, dy - cy, bx - cx, by - cy);
  const d3 = cross(bx - ax, by - ay, cx - ax, cy - ay);
  const d4 = cross(bx - ax, by - ay, dx - ax, dy - ay);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

// Does the segment (ax,ay)-(bx,by) touch the rectangle r {x,y,w,h}?
export function segmentHitsRect(ax, ay, bx, by, r) {
  if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;
  const rx = r.x;
  const ry = r.y;
  const rw = r.x + r.w;
  const rh = r.y + r.h;
  return segmentsCross(ax, ay, bx, by, rx, ry, rw, ry) ||
    segmentsCross(ax, ay, bx, by, rw, ry, rw, rh) ||
    segmentsCross(ax, ay, bx, by, rw, rh, rx, rh) ||
    segmentsCross(ax, ay, bx, by, rx, rh, rx, ry);
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Is the line of sight from (ax,ay) to (bx,by) blocked by any wall?
export function lineBlocked(ax, ay, bx, by, walls) {
  for (const w of walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return true;
  }
  return false;
}

// Distance from point (px,py) to the segment (ax,ay)-(bx,by).
export function pointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = clamp(t, 0, 1);
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return dist(px, py, cx, cy);
}

// Push a circle (x, y, radius r) out of every rectangle it overlaps.
// Returns the corrected {x, y}. The circle is resolved axis by axis so it
// slides along walls instead of sticking to corners.
export function resolveCircleRects(x, y, r, walls) {
  let nx = x;
  let ny = y;
  for (const w of walls) {
    const closestX = clamp(nx, w.x, w.x + w.w);
    const closestY = clamp(ny, w.y, w.y + w.h);
    const dx = nx - closestX;
    const dy = ny - closestY;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      nx = closestX + (dx / d) * r;
      ny = closestY + (dy / d) * r;
    } else if (d2 <= 0.0001) {
      // Centre inside the rectangle: push out along the smallest overlap.
      const left = nx - w.x;
      const right = w.x + w.w - nx;
      const top = ny - w.y;
      const bottom = w.y + w.h - ny;
      const m = Math.min(left, right, top, bottom);
      if (m === left) nx = w.x - r;
      else if (m === right) nx = w.x + w.w + r;
      else if (m === top) ny = w.y - r;
      else ny = w.y + w.h + r;
    }
  }
  return { x: nx, y: ny };
}

// Is the point (tx,ty) inside the vision cone of a watcher at (wx,wy)
// facing `angle` (radians), with `range` and `halfAngle`, and with a clear
// line of sight past `walls`?
export function inVisionCone(wx, wy, angle, range, halfAngle, tx, ty, walls) {
  const d = dist(wx, wy, tx, ty);
  if (d > range) return false;
  if (d < 14) return true; // Point blank: you are standing on the watcher.
  const targetAngle = Math.atan2(ty - wy, tx - wx);
  if (Math.abs(angleDiff(angle, targetAngle)) > halfAngle) return false;
  return !lineBlocked(wx, wy, tx, ty, walls);
}
