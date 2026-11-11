import { Z_LAYERS, GAME, PLAYER } from "../config.js";
import { activateSoldierDock } from "../entities/player.js";
import { Pools } from "./pools.js";
import { playFruitSFX, playExplosionSFX } from "./audio.js";
import { damageEnemy } from "./damage.js";
import { state } from "../state.js";
import { telemetry } from "./telemetry.js";

function treasureType(treasure) {
    if (treasure.is("pika_pika")) return "pika_pika";
    if (treasure.is("mera_mera")) return "mera_mera";
    if (treasure.is("bari_bari")) return "bari_bari";
    if (treasure.is("akuma")) return "akuma";
    return "coin";
}

export function setupCollisions(k, player, levelConfig) {
    const level = telemetry.withAttributes({ "game.level.id": levelConfig.id });

    // Player collects treasure
    k.onCollide("player", "treasure", (p, t) => {
        if (t.isCollected) return;
        t.isCollected = true;

        state.addScore(t.points);

        const collectedType = treasureType(t);
        level.debug("Treasure collected", {
            "treasure.type": collectedType,
            "treasure.points": t.points,
            "game.score": state.score,
            "player.lives": player.lives,
        });
        level.counter("game.treasure.collected", 1, { "treasure.type": collectedType });

        // Apply Akuma no Mi effect based on tag
        if (collectedType !== "coin") {
            let flashColor = [148, 0, 211]; // Default purple
            const fruitTag = collectedType;
            level.info("Devil Fruit activated", {
                "fruit.type": fruitTag,
                "game.score": state.score,
                "player.lives": player.lives,
            });
            level.counter("game.fruit.activated", 1, { "fruit.type": fruitTag });
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
                    k.z(Z_LAYERS.PROJECTILES),
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
                k.z(Z_LAYERS.TOP),
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
            k.z(Z_LAYERS.POST_HUD),
            k.move(k.UP, 60),
        ]);
        scoreText.onUpdate(() => {
            scoreText.opacity -= 1.2 * k.dt();
            if (scoreText.opacity <= 0) scoreText.destroy();
        });

        if (t.is("coin")) {
            // stop horizontal movement to play the animation in place
            t.unuse("move");
            t.play("open");

            // Wait based on animation speed before destroying
            k.wait(0.6, () => {
                if (t.exists()) t.destroy();
            });
        } else {
            t.destroy();
        }
    });

    // Player bullet hits enemy
    k.onCollide("player_bullet", "enemy", (bullet, enemy) => {
        damageEnemy(k, enemy, bullet.damage, { player, source: "bullet" });
        bullet.destroy();
    });

    // Harmful objects hit player (Enemy Bullets, Enemies, Obstacles)
    k.onCollide("harmful", "player", (harmfulObj, p) => {
        // Knock up stream doesn't deal damage, it just thrusts
        if (harmfulObj.is("knock_up_stream")) return;

        // Bosses only damage via bullets, not via body collision
        if (harmfulObj.is("boss")) return;

        const damage = harmfulObj.damage || 1;
        handlePlayerDamage(k, player, damage, levelConfig, level);

        // Destroy bullets, normal enemies, and objects upon impact
        harmfulObj.destroy();
    });
}

function handlePlayerDamage(k, player, damageAmount, levelConfig, level) {
    if (player.invincible || !player.exists() || player.bariBariActive || player.pikaPikaActive) return;

    player.lives -= damageAmount;
    player.invincible = true;

    level.info("Player damaged", {
        "game.damage": damageAmount,
        "player.lives": player.lives,
        "game.score": state.score,
    });
    level.counter("game.player.damaged");
    telemetry.gauge("game.player.lives", player.lives);
    playExplosionSFX(0.4);

    // Player Floating Damage Text
    const dmgText = k.add([
        k.text("-" + damageAmount.toString(), { size: 36, font: "Bangers" }),
        k.color(255, 0, 0),
        k.pos(player.pos.x, player.pos.y - 20),
        k.anchor("center"),
        k.opacity(1),
        k.z(Z_LAYERS.POST_HUD),
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
        level.info("Player defeated", {
            "game.score": state.score,
            "player.lives": player.lives,
        });
        k.go("gameOver", { level: levelConfig.id });
    }
}
