// ============================================
// Obstacles — Rocks, Whirlpools, Sea Kings
// ============================================
import { GAME } from "../config.js";

export function spawnObstacleLoop(k, levelConfig) {
    // Only spawn obstacles if defined in level
    if (!levelConfig.obstacles) return;

    const minInterval = 3;
    const maxInterval = 6;
    const spawnMult = levelConfig.obstacleSpawnMult || 1;

    function scheduleNext() {
        const delay = k.rand(minInterval, maxInterval) / spawnMult;
        k.wait(delay, () => {
            spawnRandomObstacle(k, levelConfig.obstacles);
            scheduleNext();
        });
    }

    scheduleNext();
}

function spawnRandomObstacle(k, availableTypes) {
    const type = k.choose(availableTypes);

    if (type === "rock") spawnRock(k);
    else if (type === "whirlpool") spawnWhirlpool(k);
    else if (type === "sea_king") spawnSeaKing(k);
}

function spawnRock(k) {
    const size = k.rand(30, 60);
    const y = k.rand(size, GAME.HEIGHT - size);

    const rock = k.add([
        k.polygon([
            k.vec2(0, -size / 2),
            k.vec2(size / 2, -size / 4),
            k.vec2(size / 2, size / 2),
            k.vec2(-size / 2, size / 2),
            k.vec2(-size / 2, -size / 4)
        ]),
        k.color(100, 100, 100),
        k.pos(GAME.WIDTH + size, y),
        k.anchor("center"),
        k.area(),
        k.move(k.LEFT, 80), // Moves slowly
        k.offscreen({ destroy: true }),
        "obstacle",
        "rock",
        { damage: 1 }
    ]);

    // Shadow/detail lines
    rock.add([
        k.polygon([
            k.vec2(0, -size / 2),
            k.vec2(-size / 2, -size / 4),
            k.vec2(0, size / 4)
        ]),
        k.color(80, 80, 80),
        k.pos(0, 0),
    ]);
}

function spawnWhirlpool(k) {
    const radius = k.rand(60, 100);
    const y = k.rand(radius, GAME.HEIGHT - radius);

    const whirlpool = k.add([
        k.circle(radius),
        k.color(20, 80, 150),
        k.opacity(0.6),
        k.pos(GAME.WIDTH + radius, y),
        k.anchor("center"),
        k.area(),
        k.move(k.LEFT, 100),
        k.offscreen({ destroy: true }),
        "obstacle",
        "whirlpool",
        { damage: 1, pullStrength: 150, radius: radius }
    ]);

    // Rotating inner circles to simulate whirlpool effect
    const inner1 = whirlpool.add([
        k.circle(radius * 0.7),
        k.color(15, 60, 120),
        k.opacity(0.8),
        k.anchor("center"),
    ]);

    const inner2 = whirlpool.add([
        k.circle(radius * 0.4),
        k.color(10, 40, 90),
        k.anchor("center"),
    ]);

    // Foam particles
    for (let i = 0; i < 3; i++) {
        whirlpool.add([
            k.circle(k.rand(4, 8)),
            k.color(200, 230, 255),
            k.opacity(0.5),
            k.pos(k.rand(-radius / 2, radius / 2), k.rand(-radius / 2, radius / 2)),
            k.anchor("center"),
        ]);
    }
}

function spawnSeaKing(k) {
    const width = 120;
    const height = 80;
    const y = k.rand(height, GAME.HEIGHT - height);

    const seaKing = k.add([
        k.pos(GAME.WIDTH + width, y),
        k.area({ shape: new k.Rect(k.vec2(0), width, height) }),
        k.anchor("center"),
        k.move(k.LEFT, 150), // Fast moving
        k.offscreen({ destroy: true }),
        "obstacle",
        "sea_king",
        { damage: 2 } // Does 2 damage instead of 1
    ]);

    // Monster Body
    seaKing.add([
        k.circle(height / 2),
        k.color(30, 120, 80), // Sea green
        k.pos(width / 2 - height / 2, 0),
    ]);

    seaKing.add([
        k.rect(width - height / 2, height, { radius: 20 }),
        k.color(30, 120, 80),
        k.pos(-width / 2, -height / 2),
    ]);

    // Eye
    seaKing.add([
        k.circle(10),
        k.color(255, 50, 50),
        k.pos(-width / 4, -10),
    ]);

    // Teeth
    for (let i = 0; i < 4; i++) {
        seaKing.add([
            k.polygon([
                k.vec2(0, 0),
                k.vec2(8, 0),
                k.vec2(4, 15)
            ]),
            k.color(255, 255, 255),
            k.pos(-width / 2 + 10 + i * 10, 15),
        ]);
    }

    // Bobbing animation
    let t = 0;
    seaKing.onUpdate(() => {
        t += k.dt() * 5;
        seaKing.pos.y = y + Math.sin(t) * 15;
    });
}
