import { GAME, ENEMY, PLAYER } from "../config.js";
import { activateSoldierDock } from "../entities/player.js";
import { Pools } from "./pools.js";
import { playFruitSFX } from "./audio.js";

export function setupCollisions(k, player, levelConfig) {
    // Player collects treasure
    k.onCollide("player", "treasure", (p, t) => {
        player.score += t.points;

        // Apply Akuma no Mi effect based on tag
        if (t.is("akuma") || t.is("mera_mera") || t.is("bari_bari") || t.is("pika_pika")) {
            let flashColor = [148, 0, 211]; // Default purple
            const fruitTag = t.is("mera_mera") ? "mera_mera" : t.is("bari_bari") ? "bari_bari" : t.is("pika_pika") ? "pika_pika" : "akuma";
            playFruitSFX(k, fruitTag);

            if (t.is("mera_mera")) {
                player.meraMeraActive = true;
                player.meraMeraTimer = 12; // MERA_MERA.DURATION
                player.meraMeraFireTimer = 0;
                flashColor = [255, 100, 20];
            } else if (t.is("bari_bari")) {
                player.bariBariActive = true;
                player.bariBariTimer = 15; // BARI_BARI.DURATION
                flashColor = [50, 255, 150];

                // Visual shield directly on player
                const shield = player.add([
                    k.circle(PLAYER.WIDTH + 10),
                    k.color(50, 255, 150),
                    k.opacity(0.4),
                    k.pos(0, 0),
                    k.z(50),
                ]);

                let time = 0;
                shield.onUpdate(() => {
                    time += k.dt() * 5;
                    shield.opacity = 0.3 + Math.sin(time) * 0.2;
                    if (!player.bariBariActive) shield.destroy();
                });

            } else if (t.is("pika_pika")) {
                player.pikaPikaActive = true;
                player.pikaPikaTimer = 10; // PIKA_PIKA.DURATION
                player.pikaPikaCooldown = 0;
                flashColor = [255, 255, 50];
            } else {
                activateSoldierDock(player);
            }

            // Visual flash effect
            const flashOverlay = k.add([
                k.rect(GAME.WIDTH, GAME.HEIGHT),
                k.color(...flashColor),
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
            const part = Pools.particles.get();
            part.pos.x = t.pos.x + k.rand(-10, 10);
            part.pos.y = t.pos.y + k.rand(-10, 10);
            part.color = k.Color.fromArray([255, 215, 0]);
            part.opacity = 1;
            part.scale.x = k.rand(0.4, 1.0);
            part.scale.y = part.scale.x;
            part.velX = 0;
            part.velY = -30;
            part.shrinkRate = 2;
        }

        // Floating Score Popup
        const scoreText = k.add([
            k.text("+" + t.points.toString(), { size: 32, font: "Bangers" }),
            k.color(255, 215, 0), // Gold
            k.pos(t.pos.x, t.pos.y - 15),
            k.anchor("center"),
            k.opacity(1),
            k.z(300),
            k.move(k.UP, 60),
        ]);
        scoreText.onUpdate(() => {
            scoreText.opacity -= 1.2 * k.dt();
            if (scoreText.opacity <= 0) scoreText.destroy();
        });

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

        // Floating Damage Text
        const dmgText = k.add([
            k.text(bullet.damage.toString(), { size: 28, font: "Bangers" }),
            k.color(255, 50, 50),
            k.pos(enemy.pos.x, enemy.pos.y - 10),
            k.anchor("center"),
            k.opacity(1),
            k.z(300),
            k.move(k.UP, 80), // Float upwards
        ]);

        dmgText.onUpdate(() => {
            dmgText.opacity -= 1.5 * k.dt();
            if (dmgText.opacity <= 0) dmgText.destroy();
        });

        // Small hit particles
        for (let i = 0; i < 3; i++) {
            const part = Pools.particles.get();
            part.pos.x = bullet.pos.x;
            part.pos.y = bullet.pos.y;
            part.color = k.Color.fromArray([255, 200, 100]);
            part.opacity = 1;
            part.scale.x = k.rand(0.4, 0.8);
            part.scale.y = part.scale.x;
            part.velX = k.rand(-20, 20);
            part.velY = k.rand(-20, 20);
            part.shrinkRate = 3;
        }

        bullet.destroy();

        // Enemy dies (non-boss, boss handles its own death)
        if (enemy.hp <= 0 && !enemy.is("boss")) {
            player.score += 20;
            k.play("explosion", { volume: 0.6 });

            // Heart Recovery Mechanic (Heal 1 up to MAX)
            if (player.exists() && player.lives < PLAYER.LIVES) {
                player.lives++;

                // +1 HP Visual Effect
                const healText = k.add([
                    k.text("+1 ♥", { size: 16 }),
                    k.color(50, 255, 100), // Green
                    k.pos(enemy.pos.x, enemy.pos.y - 20),
                    k.anchor("center"),
                    k.opacity(1),
                    "particle",
                ]);
                healText.onUpdate(() => {
                    healText.opacity -= 1.5 * k.dt();
                    healText.pos.y -= 40 * k.dt();
                    if (healText.opacity <= 0) healText.destroy();
                });
            }

            // Explosion particles
            for (let i = 0; i < 4; i++) {
                const part = Pools.particles.get();
                part.pos.x = enemy.pos.x + k.rand(-15, 15);
                part.pos.y = enemy.pos.y + k.rand(-10, 10);
                part.color = k.Color.fromArray([255, k.rand(80, 180), 0]);
                part.opacity = 1;
                part.scale.x = k.rand(0.8, 2.0);
                part.scale.y = part.scale.x;
                part.velX = 0;
                part.velY = 0;
                part.shrinkRate = 2;
            }

            enemy.destroy();
        }
    });

    // Enemy bullet hits player
    k.onCollide("enemy_bullet", "player", (bullet, p) => {
        bullet.destroy();
        handlePlayerDamage(k, player, bullet.damage, levelConfig);
    });

    // Obstacle hits player
    k.onCollide("obstacle", "player", (obstacle, p) => {
        // Knock up stream doesn't deal damage, it just thrusts
        if (obstacle.is("knock_up_stream")) return;

        handlePlayerDamage(k, player, obstacle.damage, levelConfig);

        // Destroy rocks/sea kings on impact
        obstacle.destroy();
    });

    // Enemy ship collides with player
    k.onCollide("enemy", "player", (enemy, p) => {
        if (enemy.is("boss")) return; // boss only damages via bullets
        handlePlayerDamage(k, player, 1, levelConfig);
        enemy.destroy();
    });
}

function handlePlayerDamage(k, player, damageAmount, levelConfig) {
    if (player.invincible || !player.exists() || player.bariBariActive || player.pikaPikaActive) return;

    player.lives -= damageAmount;
    player.invincible = true;
    k.play("explosion", { volume: 0.4 });

    // Player Floating Damage Text
    const dmgText = k.add([
        k.text("-" + damageAmount.toString(), { size: 36, font: "Bangers" }),
        k.color(255, 0, 0),
        k.pos(player.pos.x, player.pos.y - 20),
        k.anchor("center"),
        k.opacity(1),
        k.z(300),
        k.scale(1),
    ]);

    // Scale up and fade out effect
    k.tween(1, 1.5, 0.5, (v) => dmgText.scale = k.vec2(v), k.easings.easeOutQuad);
    const dmgLoop = k.onUpdate(() => {
        dmgText.pos.y -= 30 * k.dt();
        dmgText.opacity -= 2 * k.dt();
        if (dmgText.opacity <= 0) {
            dmgText.destroy();
            dmgLoop.cancel();
        }
    });

    // Damage flash
    k.shake(4);
    const flashLoop = k.onUpdate(() => {
        if (player.exists()) {
            player.opacity = Math.sin(k.time() * 20) > 0 ? 1 : 0.3;
        }
    });

    k.wait(PLAYER.INVINCIBLE_TIME, () => {
        if (player.exists()) {
            player.invincible = false;
            player.opacity = 1;
        }
        flashLoop.cancel();
    });

    if (player.lives <= 0) {
        k.go("gameOver", { score: player.score, level: levelConfig.id });
    }
}
