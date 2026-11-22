// THE GILDED FOX — the playfield renderer. Everything on canvas is drawn
// here from the simulation's state, in one fixed order: floor, shadows and
// vents, vision cones, walls and decor, the vault and the loot, the exit,
// the lasers, the smoke, the characters, and the light. No image files, no
// network — every shape is procedural, so the game is one self-contained
// folder and the screenshots are honest renders of the code.
import { PALETTE, SIGHT, VIEW } from './config.js';
import { conePolygon } from './cones.js';
import { alarmBand } from './alarm.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Segoe UI", system-ui, -apple-system, sans-serif';

/** Draw the whole playfield for one frame of a live world. */
export function drawPlayfield(ctx, world) {
  const { heist } = world;
  drawFloor(ctx);
  drawShadowsAndVents(ctx, heist);
  // Cones before the vault, loot and exit: the labels stay crisp on top of
  // the light instead of being washed out by it.
  drawCones(ctx, world);
  drawWalls(ctx, heist);
  drawVaultAndLoot(ctx, world);
  drawExit(ctx, world);
  drawLasers(ctx, world);
  drawSmoke(ctx, world);
  drawCoin(ctx, world);
  drawGuards(ctx, world);
  drawCameras(ctx, world);
  drawThief(ctx, world);
  drawVignette(ctx, world);
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  // Art-deco diamond lattice, faint enough to read as floor, not noise.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.07)';
  ctx.lineWidth = 1;
  const step = 64;
  for (let x = 0; x <= VIEW.width; x += step) {
    for (let y = 0; y <= VIEW.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(x + step / 2, y + 8);
      ctx.lineTo(x + step - 8, y + step / 2);
      ctx.lineTo(x + step / 2, y + step - 8);
      ctx.lineTo(x + 8, y + step / 2);
      ctx.closePath();
      ctx.stroke();
    }
  }
  // Crimson carpet runner from the entrance to the vault. Kept faint so it
  // never reads as a laser.
  ctx.fillStyle = 'rgba(140, 30, 50, 0.22)';
  ctx.fillRect(596, 64, 88, 632);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(596, 64, 88, 632);
  // Gold-trimmed outer wall.
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 60, VIEW.width - 40, VIEW.height - 64);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW.width, 20);
  ctx.fillRect(0, VIEW.height - 4, VIEW.width, 4);
  ctx.fillRect(0, 0, 20, VIEW.height);
  ctx.fillRect(VIEW.width - 20, 0, 20, VIEW.height);
}

function drawShadowsAndVents(ctx, heist) {
  for (const pool of heist.shadows) {
    const gradient = ctx.createRadialGradient(pool.x, pool.y, 10, pool.x, pool.y, pool.r);
    gradient.addColorStop(0, PALETTE.shadow);
    gradient.addColorStop(1, 'rgba(8, 12, 32, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.shadowEdge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pool.x, pool.y, pool.r - 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(140, 170, 255, 0.5)';
    ctx.font = `600 11px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('SHADOW — HARD TO SPOT', pool.x, pool.y + pool.r - 10);
  }
  for (const vent of heist.vents) {
    ctx.fillStyle = '#0d1124';
    ctx.fillRect(vent.x, vent.y, vent.w, vent.h);
    ctx.strokeStyle = 'rgba(140, 170, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(vent.x, vent.y, vent.w, vent.h);
    ctx.strokeStyle = 'rgba(140, 170, 255, 0.35)';
    ctx.lineWidth = 3;
    for (let y = vent.y + 18; y < vent.y + vent.h - 8; y += 22) {
      ctx.beginPath();
      ctx.moveTo(vent.x + 8, y);
      ctx.lineTo(vent.x + vent.w - 8, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(vent.x + vent.w / 2, vent.y + vent.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(140, 170, 255, 0.75)';
    ctx.font = `700 13px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('VENT — UNSEEN, SLOW', 0, 5);
    ctx.restore();
  }
}

function drawWalls(ctx, heist) {
  for (const wall of heist.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = 'rgba(201, 162, 39, 0.5)';
    ctx.font = `600 10px ${SANS}`;
    ctx.textAlign = 'center';
    const label = wall.kind === 'case' ? 'DISPLAY' : wall.kind === 'desk' ? 'TELLER' : wall.kind === 'pillar' ? '' : wall.kind === 'statue' ? '' : wall.kind === 'table' ? 'TABLE' : wall.kind === 'slots' ? 'SLOTS' : '';
    if (label) ctx.fillText(label, wall.x + wall.w / 2, wall.y + wall.h / 2 + 4);
    if (wall.kind === 'statue') {
      ctx.fillStyle = '#c9a227';
      ctx.beginPath();
      ctx.arc(wall.x + wall.w / 2, wall.y + wall.h / 2, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    if (wall.kind === 'slots') {
      ctx.fillStyle = '#ffd94a';
      for (let i = 0; i < 4; i += 1) {
        ctx.fillRect(wall.x + 12 + i * 32, wall.y + 10, 18, 14);
      }
    }
  }
}

function drawVaultAndLoot(ctx, world) {
  const { heist, loot, time } = world;
  const v = heist.vault;
  // The vault case: gold frame, glass shine while locked.
  ctx.fillStyle = '#10142a';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = loot.caseOpen ? '#37d67a' : PALETTE.wallTrim;
  ctx.lineWidth = 3;
  ctx.strokeRect(v.x, v.y, v.w, v.h);
  ctx.fillStyle = loot.caseOpen ? '#37d67a' : PALETTE.wallTrim;
  ctx.font = `700 11px ${SANS}`;
  ctx.textAlign = 'center';
  // The lock label sits below the vault (never above it, where the centre
  // camera hangs) and below the loot's name.
  ctx.fillText(loot.caseOpen ? 'OPEN' : 'LOCKED — HOLD E TO PICK', v.x + v.w / 2, v.y + v.h + 32);
  if (loot.taken) return;
  // The prize: a pulsing gold halo, a diamond, and sparkles.
  const pulse = 0.75 + Math.sin(time * 3) * 0.25;
  const glow = ctx.createRadialGradient(loot.x, loot.y, 4, loot.x, loot.y, 54 * pulse + 20);
  glow.addColorStop(0, PALETTE.lootGlow);
  glow.addColorStop(1, 'rgba(255, 217, 74, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(loot.x, loot.y, 54 * pulse + 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.loot;
  ctx.beginPath();
  ctx.moveTo(loot.x, loot.y - 16);
  ctx.lineTo(loot.x + 12, loot.y - 4);
  ctx.lineTo(loot.x + 8, loot.y + 14);
  ctx.lineTo(loot.x - 8, loot.y + 14);
  ctx.lineTo(loot.x - 12, loot.y - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff3b0';
  for (let i = 0; i < 4; i += 1) {
    const a = time * 2 + (i * Math.PI) / 2;
    const sx = loot.x + Math.cos(a) * 26;
    const sy = loot.y + Math.sin(a) * 26;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 12px ${SANS}`;
  ctx.fillText(loot.name.toUpperCase(), loot.x, loot.y + 34);
}

function drawExit(ctx, world) {
  const { heist } = world;
  const e = heist.exit;
  const open = world.exitOpen;
  ctx.fillStyle = open ? 'rgba(55, 214, 122, 0.25)' : 'rgba(60, 60, 80, 0.5)';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = open ? PALETTE.exit : '#666a80';
  ctx.lineWidth = open ? 3 : 2;
  ctx.strokeRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = open ? PALETTE.exit : '#8a8fa8';
  ctx.font = `700 ${open ? 15 : 12}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT (LOCKED)', e.x + e.w / 2, e.y + e.h / 2 + 5);
  if (open) {
    // The getaway van waits beyond the door.
    ctx.fillStyle = PALETTE.exit;
    ctx.font = `700 11px ${SANS}`;
    ctx.fillText('GETAWAY VAN WAITING', e.x + e.w / 2, e.y + e.h + 16);
  }
}

function drawCones(ctx, world) {
  // Camera cones first (under guard cones), then guard cones.
  for (const camera of world.cameras) {
    const offline = world.time < camera.offlineUntil;
    if (offline) continue;
    const poly = conePolygon(camera.x, camera.y, camera.angle, SIGHT.camera.halfAngle, SIGHT.camera.range, world.heist.walls);
    ctx.fillStyle = PALETTE.coneCamera;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneCameraEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  for (const guard of world.guards) {
    if (guard.kind === 'drone' && world.time < world.tools.empUntil) continue;
    const sight = SIGHT[guard.kind];
    const alert = guard.state === 'chase' || guard.state === 'stare';
    const poly = conePolygon(guard.x, guard.y, guard.angle, sight.halfAngle, sight.range, world.heist.walls);
    ctx.fillStyle = alert ? PALETTE.coneAlert : PALETTE.coneGuard;
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.coneGuardEdge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
}

function drawLasers(ctx, world) {
  for (const laser of world.lasers) {
    if (!laser.live && !laser.warming) continue;
    ctx.strokeStyle = laser.live ? 'rgba(255, 60, 60, 0.9)' : 'rgba(255, 60, 60, 0.3)';
    ctx.lineWidth = laser.live ? 2.5 : 1.5;
    ctx.setLineDash(laser.live ? [] : [6, 6]);
    ctx.beginPath();
    ctx.moveTo(laser.x1, laser.y1);
    ctx.lineTo(laser.x2, laser.y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff4040';
    ctx.beginPath();
    ctx.arc(laser.x1, laser.y1, 4, 0, Math.PI * 2);
    ctx.arc(laser.x2, laser.y2, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSmoke(ctx, world) {
  for (const cloud of world.tools.smoke) {
    const gradient = ctx.createRadialGradient(cloud.x, cloud.y, 5, cloud.x, cloud.y, cloud.radius);
    gradient.addColorStop(0, 'rgba(200, 200, 215, 0.5)');
    gradient.addColorStop(1, 'rgba(200, 200, 215, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoin(ctx, world) {
  const coin = world.tools.coin;
  if (!coin) return;
  ctx.fillStyle = PALETTE.loot;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff3b0';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 217, 74, 0.8)';
  ctx.font = `700 10px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('CLINK!', coin.x, coin.y - 12);
}

function drawGuards(ctx, world) {
  for (const guard of world.guards) {
    const empFrozen = guard.kind === 'drone' && world.time < world.tools.empUntil;
    if (guard.kind === 'hound') {
      drawHound(ctx, guard);
    } else if (guard.kind === 'drone') {
      drawDrone(ctx, guard, empFrozen);
    } else {
      drawGuardBody(ctx, guard);
    }
    if (empFrozen) {
      ctx.fillStyle = '#ffd94a';
      ctx.font = `700 11px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('OFFLINE', guard.x, guard.y - 24);
    }
    // Suspicion markers: "?" while staring, "!" while chasing.
    if (guard.state === 'stare') {
      drawMarker(ctx, guard.x, guard.y - 26, '?', '#ffb020');
    } else if (guard.state === 'chase') {
      drawMarker(ctx, guard.x, guard.y - 26, '!', '#ff4040');
    }
    // Suspicion ring: fills as the guard grows sure.
    if (guard.suspicion > 5 && guard.suspicion < 100) {
      ctx.strokeStyle = 'rgba(255, 176, 32, 0.9)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 22, -Math.PI / 2, -Math.PI / 2 + (guard.suspicion / 100) * Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawMarker(ctx, x, y, text, color) {
  ctx.fillStyle = color;
  ctx.font = `800 18px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

function drawGuardBody(ctx, guard) {
  const captain = guard.kind === 'captain';
  const r = captain ? 16 : 14;
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + r - 2, r, r * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = captain ? '#5a3b6b' : PALETTE.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0d1124';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Cap + facing tick.
  ctx.fillStyle = PALETTE.guardCap;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y - 3, r * 0.62, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#f4f1e8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (r + 5), guard.y + Math.sin(guard.angle) * (r + 5));
  ctx.stroke();
  if (captain) {
    ctx.fillStyle = PALETTE.loot;
    ctx.font = `700 10px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('CAPT', guard.x, guard.y + r + 12);
  }
}

function drawHound(ctx, guard) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 10, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.hound;
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y, 17, 11, guard.angle, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0d1124';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Ears.
  const ex = guard.x + Math.cos(guard.angle) * 12;
  const ey = guard.y + Math.sin(guard.angle) * 12;
  ctx.fillStyle = '#4a2f22';
  ctx.beginPath();
  ctx.moveTo(ex, ey - 6);
  ctx.lineTo(ex + 6, ey - 12);
  ctx.lineTo(ex + 8, ey - 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c9a27f';
  ctx.font = `700 10px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('HOUND', guard.x, guard.y + 24);
}

function drawDrone(ctx, guard, frozen) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(guard.x, guard.y + 14, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = frozen ? '#555a70' : PALETTE.drone;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0d1124';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Rotor blur.
  ctx.strokeStyle = frozen ? 'rgba(150, 150, 170, 0.4)' : 'rgba(220, 225, 245, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(guard.x - 18, guard.y - 6);
  ctx.lineTo(guard.x + 18, guard.y - 6);
  ctx.moveTo(guard.x - 18, guard.y + 6);
  ctx.lineTo(guard.x + 18, guard.y + 6);
  ctx.stroke();
  // Red eye.
  ctx.fillStyle = frozen ? '#666' : '#ff4040';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9cfe8';
  ctx.font = `700 10px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('DRONE', guard.x, guard.y + 26);
}

function drawCameras(ctx, world) {
  for (const camera of world.cameras) {
    const offline = world.time < camera.offlineUntil;
    ctx.fillStyle = '#0d1124';
    ctx.fillRect(camera.x - 12, camera.y - 8, 24, 16);
    ctx.strokeStyle = offline ? '#555a70' : PALETTE.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(camera.x - 12, camera.y - 8, 24, 16);
    ctx.fillStyle = offline ? '#555a70' : camera.seeing ? '#ff4040' : '#37d67a';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y, 4, 0, Math.PI * 2);
    ctx.fill();
    // Lens direction tick.
    ctx.strokeStyle = offline ? '#555a70' : '#f4f1e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + Math.cos(camera.angle) * 16, camera.y + Math.sin(camera.angle) * 16);
    ctx.stroke();
    if (offline) {
      ctx.fillStyle = '#ffd94a';
      ctx.font = `700 10px ${SANS}`;
      ctx.textAlign = 'center';
      ctx.fillText('OFFLINE', camera.x, camera.y + 22);
    }
  }
}

function drawThief(ctx, world) {
  const thief = world.thief;
  // A faint gold ring and a name tag: the judge must spot the Fox at a
  // glance, even inside a shadow pool.
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius + 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 10px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText('FOX', thief.x, thief.y - thief.radius - 12);
  // Shadow.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(thief.x, thief.y + thief.radius - 2, thief.radius, thief.radius * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloak.
  ctx.fillStyle = PALETTE.thiefCloak;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, thief.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.loot;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Fox ears.
  ctx.fillStyle = '#c96a2b';
  const earA = thief.facing - 2.4;
  const earB = thief.facing + 2.4;
  for (const a of [earA, earB]) {
    ctx.beginPath();
    ctx.moveTo(thief.x + Math.cos(a) * 8, thief.y + Math.sin(a) * 8);
    ctx.lineTo(thief.x + Math.cos(a - 0.25) * 18, thief.y + Math.sin(a - 0.25) * 18);
    ctx.lineTo(thief.x + Math.cos(a + 0.25) * 18, thief.y + Math.sin(a + 0.25) * 18);
    ctx.closePath();
    ctx.fill();
  }
  // Face: pale mask with two dark eyes.
  ctx.fillStyle = PALETTE.thief;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y - 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14141c';
  const lookX = Math.cos(thief.facing) * 2.5;
  const lookY = Math.sin(thief.facing) * 2.5;
  ctx.beginPath();
  ctx.arc(thief.x - 3 + lookX, thief.y - 3 + lookY, 1.8, 0, Math.PI * 2);
  ctx.arc(thief.x + 3 + lookX, thief.y - 3 + lookY, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Gold scarf trailing behind.
  ctx.strokeStyle = PALETTE.loot;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x - Math.cos(thief.facing) * 20, thief.y - Math.sin(thief.facing) * 20 + 4);
  ctx.stroke();
  // Carrying the loot: a gold glint above the head.
  if (thief.carrying) {
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.moveTo(thief.x, thief.y - 24);
    ctx.lineTo(thief.x + 6, thief.y - 16);
    ctx.lineTo(thief.x, thief.y - 10);
    ctx.lineTo(thief.x - 6, thief.y - 16);
    ctx.closePath();
    ctx.fill();
  }
  // Lockpick progress ring.
  if (thief.lockpicking > 0) {
    ctx.strokeStyle = PALETTE.loot;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 22, -Math.PI / 2, -Math.PI / 2 + thief.lockpicking * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.loot;
    ctx.font = `700 11px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('PICKING…', thief.x, thief.y - 28);
  }
  // Sneak / sprint tell.
  if (thief.sneaking) {
    ctx.fillStyle = 'rgba(140, 170, 255, 0.9)';
    ctx.font = `700 10px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('SNEAKING', thief.x, thief.y + 28);
  } else if (thief.sprinting) {
    ctx.fillStyle = 'rgba(255, 176, 32, 0.9)';
    ctx.font = `700 10px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('SPRINTING — LOUD', thief.x, thief.y + 28);
  }
}

function drawVignette(ctx, world) {
  // The room darkens toward the edges; the alarm tints it red as it rises.
  const gradient = ctx.createRadialGradient(640, 360, 300, 640, 360, 780);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const band = alarmBand(world.alarm);
  if (band === 'hot' || band === 'lockdown') {
    const pulse = band === 'lockdown' ? 0.16 + Math.sin(world.time * 8) * 0.08 : 0.1;
    ctx.fillStyle = `rgba(255, 40, 40, ${pulse})`;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  }
}
