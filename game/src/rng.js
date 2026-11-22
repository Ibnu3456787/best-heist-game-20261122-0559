// Seeded random numbers for THE GILDED FOX.
// The simulation never calls Math.random: every roll comes from a mulberry32
// generator created per world, so a scripted run replays exactly.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Float in [min, max).
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

// Integer in [min, max] inclusive.
export function int(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// Pick one element of a non-empty array.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Fisher-Yates shuffle that returns a new array.
export function shuffle(rng, list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
