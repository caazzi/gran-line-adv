# Gran Line Adventure ⛵🏴‍☠️

An unofficial, non-commercial One Piece fan game built with [Kaplay](https://kaplayjs.com/).
Sail the Thousand Sunny through three seas, collect Devil Fruits, and fight a boss at the
end of each level. Keyboard only — there is no touch or mobile support.

## Status (v0.1.0)

- **Implemented loop:** menu → 3 levels → boss → next level → victory cutscene.
- **3 levels:** East Blue, Loguetown, Grand Line, with increasing enemy HP, speed and spawn rates.
- **Keyboard only.** No touch controls, no gamepad support.
- **Unit-tested, smoke-tested and built**, but a full manual playthrough of boss rendering,
  score carry-over and Haki / Pika Pika dash kills is still pending.
  See [Current verification](#current-verification).

This is a fan project, not a finished commercial release.

## Controls

| Key | Action |
|---|---|
| `WASD` or arrow keys | Move the Thousand Sunny |
| `Space` | Gaon Cannon (main attack) |
| `E` | Coup de Burst (beam, cooldown) |
| `F` | Haoshoku Haki (screen clear, cooldown) |
| `P` or `Esc` | Pause |
| `M` | Mute / unmute |
| `R` | Restart run |
| `H` | Open the feedback form (menu) |

## Run, test, build

Requires Node.js 20 or newer.

```bash
npm ci          # install exact dependencies
npm run dev     # dev server on http://localhost:3256
npm test        # unit tests (Vitest)
npm run check   # unit tests + production build
npm run build   # production build into dist/
npm run preview # serve the built dist/ locally
```

## Telemetry

Logging uses a small, OTel-shaped layer that lives entirely in memory. It never exports,
performs network requests, or writes to storage.

- **Records:** severity-numbered logs, spans with trace/span IDs, span events and status,
  and counter / histogram / gauge series. All buffers are bounded ring buffers.
- **Inspect:** `window.__telemetry.getSnapshot()` returns `resource`, `logs`, `spans`,
  `metrics.series`, `activeSpanIds` and dropped-record counts.
- **Console verbosity:** open the game with `?telemetry=debug`, `trace`, `info`, `warn`,
  `error` or `off`. The default is `info`.
- **Cross-cutting helpers:** `telemetry.withAttributes(...)` binds level/boss context once;
  `recordWeaponFired` and `recordRunEnded` keep repeated events in one place.

```js
// DevTools console: slowest spans, then the current metric series.
const { spans, metrics } = window.__telemetry.getSnapshot();
spans.sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
metrics.series.filter((series) => series.kind === "counter");
```

## Deploy (Netlify Drop)

1. `npm run build`
2. Open <https://app.netlify.com/drop> and drag the generated `dist/` folder onto the page.
3. Claim the temporary site so the URL is stable.
4. Replace the relative `og:image` / `twitter:image` value in `index.html` with the absolute
   deployed URL (for example `https://your-site.netlify.app/og.png`), then rebuild and redeploy.
   Social crawlers need an absolute image URL.

## Current verification

- `npm ci && npm run check` — clean install, **42 tests in 9 files pass**, production build
  succeeds.
- Headless Chromium smoke test — menu renders, `Enter` starts level 1, `P` opens the pause
  overlay, `M` toggles mute, `Space` fires, `R` restarts from pause, no console or page
  errors. The telemetry snapshot shows `app.startup` and `assets.load` closed, `Assets loaded`
  once, and the expected counters/gauges (`game.level.started`, `game.pause`, `game.resume`,
  `audio.mute.toggled`, `game.weapon.fired`, `game.run.restarted`). The fixed footer sits
  below the canvas (canvas ends at 772px, footer starts at 776.6px on a 1280×800 viewport).
- Boss sprite mapping, score ownership and the shared damage/death path have unit coverage;
  an end-to-end playthrough of boss rendering, score carry-over and Haki / dash kills is
  still pending manual verification.
- **Not covered:** automated browser/E2E gameplay tests, real-device mobile testing, touch
  input. No performance or cross-browser guarantee is claimed.

## Unofficial fan project

This is a non-commercial fan project. It is **not affiliated with, endorsed by, or sponsored by
Eiichiro Oda, Toei Animation, Shueisha, or any One Piece rights holder.** One Piece and its
characters are trademarks of their respective owners.

Art and audio in `public/` are generated/assembled for this project (pixel-art sprites and
sound effects). Fonts are [Bangers](https://fonts.google.com/specimen/Bangers) and
[Outfit](https://fonts.google.com/specimen/Outfit) under the SIL Open Font License. If you are a
rights holder and want an asset removed, please open an issue.

## Project layout

- `src/main.js` — Kaplay init, error reporting, scene registration.
- `src/config.js` — gameplay constants, levels, bosses.
- `src/scenes/` — menu, game, game over, victory cutscene, victory.
- `src/entities/` — player, boss, enemy, treasure, obstacles.
- `src/systems/` — collisions, weapons, damage, pause, audio, pools, leaderboard,
  `telemetry.js` (logs/spans/metrics) and `runTelemetry.js` (shared run-end event).
- `src/ui/` — HUD and reusable UI components.
- `src/utils/` — asset loader, object pool, shared components, SFX helpers.

## Known gaps / next work

- Add automated browser tests for the menu → level → boss → victory flow.
- Verify hitboxes against the scaled sprites (rocks, Sea Kings, bosses, chests).
- Add CI (GitHub Actions) running `npm run check` on pull requests.
- Optional: parallax background layers and per-level particle themes.
- Optional: touch controls and a mobile layout (explicitly out of scope for v0.1.0).

## License

Fan project, non-commercial use only.
