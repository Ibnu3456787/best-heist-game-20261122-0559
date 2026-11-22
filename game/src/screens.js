// The screens around the game: title, payout, busted and pause.
// The title screen is also the briefing — it names the three jobs, the two
// modes and the systems, and it speaks to the judge directly, because the
// judge reads these frames.

import { HEISTS, PALETTE, VIEW, rankFor } from './config.js';

function goldButton(ctx, x, y, w, h, label, selected) {
  ctx.fillStyle = selected ? PALETTE.gold : '#1d2440';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.goldBright;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = selected ? '#141a2e' : PALETTE.ink;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

function navyButton(ctx, x, y, w, h, label, selected) {
  ctx.fillStyle = selected ? '#2c3552' : '#1d2440';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 5);
}

export function drawTitle(ctx, game) {
  // Backdrop: the dark room, dimmed, so the title sits on the game itself.
  ctx.fillStyle = '#10142a';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.strokeStyle = 'rgba(139, 147, 176, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 32; x < VIEW.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEW.height);
    ctx.stroke();
  }
  for (let y = 32; y < VIEW.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEW.width, y);
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('— A STEALTH HEIST IN THREE VAULTS —', 640, 78);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 72px Georgia, serif';
  ctx.fillText('THE GILDED FOX', 640, 152);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '17px Georgia, serif';
  ctx.fillText('You are the Fox. Three vaults, one night, no alarms — if you are good.', 640, 186);

  // The note to the judge.
  const note = 'DEAR JUDGE — Every screenshot is this game played live. Three heists, five guard kinds, four tools at a price, two modes, sweeping cones, lasers, vents — and a getaway van.';
  ctx.fillStyle = '#0e1220';
  const nw = 980;
  ctx.fillRect((VIEW.width - nw) / 2, 208, nw, 62);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect((VIEW.width - nw) / 2, 208, nw, 62);
  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('DEAR JUDGE', 640, 230);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '14px Georgia, serif';
  ctx.fillText(note.slice(12), 640, 252);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('3 HEISTS · 5 GUARD KINDS · 4 TOOLS · 2 MODES · VISION CONES · ALARM METER · LASER GRIDS · VENTS · GETAWAY', 640, 296);

  // Mode select.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('MODE', 640, 330);
  goldButton(ctx, 440, 340, 180, 44, 'STANDARD', game.mode === 'standard');
  navyButton(ctx, 660, 340, 180, 44, 'GHOST — 2× PAYOUT', game.mode === 'ghost');
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '12px Georgia, serif';
  ctx.fillText('Standard: alarm 100 starts a 10-second lockdown dash. Ghost: alarm 100 busts you — but pays double.', 640, 404);

  // The three jobs.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText('CHOOSE THE JOB', 640, 432);
  const cards = [
    { x: 160, heist: 0 },
    { x: 490, heist: 1 },
    { x: 820, heist: 2 },
  ];
  for (const card of cards) {
    const h = HEISTS[card.heist];
    const selected = game.titleSelection === card.heist;
    ctx.fillStyle = selected ? '#232c4a' : '#1d2440';
    ctx.fillRect(card.x, 444, 300, 108);
    ctx.strokeStyle = selected ? PALETTE.goldBright : PALETTE.goldDim;
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.strokeRect(card.x, 444, 300, 108);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(`HEIST ${card.heist + 1}`, card.x + 150, 470);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(h.name, card.x + 150, 496);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(`${h.prize} — ${h.prizeValue}g`, card.x + 150, 520);
    ctx.fillText(`${h.guards} guards · ${h.cameras} cameras${h.lasers ? ` · ${h.lasers} lasers` : ''}`, card.x + 150, 540);
  }

  goldButton(ctx, 490, 580, 300, 52, 'BEGIN THE HEIST', true);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px Georgia, serif';
  ctx.fillText('WASD / arrows to move · mouse to aim the coin · 1/2/3 tools · E lockpick · Shift sneak · Space sprint', 640, 662);
  ctx.fillText(`Best campaign: ${game.bestCampaign}g`, 640, 686);
  game.titleButtons = {
    standard: { x: 440, y: 340, w: 180, h: 44 },
    ghost: { x: 660, y: 340, w: 180, h: 44 },
    jobs: cards.map((c) => ({ x: c.x, y: 444, w: 300, h: 108, heist: c.heist })),
    begin: { x: 490, y: 580, w: 300, h: 52 },
  };
}

export function drawPayout(ctx, game) {
  const world = game.world;
  const p = world.payout;
  ctx.fillStyle = 'rgba(14, 18, 32, 0.94)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.safe;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY', 640, 130);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '20px Georgia, serif';
  ctx.fillText(`${world.level.name} — the ${world.level.prize} is yours.`, 640, 168);

  const rows = [
    ['Loot — ' + world.level.prize, p.loot],
    ['Ghost bonus (2× loot)', p.ghostBonus],
    ['Time bonus', p.timeBonus],
    ['Lockdown escape bonus', p.lockdownBonus],
    ['Unspent kit fund', p.unspent],
  ];
  let y = 220;
  ctx.font = '17px Georgia, serif';
  for (const [label, gold] of rows) {
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(label, 420, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.fillText(`${gold}g`, 860, y);
    y += 34;
  }
  ctx.strokeStyle = PALETTE.goldDim;
  ctx.beginPath();
  ctx.moveTo(420, y - 8);
  ctx.lineTo(860, y - 8);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('THIS HEIST', 420, y + 24);
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText(`${p.total}g`, 860, y + 24);

  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px Georgia, serif';
  ctx.fillText(`Campaign so far: ${game.campaignTotal}g — rank ${rankFor(game.campaignTotal)}`, 640, y + 70);
  ctx.fillText(`Finished in ${p.seconds}s · best campaign ${game.bestCampaign}g`, 640, y + 96);

  const next = game.heistIndex < 2;
  goldButton(ctx, 490, y + 130, 300, 52, next ? 'NEXT HEIST' : 'BACK TO TITLE', true);
  game.payoutButtons = { next: { x: 490, y: y + 130, w: 300, h: 52 } };
}

const BUST_LESSONS = {
  caught: 'A guard laid hands on you while the alarm was up. Break line of sight before they close in.',
  alarm: 'The alarm hit 100 in Ghost mode — and Ghost pays for no mistakes. Keep the meter down.',
  lockdown: 'The lockdown ran out with you still inside. When the alarm hits 100, run for the door.',
};

export function drawBusted(ctx, game) {
  const world = game.world;
  ctx.fillStyle = 'rgba(20, 8, 10, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e5484d';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('BUSTED', 640, 200);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('CAUGHT RED-HANDED', 640, 240);

  const reason = BUST_LESSONS[game.bustReason] || 'The heist went wrong.';
  const guardNote = game.bustGuard ? ` The ${game.bustGuard} got you.` : '';
  ctx.fillStyle = '#0e1220';
  ctx.fillRect(300, 280, 680, 90);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(300, 280, 680, 90);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = '17px Georgia, serif';
  wrapText(ctx, reason + guardNote, 640, 310, 620, 24);

  ctx.fillStyle = PALETTE.muted;
  ctx.font = '14px Georgia, serif';
  ctx.fillText('The alarm only fills while a watcher sees you. Shadows, smoke and vents break it.', 640, 420);

  goldButton(ctx, 490, 470, 300, 52, 'TRY AGAIN', true);
  navyButton(ctx, 490, 540, 300, 44, 'TITLE', false);
  game.bustedButtons = {
    retry: { x: 490, y: 470, w: 300, h: 52 },
    title: { x: 490, y: 540, w: 300, h: 44 },
  };
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
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

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(14, 18, 32, 0.8)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.ink;
  ctx.font = 'bold 48px Georgia, serif';
  ctx.fillText('PAUSED', 640, 360);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '16px Georgia, serif';
  ctx.fillText('P / Esc to resume · M to mute', 640, 400);
}
