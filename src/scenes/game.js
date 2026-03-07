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

export function gameScene(k) {
    return (levelIndex = 0) => {
        const levelConfig = LEVELS[levelIndex] || LEVELS[0];

        // ---- Background layers ----
        // Ocean looping pixel art background
        k.add([
            k.sprite("ocean", { width: GAME.WIDTH, height: GAME.HEIGHT, tiled: true }),
            k.pos(0, 0),
            k.fixed(),
            k.z(-100),
        ]);

        // ---- Player ----
        const player = createPlayer(k);

        // ---- Spawning systems ----
        spawnTreasureLoop(k, levelConfig.enemySpawnMult);
        spawnEnemyLoop(k, levelConfig);
        spawnObstacleLoop(k, levelConfig);

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
                            k.go("game", nextLevel);
                        });
                    } else {
                        // Game complete!
                        k.go("victory", { score: player.score });
                    }
                });
            }
        });

        // Whirlpool pull effect (runs every frame)
        k.onUpdate(() => {
            if (player.lives <= 0) return;

            k.get("whirlpool").forEach((whirlpool) => {
                const dist = player.pos.dist(whirlpool.pos);
                // If within pull radius (+ padding)
                if (dist < whirlpool.radius * 2) {
                    // Calculate pull vector towards center
                    const pullDir = player.pos.angle(whirlpool.pos);
                    const strength = (1 - (dist / (whirlpool.radius * 2))) * whirlpool.pullStrength;

                    // Move player using vector math
                    // Note: Kaplay angle is in degrees, 0 is right. k.Vec2.fromAngle() gives directional unit vector.
                    const moveVec = k.Vec2.fromAngle(pullDir).scale(strength * k.dt());
                    player.pos = player.pos.add(moveVec);
                }
            });
        });


    };
}
