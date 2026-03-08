// ============================================
// Treasures — Coins & Akuma no Mi
// ============================================
import { TREASURE, GAME } from "../config.js";

export function spawnTreasureLoop(k, levelConfig = {}) {
    const levelMult = levelConfig.enemySpawnMult || 1;
    const [minInterval, maxInterval] = TREASURE.SPAWN_INTERVAL;

    function scheduleNext() {
        const delay = k.rand(minInterval, maxInterval) / levelMult;
        k.wait(delay, () => {
            spawnTreasure(k, levelConfig);
            scheduleNext();
        });
    }

    scheduleNext();
}

function spawnTreasure(k, levelConfig = {}) {
    const isAkuma = k.rand() < 0.15; // 15% chance for Akuma no Mi
    const coinValue = levelConfig.coinValue || TREASURE.COIN.POINTS;
    const speedMult = levelConfig.treasureSpeedMult || 1;

    let config = { ...TREASURE.COIN, POINTS: coinValue }; // Use level-scaled coin value
    let spriteName = "chest";
    let typeTag = "coin"; // keep logic tag as coin

    if (isAkuma) {
        // Roll for specific fruit (Ultra Rare Pika Pika)
        const roll = k.rand();
        if (roll < 0.10) {
            config = TREASURE.PIKA_PIKA;
            spriteName = "akuma";
            typeTag = "pika_pika";
        } else if (roll < 0.40) {
            config = TREASURE.AKUMA;
            spriteName = "akuma";
            typeTag = "akuma";
        } else if (roll < 0.70) {
            config = TREASURE.MERA_MERA;
            spriteName = "akuma"; // Reuse base sprite but tint later
            typeTag = "mera_mera";
        } else {
            config = TREASURE.BARI_BARI;
            spriteName = "akuma"; // Reuse base sprite but tint later
            typeTag = "bari_bari";
        }
    }

    const y = k.rand(30, GAME.HEIGHT - 30);

    const treasure = k.add([
        k.sprite(spriteName, { anim: "idle" }),
        k.scale((config.SIZE * GAME.TREASURE_SCALE) / 320), // 320 is height of a single frame
        k.pos(GAME.WIDTH + 20, y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), 320, 320) }), // Hitbox based on a single frame length
        k.move(k.LEFT, TREASURE.SPEED * speedMult),
        k.offscreen({ destroy: true }),
        typeTag, // Generic tag will be the specific fruit name
        "treasure",
        { points: config.POINTS },
    ]);

    // Always tint the akuma sprite with the fruit's unique color
    if (isAkuma) {
        treasure.use(k.color(config.COLOR[0], config.COLOR[1], config.COLOR[2]));
    }

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
