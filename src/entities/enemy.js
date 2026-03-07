// ============================================
// Enemy — Marine Ships
// ============================================
import { ENEMY, GAME } from "../config.js";

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
    const y = k.rand(40, GAME.HEIGHT - 40);

    const enemy = k.add([
        k.sprite("marine"),
        k.scale((ENEMY.HEIGHT * GAME.PLAYER_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(GAME.WIDTH + 30, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }),
        k.move(k.LEFT, ENEMY.SPEED * speedMult),
        k.offscreen({ destroy: true }),
        "enemy",
        {
            hp: ENEMY.HP,
            fireTimer: k.rand(0.5, ENEMY.FIRE_RATE),
        },
    ]);

    // Enemy shooting logic
    enemy.onUpdate(() => {
        enemy.fireTimer -= k.dt();
        if (enemy.fireTimer <= 0) {
            enemy.fireTimer = ENEMY.FIRE_RATE;
            spawnEnemyBullet(k, enemy.pos);
        }
    });

    return enemy;
}

function spawnEnemyBullet(k, origin) {
    k.add([
        k.rect(12, 5),
        k.color(...ENEMY.BULLET_COLOR),
        k.pos(origin.x - ENEMY.WIDTH / 2, origin.y),
        k.anchor("center"),
        k.area(),
        k.move(k.LEFT, ENEMY.BULLET_SPEED),
        k.offscreen({ destroy: true }),
        "enemy_bullet",
        { damage: ENEMY.BULLET_DAMAGE },
    ]);
}
