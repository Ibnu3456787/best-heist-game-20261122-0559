// The canvas painter for THE GILDED FOX.
// One draw call paints a whole frame: the room, the cones, the watchers, the
// thief, the loot and the exit. Nothing here touches game state — it only
// reads the world and draws it, so the pilot can stage any frame and the
// renderer will show it exactly.

import { PALETTE, ROOM, VIEW } from './config.js';
import { laserLive } from './lasers.js';
import { clamp } from './geometry.js';

let patternCanvas = null;

function diamondPattern(ctx) {
  if (patternCanvas) return patternCanvas;
  patternCanvas = document.createElement('canvas');
  patternCanvas.width = 64;
  patternCanvas.height = 64;
  const p = patternCanvas.getContext('2d');
  p.strokeStyle = 'rgba(139, 147, 176, 0.07)';
  p.lineWidth = 1;
  p.beginPath();
  p.moveTo(32, 6);
  p.lineTo(58, 32);
  p.lineTo(32, 58);
  p.lineTo(6, 32);
  p.closePath();
  p.stroke();
  return patternCanvas;
}

function sector(ctx, x, y, angle, halfAngle, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
}

function coneColor(seen, chasing, base) {
  if (chasing) return 'rgba(229, 72, 77, 0.34)';
  if (seen) return 'rgba(229, 72, 77, 0.22)';
  return base;
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // The room floor, tiled a shade lighter than the surround.
  ctx.fillStyle = PALETTE.floorAlt;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  const pat = ctx.createPattern(diamondPattern(ctx), 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  // Faint tile grid across the floor.
  ctx.strokeStyle = 'rgba(139, 147, 176, 0.05)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = ROOM.x + 80; x < ROOM.x + ROOM.w; x += 80) {
    ctx.moveTo(x, ROOM.y);
    ctx.lineTo(x, ROOM.y + ROOM.h);
  }
  for (let y = ROOM.y + 80; y < ROOM.y + ROOM.h; y += 80) {
    ctx.moveTo(ROOM.x, y);
    ctx.lineTo(ROOM.x + ROOM.w, y);
  }
  ctx.stroke();
  // Gold trim around the room.
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
}

function drawShadowsAndVents(ctx, level) {
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(43, 63, 110, 0.4)';
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(125, 160, 220, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(139, 147, 176, 0.55)';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — HARD TO SPOT', s.x, s.y + s.r + 14);
  }
  for (const v of level.vents) {
    ctx.fillStyle = PALETTE.vent;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = PALETTE.goldDim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = v.y + 14; y < v.y + v.h - 6; y += 16) {
      ctx.moveTo(v.x + 6, y);
      ctx.lineTo(v.x + v.w - 6, y);
    }
    ctx.stroke();
    ctx.save();
    ctx.translate(v.x + v.w / 2, v.y + v.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(232, 228, 216, 0.6)';
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VENT — UNSEEN, SLOW', 0, 4);
    ctx.restore();
  }
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    if (w.w <= 0 || w.h <= 0) continue;
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = PALETTE.wallEdge;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
    if (w.label) {
      ctx.fillStyle = 'rgba(201, 162, 39, 0.75)';
      ctx.font = '12px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(w.label, w.x + w.w / 2, w.y + w.h / 2 + 4);
    }
  }
}

function drawCase(ctx, world) {
  const c = world.level.casePos;
  const cx = c.x + c.w / 2;
  const cy = c.y + c.h / 2;
  ctx.fillStyle = '#1d2440';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = world.lootSecured ? PALETTE.safe : PALETTE.goldBright;
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  // The prize itself: a mask, a diamond, or a jackpot stack.
  ctx.fillStyle = PALETTE.goldBright;
  if (world.heistIndex === 0) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141a2e';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy - 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 5, cy - 1, 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (world.heistIndex === 1) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 13);
    ctx.lineTo(cx + 11, cy - 2);
    ctx.lineTo(cx, cy + 13);
    ctx.lineTo(cx - 11, cy - 2);
    ctx.closePath();
    ctx.fill();
  } else {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx - 10 + i * 10, cy + 6 - i * 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // The prize name and its state, under the case.
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText(world.level.prize.toUpperCase(), cx, c.y + c.h + 20);
  ctx.font = '11px Georgia, serif';
  if (world.lootSecured) {
    ctx.fillStyle = PALETTE.safe;
    ctx.fillText('OPEN', cx, c.y + c.h + 36);
  } else {
    ctx.fillStyle = PALETTE.gold;
    ctx.fillText('LOCKED — HOLD E TO PICK', cx, c.y + c.h + 36);
  }
  // Lockpick progress ring while the thief picks.
  if (world.thief.picking) {
    const p = clamp(world.thief.pickProgress / 2.5, 0, 1);
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 34, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
    ctx.stroke();
  }
}

function drawExit(ctx, world) {
  const e = world.level.exit;
  const open = world.lootSecured;
  ctx.fillStyle = open ? 'rgba(57, 217, 138, 0.25)' : 'rgba(91, 107, 140, 0.2)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? PALETTE.safe : PALETTE.muted;
  ctx.lineWidth = 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillStyle = open ? PALETTE.safe : PALETTE.muted;
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT (LOCKED)', e.x + e.w / 2, e.y + e.h / 2 + 4);
  if (open) {
    // The getaway van waits below the door.
    const vx = e.x + e.w / 2;
    ctx.fillStyle = '#2c3552';
    ctx.fillRect(vx - 34, 738, 68, 26);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx - 34, 738, 68, 26);
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = '10px Georgia, serif';
    ctx.fillText('GETAWAY VAN WAITING', vx, 778);
  }
}

function drawLasers(ctx, world) {
  for (const l of world.lasers) {
    const live = laserLive(l);
    if (live) {
      ctx.strokeStyle = 'rgba(229, 72, 77, 0.25)';
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.strokeStyle = '#ff5b60';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(229, 72, 77, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 8]);
      ctx.beginPath();
      ctx.moveTo(l.x1, l.y1);
      ctx.lineTo(l.x2, l.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    // Emitter dots at both ends.
    ctx.fillStyle = live ? '#ff5b60' : '#7a2b2e';
    ctx.beginPath();
    ctx.arc(l.x1, l.y1, 4, 0, Math.PI * 2);
    ctx.arc(l.x2, l.y2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCones(ctx, world) {
  // Camera cones first (under guard cones).
  for (const cam of world.cameras) {
    const blind = cam.blindFor > 0;
    ctx.fillStyle = blind ? 'rgba(125, 211, 168, 0.05)' : 'rgba(232, 161, 60, 0.13)';
    sector(ctx, cam.x, cam.y, cam.angle, cam.cone, cam.range);
    ctx.fill();
    ctx.strokeStyle = blind ? 'rgba(125, 211, 168, 0.25)' : 'rgba(232, 161, 60, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const g of world.guards) {
    const chasing = g.state === 'chase';
    const seen = g.suspicion > 35;
    ctx.fillStyle = coneColor(seen, chasing, 'rgba(232, 161, 60, 0.16)');
    if (g.kind === 'drone' && g.blindFor > 0) {
      ctx.fillStyle = 'rgba(125, 211, 168, 0.05)';
    }
    sector(ctx, g.x, g.y, g.angle, g.cone, g.range);
    ctx.fill();
    ctx.strokeStyle = chasing ? 'rgba(229, 72, 77, 0.5)' : 'rgba(232, 161, 60, 0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGuards(ctx, world) {
  for (const g of world.guards) {
    // Body.
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0e1220';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick.
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 17, g.y + Math.sin(g.angle) * 17);
    ctx.stroke();
    // Kind initial.
    ctx.fillStyle = '#e8e4d8';
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.label[0], g.x, g.y + 4);
    // Suspicion arc above the guard.
    if (g.suspicion > 2) {
      const p = clamp(g.suspicion / 100, 0, 1);
      ctx.strokeStyle = p > 0.66 ? '#e5484d' : '#f2c94c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(g.x, g.y, 20, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      ctx.stroke();
    }
    if (g.state === 'chase') {
      ctx.fillStyle = '#e5484d';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillText('!', g.x, g.y - 24);
    }
  }
  // Cameras as wall units.
  for (const cam of world.cameras) {
    ctx.fillStyle = cam.blindFor > 0 ? '#3a4a3a' : '#2c3552';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = cam.blindFor > 0 ? PALETTE.safe : PALETTE.camera;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cam.blindFor > 0 ? PALETTE.safe : PALETTE.camera;
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 7, cam.y + Math.sin(cam.angle) * 7, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawThief(ctx, world) {
  const t = world.thief;
  // Sprint streaks.
  if (t.sprinting && t.moving) {
    ctx.strokeStyle = 'rgba(255, 159, 46, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 1; i <= 3; i++) {
      const bx = t.x - Math.cos(t.angle) * (16 + i * 7);
      const by = t.y - Math.sin(t.angle) * (16 + i * 7);
      ctx.moveTo(bx - 5, by);
      ctx.lineTo(bx + 5, by);
    }
    ctx.stroke();
  }
  // Body: a fox-orange disc with ears.
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0e1220';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.moveTo(t.x - 9, t.y - 8);
  ctx.lineTo(t.x - 4, t.y - 18);
  ctx.lineTo(t.x - 1, t.y - 8);
  ctx.moveTo(t.x + 9, t.y - 8);
  ctx.lineTo(t.x + 4, t.y - 18);
  ctx.lineTo(t.x + 1, t.y - 8);
  ctx.fill();
  // Face dot and facing tick.
  ctx.fillStyle = '#141a2e';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.angle) * 5, t.y + Math.sin(t.angle) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
  // Sneak ring.
  if (t.sneaking) {
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, 19, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Hidden marker.
  if (t.hidden) {
    ctx.fillStyle = 'rgba(232, 228, 216, 0.85)';
    ctx.font = '10px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', t.x, t.y - 22);
  }
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOX', t.x, t.y - (t.hidden ? 32 : 22));
  if (t.sprinting) {
    ctx.fillStyle = PALETTE.thief;
    ctx.font = '10px Georgia, serif';
    ctx.fillText('SPRINTING — LOUD', t.x, t.y + 28);
  }
}

function drawTools(ctx, world) {
  for (const coin of world.coins) {
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 16 + (5 - coin.timer) * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.goldBright;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const smoke of world.smokes) {
    ctx.fillStyle = 'rgba(154, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(154, 163, 184, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// Paint one frame of a playing world.
export function drawWorld(ctx, world) {
  drawFloor(ctx);
  drawShadowsAndVents(ctx, world.level);
  drawWalls(ctx, world.level);
  drawExit(ctx, world);
  drawCase(ctx, world);
  drawLasers(ctx, world);
  drawCones(ctx, world);
  drawGuards(ctx, world);
  drawTools(ctx, world);
  drawThief(ctx, world);
}
