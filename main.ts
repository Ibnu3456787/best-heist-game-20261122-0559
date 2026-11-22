// THE GILDED FOX — the hand-in (Node 22, standard library only).
// The game is this directory's game/ folder: plain static files a desktop
// browser loads offline, no library and no network request. This program
// copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Then it rebuilds the dossier from the output and
// refuses to finish if the bytes differ, so a bad hand-in never ships.
//
// Serve the game locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (from the competition's RULES.txt): only
// text_max_bytes shapes the bytes; the others refuse an entry the scorer
// would refuse (more than 4 screenshots or one over 256 KiB; more than 993
// files in game/ or 48 MiB of game files in all, or a path under game/ over
// 1000 bytes — game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Empty the output directory's CONTENTS, never the directory itself: the
// grader mounts /output as a writable directory on a read-only filesystem,
// and deleting the mount point fails.
mkdirSync(out, { recursive: true });
for (const child of readdirSync(out)) {
  rmSync(join(out, child), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(out, DOSSIER_CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);

// Rebuild the dossier from what was just written and refuse if it differs:
// the hand-in is only valid when the dossier in /output is byte for byte
// what the library writes from game/ and screenshots/.
const rebuilt = buildDossier(out, DOSSIER_CAPS);
const written = readFileSync(join(out, 'dossier.json'));
if (!written.equals(rebuilt)) {
  throw new Error('main.ts: dossier.json does not match a fresh buildDossier run — refusing to finish');
}
console.log(`hand-in written to ${out} (${written.length} byte dossier)`);
