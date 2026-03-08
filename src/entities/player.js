// ============================================
// Player — Thousand Sunny
// ============================================
import {
    PLAYER,
    GAON_CANNON,
    COUP_DE_BURST,
    HAOSHOKU_HAKI,
    MERA_MERA,
    SOLDIER_DOCK,
    PIKA_PIKA,
    GAME
} from "../config.js";
import {
    spawnGaonBullet,
    spawnCoupDeBurst,
    spawnSoldierDockBullets,
    spawnMeraMeraBullets,
    triggerHaoshokuHaki,
    triggerYataNoKagami,
} from "../systems/weapons.js";

export function createPlayer(k, initialScore = 0) {
    const sunny = k.add([
        k.sprite("sunny"),
        k.scale((PLAYER.HEIGHT * GAME.PLAYER_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(100, GAME.HEIGHT / 2),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }), // Hitbox based on base sprite
        "player",
        {
            lives: PLAYER.LIVES,
            score: initialScore,
            invincible: false,
            gaonCooldown: 0,
            coupCooldown: 0,
            hakiCooldown: 0,
            soldierDockActive: false,
            soldierDockTimer: 0,
            soldierDockFireTimer: 0,
            meraMeraActive: false,
            meraMeraTimer: 0,
            meraMeraFireTimer: 0,
            bariBariActive: false,
            bariBariTimer: 0,
            pikaPikaActive: false,
            pikaPikaTimer: 0,
            pikaPikaCooldown: 0,
        },
    ]);

    // Sunflower center
    sunny.add([
        k.circle(5),
        k.color(180, 100, 0),
        k.pos(PLAYER.WIDTH / 2 + 6, 0),
    ]);

    // -- Movement --
    sunny.onUpdate(() => {
        const p = sunny;
        const spd = PLAYER.SPEED * k.dt();

        if (k.isKeyDown("left") || k.isKeyDown("a")) p.pos.x -= spd;
        if (k.isKeyDown("right") || k.isKeyDown("d")) p.pos.x += spd;
        if (k.isKeyDown("up") || k.isKeyDown("w")) p.pos.y -= spd;
        if (k.isKeyDown("down") || k.isKeyDown("s")) p.pos.y += spd;

        // Clamp to screen
        p.pos.x = k.clamp(p.pos.x, PLAYER.WIDTH / 2, GAME.WIDTH - PLAYER.WIDTH / 2);
        p.pos.y = k.clamp(p.pos.y, PLAYER.HEIGHT / 2 + 10, GAME.HEIGHT - PLAYER.HEIGHT / 2 - 10);

        // Cooldown timers
        if (p.gaonCooldown > 0) p.gaonCooldown -= k.dt();
        if (p.coupCooldown > 0) p.coupCooldown -= k.dt();
        if (p.hakiCooldown > 0) p.hakiCooldown -= k.dt();

        // Soldier Dock auto-fire
        if (p.soldierDockActive) {
            p.soldierDockTimer -= k.dt();
            p.soldierDockFireTimer -= k.dt();

            if (p.soldierDockFireTimer <= 0) {
                p.soldierDockFireTimer = SOLDIER_DOCK.FIRE_RATE;
                spawnSoldierDockBullets(k, p.pos);
            }

            if (p.soldierDockTimer <= 0) {
                p.soldierDockActive = false;
            }
        }

        // Mera Mera auto-fire
        if (p.meraMeraActive) {
            p.meraMeraTimer -= k.dt();
            p.meraMeraFireTimer -= k.dt();

            if (p.meraMeraFireTimer <= 0) {
                p.meraMeraFireTimer = MERA_MERA.FIRE_RATE;
                spawnMeraMeraBullets(k, p.pos);
            }

            if (p.meraMeraTimer <= 0) {
                p.meraMeraActive = false;
            }
        }

        // Bari Bari shield
        if (p.bariBariActive) {
            p.bariBariTimer -= k.dt();
            if (p.bariBariTimer <= 0) {
                p.bariBariActive = false;
            }
        }

        // Pika Pika (Light Dash)
        if (p.pikaPikaActive) {
            p.pikaPikaTimer -= k.dt();
            if (p.pikaPikaCooldown > 0) p.pikaPikaCooldown -= k.dt();
            if (p.pikaPikaTimer <= 0) {
                p.pikaPikaActive = false;
            }
        }
    });

    // -- Gaon Cannon / Yata no Kagami (Space) --
    k.onKeyDown("space", () => {
        if (!sunny.exists()) return;
        const p = sunny;

        if (p.pikaPikaActive) {
            if (p.pikaPikaCooldown <= 0) {
                p.pikaPikaCooldown = PIKA_PIKA.COOLDOWN;
                triggerYataNoKagami(k, p);
            }
        } else {
            if (p.gaonCooldown <= 0) {
                p.gaonCooldown = GAON_CANNON.FIRE_RATE;
                spawnGaonBullet(k, p.pos);
            }
        }
    });

    // -- Coup de Burst (E) --
    k.onKeyPress("e", () => {
        if (!sunny.exists()) return;
        const p = sunny;
        if (p.coupCooldown <= 0) {
            p.coupCooldown = COUP_DE_BURST.COOLDOWN;
            spawnCoupDeBurst(k, p.pos);
            // Screen shake for impact
            k.shake(6);
        }
    });

    // -- Haoshoku Haki (F) --
    k.onKeyPress("f", () => {
        if (!sunny.exists()) return;
        const p = sunny;
        if (p.hakiCooldown <= 0) {
            p.hakiCooldown = HAOSHOKU_HAKI.COOLDOWN;
            triggerHaoshokuHaki(k, p);
        }
    });

    return sunny;
}

export function activateSoldierDock(player) {
    player.soldierDockActive = true;
    player.soldierDockTimer = SOLDIER_DOCK.DURATION;
    player.soldierDockFireTimer = 0;
}
