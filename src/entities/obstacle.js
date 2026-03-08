// ============================================
// Obstacles — Rocks, Whirlpools, Sea Kings
// ============================================
import { Z_LAYERS, GAME } from "../config.js";
import { bobbing } from "../utils/components.js";

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

    if (type === "rock") spawnReverseMountainRock(k);
    else if (type === "whirlpool") spawnKnockUpStream(k);
    else if (type === "sea_king") spawnSeaKing(k);
}

function spawnReverseMountainRock(k) {
    const size = k.rand(160, 260); // Much larger than ships (which are ~100px rendered)
    const y = k.rand(size, GAME.HEIGHT - size);

    const rock = k.add([
        k.sprite("rock"),
        k.scale(size / 640), // Calculate scale down from 640x640 base based on randomized size
        k.pos(GAME.WIDTH + size, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), 640, 640) }), // Area based on base sprite size
        k.move(k.LEFT, 100),
        k.offscreen({ destroy: true }),
        "obstacle",
        "harmful",
        "rock",
        { damage: 1 },
        k.z(Z_LAYERS.EFFECTS) // stay above water
    ]);
}

function spawnKnockUpStream(k) {
    const width = k.rand(100, 180); // Fatter stream
    const height = GAME.HEIGHT;
    const y = GAME.HEIGHT / 2;

    const stream = k.add([
        k.rect(width, height),
        k.color(50, 150, 255), // Rich ocean blue
        k.opacity(0.5),
        k.pos(GAME.WIDTH + width, y),
        k.anchor("center"),
        k.area(),
        k.move(k.LEFT, 150),
        k.offscreen({ destroy: true }),
        "obstacle",
        "harmful",
        "knock_up_stream",
        { pullStrength: -400 } // Even stronger upward pull
    ]);

    // Fast moving, thick rounded water streaks wrapping around
    for (let i = 0; i < 15; i++) {
        const streamPart = stream.add([
            k.rect(k.rand(8, 24), k.rand(50, 150), { radius: 10 }), // Rounded water pillars
            k.color(200, 240, 255),
            k.opacity(k.rand(0.5, 0.9)),
            k.pos(k.rand(-width / 2 + 10, width / 2 - 10), k.rand(-height / 2, height / 2)),
            k.anchor("center"),
            { speedOffset: k.rand(500, 800) } // specific vertical speed
        ]);

        streamPart.onUpdate(() => {
            streamPart.pos.y -= streamPart.speedOffset * k.dt(); // Blast upwards
            if (streamPart.pos.y < -height / 2 - 100) {
                streamPart.pos.y = height / 2 + 100;
                streamPart.pos.x = k.rand(-width / 2 + 10, width / 2 - 10);
            }
        });
    }
}

function spawnSeaKing(k) {
    const size = 300; // Sea Kings are massive
    const y = k.rand(size / 2, GAME.HEIGHT - size / 2);

    const seaKing = k.add([
        k.sprite("sea_monster"),
        k.scale(size / 1024), // Assuming the Nano Banana gen resulted in a 1024x1024 res image
        k.pos(GAME.WIDTH + size, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), 1024, 1024) }),
        k.move(k.LEFT, 150), // Fast moving
        k.offscreen({ destroy: true }),
        "obstacle",
        "harmful",
        "sea_king",
        { damage: 2 }, // Does 2 damage instead of 1
        k.z(Z_LAYERS.ENEMIES), // Above water
        bobbing(20, 4)
    ]);
}
