// ============================================
// Global Object Pools
// ============================================
import { createPool } from "../utils/pool.js";
import { Z_LAYERS, GAON_CANNON, MERA_MERA, SOLDIER_DOCK, COUP_DE_BURST, ENEMY, GAME, PLAYER } from "../config.js";

// Export the instances so other files can just import Pools.particles, etc.
export const Pools = {
    gaonBullets: null,
    meraBullets: null,
    soldierBullets: null,
    enemyBullets: null,
    particles: null,
};

/** Reset all pools — call on scene transitions to prevent stale objects */
export function resetAllPools() {
    Object.values(Pools).forEach(pool => {
        if (pool && pool.resetAll) pool.resetAll();
    });
}

// Must be called inside the game scene to bind `k`
export function initPools(k) {
    // ----------------------------------------
    // Player Particles (Generic hit/explosion)
    // ----------------------------------------
    Pools.particles = createPool(k, 50, (k) => {
        return k.add([
            k.circle(5),
            k.color(255, 255, 255),
            k.pos(-9999, -9999), // default hidden
            k.anchor("center"),
            k.opacity(1),
            k.scale(1),
            "particle",
            {
                velX: 0,
                velY: 0,
                shrinkRate: 2,
            }
        ]);
    });

    // Particle update logic
    k.onUpdate("particle", (p) => {
        if (p.hidden) return;
        p.opacity -= p.shrinkRate * k.dt();
        p.pos.x += p.velX * k.dt();
        p.pos.y += p.velY * k.dt();

        if (p.opacity <= 0) {
            p.destroy(); // Recycles to pool
        }
    });

    // ----------------------------------------
    // Gaon Cannon Bullets
    // ----------------------------------------
    Pools.gaonBullets = createPool(k, 10, (k) => {
        const b = k.add([
            k.circle(10), // Iron ball shape
            k.color(50, 50, 50),
            k.pos(-9999, -9999),
            k.anchor("center"),
            k.area(),
            "player_bullet",
            { damage: GAON_CANNON.DAMAGE }
        ]);

        // Golden fiery aura
        b.add([
            k.circle(16),
            k.color(255, 150, 50),
            k.opacity(0.6),
            k.anchor("center"),
            k.z(Z_LAYERS.POOL_IDLE)
        ]);

        return b;
    });

    // ----------------------------------------
    // Mera Mera Bullets
    // ----------------------------------------
    Pools.meraBullets = createPool(k, 30, (k) => {
        return k.add([
            k.circle(MERA_MERA.WIDTH / 2),
            k.color(...MERA_MERA.COLOR),
            k.pos(-9999, -9999),
            k.anchor("center"),
            k.area(),
            "player_bullet",
            {
                damage: MERA_MERA.DAMAGE,
                angle: 0
            }
        ]);
    });

    // ----------------------------------------
    // Soldier Dock Bullets
    // ----------------------------------------
    Pools.soldierBullets = createPool(k, 20, (k) => {
        return k.add([
            k.rect(SOLDIER_DOCK.WIDTH, SOLDIER_DOCK.HEIGHT),
            k.color(...SOLDIER_DOCK.COLOR),
            k.pos(-9999, -9999),
            k.anchor("center"),
            k.area(),
            "player_bullet",
            {
                damage: SOLDIER_DOCK.DAMAGE,
                angle: 0
            }
        ]);
    });

    // ----------------------------------------
    // Enemy Bullets
    // ----------------------------------------
    Pools.enemyBullets = createPool(k, 30, (k) => {
        const b = k.add([
            k.circle(8), // Round fireball
            k.color(255, 50, 50),
            k.pos(-9999, -9999),
            k.anchor("center"),
            k.area({ shape: new k.Rect(k.vec2(0), ENEMY.WIDTH, ENEMY.HEIGHT) }),
            "enemy_bullet",
            "harmful",
            { damage: ENEMY.BULLET_DAMAGE }
        ]);

        // Bright core
        b.add([
            k.circle(4),
            k.color(255, 255, 150),
            k.anchor("center"),
            k.z(Z_LAYERS.PROJECTILES)
        ]);

        return b;
    });

    // Unified bullet movement update
    k.onUpdate("player_bullet", (b) => {
        if (b.hidden) return;

        // Handle custom angled movement if exists (Mera Mera, Soldier Dock)
        if (b.angle !== undefined && b.angle !== 0) {
            const speed = b.width === SOLDIER_DOCK.WIDTH ? SOLDIER_DOCK.SPEED : MERA_MERA.SPEED;
            const moveVec = k.Vec2.fromAngle(b.angle).scale(speed * k.dt());
            b.pos.x += moveVec.x;
            b.pos.y += moveVec.y;
        } else {
            // Standard straight forward speed (Gaon Cannon)
            b.pos.x += GAON_CANNON.SPEED * k.dt();
        }

        if (b.pos.x > GAME.WIDTH + 50 || b.pos.x < -50 || b.pos.y < -50 || b.pos.y > GAME.HEIGHT + 50) {
            b.destroy();
        }
    });

    k.onUpdate("enemy_bullet", (b) => {
        if (b.hidden) return;

        // Boss spread bullets move in custom angles
        if (b._spreadAngle !== undefined) {
            const speed = b._spreadSpeed || 250;
            const rad = (b._spreadAngle * Math.PI) / 180;
            b.pos.x += Math.cos(rad) * speed * k.dt();
            b.pos.y += Math.sin(rad) * speed * k.dt();
        } else {
            // Standard left-moving enemy bullets
            b.pos.x -= ENEMY.BULLET_SPEED * k.dt();
        }

        if (b.pos.x < -50 || b.pos.x > GAME.WIDTH + 50 || b.pos.y < -50 || b.pos.y > GAME.HEIGHT + 50) {
            b._spreadAngle = undefined; // Reset for reuse
            b._spreadSpeed = undefined;
            b.destroy();
        }
    });
}
