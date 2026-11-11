// ============================================
// Enemy Damage & Death — single source of truth
// ============================================
import { ENEMY, PLAYER, Z_LAYERS } from "../config.js";
import { Pools } from "./pools.js";
import { playCoinSFX, playExplosionSFX } from "./audio.js";
import { state } from "../state.js";
import { telemetry } from "./telemetry.js";

/**
 * Apply damage to an enemy and handle the shared hit/death rules.
 * Boss death stays in boss.js; this only applies the hit effects.
 */
export function damageEnemy(k, enemy, amount, { player, source = "bullet" } = {}) {
    if (!enemy || !enemy.exists() || enemy.dead) return;

    enemy.hp -= amount;
    telemetry.counter("game.enemy.damage", 1, {
        source,
        boss: enemy.is("boss"),
    });

    // White hit flash, restored to the enemy's own color.
    enemy.color = k.Color.fromArray([255, 255, 255]);
    k.wait(0.08, () => {
        if (!enemy.exists()) return;
        const restoreColor = enemy.is("boss") && enemy.bossColor
            ? enemy.bossColor
            : ENEMY.COLOR;
        enemy.color = k.Color.fromArray(restoreColor);
    });

    // Floating damage text
    const dmgText = k.add([
        k.text(amount.toString(), { size: 28, font: "Bangers" }),
        k.color(255, 50, 50),
        k.pos(enemy.pos.x, enemy.pos.y - 10),
        k.anchor("center"),
        k.opacity(1),
        k.z(Z_LAYERS.POST_HUD),
        k.move(k.UP, 80),
    ]);

    dmgText.onUpdate(() => {
        dmgText.opacity -= 1.5 * k.dt();
        if (dmgText.opacity <= 0) dmgText.destroy();
    });

    // Small hit particles
    for (let i = 0; i < 3; i++) {
        const part = Pools.particles.get();
        part.pos.x = enemy.pos.x;
        part.pos.y = enemy.pos.y;
        part.color = k.Color.fromArray([255, 200, 100]);
        part.opacity = 1;
        part.scale.x = k.rand(0.4, 0.8);
        part.scale.y = part.scale.x;
        part.velX = k.rand(-20, 20);
        part.velY = k.rand(-20, 20);
        part.shrinkRate = 3;
    }

    // Bosses own their death sequence.
    if (enemy.is("boss")) return;
    if (enemy.hp > 0) return;

    enemy.dead = true;
    state.addScore(20);
    const killAttributes = {
        "enemy.source": source,
        "game.score": state.score,
    };
    if (player) killAttributes["player.lives"] = player.lives;
    telemetry.debug("Enemy defeated", killAttributes);
    telemetry.counter("game.enemy.defeated", 1, { source });
    playCoinSFX(0.5);

    // Heart recovery mechanic (heal 1 up to max)
    if (player && player.exists() && player.lives < PLAYER.LIVES) {
        player.lives++;
        telemetry.debug("Player healed", {
            "player.lives": player.lives,
            "enemy.source": source,
        });
        telemetry.counter("game.player.healed");
        telemetry.gauge("game.player.lives", player.lives);
        playExplosionSFX(0.6);

        const healText = k.add([
            k.text("+1 ♥", { size: 16 }),
            k.color(50, 255, 100),
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
