// ============================================
// Audio Manager — Centralized Sound System
// Handles per-level BGM, per-fruit SFX,
// boss fanfare, and victory jingle.
// ============================================

// BGM configuration per level (uses pitch/speed variants of base BGM)
const LEVEL_BGM = {
    1: { speed: 1.0, volume: 0.15 },    // East Blue: calm, normal tempo
    2: { speed: 1.1, volume: 0.18 },    // Loguetown: slightly faster, tenser
    3: { speed: 1.25, volume: 0.20 },   // Grand Line: fast, intense
};

// SFX per Akuma no Mi fruit (uses pitch variants of coin.wav)
const FRUIT_SFX = {
    akuma: { speed: 0.7, volume: 0.8 },   // Deep mystical tone (Soldier Dock)
    mera_mera: { speed: 1.3, volume: 0.9 },   // High crackling fire
    bari_bari: { speed: 0.5, volume: 0.7 },   // Low resonant barrier hum
    pika_pika: { speed: 2.0, volume: 1.0 },   // Ultra-high light zap
};

let currentBgm = null;

/**
 * Play the level-appropriate BGM
 * @param {import("kaplay").KaplayCtx} k
 * @param {number} levelId
 */
export function playLevelBGM(k, levelId) {
    const cfg = LEVEL_BGM[levelId] || LEVEL_BGM[1];
    // Stop any existing BGM
    if (currentBgm) {
        currentBgm.stop();
        currentBgm = null;
    }
    currentBgm = k.play("bgm", {
        loop: true,
        volume: cfg.volume,
        speed: cfg.speed,
    });
}

/**
 * Stop the current BGM
 */
export function stopBGM() {
    if (currentBgm) {
        currentBgm.stop();
        currentBgm = null;
    }
}

/**
 * Play the SFX for collecting a specific Akuma no Mi
 * @param {import("kaplay").KaplayCtx} k
 * @param {string} fruitTag — "akuma", "mera_mera", "bari_bari", "pika_pika"
 */
export function playFruitSFX(k, fruitTag) {
    const cfg = FRUIT_SFX[fruitTag];
    if (cfg) {
        // Layer 1: deep "power up" explosion
        k.play("explosion", { volume: 0.3, speed: 0.4 });
        // Layer 2: unique pitch coin chime per fruit
        k.play("coin", { volume: cfg.volume, speed: cfg.speed });
    } else {
        // Regular coin
        k.play("coin", { volume: 0.5 });
    }
}

/**
 * Play boss entrance fanfare — dramatic low rumble + multi-layered explosion
 * @param {import("kaplay").KaplayCtx} k
 */
export function playBossFanfare(k) {
    // Deep rumble
    k.play("explosion", { volume: 0.9, speed: 0.3 });
    // Staggered higher impacts for dramatic effect
    k.wait(0.3, () => k.play("explosion", { volume: 0.6, speed: 0.5 }));
    k.wait(0.6, () => k.play("explosion", { volume: 0.4, speed: 0.7 }));
}

/**
 * Play victory jingle — bright ascending chime sequence
 * @param {import("kaplay").KaplayCtx} k
 */
export function playVictoryJingle(k) {
    // Ascending coin chimes (musical scale effect)
    k.play("coin", { volume: 0.7, speed: 0.8 });
    k.wait(0.15, () => k.play("coin", { volume: 0.8, speed: 1.0 }));
    k.wait(0.30, () => k.play("coin", { volume: 0.9, speed: 1.2 }));
    k.wait(0.45, () => k.play("coin", { volume: 1.0, speed: 1.5 }));
    k.wait(0.60, () => k.play("coin", { volume: 1.0, speed: 2.0 }));
    // Final triumphant low boom
    k.wait(0.75, () => k.play("explosion", { volume: 0.5, speed: 0.6 }));
}

/**
 * Play boss defeated jingle — descending boom + victory chime
 * @param {import("kaplay").KaplayCtx} k
 */
export function playBossDefeatedJingle(k) {
    k.play("explosion", { volume: 1.0, speed: 0.4 });
    k.wait(0.3, () => k.play("explosion", { volume: 0.7, speed: 0.6 }));
    k.wait(0.5, () => k.play("coin", { volume: 0.9, speed: 1.5 }));
    k.wait(0.65, () => k.play("coin", { volume: 1.0, speed: 2.0 }));
}
