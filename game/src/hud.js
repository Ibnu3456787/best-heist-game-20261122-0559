// The HUD: the top bar (heist, alarm, purse, clock), the bottom bar
// (controls and the tool belt) and the centre banner. Drawn over the world
// every frame, so the player always sees the alarm, the purse and the goal.

import { PALETTE, TOOLS, VIEW } from './config.js';

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function drawTopBar(ctx, game) {
  const world = game.world;
  const level = world.level;
  ctx.fillStyle = '#0e1220';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(VIEW.width, 64);
  ctx.stroke();

  // Left: heist name and mode.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText(level.name.toUpperCase(), 20, 26);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`${game.mode.toUpperCase()} MODE · HEIST ${world.heistIndex + 1} OF 3`, 20, 46);

  // Centre: the alarm meter.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px Georgia, serif';
  ctx.fillText('ALARM', 470, 26);
  const bx = 500;
  const bw = 280;
  ctx.fillStyle = '#1d2440';
  ctx.fillRect(bx, 12, bw, 20);
  const pct = world.alarm / 100;
  ctx.fillStyle = pct < 0.5 ? PALETTE.safe : pct < 0.8 ? '#f2c94c' : '#e5484d';
  ctx.fillRect(bx, 12, bw * pct, 20);
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(bx, 12, bw, 20);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(`${Math.round(world.alarm)}%`, bx + bw + 28, 27);
  // Status line under the meter.
  ctx.fillStyle = world.lockdown ? '#e5484d' : world.alarmHot ? '#f2c94c' : PALETTE.muted;
  ctx.font = '12px Georgia, serif';
  const status = world.lockdown
    ? `LOCKDOWN — ${Math.ceil(world.lockdownLeft)}s TO THE EXIT!`
    : world.alarmHot
      ? 'SOMEONE IS SUSPICIOUS — BREAK AWAY'
      : 'UNSEEN — STAY IN THE SHADOWS';
  ctx.fillText(status, 640, 50);

  // Right: prize and purse.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(
    world.lootSecured ? `${level.prizeValue}g SECURED` : `${level.prizeValue}g TO STEAL`,
    1260, 26,
  );
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px Georgia, serif';
  ctx.fillText(`PURSE ${world.purse}g · ${fmtTime(world.time)}`, 1260, 46);
}

export function drawBottomBar(ctx, game) {
  const world = game.world;
  ctx.fillStyle = '#0e1220';
  ctx.fillRect(0, VIEW.height - 64, VIEW.width, 64);
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height - 64);
  ctx.lineTo(VIEW.width, VIEW.height - 64);
  ctx.stroke();

  // Left: the objective.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 13px Georgia, serif';
  const objective = world.lootSecured
    ? `★ ${world.level.prize} secured — reach the EXIT!`
    : `★ Steal the ${world.level.prize} (${world.level.prizeValue}g)`;
  ctx.fillText(objective, 20, VIEW.height - 40);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '11px Georgia, serif';
  ctx.fillText(
    '[E] LOCKPICK (hold, stay still)   [SHIFT] SNEAK   [SPACE] SPRINT   [M] SOUND   [P] PAUSE',
    20, VIEW.height - 18,
  );

  // Right: the tool belt.
  let x = VIEW.width - 20;
  const slots = ['emp', 'smoke', 'coin'];
  for (const slot of slots) {
    const tool = TOOLS[slot];
    const w = 168;
    x -= w;
    const afford = world.purse >= tool.cost;
    ctx.fillStyle = afford ? '#1d2440' : '#141a2e';
    ctx.fillRect(x, VIEW.height - 56, w - 8, 48);
    ctx.strokeStyle = afford ? PALETTE.gold : '#3a4668';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, VIEW.height - 56, w - 8, 48);
    ctx.textAlign = 'left';
    ctx.fillStyle = afford ? PALETTE.ink : PALETTE.muted;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(`[${tool.key}] ${tool.name}`, x + 10, VIEW.height - 38);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '11px Georgia, serif';
    ctx.fillText(`${tool.cost}g · ${tool.blurb}`, x + 10, VIEW.height - 20);
    x -= 4;
  }
}

// A big centre banner (laser trips, loot secured, lockdown).
export function drawBanner(ctx, game) {
  const world = game.world;
  if (!world.banner) return;
  ctx.textAlign = 'center';
  ctx.font = 'bold 26px Georgia, serif';
  const text = world.banner.text;
  const w = ctx.measureText(text).width + 48;
  const x = (VIEW.width - w) / 2;
  const y = VIEW.height - 150;
  ctx.fillStyle = 'rgba(14, 18, 32, 0.92)';
  ctx.fillRect(x, y, w, 44);
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, 44);
  ctx.fillStyle = PALETTE.ink;
  ctx.fillText(text, VIEW.width / 2, y + 30);
}
