// ============================================
// Boss System
// ============================================
import { GAME } from "../config.js";

export function spawnBoss(k, bossConfig, onDefeated) {
    const spriteName = "boss_" + bossConfig.name.toLowerCase();

    const boss = k.add([
        k.sprite(spriteName),
        k.scale((bossConfig.height * GAME.BOSS_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(GAME.WIDTH + 50, GAME.HEIGHT / 2),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }),
        "boss",
        "enemy",
        {
            hp: bossConfig.hp,
            maxHp: bossConfig.hp,
            bossName: bossConfig.name,
            speed: bossConfig.speed,
            attacks: bossConfig.attacks,
            attackTimer: 2,
            phase: "enter",
            patternIndex: 0,
            baseY: GAME.HEIGHT / 2,
            moveDir: 1,
        },
    ]);

    // Boss name label
    boss.add([
        k.text(bossConfig.name, { size: 14 }),
        k.color(255, 255, 255),
        k.anchor("center"),
        k.pos(0, -100), // Adjusted slightly higher relative to scaled sprite
    ]);

    // HP bar background
    const hpBarBg = boss.add([
        k.rect(bossConfig.width + 20, 8),
        k.color(60, 0, 0),
        k.pos(-(bossConfig.width + 20) / 2, -60),
    ]);

    // HP bar fill
    const hpBarFill = boss.add([
        k.rect(bossConfig.width + 20, 8),
        k.color(220, 30, 30),
        k.pos(-(bossConfig.width + 20) / 2, -60),
    ]);

    // -- Boss behavior --
    boss.onUpdate(() => {
        const fullW = bossConfig.width + 20;

        // Update HP bar
        const hpRatio = Math.max(0, boss.hp / boss.maxHp);
        hpBarFill.width = fullW * hpRatio;

        // Phase: Enter the screen
        if (boss.phase === "enter") {
            boss.pos.x -= 120 * k.dt();
            if (boss.pos.x <= GAME.WIDTH - 100) {
                boss.phase = "fight";
            }
            return;
        }

        // Phase: Fight — oscillate vertically + attack patterns
        boss.pos.y += boss.moveDir * boss.speed * k.dt();
        if (boss.pos.y > GAME.HEIGHT - 40) boss.moveDir = -1;
        if (boss.pos.y < 40) boss.moveDir = 1;

        // Attack timer
        boss.attackTimer -= k.dt();
        if (boss.attackTimer <= 0) {
            const attack = boss.attacks[boss.patternIndex % boss.attacks.length];
            boss.patternIndex++;
            performBossAttack(k, boss, attack);
            boss.attackTimer = 2.5;
        }

        // Check defeat
        if (boss.hp <= 0) {
            // Explosion effect
            for (let i = 0; i < 8; i++) {
                const particle = k.add([
                    k.circle(k.rand(6, 16)),
                    k.color(255, k.rand(100, 200), 0),
                    k.pos(boss.pos.x + k.rand(-40, 40), boss.pos.y + k.rand(-30, 30)),
                    k.anchor("center"),
                    k.opacity(1),
                    "particle",
                ]);
                particle.onUpdate(() => {
                    particle.opacity -= 1.5 * k.dt();
                    particle.pos.y -= 40 * k.dt();
                    if (particle.opacity <= 0) particle.destroy();
                });
            }
            k.shake(12);
            boss.destroy();
            if (onDefeated) onDefeated();
        }
    });

    return boss;
}

function performBossAttack(k, boss, attackType) {
    switch (attackType) {
        case "charge":
            // Rush toward player briefly
            k.tween(
                boss.pos.x,
                boss.pos.x - 150,
                0.4,
                (val) => (boss.pos.x = val),
                k.easings.easeOutQuad
            ).then(() => {
                k.tween(
                    boss.pos.x,
                    GAME.WIDTH - 100,
                    0.8,
                    (val) => (boss.pos.x = val),
                    k.easings.easeInQuad
                );
            });
            break;

        case "spread":
            // Fire bullets in a fan pattern
            for (let angle = 150; angle <= 210; angle += 15) {
                k.add([
                    k.circle(6),
                    k.color(255, 50, 50),
                    k.pos(boss.pos.x - 36, boss.pos.y),
                    k.anchor("center"),
                    k.area(),
                    k.move(angle, 250),
                    k.offscreen({ destroy: true }),
                    "enemy_bullet",
                    { damage: 1 },
                ]);
            }
            break;

        case "smoke_wave":
            // Smoker special: Horizontal smoke wall
            k.add([
                k.rect(30, GAME.HEIGHT - 80),
                k.color(180, 180, 180),
                k.opacity(0.5),
                k.pos(boss.pos.x - 40, GAME.HEIGHT / 2),
                k.anchor("center"),
                k.area(),
                k.move(k.LEFT, 200),
                k.offscreen({ destroy: true }),
                "enemy_bullet",
                { damage: 1 },
            ]);
            break;

        case "ice_age":
            // Aokiji special: Ice crystals rain from top and bottom
            for (let i = 0; i < 6; i++) {
                const x = k.rand(100, GAME.WIDTH - 100);
                k.wait(i * 0.3, () => {
                    // From top
                    k.add([
                        k.rect(8, 20),
                        k.color(100, 200, 255),
                        k.pos(x, 0),
                        k.anchor("center"),
                        k.area(),
                        k.move(k.DOWN, 300),
                        k.offscreen({ destroy: true }),
                        "enemy_bullet",
                        { damage: 1 },
                    ]);
                    // From bottom
                    k.add([
                        k.rect(8, 20),
                        k.color(100, 200, 255),
                        k.pos(x + 40, GAME.HEIGHT),
                        k.anchor("center"),
                        k.area(),
                        k.move(k.UP, 300),
                        k.offscreen({ destroy: true }),
                        "enemy_bullet",
                        { damage: 1 },
                    ]);
                });
            }
            break;
    }
}

function bossWidth(boss) {
    return boss.width || 72;
}
