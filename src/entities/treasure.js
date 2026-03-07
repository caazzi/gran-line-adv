// ============================================
// Treasures — Coins & Akuma no Mi
// ============================================
import { TREASURE, GAME } from "../config.js";

export function spawnTreasureLoop(k, levelMult = 1) {
    const [minInterval, maxInterval] = TREASURE.SPAWN_INTERVAL;

    function scheduleNext() {
        const delay = k.rand(minInterval, maxInterval) / levelMult;
        k.wait(delay, () => {
            spawnTreasure(k);
            scheduleNext();
        });
    }

    scheduleNext();
}

function spawnTreasure(k) {
    const isAkuma = k.rand() < 0.15; // 15% chance for Akuma no Mi
    const config = isAkuma ? TREASURE.AKUMA : TREASURE.COIN;
    const y = k.rand(30, GAME.HEIGHT - 30);
    const spriteName = isAkuma ? "akuma" : "coin";

    const treasure = k.add([
        k.sprite(spriteName),
        k.scale((config.SIZE * GAME.TREASURE_SCALE) / GAME.SPRITE_BASE_RES),
        k.pos(GAME.WIDTH + 20, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), GAME.SPRITE_BASE_RES, GAME.SPRITE_BASE_RES) }),
        k.move(k.LEFT, TREASURE.SPEED),
        k.offscreen({ destroy: true }),
        isAkuma ? "akuma" : "coin",
        "treasure",
        { points: config.POINTS },
    ]);

    if (isAkuma) {
        // Pulsing glow effect
        let t = 0;
        treasure.onUpdate(() => {
            t += k.dt() * 4;
            treasure.opacity = 0.8 + Math.sin(t) * 0.2;
        });
    }

    return treasure;
}
