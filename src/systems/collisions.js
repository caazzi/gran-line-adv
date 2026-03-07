import { GAME, ENEMY, PLAYER } from "../config.js";
import { activateSoldierDock } from "../entities/player.js";

export function setupCollisions(k, player, levelConfig) {
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
        handlePlayerDamage(k, player, bullet.damage, levelConfig);
    });

    // Obstacle hits player
    k.onCollide("obstacle", "player", (obstacle, p) => {
        handlePlayerDamage(k, player, obstacle.damage, levelConfig);

        // Destroy rocks/sea kings on impact, let whirlpools persist
        if (!obstacle.is("whirlpool")) {
            obstacle.destroy();
        }
    });

    // Enemy ship collides with player
    k.onCollide("enemy", "player", (enemy, p) => {
        if (enemy.is("boss")) return; // boss only damages via bullets
        handlePlayerDamage(k, player, 1, levelConfig);
        enemy.destroy();
    });
}

function handlePlayerDamage(k, player, damageAmount, levelConfig) {
    if (player.invincible || !player.exists()) return;

    player.lives -= damageAmount;
    player.invincible = true;
    k.play("explosion", { volume: 0.4 });

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
