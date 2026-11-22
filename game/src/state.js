// Game state: the screen machine above the simulation, plus the campaign.
// One campaign is three heists in a row; the payout of each job banks into
// the campaign total, and the rank is read from that total. The best
// campaign is kept in localStorage when the browser has it.

import { HEISTS, rankFor } from './config.js';
import { createWorld } from './world.js';

export const BEST_KEY = 'gilded-fox-best-campaign';

export function loadBest() {
  try {
    const raw = window.localStorage.getItem(BEST_KEY);
    const n = raw === null ? 0 : Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

export function saveBest(total) {
  try {
    window.localStorage.setItem(BEST_KEY, String(total));
  } catch {
    // No storage (private mode, headless): the campaign still plays.
  }
}

// A fresh game: title screen, no heist chosen yet.
export function createGame() {
  return {
    screen: 'title', // 'title' | 'playing' | 'payout' | 'busted' | 'paused'
    mode: 'standard',
    heistIndex: 1,
    world: null,
    campaign: [],
    campaignTotal: 0,
    bestCampaign: loadBest(),
    muted: false,
    // The busted screen's reason, set when a world ends badly.
    bustReason: null,
    bustGuard: null,
    // Which job card the title screen highlights (keyboard).
    titleSelection: 1,
    // Title-screen animation clock.
    titleTime: 0,
  };
}

export function startHeist(game, heistIndex, mode) {
  game.heistIndex = heistIndex;
  game.mode = mode || game.mode;
  game.world = createWorld(heistIndex, game.mode, 9000 + heistIndex * 131);
  game.screen = 'playing';
  game.bustReason = null;
  game.bustGuard = null;
}

// Bank the finished world's payout into the campaign and move on.
export function bankPayout(game) {
  const payout = game.world.payout;
  game.campaign.push({ heist: game.heistIndex, payout });
  game.campaignTotal += payout.total;
  if (game.campaignTotal > game.bestCampaign) {
    game.bestCampaign = game.campaignTotal;
    saveBest(game.bestCampaign);
  }
  game.screen = 'payout';
}

// Record a bust, then show the busted screen.
export function recordBust(game) {
  game.bustReason = game.world.bustReason;
  game.bustGuard = game.world.bustGuard;
  game.screen = 'busted';
}

// Is there a next job in the campaign?
export function hasNextHeist(game) {
  return game.heistIndex < HEISTS.length - 1;
}

export function nextHeist(game) {
  startHeist(game, game.heistIndex + 1, game.mode);
}

export function campaignRank(game) {
  return rankFor(game.campaignTotal);
}

export function backToTitle(game) {
  game.screen = 'title';
  game.world = null;
  game.campaign = [];
  game.campaignTotal = 0;
}
