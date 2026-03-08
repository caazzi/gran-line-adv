// ============================================
// Enemy — Marine Ships
// ============================================
import { ENEMY, GAME } from "../config.js";
import { Pools } from "../systems/pools.js";

export function spawnEnemyLoop(k, levelConfig) {
    const [minInterval, maxInterval] = ENEMY.SPAWN_INTERVAL;
    const spawnMult = levelConfig.enemySpawnMult || 1;

    function scheduleNext() {
        const delay = k.rand(minInterval, maxInterval) / spawnMult;
        k.wait(delay, () => {
            spawnEnemy(k, levelConfig);
            scheduleNext();
        });
    }

    scheduleNext();
}

function spawnEnemy(k, levelConfig) {
    const speedMult = levelConfig.enemySpeedMult || 1;
    const hpMult = levelConfig.enemyHpMult || 1;
    const fireRateMult = levelConfig.enemyFireRateMult || 1;
    const y = k.rand(40, GAME.HEIGHT - 40);

    const scaledHp = Math.ceil(ENEMY.HP * hpMult);
    const scaledFireRate = ENEMY.FIRE_RATE * fireRateMult;

    const enemy = k.add([
        k.sprite("marine", { anim: "idle" }),
        k.scale((ENEMY.HEIGHT * GAME.PLAYER_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(GAME.WIDTH + 30, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }),
        k.move(k.LEFT, ENEMY.SPEED * speedMult),
        k.offscreen({ destroy: true }),
        "enemy",
        "harmful",
        {
            hp: scaledHp,
            fireTimer: k.rand(0.5, scaledFireRate),
        },
    ]);

    // Enemy shooting logic
    enemy.onUpdate(() => {
        enemy.fireTimer -= k.dt();
        if (enemy.fireTimer <= 0) {
            enemy.fireTimer = scaledFireRate;
            spawnEnemyBullet(k, enemy.pos);
        }
    });

    return enemy;
}

function spawnEnemyBullet(k, origin) {
    const b = Pools.enemyBullets.get();
    b.pos.x = origin.x - ENEMY.WIDTH / 2;
    b.pos.y = origin.y;
}
