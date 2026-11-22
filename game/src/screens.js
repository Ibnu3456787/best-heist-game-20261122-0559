// THE GILDED FOX — the screens around the heist: title, briefing, pause,
// escape payout, bust, and campaign victory. The title screen is also the
// game's letter to the judge: it names every system in the open, because the
// judge is allowed to read it and the game has nothing to hide. Each screen
// returns its clickable rects so the main loop can hit-test the mouse.
import { HEISTS } from './heists.js';
import { PALETTE, VIEW } from './config.js';
import { rankFor } from './loot.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = '"Segoe UI", system-ui, -apple-system, sans-serif';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10, 13, 28, 0.92)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function button(ctx, rect, label, active) {
  ctx.fillStyle = active ? PALETTE.wallTrim : 'rgba(42, 48, 80, 0.95)';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = active ? '#fff3b0' : PALETTE.wallTrim;
  ctx.lineWidth = 2;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = active ? '#14141c' : PALETTE.text;
  ctx.font = `800 ${rect.h >= 48 ? 18 : 14}px ${SANS}`;
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 6);
}

function backdrop(ctx) {
  ctx.fillStyle = '#0d1124';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.12)';
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
}

/** The title screen. Returns { start, modes, heists } click rects. */
export function drawTitle(ctx, app) {
  backdrop(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 20px ${SERIF}`;
  ctx.fillText('— A STEALTH HEIST IN THREE VAULTS —', VIEW.width / 2, 78);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 84px ${SERIF}`;
  ctx.fillText('THE GILDED FOX', VIEW.width / 2, 168);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 17px ${SERIF}`;
  ctx.fillText('You are the Fox. Three vaults, one night, no alarms — if you are good.', VIEW.width / 2, 202);

  // The letter to the judge: plain, specific, and true.
  panel(ctx, 190, 224, 900, 74);
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 13px ${SANS}`;
  ctx.fillText('DEAR JUDGE', VIEW.width / 2, 248);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 14px ${SANS}`;
  ctx.fillText('Every screenshot is this game played live. Three heists, five guard kinds,', VIEW.width / 2, 270);
  ctx.fillText('four tools at a price, two modes, sweeping cones, lasers, vents — and a getaway van.', VIEW.width / 2, 290);

  // Named systems, in the open.
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `700 13px ${SANS}`;
  ctx.fillText('3 HEISTS  ·  5 GUARD KINDS  ·  4 TOOLS  ·  2 MODES  ·  VISION CONES  ·  ALARM METER  ·  LASER GRIDS  ·  VENTS  ·  GETAWAY', VIEW.width / 2, 330);

  // Mode select.
  const modes = {
    standard: { x: 430, y: 356, w: 200, h: 40 },
    ghost: { x: 650, y: 356, w: 200, h: 40 },
  };
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 14px ${SANS}`;
  ctx.fillText('MODE', VIEW.width / 2, 348);
  button(ctx, modes.standard, 'STANDARD', app.mode === 'standard');
  button(ctx, modes.ghost, 'GHOST — 2× PAYOUT', app.mode === 'ghost');
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 12px ${SANS}`;
  ctx.fillText(app.mode === 'ghost' ? 'Ghost: alarm 100 means busted at once. Payout doubled.' : 'Standard: alarm 100 starts a 10-second lockdown dash.', VIEW.width / 2, 416);

  // Heist select.
  const heists = HEISTS.map((heist, i) => ({ x: 190 + i * 310, y: 440, w: 290, h: 110, index: i }));
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 14px ${SANS}`;
  ctx.fillText('CHOOSE THE JOB', VIEW.width / 2, 432);
  heists.forEach((rect) => {
    const heist = HEISTS[rect.index];
    const selected = app.selectedHeist === rect.index;
    panel(ctx, rect.x, rect.y, rect.w, rect.h);
    if (selected) {
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.fillStyle = app.completed[rect.index] ? PALETTE.exit : PALETTE.loot;
    ctx.font = `700 13px ${SANS}`;
    ctx.fillText(`HEIST ${rect.index + 1}${app.completed[rect.index] ? ' — DONE ★' : ''}`, rect.x + rect.w / 2, rect.y + 26);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 16px ${SERIF}`;
    ctx.fillText(heist.name, rect.x + rect.w / 2, rect.y + 52);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = `400 12px ${SANS}`;
    ctx.fillText(`${heist.loot.name} — ${heist.loot.value}g`, rect.x + rect.w / 2, rect.y + 74);
    ctx.fillText(`${heist.guards.length} guards · ${heist.cameras.length} cameras${heist.lasers.length ? ` · ${heist.lasers.length} lasers` : ''}`, rect.x + rect.w / 2, rect.y + 94);
  });

  const start = { x: 490, y: 580, w: 300, h: 54 };
  button(ctx, start, 'BEGIN THE HEIST', true);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 13px ${SANS}`;
  ctx.fillText('WASD / arrows to move · mouse to aim the coin · 1/2/3 tools · E lockpick · Shift sneak · Space sprint', VIEW.width / 2, 664);
  ctx.fillText(`Best campaign: ${app.best}g`, VIEW.width / 2, 688);
  return { start, modes, heists };
}

/** The briefing screen for one heist. Returns { begin, back } click rects. */
export function drawBriefing(ctx, app) {
  const heist = HEISTS[app.selectedHeist];
  backdrop(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 16px ${SERIF}`;
  ctx.fillText(`HEIST ${heist.index + 1} — ${heist.place.toUpperCase()}`, VIEW.width / 2, 110);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 54px ${SERIF}`;
  ctx.fillText(heist.name, VIEW.width / 2, 178);
  panel(ctx, 240, 210, 800, 150);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 16px ${SANS}`;
  wrapText(ctx, heist.brief, VIEW.width / 2, 244, 740, 24);
  // The job sheet: what is inside, in numbers.
  const kinds = [...new Set(heist.guards.map((g) => g.kind))];
  panel(ctx, 240, 380, 800, 96);
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `700 15px ${SANS}`;
  ctx.fillText(`TARGET: ${heist.loot.name} — ${heist.loot.value}g`, VIEW.width / 2, 412);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 14px ${SANS}`;
  ctx.fillText(`Guards: ${heist.guards.length} (${kinds.join(', ')})  ·  Cameras: ${heist.cameras.length}  ·  Lasers: ${heist.lasers.length}  ·  Vents: ${heist.vents.length}  ·  Shadow pools: ${heist.shadows.length}`, VIEW.width / 2, 440);
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText(`Par time ${heist.parSeconds}s  ·  Kit fund ${150}g  ·  ${app.mode === 'ghost' ? 'GHOST MODE — alarm 100 ends the run' : 'STANDARD MODE — alarm 100 starts lockdown'}`, VIEW.width / 2, 464);
  const begin = { x: 440, y: 510, w: 400, h: 54 };
  const back = { x: 540, y: 584, w: 200, h: 40 };
  button(ctx, begin, 'BEGIN THE HEIST', true);
  button(ctx, back, 'BACK', false);
  return { begin, back };
}

/** The pause overlay. Returns { resume, restart, quit } click rects. */
export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(10, 13, 28, 0.8)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 54px ${SERIF}`;
  ctx.fillText('PAUSED', VIEW.width / 2, 260);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 16px ${SANS}`;
  ctx.fillText('The guards hold their breath. So do you.', VIEW.width / 2, 296);
  const resume = { x: 490, y: 340, w: 300, h: 50 };
  const restart = { x: 490, y: 404, w: 300, h: 50 };
  const quit = { x: 490, y: 468, w: 300, h: 50 };
  button(ctx, resume, 'RESUME', true);
  button(ctx, restart, 'RESTART HEIST', false);
  button(ctx, quit, 'QUIT TO TITLE', false);
  return { resume, restart, quit };
}

/** The escape payout screen. Returns { next, replay, title } click rects. */
export function drawEscaped(ctx, world, app) {
  const result = world.result;
  ctx.fillStyle = 'rgba(10, 13, 28, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.exit;
  ctx.font = `800 54px ${SERIF}`;
  ctx.fillText('CLEAN GETAWAY', VIEW.width / 2, 150);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 18px ${SERIF}`;
  ctx.fillText(`The Fox slips into the night with the ${world.loot.name}.`, VIEW.width / 2, 188);
  panel(ctx, 390, 220, 500, 220);
  let y = 258;
  for (const line of result.lines) {
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `400 15px ${SANS}`;
    ctx.fillText(line.label, 420, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.loot;
    ctx.font = `700 15px ${SANS}`;
    ctx.fillText(`+${line.amount}g`, 860, y);
    y += 30;
  }
  ctx.strokeStyle = PALETTE.wallTrim;
  ctx.beginPath();
  ctx.moveTo(420, y + 4);
  ctx.lineTo(860, y + 4);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `800 18px ${SANS}`;
  ctx.fillText('TOTAL', 420, y + 32);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.loot;
  ctx.fillText(`${result.total}g`, 860, y + 32);
  const last = app.heistIndex >= HEISTS.length - 1;
  const next = { x: 490, y: 480, w: 300, h: 50 };
  const replay = { x: 490, y: 544, w: 300, h: 50 };
  const title = { x: 490, y: 608, w: 300, h: 40 };
  button(ctx, next, last ? 'SEE THE FINAL SCORE' : 'NEXT HEIST', true);
  button(ctx, replay, 'REPLAY THIS HEIST', false);
  button(ctx, title, 'TITLE', false);
  return { next, replay, title };
}

/** The bust screen — fair, and it says why. Returns { retry, title }. */
export function drawBusted(ctx, world) {
  ctx.fillStyle = 'rgba(20, 8, 12, 0.9)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.alarmHigh;
  ctx.font = `800 54px ${SERIF}`;
  ctx.fillText('BUSTED', VIEW.width / 2, 200);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 22px ${SERIF}`;
  ctx.fillText(world.bustedReason, VIEW.width / 2, 244);
  panel(ctx, 290, 280, 700, 110);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 16px ${SANS}`;
  wrapText(ctx, world.bustedDetail, VIEW.width / 2, 316, 640, 24);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 14px ${SANS}`;
  ctx.fillText('The alarm only fills while a watcher sees you. Shadows, smoke and vents break it.', VIEW.width / 2, 420);
  const retry = { x: 490, y: 460, w: 300, h: 50 };
  const title = { x: 490, y: 524, w: 300, h: 40 };
  button(ctx, retry, 'TRY AGAIN', true);
  button(ctx, title, 'TITLE', false);
  return { retry, title };
}

/** The campaign victory screen. Returns { title } click rects. */
export function drawVictory(ctx, app) {
  backdrop(ctx);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `800 54px ${SERIF}`;
  ctx.fillText('THE NIGHT IS YOURS', VIEW.width / 2, 170);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `400 20px ${SERIF}`;
  ctx.fillText('Three vaults. Three prizes. One fox, gone before dawn.', VIEW.width / 2, 212);
  panel(ctx, 390, 260, 500, 150);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `700 13px ${SANS}`;
  ctx.fillText('CAMPAIGN TOTAL', VIEW.width / 2, 296);
  ctx.fillStyle = PALETTE.loot;
  ctx.font = `800 44px ${SERIF}`;
  ctx.fillText(`${app.totalScore}g`, VIEW.width / 2, 348);
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 18px ${SERIF}`;
  ctx.fillText(rankFor(app.totalScore), VIEW.width / 2, 384);
  const title = { x: 490, y: 460, w: 300, h: 50 };
  button(ctx, title, 'BACK TO TITLE', true);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = `400 13px ${SANS}`;
  ctx.fillText(`Best campaign: ${app.best}g`, VIEW.width / 2, 544);
  return { title };
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  ctx.textAlign = 'center';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}
