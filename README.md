# THE GILDED FOX — a stealth heist in three vaults

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Ibnu3456787/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Ibnu3456787/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Entry for make.fun's **best-heist-game-20261122-0559** ("Make the best heist
game"). You are the Fox. Three vaults, one night, no alarms — if you are
good. A top-down 2D stealth game: read the patrols, slip the cones, pick the
case, grab the prize, and walk out the front door with the getaway van
waiting.

No dependencies, no network, no assets to download — the whole game is plain
static files under `game/`, every sprite drawn in code on a canvas, every
sound synthesised in the browser with WebAudio.

## Play it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Or open `game/index.html` straight from disk (a static server is
recommended so the ES modules load without CORS fuss).

**Controls:** WASD / arrows to move · Shift to sneak (slower, harder to
spot) · Space to sprint (faster, louder) · E to pick a lock (hold still
2.5s) · 1/2/3 for tools (the coin aims at the mouse) · M sound · P / Esc
pause.

## The heists

| # | Job | Prize | Watch |
|---|-----|-------|-------|
| 1 | The Gallery of Echoes | Aurum Sun Mask — 1200g | 3 guards · 2 cameras |
| 2 | The Meridian Bank Vault | Aurum Heart Diamond — 2500g | 4 guards · 3 cameras · 2 lasers |
| 3 | The Sky Casino | Aurum Jackpot — 4000g | 5 guards · 3 cameras · 2 lasers |

## The systems

- **Five guard kinds** — Patroller, Sentry, Captain, Hound, Drone — each
  with its own speed, sight range and behaviour. Suspicion fills while they
  see you; a full meter turns a patrol into a chase.
- **Vision cones that sweep** — guards and cameras both sweep their cones,
  and walls block sight. Read the sweep, cross behind it.
- **An alarm meter** — rises while any watcher sees you or a laser trips,
  decays in the dark. At 100, Standard mode starts a 10-second lockdown dash
  to the exit; Ghost mode busts you on the spot and pays double.
- **Four tools, each with a price** — Coin Toss (25g, distracts), Smoke
  Pellet (50g, hides you 6s), EMP Pulse (100g, blinds cameras and drones
  8s), Lockpick (free, but you stand still 2.5s to use it). Every heist
  starts with a 150g kit fund; unspent fund pays out at the end.
- **Laser grids** (heists 2–3) — toggling beams; trip a live one and the
  alarm jumps +30.
- **Vents and shadow pools** — vents hide you completely but slow you down;
  shadows cut detection by nearly half.
- **A getaway that pays off** — the exit opens only once the prize is in
  hand, and the payout screen breaks down loot, time bonus, Ghost bonus,
  unspent fund and the lockdown-escape bonus, with a campaign rank from
  STREET RAT to LEGEND OF THE NIGHT.

## The screenshots

`screenshots/` holds four frames, all real renders of the game played live
by an in-repo pilot (`game/src/shots.js`) that walks the rooms under the
real rules — no editing, no compositing:

1. `1-cover.jpg` — the bank vault mid-heist: the Fox in the open, four
   guard cones, three camera cones, the lasers, the diamond in its case,
   and the alarm meter warm at 25%.
2. `2-briefing.jpg` — the title screen: the three jobs, the two modes, and
   a note to the judge.
3. `3-getaway.jpg` — the mask secured, the alarm at 54%, the Fox sprinting
   for the exit.
4. `4-caught.jpg` — the bust: caught red-handed, with the reason and the
   lesson on screen.

## Layout

```
game/            the game — index.html + src/ (one file per system)
  src/config.js  tuning: speeds, ranges, costs, palette
  src/heists.js  the three rooms (walls, guards, cameras, lasers, vents)
  src/guards.js  patrol / stare / chase / investigate / return
  src/cameras.js sweeping cameras + EMP
  src/lasers.js  toggling beams
  src/thief.js   movement, sneaking, sprinting, hiding
  src/loot.js    the case, the prize, the exit
  src/alarm.js   the meter, lockdown, Ghost bust
  src/tools.js   coin, smoke, EMP, lockpick
  src/world.js   the simulation: one step, every system
  src/state.js   screens, campaign, payout
  src/render.js  the canvas painter
  src/hud.js     the meter, the tool belt, the message bar
  src/screens.js title, briefing, payout, busted
  src/audio.js   WebAudio sound effects, no files
  src/input.js   keyboard + mouse
  src/shots.js   the pilot that stages the screenshots
  src/main.js    the game loop
main.ts          the hand-in: copies game/ + screenshots/ to /output and
                 writes /output/dossier.json (vendored make.fun library)
serve.ts         a tiny static server for local play
shots.json       the four screenshot scenes
vendor/          the make.fun dossier library, from the official kit
```

## Build (the hand-in)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` checks the screenshots against the gate's caps, copies the game
and the screenshots, builds `dossier.json`, then rebuilds the dossier from
the output and refuses to finish if the bytes differ. Run it twice: the
output is byte-identical.

## Original work

Every line of the game is original, written for this bounty. No
open-source game code, no assets, no copied art — the only borrowed file is
`vendor/makefun-game.ts`, the dossier library from the official make.fun
kit, which the competition's own rules ask entries to use.

---

Built for make.fun by IDAWATI. New to make.fun? Sign up with my link:
https://make.fun/r/zq0xe8tm
