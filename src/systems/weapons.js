// ============================================
// Weapons System
// Extracted from player.js to decouple attack
// logic from player state + movement logic.
// ============================================
import {
    GAON_CANNON,
    COUP_DE_BURST,
    SOLDIER_DOCK,
    MERA_MERA,
    HAOSHOKU_HAKI,
    PIKA_PIKA,
    PLAYER,
    GAME,
} from "../config.js";
import { Pools } from "./pools.js";

// =============================================
// Gaon Cannon (SPACE — default)
// =============================================
export function spawnGaonBullet(k, origin) {
    const b = Pools.gaonBullets.get();
    b.pos.x = origin.x + PLAYER.WIDTH / 2;
    b.pos.y = origin.y;
}

// =============================================
// Coup de Burst (E — horizontal beam)
// =============================================
export function spawnCoupDeBurst(k, origin) {
    k.play("explosion", { volume: 0.8 });
    const burst = k.add([
        k.rect(COUP_DE_BURST.WIDTH, COUP_DE_BURST.HEIGHT),
        k.color(...COUP_DE_BURST.COLOR),
        k.opacity(0.6),
        k.pos(origin.x + PLAYER.WIDTH / 2, GAME.HEIGHT / 2),
        k.anchor("center"),
        k.area(),
        k.move(k.RIGHT, COUP_DE_BURST.SPEED),
        k.offscreen({ destroy: true }),
        "player_bullet",
        { damage: COUP_DE_BURST.DAMAGE },
    ]);

    burst.onUpdate(() => {
        burst.opacity -= 0.3 * k.dt();
        if (burst.opacity <= 0) burst.destroy();
    });
}

// =============================================
// Soldier Dock Cannons (auto-fire after akuma)
// =============================================
export function spawnSoldierDockBullets(k, origin) {
    k.play("shoot", { volume: 0.4 });

    const b1 = Pools.soldierBullets.get();
    b1.pos.x = origin.x + PLAYER.WIDTH / 2;
    b1.pos.y = origin.y - 15;
    b1.angle = -30; // Upper

    const b2 = Pools.soldierBullets.get();
    b2.pos.x = origin.x + PLAYER.WIDTH / 2;
    b2.pos.y = origin.y + 15;
    b2.angle = 30; // Lower
}

// =============================================
// Mera Mera spread fire (auto-fire after akuma)
// =============================================
export function spawnMeraMeraBullets(k, origin) {
    k.play("shoot", { volume: 0.5 });
    const angles = [0, -15, 15]; // Straight, upper, lower

    angles.forEach(angle => {
        const b = Pools.meraBullets.get();
        b.pos.x = origin.x + PLAYER.WIDTH / 2;
        b.pos.y = origin.y;
        b.angle = angle;
    });
}

// =============================================
// Haoshoku Haki (F — screen clear)
// =============================================
export function triggerHaoshokuHaki(k, player) {
    k.play("explosion", { volume: 0.9, speed: 0.5 });
    k.shake(12);

    // Expanding crimson ring
    const hakiRing = k.add([
        k.circle(10),
        k.color(...HAOSHOKU_HAKI.COLOR),
        k.opacity(0.8),
        k.pos(player.pos.x, player.pos.y),
        k.anchor("center"),
        k.z(400),
    ]);

    let radius = 10;
    hakiRing.onUpdate(() => {
        radius += 1000 * k.dt();
        hakiRing.use(k.circle(radius));
        hakiRing.opacity -= 1.0 * k.dt();
        if (hakiRing.opacity <= 0) hakiRing.destroy();
    });

    // Full-screen red flash
    const invertBg = k.add([
        k.rect(GAME.WIDTH, GAME.HEIGHT),
        k.color(255, 0, 50),
        k.opacity(0),
        k.pos(0, 0),
        k.fixed(),
        k.z(401),
    ]);

    let flashed = false;
    invertBg.onUpdate(() => {
        if (!flashed) {
            invertBg.opacity += 4 * k.dt();
            if (invertBg.opacity >= 0.6) flashed = true;
        } else {
            invertBg.opacity -= 2 * k.dt();
            if (invertBg.opacity <= 0) invertBg.destroy();
        }
    });

    // Instantly destroy all non-boss enemies
    k.get("enemy").forEach(enemy => {
        if (!enemy.is("boss")) {
            enemy.hp -= 999;
            k.add([
                k.circle(k.rand(10, 20)),
                k.color(0, 0, 0),
                k.pos(enemy.pos.x, enemy.pos.y),
                k.anchor("center"),
                k.opacity(1),
                k.lifespan(0.3, { fade: 0.1 }),
                k.z(405)
            ]);
        }
    });

    k.get("enemy_bullet").forEach(b => b.destroy());
}

// =============================================
// Yata no Kagami (SPACE while Pika Pika — dash)
// =============================================
export function triggerYataNoKagami(k, player) {
    k.play("shoot", { volume: 0.8, pitch: 1.5 });

    const startX = player.pos.x;
    const startY = player.pos.y;

    const dashDistance = 450;
    player.pos.x += dashDistance;
    if (player.pos.x > GAME.WIDTH - PLAYER.WIDTH / 2) {
        player.pos.x = GAME.WIDTH - PLAYER.WIDTH / 2;
    }

    // Leave a light beam between start and end position
    const beamWidth = player.pos.x - startX + PLAYER.WIDTH;
    const beam = k.add([
        k.rect(beamWidth, 60),
        k.color(...PIKA_PIKA.COLOR),
        k.opacity(0.8),
        k.pos(startX - PLAYER.WIDTH / 2, startY),
        k.anchor("left"),
        k.area(),
        k.z(450),
        "light_beam"
    ]);

    // Screen white flash
    const flash = k.add([
        k.rect(GAME.WIDTH, GAME.HEIGHT),
        k.color(255, 255, 255),
        k.opacity(0.5),
        k.pos(0, 0),
        k.fixed(),
        k.z(500)
    ]);
    flash.onUpdate(() => {
        flash.opacity -= 3 * k.dt();
        if (flash.opacity <= 0) flash.destroy();
    });

    // Damage enemies intersecting the beam path
    k.get("enemy").forEach(enemy => {
        if (enemy.pos.x > startX && enemy.pos.x < player.pos.x + 100) {
            if (Math.abs(enemy.pos.y - startY) < 60) {
                enemy.hp -= PIKA_PIKA.DAMAGE;

                for (let i = 0; i < 3; i++) {
                    const spark = Pools.particles.get();
                    spark.pos.x = enemy.pos.x;
                    spark.pos.y = enemy.pos.y;
                    spark.color = k.Color.fromArray(PIKA_PIKA.COLOR);
                    spark.opacity = 1;
                    spark.scale.x = 1.5;
                    spark.scale.y = 1.5;
                    spark.velX = k.rand(-50, 50);
                    spark.velY = k.rand(-50, 50);
                    spark.shrinkRate = 2;
                }
            }
        }
    });

    beam.onUpdate(() => {
        beam.opacity -= 4 * k.dt();
        if (beam.opacity <= 0) beam.destroy();
    });
}
