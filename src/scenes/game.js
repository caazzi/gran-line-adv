// ============================================
// Game Scene — Main gameplay
// ============================================
import { GAME, LEVELS } from "../config.js";
import { createPlayer } from "../entities/player.js";
import { spawnTreasureLoop } from "../entities/treasure.js";
import { spawnEnemyLoop } from "../entities/enemy.js";
import { spawnBoss } from "../entities/boss.js";
import { spawnObstacleLoop } from "../entities/obstacle.js";
import { setupCollisions } from "../systems/collisions.js";
import { setupHUD } from "../ui/hud.js";
import { initPools, resetAllPools } from "../systems/pools.js";
import { setupGameEvents } from "../systems/events.js";

export function gameScene(k) {
    return ({ levelIndex = 0, score = 0 } = {}) => {
        const levelConfig = LEVELS[levelIndex] || LEVELS[0];

        // ---- Background layers ----
        // Ocean looping pixel art background
        k.add([
            k.sprite("ocean", { width: GAME.WIDTH, height: GAME.HEIGHT, tiled: true }),
            k.pos(0, 0),
            k.fixed(),
            k.z(-100),
        ]);

        // ---- Object Pools ----
        initPools(k);
        resetAllPools(); // Clear stale objects from previous level

        // ---- Event System ----
        setupGameEvents(k);

        // ---- Player ----
        const player = createPlayer(k, score);

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
            k.z(200),
        ]);

        const levelSubtitle = k.add([
            k.text(`Nível ${levelConfig.id}`, { size: 22, font: "Outfit" }),
            k.color(200, 200, 255),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20),
            k.anchor("center"),
            k.opacity(0),
            k.fixed(),
            k.z(200),
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

        // ---- Boss trigger ----
        let bossSpawned = false;
        let levelTimer = 0;

        k.onUpdate(() => {
            updateHUD(levelTimer, bossSpawned);

            levelTimer += k.dt();

            if (!bossSpawned && levelTimer >= levelConfig.duration) {
                bossSpawned = true;

                // Warning text
                const warning = k.add([
                    k.text(`⚠ ${levelConfig.boss.name} APARECEU!`, { size: 28 }),
                    k.color(255, 50, 50),
                    k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 40),
                    k.anchor("center"),
                    k.opacity(1),
                    k.fixed(),
                    k.z(100),
                ]);

                // Fade out warning
                k.wait(2, () => {
                    warning.onUpdate(() => {
                        warning.opacity -= k.dt();
                        if (warning.opacity <= 0) warning.destroy();
                    });
                });

                k.shake(10);

                // Destroy all remaining regular enemies and obstacles
                k.get("enemy").forEach((e) => {
                    if (!e.is("boss")) e.destroy();
                });
                k.get("obstacle").forEach(o => o.destroy());

                // Spawn boss
                spawnBoss(k, levelConfig.boss, () => {
                    // Boss defeated!
                    player.score += 100;
                    const nextLevel = levelIndex + 1;

                    if (nextLevel < LEVELS.length) {
                        // Transition to next level
                        const victoryText = k.add([
                            k.text(`${levelConfig.boss.name} DERROTADO!\n\nPróximo: ${LEVELS[nextLevel].name}`, {
                                size: 22,
                                align: "center",
                            }),
                            k.color(50, 255, 100),
                            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2),
                            k.anchor("center"),
                            k.fixed(),
                            k.z(100),
                        ]);

                        k.wait(3, () => {
                            k.go("game", { levelIndex: nextLevel, score: player.score });
                        });
                    } else {
                        // Game complete!
                        k.go("victory", { score: player.score });
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
