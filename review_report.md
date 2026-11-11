# Verification Report — Gran Line Adventure v0.1.0

Date: 2026-11-11 · Branch: `fix/ship-v0.1`

This report replaces an earlier generated "production-ready" review. That report was
inaccurate: it missed at least three real runtime bugs and claimed verification that never
happened (there is no Playwright suite, no hitbox test suite, and the event bus it praised was
dead code).

## Scope

This is the verification record for the v0.1.0 ship slice:

- Runtime: boss sprite contract/scale, single score source, shared enemy damage/death.
- Presentation: sprite-scale fixes, social metadata, favicon/OG image, footer, menu info.
- Keyboard shell: pause (`P`/`Esc`), mute (`M`), restart (`R`).
- Cleanup: dead event bus removed, unused dependencies removed, docs corrected.

The game remains keyboard only. No touch controls were added.

## Claims

| Claim | How it was checked | Status |
|---|---|---|
| Clean install works from the lockfile | `npm ci` | **Verified** — 41 packages |
| Unit tests pass | `npm run check` → `vitest run` | **Verified** — 31 tests, 7 files |
| Production build succeeds | `npm run check` → `vite build` | **Verified** — 30 modules, built in 1.93s |
| Bosses map to loaded sprites and no longer crash on spawn | `config.test.js` asserts every boss sprite is `boss_alvida` / `boss_smoker` / `boss_aokiji` and `frameSize: 320`; `boss.js` uses `bossConfig.sprite` | **Unit/code verified**; reaching the 60s boss spawn in a browser is still pending |
| Boss scale, hitbox and counter-scaled HP label are correct | code inspection: frame-size scale + counter-scaled children | **Code changed, needs in-browser visual check** |
| Score has one owner and carries across levels | `state.test.js` covers accumulation/reset/boss bonus; no `player.score` references remain; HUD, game over and victory read `state.score` | **Unit/code verified**; end-to-end playthrough pending |
| Haki and Pika Pika dash kills register exactly once | `damage.test.js` covers non-boss kill/score-once and boss death deferral; both weapons call `damageEnemy` | **Unit/code verified**; end-to-end playthrough pending |
| Dead event bus removal is safe | `grep -rn "systems/events" --include=*.js src/` | **Verified** — no remaining imports |
| Pause overlay works and blocks weapon input | headless Chromium smoke test: `P` opens the overlay; code inspection: guards in the three weapon callbacks return while paused | **Overlay smoke verified; input guard code-verified** |
| `M` mute and pause-time mute label work | headless Chromium smoke test, no crash; `toggleMute` restores the saved master volume | **Smoke verified**; audible result not instrumented |
| `R` restarts from normal play and from pause | headless Chromium smoke test, including `R` while paused | **Smoke verified** |
| Menu renders version, controls, disclaimer and footer | headless Chromium screenshot at 1280×800 | **Smoke verified** |
| Footer never covers the canvas | bounding boxes: canvas 1280×772, footer starts at y=776.6 on a 1280×800 viewport | **Smoke verified** |
| No runtime errors during menu → level → pause → restart | browser console and `pageerror` capture | **Verified** — zero entries |
| `H` opens the feedback form | code inspection only | **Manual / not automated** |
| Sea King renders at 300px with a matching hitbox | code: `size / GAME.SPRITE_BASE_RES` scale + 640px rect | **Code changed, needs in-browser visual check** |
| Victory cutscene ship is ~120px, chest ~120px | code: frame-size-corrected scales | **Code changed, needs in-browser visual check** |
| Open Graph / Twitter metadata and favicon present | inspection of `index.html`; asset files exist | **Verified statically**; social preview needs the deployed absolute URL |
| Touch or mobile play works | — | **Not covered** — keyboard only |
| Firefox / Safari compatibility | — | **Not covered** |
| Automated browser/E2E gameplay coverage | — | **Not covered** — the smoke test is a one-off script, not committed |
| Performance / FPS guarantees | — | **Not covered** |

## Commands to reproduce

```bash
# install exactly what the lockfile pins
npm ci

# unit suite + production build
npm run check

# manual smoke test
npm run dev
# open http://localhost:3256
# 1. menu renders, version + disclaimer visible, H opens feedback
# 2. start a run, press P and confirm the pause overlay and that Space/E/F do nothing
# 3. press M, resume, press R, confirm a fresh level 1
# 4. play through level 1 into the boss
# 5. confirm boss sprite, score carry-over, Haki and dash kills
# 6. finish level 3 and watch the victory cutscene
# 7. check the browser console for runtime errors
```

The recorded smoke run used Playwright with a local Chromium, before the final clean
`npm ci`; the script lives outside the repo and is not a committed test suite.

## What changed in this slice

- Boss configs now declare `sprite` and `frameSize`; `boss.js` uses them for the sprite, scale,
  hitbox and counter-scaled name/HP bar.
- `state.score` is the only score; player score duplication and the boss-bonus overwrite are
  gone. HUD, game over and victory read the global state.
- New `src/systems/damage.js` owns hit flash, floating text, particles, score, heal and
  single-destroy death. Bullets, Haki and Pika Pika dash all use it; boss death stays in
  `boss.js`.
- Keyboard pause/mute/restart: `src/systems/pause.js`, guards in player weapon input, native
  `k.debug.paused`, a pause overlay, master-volume mute and run reset.
- Deleted the unused event bus (`src/systems/events.js`).
- Fixed Sea King and victory-cutscene sprite scaling.
- Added social metadata, favicon, OG image, and a non-blocking footer with version, feedback
  link and fan-project disclaimer.
- Added menu build info, the full control list and the `H` feedback shortcut.
- Removed unused dependencies, added `check`/`test:watch` scripts and a Node engine pin.
- Rewrote the README and this report to match what is actually verified.

## Explicit non-claims

- This build is **not** "production-ready".
- Boss rendering, score carry-over, Haki/dash kills, and the sprite-scale fixes are **not**
  proven by end-to-end browser gameplay; they have unit/code coverage only.
- No touch, mobile, Firefox, Safari, or performance guarantees are made.
- The earlier report's claims about Playwright coverage, hitbox tests and a working event bus
  were false and have been removed.
