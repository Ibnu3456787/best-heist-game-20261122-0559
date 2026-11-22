// THE GILDED FOX — loot, the vault case, and the score. Each heist has one
// prize behind a locked case: pick the lock (hold E, stay still), grab the
// prize, and the exit opens. The payout rewards speed, nerve and restraint:
// loot value, a time bonus against par, a Ghost bonus for staying quiet, and
// whatever of the kit fund the tools did not spend.
import { ALARM, GHOST_BONUS, LOCKDOWN_ESCAPE_BONUS, TIME_BONUS_MAX, TOOLS } from './config.js';

/** A fresh loot state for a heist: the case is locked, the prize untouched. */
export function makeLoot(heist) {
  return {
    name: heist.loot.name,
    value: heist.loot.value,
    x: heist.loot.x,
    y: heist.loot.y,
    caseOpen: false,
    taken: false,
  };
}

/** True when the thief stands close enough to the vault case to pick it. */
export function nearVault(thief, heist) {
  const v = heist.vault;
  const cx = v.x + v.w / 2;
  const cy = v.y + v.h / 2;
  return Math.hypot(thief.x - cx, thief.y - cy) < 64;
}

/** True when the thief stands on the prize and can grab it. */
export function nearLoot(thief, loot) {
  return Math.hypot(thief.x - loot.x, thief.y - loot.y) < 30;
}

/** True when the thief stands in the exit doorway. */
export function atExit(thief, heist) {
  const e = heist.exit;
  return thief.x >= e.x && thief.x <= e.x + e.w && thief.y >= e.y - 10 && thief.y <= e.y + e.h + 10;
}

/**
 * The payout for escaping a heist. `stats` carries elapsed seconds, the
 * highest alarm reached, the purse left, and whether lockdown was active.
 */
export function payout(heist, stats) {
  const timeBonus = Math.max(0, Math.round(TIME_BONUS_MAX * (1 - stats.elapsed / (heist.parSeconds * 2))));
  const ghostBonus = stats.peakAlarm <= ALARM.ghostBonusAt ? GHOST_BONUS : 0;
  const lockdownBonus = stats.escapedDuringLockdown ? LOCKDOWN_ESCAPE_BONUS : 0;
  const lines = [
    { label: heist.loot.name, amount: heist.loot.value },
    { label: 'Time bonus', amount: timeBonus },
    { label: 'Ghost bonus (alarm stayed under 25)', amount: ghostBonus },
    { label: 'Lockdown escape bonus', amount: lockdownBonus },
    { label: 'Kit fund unspent', amount: stats.purseLeft },
  ];
  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  return { lines: lines.filter((line) => line.amount > 0), total };
}

/** The rank a campaign total earns, from street rat to legend. */
export function rankFor(total) {
  if (total >= 12000) return 'LEGEND OF THE NIGHT';
  if (total >= 9000) return 'MASTER THIEF';
  if (total >= 6000) return 'THE GILDED FOX';
  if (total >= 3500) return 'SHADOW PROFESSIONAL';
  if (total >= 1500) return 'PROMISING PICKPOCKET';
  return 'STREET RAT';
}

/** The tool belt as the HUD shows it, with live affordability. */
export function toolBelt(purse) {
  return [
    { id: 'coin', ...TOOLS.coin, afford: purse >= TOOLS.coin.cost },
    { id: 'smoke', ...TOOLS.smoke, afford: purse >= TOOLS.smoke.cost },
    { id: 'emp', ...TOOLS.emp, afford: purse >= TOOLS.emp.cost },
  ];
}
