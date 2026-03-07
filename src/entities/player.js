// ============================================
// Player — Thousand Sunny
// ============================================
import { PLAYER, GAON_CANNON, COUP_DE_BURST, SOLDIER_DOCK, GAME } from "../config.js";

export function createPlayer(k) {
    const sunny = k.add([
        k.sprite("sunny"),
        k.scale((PLAYER.HEIGHT * GAME.PLAYER_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(100, GAME.HEIGHT / 2),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }), // Hitbox based on base sprite
        "player",
        {
            lives: PLAYER.LIVES,
            score: 0,
            invincible: false,
            gaonCooldown: 0,
            coupCooldown: 0,
            soldierDockActive: false,
            soldierDockTimer: 0,
            soldierDockFireTimer: 0,
        },
    ]);

    // Sunflower center
    sunny.add([
        k.circle(5),
        k.color(180, 100, 0),
        k.pos(PLAYER.WIDTH / 2 + 6, 0),
    ]);

    // -- Movement --
    k.onUpdate("player", (p) => {
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
    });

    // -- Gaon Cannon (Space) --
    k.onKeyDown("space", () => {
        const p = sunny;
        if (p.gaonCooldown <= 0) {
            p.gaonCooldown = GAON_CANNON.FIRE_RATE;
            spawnGaonBullet(k, p.pos);
        }
    });

    // -- Coup de Burst (E) --
    k.onKeyPress("e", () => {
        const p = sunny;
        if (p.coupCooldown <= 0) {
            p.coupCooldown = COUP_DE_BURST.COOLDOWN;
            spawnCoupDeBurst(k, p.pos);
            // Screen shake for impact
            k.shake(6);
        }
    });

    return sunny;
}

// -- Bullet factories --

function spawnGaonBullet(k, origin) {
    k.add([
        k.rect(GAON_CANNON.WIDTH, GAON_CANNON.HEIGHT),
        k.color(...GAON_CANNON.COLOR),
        k.pos(origin.x + PLAYER.WIDTH / 2, origin.y),
        k.anchor("center"),
        k.area(),
        k.move(k.RIGHT, GAON_CANNON.SPEED),
        k.offscreen({ destroy: true }),
        "player_bullet",
        { damage: GAON_CANNON.DAMAGE },
    ]);
}

function spawnCoupDeBurst(k, origin) {
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

    // Fade out effect
    burst.onUpdate(() => {
        burst.opacity -= 0.3 * k.dt();
        if (burst.opacity <= 0) burst.destroy();
    });
}

function spawnSoldierDockBullets(k, origin) {
    k.play("shoot", { volume: 0.4 });
    // Upper angle
    k.add([
        k.rect(SOLDIER_DOCK.WIDTH, SOLDIER_DOCK.HEIGHT),
        k.color(...SOLDIER_DOCK.COLOR),
        k.pos(origin.x + PLAYER.WIDTH / 2, origin.y - 15),
        k.anchor("center"),
        k.area(),
        k.move(30, SOLDIER_DOCK.SPEED), // 30 degrees up
        k.offscreen({ destroy: true }),
        "player_bullet",
        { damage: SOLDIER_DOCK.DAMAGE },
    ]);

    // Lower angle
    k.add([
        k.rect(SOLDIER_DOCK.WIDTH, SOLDIER_DOCK.HEIGHT),
        k.color(...SOLDIER_DOCK.COLOR),
        k.pos(origin.x + PLAYER.WIDTH / 2, origin.y + 15),
        k.anchor("center"),
        k.area(),
        k.move(-30, SOLDIER_DOCK.SPEED), // 30 degrees down
        k.offscreen({ destroy: true }),
        "player_bullet",
        { damage: SOLDIER_DOCK.DAMAGE },
    ]);
}

export function activateSoldierDock(player) {
    player.soldierDockActive = true;
    player.soldierDockTimer = SOLDIER_DOCK.DURATION;
    player.soldierDockFireTimer = 0;
}
