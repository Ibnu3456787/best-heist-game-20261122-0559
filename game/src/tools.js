// THE GILDED FOX — the tool belt. Four tools, each with a price in gold from
// the heist's kit fund — tools are a trade, not a freebie, and the fund you
// do not spend scores at the getaway. Coin distracts, smoke hides, EMP blinds
// the machines, and the lockpick opens the case (its price is time, standing
// still in the open).
import { PURSE_START, TOOLS } from './config.js';

/** A fresh tool state: the purse, live smoke clouds, and the coin in flight. */
export function makeTools() {
  return {
    purse: PURSE_START,
    smoke: [], // { x, y, radius, until }
    coin: null, // { x, y, until } — the distraction point guards walk to
    empUntil: 0,
  };
}

/** Spend `cost` from the purse when affordable; returns true on success. */
export function spend(tools, cost) {
  if (tools.purse < cost) return false;
  tools.purse -= cost;
  return true;
}

/** Throw a coin at (x, y): guards nearby walk over to look at it. */
export function throwCoin(tools, x, y, time) {
  if (!spend(tools, TOOLS.coin.cost)) return false;
  tools.coin = { x, y, until: time + 5 };
  return true;
}

/** Drop a smoke pellet at the thief: a cloud that blocks all vision. */
export function dropSmoke(tools, x, y, time) {
  if (!spend(tools, TOOLS.smoke.cost)) return false;
  tools.smoke.push({ x, y, radius: TOOLS.smoke.radius, until: time + TOOLS.smoke.seconds });
  return true;
}

/** Fire the EMP: cameras and drones go dark for a few seconds. */
export function fireEmp(tools, time) {
  if (!spend(tools, TOOLS.emp.cost)) return false;
  tools.empUntil = time + TOOLS.emp.seconds;
  return true;
}

/** Step the tools: expire old smoke and the coin's distraction. */
export function updateTools(tools, time) {
  tools.smoke = tools.smoke.filter((cloud) => time < cloud.until);
  if (tools.coin && time >= tools.coin.until) tools.coin = null;
}

/** True when the EMP is still active at `time`. */
export function empActive(tools, time) {
  return time < tools.empUntil;
}
