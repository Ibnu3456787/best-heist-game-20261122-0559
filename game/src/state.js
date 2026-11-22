// THE GILDED FOX — app state: which screen is showing, which mode and
// heist are selected, and how the campaign totals up. The simulation owns
// the heist; this owns everything around it.
import { HEISTS } from './heists.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BRIEFING = 'briefing';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_BUSTED = 'busted';
export const SCREEN_VICTORY = 'victory';

const BEST_KEY = 'gilded-fox-best';

/** The app's top-level state, fresh for a new visit. */
export function makeAppState() {
  return {
    screen: SCREEN_TITLE,
    mode: 'standard', // 'standard' | 'ghost'
    heistIndex: 0,
    selectedHeist: 0,
    totalScore: 0,
    completed: [false, false, false],
    best: readBest(),
    muted: false,
  };
}

export function readBest() {
  try {
    const raw = globalThis.localStorage?.getItem(BEST_KEY);
    const value = raw === null || raw === undefined ? 0 : Number.parseInt(raw, 10);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function writeBest(value) {
  try {
    globalThis.localStorage?.setItem(BEST_KEY, String(value));
  } catch {
    // Private mode or no storage: the score just does not persist.
  }
}

/** The heist the player is about to play. */
export function currentHeist(app) {
  return HEISTS[app.heistIndex];
}

/** True when every heist in the campaign is complete. */
export function campaignComplete(app) {
  return app.completed.every(Boolean);
}

/** Record an escape: bank the payout and mark the heist done. */
export function bankEscape(app, result) {
  app.totalScore += result.total;
  app.completed[app.heistIndex] = true;
  if (app.totalScore > app.best) {
    app.best = app.totalScore;
    writeBest(app.best);
  }
}
