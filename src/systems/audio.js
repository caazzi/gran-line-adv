import { zzfx } from "../utils/zzfx.js";

// BGM is kept as an audio file since ZzFX is strictly for short SFX
const LEVEL_BGM = {
    1: { speed: 1.0, volume: 0.15 },
    2: { speed: 1.1, volume: 0.18 },
    3: { speed: 1.25, volume: 0.20 },
};

let currentBgm = null;

export function playLevelBGM(k, levelId) {
    const cfg = LEVEL_BGM[levelId] || LEVEL_BGM[1];
    if (currentBgm) {
        currentBgm.stop();
        currentBgm = null;
    }
    // Only play if bgm is loaded, fail gracefully if missing
    try {
        currentBgm = k.play("bgm", { loop: true, volume: cfg.volume, speed: cfg.speed });
    } catch (e) { }
}

export function stopBGM() {
    if (currentBgm) {
        currentBgm.stop();
        currentBgm = null;
    }
}

// ZzFX procedural sound effects
export function playShootSFX(volume = 1, pitchMult = 1) {
    // Crisp retro laser/shoot
    zzfx(volume, ...[, 150 * pitchMult, .05, , .05, , 1.3, , , , , , 15, , , , , 1]);
}

export function playExplosionSFX(volume = 1, pitchMult = 1) {
    // Deep retro boom
    zzfx(volume, ...[, 100 * pitchMult, , .2, .4, 1, 1.5, 1, , , , .1, , .5, , .05]);
}

export function playHitSFX(volume = 1) {
    // Light hit sound
    zzfx(volume, ...[, 300, , , .1, 4, 1.5, , , , , , .5, , .5]);
}

export function playCoinSFX(volume = 1) {
    // Classic 8-bit coin chime
    zzfx(volume, ...[, 1600, , .05, .1, , 1.5, , , 250, .05, , , , , , .5]);
}

export function playFruitSFX(k, fruitTag) {
    // Power-up chord
    zzfx(1, ...[, 400, , , .2, 1, 2, , , 250, .1, , , .1, , .5]);

    // Slight variation per fruit type
    switch (fruitTag) {
        case "akuma": zzfx(0.8, ...[, 300, , , .2, 1, 2, , , 250, .1, , , .1, , .5]); break;
        case "mera_mera": zzfx(0.8, ...[, 500, , , .2, 1, 2, , , 250, .1, , , .1, , .5]); break;
        case "bari_bari": zzfx(0.8, ...[, 200, , , .2, 1, 2, , , 250, .1, , , .1, , .5]); break;
        case "pika_pika": zzfx(1.0, ...[, 800, , , .2, 1, 2, , , 250, .1, , , .1, , .5]); break;
    }
}

export function playBossFanfare(k) {
    // Dramatic low rumbles
    zzfx(1, ...[, 50, , .5, .8, 2, 1.5, 1, , , , .1, , .5, , .05]);
    k.wait(0.3, () => zzfx(0.8, ...[, 60, , .4, .6, 2, 1.5, 1, , , , .1, , .5, , .05]));
    k.wait(0.6, () => zzfx(0.6, ...[, 70, , .3, .5, 2, 1.5, 1, , , , .1, , .5, , .05]));
}

export function playVictoryJingle(k) {
    // Triumphant ascending arpeggio
    k.wait(0.00, () => zzfx(0.7, ...[, 400, , .05, .1, , 1.5, , , 250, .05, , , , , , .5]));
    k.wait(0.15, () => zzfx(0.8, ...[, 500, , .05, .1, , 1.5, , , 250, .05, , , , , , .5]));
    k.wait(0.30, () => zzfx(0.9, ...[, 600, , .05, .1, , 1.5, , , 250, .05, , , , , , .5]));
    k.wait(0.45, () => zzfx(1.0, ...[, 800, , .1, .2, , 1.5, , , 250, .05, , , , , , .5]));
    k.wait(0.60, () => zzfx(1.0, ...[, 1200, , .2, .4, , 2.0, , , 250, .05, , , , , , .5]));
    k.wait(0.85, () => zzfx(0.8, ...[, 100, , .4, .6, 2, 1.5, 1, , , , .1, , .5, , .05]));
}

export function playBossDefeatedJingle(k) {
    // Huge explosion + chime
    zzfx(1, ...[, 80, , .5, 1, 2, 1.5, 1, , , , .1, , .5, , .05]);
    k.wait(0.3, () => zzfx(0.7, ...[, 120, , .3, .6, 2, 1.5, 1, , , , .1, , .5, , .05]));
    k.wait(0.5, () => zzfx(0.9, ...[, 800, , .1, .2, , 2.0, , , 250, .05, , , , , , .5]));
    k.wait(0.65, () => zzfx(1.0, ...[, 1200, , .2, .4, , 3.0, , , 250, .05, , , , , , .5]));
}
