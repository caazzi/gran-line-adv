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

    if (type === "rock") spawnReverseMountainRock(k);
    else if (type === "whirlpool") spawnKnockUpStream(k);
    else if (type === "sea_king") spawnSeaKing(k);
}

function spawnReverseMountainRock(k) {
    const size = k.rand(70, 110);
    const y = k.rand(size, GAME.HEIGHT - size);

    const rock = k.add([
        k.pos(GAME.WIDTH + size, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(-size * 0.4, -size * 0.4), size * 0.8, size * 0.8) }),
        k.move(k.LEFT, 100),
        k.offscreen({ destroy: true }),
        "obstacle",
        "rock",
        { damage: 1 },
        k.z(10) // stay above water
    ]);

    // Base large rock structure (dark bluish-gray to fit ocean palette)
    rock.add([
        k.polygon([
            k.vec2(0, -size * 0.8),
            k.vec2(size * 0.5, -size * 0.2),
            k.vec2(size * 0.7, size * 0.4),
            k.vec2(size * 0.2, size * 0.6),
            k.vec2(-size * 0.4, size * 0.5),
            k.vec2(-size * 0.6, 0),
            k.vec2(-size * 0.3, -size * 0.5)
        ]),
        k.color(60, 70, 90),
        k.pos(0, 0),
    ]);

    // Mid-layer highlight (creates 3D jagged effect)
    rock.add([
        k.polygon([
            k.vec2(0, -size * 0.7),
            k.vec2(size * 0.3, -size * 0.1),
            k.vec2(size * 0.4, size * 0.3),
            k.vec2(-size * 0.1, size * 0.4),
            k.vec2(-size * 0.3, 0)
        ]),
        k.color(80, 95, 120),
        k.pos(-size * 0.1, 0),
    ]);

    // Jagged snow cap at the top
    rock.add([
        k.polygon([
            k.vec2(0, -size * 0.82),
            k.vec2(size * 0.3, -size * 0.5),
            k.vec2(size * 0.1, -size * 0.4),
            k.vec2(-size * 0.1, -size * 0.45),
            k.vec2(-size * 0.25, -size * 0.55)
        ]),
        k.color(240, 245, 255), // Snow
        k.pos(0, 0),
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
    const width = 140;
    const height = 90;
    const y = k.rand(height, GAME.HEIGHT - height);

    const seaKing = k.add([
        k.pos(GAME.WIDTH + width, y),
        k.area({ shape: new k.Rect(k.vec2(0), width, height) }),
        k.anchor("center"),
        k.move(k.LEFT, 150), // Fast moving
        k.offscreen({ destroy: true }),
        "obstacle",
        "sea_king",
        { damage: 2 }, // Does 2 damage instead of 1
        k.z(20) // Above water
    ]);

    // Back Dorsal Fins (Dark green, jagged)
    for (let i = 0; i < 3; i++) {
        seaKing.add([
            k.polygon([
                k.vec2(0, 0),
                k.vec2(15, -25),
                k.vec2(30, 0)
            ]),
            k.color(15, 80, 50),
            k.pos(-width / 2 + 10 + (i * 35), -height / 2 + 5),
        ]);
    }

    // Main Body Segment (Thick winding snake-like body)
    seaKing.add([
        k.rect(width - 20, height, { radius: 30 }),
        k.color(30, 120, 80), // Sea green
        k.pos(-width / 2, -height / 2),
    ]);

    // Underbelly (Lighter green/yellowish curve)
    seaKing.add([
        k.rect(width - 30, height / 3, { radius: 15 }),
        k.color(100, 180, 110),
        k.pos(-width / 2 + 10, height / 6),
    ]);

    // Head / Snout (Tapered front)
    seaKing.add([
        k.polygon([
            k.vec2(0, -height / 2 + 10),
            k.vec2(-30, -10),
            k.vec2(-40, 20),
            k.vec2(0, height / 2 - 10)
        ]),
        k.color(30, 120, 80),
        k.pos(-width / 2 + 10, 0),
    ]);

    // Angry Red Eye with slit pupil
    const eyeBase = seaKing.add([
        k.circle(12),
        k.color(255, 30, 30),
        k.pos(-width / 2 - 5, -15),
    ]);
    eyeBase.add([
        k.rect(4, 14),
        k.color(0, 0, 0),
        k.anchor("center"),
    ]);

    // Jaw & Sharp Teeth
    seaKing.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(-20, 10),
            k.vec2(-10, 25),
            k.vec2(30, 20)
        ]),
        k.color(20, 90, 60),
        k.pos(-width / 2 - 15, 10),
    ]);

    // Rows of teeth
    for (let i = 0; i < 4; i++) {
        seaKing.add([
            k.polygon([
                k.vec2(0, 0),
                k.vec2(6, 0),
                k.vec2(3, 12)
            ]),
            k.color(255, 255, 240),
            k.pos(-width / 2 - 25 + (i * 12), 15),
            k.rotate(-15)
        ]);
    }

    // Side Fin (flapping animation)
    const sideFin = seaKing.add([
        k.polygon([
            k.vec2(0, 0),
            k.vec2(-20, 20),
            k.vec2(10, 30),
            k.vec2(20, 10)
        ]),
        k.color(20, 100, 70),
        k.pos(-10, 10),
        k.anchor("center")
    ]);

    // Bobbing and swimming animation
    let t = 0;
    seaKing.onUpdate(() => {
        t += k.dt() * 4;
        // Undulating up and down
        seaKing.pos.y = y + Math.sin(t) * 20;
        // Flapping fin
        sideFin.angle = Math.sin(t * 2) * 20;
    });
}
