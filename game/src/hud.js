// THE GILDED FOX — the HUD. The alarm meter is the star: a big bar across
// the top that the eye finds in a glance, green to amber to red, with the
// lockdown countdown when it matters. Around it: the heist name, the loot
// and the purse, the clock, the objective, and the tool belt with prices —
// every system the game has, visible while you play.
import { PALETTE, VIEW } from './config.js';
import { alarmBand } from './alarm.js';
import { toolBelt } from './loot.js';

const SANS = '"Segoe UI", system-ui, -apple-system, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';

/** The tool belt's clickable rects, in belt order (coin, smoke, EMP). */
export function toolBeltRects() {
  const boxW = 148;
  const boxH = 44;
  const gap = 10;
  const totalW = 3 * boxW + 2 * gap;
  const x = (VIEW.width - totalW) / 2;
  const y = VIEW.height - boxH - 12;
  return [0, 1, 2].map((i) => ({ x: x + i * (boxW + gap), y, w: boxW, h: boxH }));
}

/** The full HUD for one frame of a live world. */
export function drawHud(ctx, world, app) {
  drawTopBar(ctx, world, app);
  drawToolBelt(ctx, world);
  drawObjective(ctx, world);
  drawMessage(ctx, world);
}

function drawTopBar(ctx, world, app) {
  const { heist, alarm } = world;
  ctx.fillStyle = 'rgba(10, 13, 28, 0.92)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.hudHeight);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.hudHeight);
  ctx.lineTo(VIEW.width, VIEW.hudHeight);
  ctx.stroke();

  // Left: heist name + mode.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 16px ${SERIF}`;
  ctx.fillText(heist.name.toUpperCase(), 20, 24);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 11px ${SANS}`;
  ctx.fillText(`${app.mode.toUpperCase()} MODE  ·  HEIST ${heist.index + 1} OF 3`, 20, 42);

  // Centre: the alarm meter — big, labelled, impossible to miss.
  const meterX = 470;
  const meterW = 340;
  const meterY = 14;
  const meterH = 20;
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `700 12px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', meterX, meterY + 15);
  ctx.fillStyle = '#1c2138';
  ctx.fillRect(meterX + 62, meterY, meterW, meterH);
  const band = alarmBand(alarm);
  const color = band === 'lockdown' ? PALETTE.alarmHigh : band === 'hot' ? PALETTE.alarmHigh : band === 'warm' ? PALETTE.alarmMid : PALETTE.alarmLow;
  const fillW = (alarm.value / 100) * meterW;
  ctx.fillStyle = color;
  ctx.fillRect(meterX + 62, meterY, fillW, meterH);
  ctx.strokeStyle = '#f4f1e8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(meterX + 62, meterY, meterW, meterH);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 13px ${SANS}`;
  ctx.fillText(`${Math.round(alarm.value)}%`, meterX + 62 + meterW + 10, meterY + 15);
  if (alarm.lockdown) {
    ctx.fillStyle = PALETTE.alarmHigh;
    ctx.font = `800 13px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(`LOCKDOWN — ${Math.ceil(alarm.lockdownLeft)}s TO THE EXIT`, meterX + 62 + meterW / 2, meterY + 36);
  } else {
    ctx.fillStyle = PALETTE.dim;
    ctx.font = `600 11px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText(band === 'calm' ? 'UNSEEN — STAY IN THE SHADOWS' : band === 'warm' ? 'SOMEONE IS SUSPICIOUS — BREAK AWAY' : 'THEY ARE ONTO YOU — RUN OR HIDE', meterX + 62 + meterW / 2, meterY + 36);
  }

  // Right: loot, purse, clock.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 15px ${SANS}`;
  const lootText = world.loot.taken ? `${heist.loot.value}g SECURED` : `${heist.loot.value}g TO STEAL`;
  ctx.fillText(lootText, VIEW.width - 20, 24);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 12px ${SANS}`;
  const minutes = Math.floor(world.elapsed / 60);
  const seconds = Math.floor(world.elapsed % 60);
  ctx.fillText(`PURSE ${world.tools.purse}g  ·  ${minutes}:${String(seconds).padStart(2, '0')}`, VIEW.width - 20, 42);
}

function drawToolBelt(ctx, world) {
  const belt = toolBelt(world.tools.purse);
  const rects = toolBeltRects();
  belt.forEach((tool, index) => {
    const bx = rects[index].x;
    const y = rects[index].y;
    const boxW = rects[index].w;
    const boxH = rects[index].h;
    ctx.fillStyle = tool.afford ? 'rgba(16, 20, 42, 0.92)' : 'rgba(16, 20, 42, 0.55)';
    ctx.fillRect(bx, y, boxW, boxH);
    ctx.strokeStyle = tool.afford ? PALETTE.wallTrim : '#444a66';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, y, boxW, boxH);
    ctx.textAlign = 'left';
    ctx.fillStyle = tool.afford ? PALETTE.text : '#777c96';
    ctx.font = `700 13px ${SANS}`;
    ctx.fillText(`[${tool.key}] ${tool.name}`, bx + 10, y + 19);
    ctx.fillStyle = tool.afford ? PALETTE.loot : '#777c96';
    ctx.font = `600 11px ${SANS}`;
    const hint = tool.id === 'coin' ? 'aim with mouse' : tool.id === 'smoke' ? 'hides you 6s' : 'blinds machines 8s';
    ctx.fillText(`${tool.cost}g  ·  ${hint}`, bx + 10, y + 35);
  });
  // Lockpick hint, bottom-left.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `600 11px ${SANS}`;
  ctx.fillText('[E] LOCKPICK (hold, stay still)   [SHIFT] SNEAK   [SPACE] SPRINT   [M] SOUND   [P] PAUSE', 20, VIEW.height - 56);
}

function drawObjective(ctx, world) {
  const { loot } = world;
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(10, 13, 28, 0.75)';
  ctx.fillRect(20, 68, 340, 26);
  ctx.fillStyle = loot.taken ? PALETTE.exit : PALETTE.loot;
  ctx.font = `700 13px ${SANS}`;
  const text = loot.taken
    ? `★ ${loot.name} secured — reach the EXIT!`
    : `★ Steal the ${loot.name} (${loot.value}g)`;
  ctx.fillText(text, 30, 86);
}

function drawMessage(ctx, world) {
  if (!world.message || world.time >= world.messageUntil) return;
  ctx.textAlign = 'center';
  ctx.font = `800 26px ${SERIF}`;
  const w = ctx.measureText(world.message).width + 48;
  // The message bar sits at the bottom of the room, never over the vault:
  // the prize must stay visible while the news is up.
  const y = VIEW.height - 108;
  ctx.fillStyle = 'rgba(10, 13, 28, 0.85)';
  ctx.fillRect((VIEW.width - w) / 2, y, w, 44);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect((VIEW.width - w) / 2, y, w, 44);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(world.message, VIEW.width / 2, y + 30);
}
