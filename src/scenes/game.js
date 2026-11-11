// ============================================
// Game Scene — Main gameplay
// ============================================
import { Z_LAYERS, GAME, LEVELS } from "../config.js";
import { createPlayer } from "../entities/player.js";
import { spawnTreasureLoop } from "../entities/treasure.js";
import { spawnEnemyLoop } from "../entities/enemy.js";
import { spawnBoss } from "../entities/boss.js";
import { spawnObstacleLoop } from "../entities/obstacle.js";
import { setupCollisions } from "../systems/collisions.js";
import { setupHUD } from "../ui/hud.js";
import { initPools, resetAllPools } from "../systems/pools.js";
import { playLevelBGM, playBossFanfare, playBossDefeatedJingle, toggleMute, isMuted } from "../systems/audio.js";
import { pauseState, isPaused, resetPause } from "../systems/pause.js";
import { state } from "../state.js";
import { telemetry } from "../systems/telemetry.js";

export function gameScene(k) {
    return () => {
        const levelConfig = LEVELS[state.levelIndex] || LEVELS[0];

        const level = telemetry.withAttributes({
            "game.level.id": levelConfig.id,
            "game.level.name": levelConfig.name,
        });
        const levelStartAttributes = {
            "game.level.duration_s": levelConfig.duration,
            "game.boss.name": levelConfig.boss.name,
            "game.score": state.score,
        };
        telemetry.currentSpan()?.setAttributes({
            ...level.attributes,
            ...levelStartAttributes,
        });
        level.info("Level started", levelStartAttributes);
        level.counter("game.level.started");

        // ---- Background layers ----
        // Ocean looping pixel art background
        k.add([
            k.sprite("ocean", { width: GAME.WIDTH, height: GAME.HEIGHT, tiled: true }),
            k.pos(0, 0),
            k.fixed(),
            k.z(Z_LAYERS.BACKGROUND),
        ]);

        // ---- Object Pools ----
        initPools(k);
        resetAllPools(); // Clear stale objects from previous level

        // ---- Player ----
        const player = createPlayer(k);
        telemetry.gauge("game.player.lives", player.lives);

        // ---- Level BGM ----
        playLevelBGM(k, levelConfig.id);

        // ---- Spawning systems ----
        spawnTreasureLoop(k, levelConfig);
        spawnEnemyLoop(k, levelConfig);
        spawnObstacleLoop(k, levelConfig);

        // ---- Level Intro Announcement ----
        const levelTitle = k.add([
            k.text(levelConfig.name.toUpperCase(), { size: 28, font: "Bangers" }),
            k.scale(2),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 30),
            k.anchor("center"),
            k.opacity(0),
            k.fixed(),
            k.z(Z_LAYERS.HUD),
        ]);

        const levelSubtitle = k.add([
            k.text(`Nível ${levelConfig.id}`, { size: 22, font: "Outfit" }),
            k.color(200, 200, 255),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20),
            k.anchor("center"),
            k.opacity(0),
            k.fixed(),
            k.z(Z_LAYERS.HUD),
        ]);

        // Fade in, hold, fade out
        k.tween(0, 1, 0.5, (v) => {
            levelTitle.opacity = v;
            levelSubtitle.opacity = v;
        });
        k.wait(2, () => {
            k.tween(1, 0, 0.8, (v) => {
                levelTitle.opacity = v;
                levelSubtitle.opacity = v;
            }).then(() => {
                levelTitle.destroy();
                levelSubtitle.destroy();
            });
        });

        // ---- Collisions ----
        setupCollisions(k, player, levelConfig);

        // ---- HUD ----
        const updateHUD = setupHUD(k, player, levelConfig);

        // ---- Meta controls: Pause (P / Esc), Mute (M), Restart (R) ----
        let pauseOverlay = [];
        let pauseMuteLabel = null;

        const refreshPauseMuteLabel = () => {
            if (pauseMuteLabel && pauseMuteLabel.exists()) {
                pauseMuteLabel.text = `SOM: ${isMuted() ? "MUDO" : "LIGADO"}`;
            }
        };

        const buildPauseOverlay = () => {
            const overlayZ = Z_LAYERS.TOP;
            pauseOverlay = [
                k.add([
                    k.rect(GAME.WIDTH, GAME.HEIGHT),
                    k.color(0, 0, 0),
                    k.opacity(0.7),
                    k.pos(0, 0),
                    k.fixed(),
                    k.z(overlayZ),
                ]),
                k.add([
                    k.text("PAUSADO", { size: 32, font: "Bangers" }),
                    k.scale(2),
                    k.color(255, 215, 0),
                    k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 70),
                    k.anchor("center"),
                    k.fixed(),
                    k.z(overlayZ),
                ]),
                k.add([
                    k.text("P / Esc = Continuar\nM = Som\nR = Reiniciar", {
                        size: 20,
                        font: "Outfit",
                        align: "center",
                    }),
                    k.color(235, 235, 255),
                    k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 10),
                    k.anchor("center"),
                    k.fixed(),
                    k.z(overlayZ),
                ]),
            ];

            pauseMuteLabel = k.add([
                k.text(`SOM: ${isMuted() ? "MUDO" : "LIGADO"}`, { size: 16, font: "Outfit" }),
                k.color(150, 220, 255),
                k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 90),
                k.anchor("center"),
                k.fixed(),
                k.z(overlayZ),
            ]);
            pauseOverlay.push(pauseMuteLabel);
        };

        const destroyPauseOverlay = () => {
            pauseOverlay.forEach((obj) => {
                if (obj && obj.exists()) obj.destroy();
            });
            pauseOverlay = [];
            pauseMuteLabel = null;
        };

        const setPausedState = (active) => {
            pauseState.active = active;
            k.debug.paused = active;
            if (active) {
                if (pauseOverlay.length === 0) buildPauseOverlay();
            } else {
                destroyPauseOverlay();
            }

            level.info(active ? "Game paused" : "Game resumed", {
                "game.paused": active,
                "game.score": state.score,
            });
            level.counter(active ? "game.pause" : "game.resume");
        };

        const togglePause = () => {
            setPausedState(!isPaused());
        };

        const restartGame = () => {
            level.info("Run restarted", {
                "game.score": state.score,
                "game.player.lives": player.lives,
            });
            level.counter("game.run.restarted");

            // Clear pause before leaving so the audio context is resumed.
            resetPause(k);
            destroyPauseOverlay();
            state.reset();
            k.go("game");
        };

        k.onKeyPress(["p", "escape"], togglePause);
        k.onKeyPress("m", () => {
            toggleMute(k, { "ui.scene": "game" });
            refreshPauseMuteLabel();
        });
        k.onKeyPress("r", restartGame);

        // ---- Boss trigger state ----
        let bossSpawned = false;
        let levelTimer = 0;
        let bossSpan = null;

        k.onSceneLeave(() => {
            level.info("Level ended", {
                "game.score": state.score,
                "game.player.lives": player.lives,
                "game.boss.spawned": bossSpawned,
            });
            if (bossSpan && !bossSpan.ended) {
                bossSpan.setAttribute("boss.defeated", false).end();
            }

            destroyPauseOverlay();
            resetPause(k);
        });

        k.onUpdate(() => {
            updateHUD(levelTimer, bossSpawned);

            levelTimer += k.dt();

            if (!bossSpawned && levelTimer >= levelConfig.duration) {
                bossSpawned = true;

                const boss = level.withAttributes({
                    "boss.name": levelConfig.boss.name,
                });
                bossSpan = boss.startSpan("game.boss", { "boss.hp": levelConfig.boss.hp });
                boss.info("Boss spawned", { "boss.hp": levelConfig.boss.hp });
                boss.counter("game.boss.spawned");
                level.histogram("game.level.boss_spawn_time_s", levelTimer);

                // Warning text
                const warning = k.add([
                    k.text(`⚠ ${levelConfig.boss.name} APARECEU!`, { size: 28 }),
                    k.color(255, 50, 50),
                    k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40),
                    k.anchor("center"),
                    k.opacity(1),
                    k.fixed(),
                    k.z(Z_LAYERS.EFFECTS),
                ]);

                // Fade out warning
                k.wait(2, () => {
                    warning.onUpdate(() => {
                        warning.opacity -= k.dt();
                        if (warning.opacity <= 0) warning.destroy();
                    });
                });

                k.shake(10);

                // Boss entrance fanfare
                playBossFanfare(k);

                // Destroy all remaining regular enemies and obstacles
                k.get("enemy").forEach((e) => {
                    if (!e.is("boss")) e.destroy();
                });
                k.get("obstacle").forEach(o => o.destroy());

                // Spawn boss
                spawnBoss(k, levelConfig.boss, () => {
                    // Boss defeated!
                    state.addScore(100);
                    bossSpan?.setAttributes({
                        "boss.defeated": true,
                        "game.score": state.score,
                    }).end();
                    boss.info("Boss defeated", { "game.score": state.score });
                    boss.counter("game.boss.defeated");
                    level.histogram("game.level.clear_time_s", levelTimer);
                    playBossDefeatedJingle(k);

                    state.nextLevel();

                    if (state.levelIndex < LEVELS.length) {
                        level.info("Level completed", {
                            "game.next_level.id": LEVELS[state.levelIndex].id,
                            "game.score": state.score,
                        });
                        level.counter("game.level.completed");

                        // Transition to next level
                        const victoryText = k.add([
                            k.text(`${levelConfig.boss.name} DERROTADO!\n\nPróximo: ${LEVELS[state.levelIndex].name}`, {
                                size: 22,
                                align: "center",
                            }),
                            k.color(50, 255, 100),
                            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2),
                            k.anchor("center"),
                            k.fixed(),
                            k.z(Z_LAYERS.EFFECTS),
                        ]);

                        k.wait(3, () => {
                            k.go("game");
                        });
                    } else {
                        level.info("Campaign completed", {
                            "game.score": state.score,
                        });
                        level.counter("game.campaign.completed");

                        // Game complete! Go to cutscene first.
                        k.go("cutscene");
                    }
                });
            }
        });

        // Knock Up Stream thrust effect (runs every frame)
        k.onUpdate(() => {
            if (player.lives <= 0) return;

            k.get("knock_up_stream").forEach((stream) => {
                // If player is inside the stream's X boundaries
                const streamLeft = stream.pos.x - stream.width / 2;
                const streamRight = stream.pos.x + stream.width / 2;

                if (player.pos.x > streamLeft && player.pos.x < streamRight) {
                    // Pull player violently UPWARDS (negative Y is up)
                    player.pos.y += stream.pullStrength * k.dt();
                }
            });
        });


    };
}
