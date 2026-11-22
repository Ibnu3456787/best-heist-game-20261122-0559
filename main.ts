// THE GILDED FOX — a stealth heist game for make.fun's best-heist-game
// bounty (Node 22, standard library only). The game is this directory's
// game/ folder: plain static files a desktop browser loads offline
// (game/index.html and its ES modules, no library and no network request).
// This program hands it in: it copies game/ and screenshots/ from beside
// this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. It then verifies its own
// output: it rebuilds the dossier from the output directory and refuses to
// finish silently if the bytes differ, and it checks the screenshots are
// within the gate's caps before it writes anything at all.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (from the kit's RULES.txt): only text_max_bytes
// shapes the bytes; the others refuse an entry the scorer would refuse
// (fewer than 3 or more than 4 screenshots, or one over 256 KiB; more than
// 993 files in game/ or 48 MiB of game files, in all, or a path under game/
// over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const DOSSIER_OPTIONS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function human(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function walk(dir: string): string[] {
  const entries: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, name.name);
    if (name.isDirectory()) entries.push(...walk(path));
    else entries.push(path);
  }
  return entries;
}

// Fail loudly before writing anything if the game itself is missing its
// entrypoint: a copy error halfway through would be harder to read.
if (!existsSync(join(here, 'game', 'index.html'))) {
  throw new Error('game/index.html is missing — the game cannot be handed in');
}

// Fail loudly before writing anything if the screenshots are out of shape:
// the gate wants 3 or 4 of them, each a whole file under 256 KiB.
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort()
  : [];
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots: expected 3 or 4, found ${shots.length}`);
}
for (const name of shots) {
  const size = statSync(join(shotsDir, name)).size;
  if (size > 262144) throw new Error(`screenshot ${name} is ${human(size)} — over the 256 KiB cap`);
  if (!/\.(png|jpe?g)$/i.test(name)) throw new Error(`screenshot ${name} is not a PNG or JPEG`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, DOSSIER_OPTIONS);
writeFileSync(join(out, 'dossier.json'), dossier);

// Self-check: the scorer rebuilds the dossier from /output and compares it
// byte for byte with the one this program wrote. Rebuild it here and fail
// loudly if they ever differ.
const rebuilt = buildDossier(out, DOSSIER_OPTIONS);
if (!Buffer.from(rebuilt).equals(Buffer.from(dossier))) {
  throw new Error('dossier self-check failed: rebuild does not match the written dossier.json');
}
const written = readFileSync(join(out, 'dossier.json'));
if (!written.equals(Buffer.from(dossier))) {
  throw new Error('dossier self-check failed: dossier.json on disk does not match the build');
}

// Summary: game files, screenshots, dossier size.
const gameFiles = walk(join(out, 'game'));
const gameBytes = gameFiles.reduce((sum, file) => sum + statSync(file).size, 0);
const shotBytes = shots.reduce((sum, name) => sum + statSync(join(out, 'screenshots', name)).size, 0);
console.log(`THE GILDED FOX build OK: ${gameFiles.length} game files (${human(gameBytes)}), ` +
  `${shots.length} screenshots (${human(shotBytes)}), dossier ${human(written.length)} ` +
  `(text cap ${human(DOSSIER_OPTIONS.text_max_bytes)})`);
for (const name of shots) console.log(`  screenshot: ${name} (${human(statSync(join(out, 'screenshots', name)).size)})`);
