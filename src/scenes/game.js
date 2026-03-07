// ============================================
// Game Scene — Main gameplay
// ============================================
import { GAME, LEVELS, ENEMY, PLAYER } from "../config.js";
import { createPlayer, activateSoldierDock } from "../entities/player.js";
import { spawnTreasureLoop } from "../entities/treasure.js";
import { spawnEnemyLoop } from "../entities/enemy.js";
import { spawnBoss } from "../entities/boss.js";
import { spawnObstacleLoop } from "../entities/obstacle.js";

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

        // Player collects treasure
        k.onCollide("player", "treasure", (p, t) => {
            player.score += t.points;

            // Akuma no Mi activates Soldier Dock
            if (t.is("akuma")) {
                activateSoldierDock(player);
                // Visual flash effect
                const flashOverlay = k.add([
                    k.rect(GAME.WIDTH, GAME.HEIGHT),
                    k.color(148, 0, 211),
                    k.opacity(0.4),
                    k.pos(0, 0),
                    k.fixed(),
                    k.z(500),
                ]);
                flashOverlay.onUpdate(() => {
                    flashOverlay.opacity -= 2 * k.dt();
                    if (flashOverlay.opacity <= 0) flashOverlay.destroy();
                });
            }

            // Collect particle effect
            for (let i = 0; i < 5; i++) {
                const part = k.add([
                    k.circle(k.rand(2, 5)),
                    k.color(255, 215, 0),
                    k.pos(t.pos.x + k.rand(-10, 10), t.pos.y + k.rand(-10, 10)),
                    k.anchor("center"),
                    k.opacity(1),
                    "particle",
                ]);
                part.onUpdate(() => {
                    part.opacity -= 2 * k.dt();
                    part.pos.y -= 30 * k.dt();
                    if (part.opacity <= 0) part.destroy();
                });
            }

            t.destroy();
        });

        // Player bullet hits enemy
        k.onCollide("player_bullet", "enemy", (bullet, enemy) => {
            enemy.hp -= bullet.damage;

            enemy.color = k.Color.fromArray([255, 255, 255]);
            k.wait(0.08, () => {
                if (enemy.exists()) {
                    enemy.color = enemy.is("boss")
                        ? k.Color.fromArray(levelConfig.boss.color)
                        : k.Color.fromArray(ENEMY.COLOR);
                }
            });

            // Small hit particles
            for (let i = 0; i < 3; i++) {
                const part = k.add([
                    k.circle(k.rand(2, 4)),
                    k.color(255, 200, 100),
                    k.pos(bullet.pos.x, bullet.pos.y),
                    k.anchor("center"),
                    k.opacity(1),
                    "particle",
                ]);
                part.onUpdate(() => {
                    part.opacity -= 3 * k.dt();
                    part.pos.x += k.rand(-20, 20) * k.dt();
                    part.pos.y += k.rand(-20, 20) * k.dt();
                    if (part.opacity <= 0) part.destroy();
                });
            }

            bullet.destroy();

            // Enemy dies (non-boss, boss handles its own death)
            if (enemy.hp <= 0 && !enemy.is("boss")) {
                player.score += 20;
                k.play("explosion", { volume: 0.6 });

                // Explosion particles
                for (let i = 0; i < 4; i++) {
                    const p = k.add([
                        k.circle(k.rand(4, 10)),
                        k.color(255, k.rand(80, 180), 0),
                        k.pos(enemy.pos.x + k.rand(-15, 15), enemy.pos.y + k.rand(-10, 10)),
                        k.anchor("center"),
                        k.opacity(1),
                        "particle",
                    ]);
                    p.onUpdate(() => {
                        p.opacity -= 2 * k.dt();
                        if (p.opacity <= 0) p.destroy();
                    });
                }

                enemy.destroy();
            }
        });

        // Enemy bullet hits player
        k.onCollide("enemy_bullet", "player", (bullet, p) => {
            bullet.destroy();

            if (player.invincible) return;

            player.lives -= bullet.damage;
            player.invincible = true;
            k.play("explosion", { volume: 0.4 });

            // Damage flash
            k.shake(4);
            const flashLoop = k.onUpdate(() => {
                player.opacity = Math.sin(k.time() * 20) > 0 ? 1 : 0.3;
            });

            k.wait(PLAYER.INVINCIBLE_TIME, () => {
                player.invincible = false;
                player.opacity = 1;
                flashLoop.cancel();
            });

            if (player.lives <= 0) {
                k.go("gameOver", { score: player.score, level: levelConfig.id });
            }
        });

        // Obstacle hits player
        k.onCollide("obstacle", "player", (obstacle, p) => {
            if (player.invincible) return;

            player.lives -= obstacle.damage;
            player.invincible = true;
            k.play("explosion", { volume: 0.5 });

            k.shake(8);
            const flashLoop = k.onUpdate(() => {
                player.opacity = Math.sin(k.time() * 20) > 0 ? 1 : 0.3;
            });

            k.wait(PLAYER.INVINCIBLE_TIME, () => {
                player.invincible = false;
                player.opacity = 1;
                flashLoop.cancel();
            });

            // Destroy rocks/sea kings on impact, let whirlpools persist
            if (!obstacle.is("whirlpool")) {
                obstacle.destroy();
            }

            if (player.lives <= 0) {
                k.go("gameOver", { score: player.score, level: levelConfig.id });
            }
        });

        // Enemy ship collides with player
        k.onCollide("enemy", "player", (enemy, p) => {
            if (player.invincible) return;
            if (enemy.is("boss")) return; // boss only damages via bullets

            player.lives -= 1;
            player.invincible = true;
            k.play("explosion", { volume: 0.6 });

            k.shake(6);
            const flashLoop = k.onUpdate(() => {
                player.opacity = Math.sin(k.time() * 20) > 0 ? 1 : 0.3;
            });

            k.wait(PLAYER.INVINCIBLE_TIME, () => {
                player.invincible = false;
                player.opacity = 1;
                flashLoop.cancel();
            });

            enemy.destroy();

            if (player.lives <= 0) {
                k.go("gameOver", { score: player.score, level: levelConfig.id });
            }
        });

        // ---- Boss trigger ----
        let bossSpawned = false;
        let levelTimer = 0;

        k.onUpdate(() => {
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

        // ---- HUD ----
        // Score
        const scoreText = k.add([
            k.text("Score: 0", { size: 18 }),
            k.color(255, 215, 0),
            k.pos(16, 12),
            k.fixed(),
            k.z(200),
        ]);

        // Lives
        const livesText = k.add([
            k.text(`♥ ${player.lives}`, { size: 18 }),
            k.color(255, 80, 80),
            k.pos(16, 36),
            k.fixed(),
            k.z(200),
        ]);

        // Level
        k.add([
            k.text(`Nível ${levelConfig.id}: ${levelConfig.name}`, { size: 14 }),
            k.color(150, 200, 255),
            k.pos(GAME.WIDTH - 16, 12),
            k.anchor("topright"),
            k.fixed(),
            k.z(200),
        ]);

        // Coup de Burst cooldown indicator
        const coupIndicator = k.add([
            k.text("(E) Coup de Burst: READY", { size: 12 }),
            k.color(100, 200, 255),
            k.pos(GAME.WIDTH - 16, 36),
            k.anchor("topright"),
            k.fixed(),
            k.z(200),
        ]);

        // Soldier Dock indicator
        const dockIndicator = k.add([
            k.text("", { size: 12 }),
            k.color(255, 150, 50),
            k.pos(GAME.WIDTH - 16, 54),
            k.anchor("topright"),
            k.fixed(),
            k.z(200),
        ]);

        // Level timer / progress bar background
        k.add([
            k.rect(GAME.WIDTH - 32, 4),
            k.color(40, 40, 60),
            k.pos(16, GAME.HEIGHT - 16),
            k.fixed(),
            k.z(200),
        ]);

        const progressBar = k.add([
            k.rect(1, 4),
            k.color(50, 200, 100),
            k.pos(16, GAME.HEIGHT - 16),
            k.fixed(),
            k.z(201),
        ]);

        // Update HUD every frame
        k.onUpdate(() => {
            scoreText.text = `Score: ${player.score}`;
            livesText.text = `♥ ${"♥".repeat(Math.max(0, player.lives))}`;

            // Coup de Burst cooldown
            if (player.coupCooldown > 0) {
                coupIndicator.text = `(E) Coup de Burst: ${Math.ceil(player.coupCooldown)}s`;
                coupIndicator.color = k.Color.fromArray([100, 100, 100]);
            } else {
                coupIndicator.text = "(E) Coup de Burst: READY";
                coupIndicator.color = k.Color.fromArray([100, 200, 255]);
            }

            // Soldier Dock status
            if (player.soldierDockActive) {
                dockIndicator.text = `🔥 Soldier Dock: ${Math.ceil(player.soldierDockTimer)}s`;
            } else {
                dockIndicator.text = "";
            }

            // Progress bar
            if (!bossSpawned) {
                const progress = Math.min(levelTimer / levelConfig.duration, 1);
                progressBar.width = (GAME.WIDTH - 32) * progress;
            } else {
                progressBar.color = k.Color.fromArray([255, 50, 50]);
                progressBar.width = GAME.WIDTH - 32;
            }
        });
    };
}
