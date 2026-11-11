import { describe, it, expect, beforeEach, vi } from 'vitest';

// zzfx creates an AudioContext at module load, so stub audio before importing damage.js.
vi.mock("../systems/audio.js", () => ({
    playCoinSFX: vi.fn(),
    playExplosionSFX: vi.fn(),
}));

import { damageEnemy } from "./damage.js";
import { Pools } from "./pools.js";
import { state } from "../state.js";

function makeParticle() {
    return {
        pos: { x: 0, y: 0 },
        color: null,
        opacity: 1,
        scale: { x: 1, y: 1 },
        velX: 0,
        velY: 0,
        shrinkRate: 1,
    };
}

function makeK() {
    return {
        Color: { fromArray: (arr) => ({ color: arr }) },
        UP: { x: 0, y: -1 },
        wait: (time, cb) => cb(),
        rand: (min, max) => (min + max) / 2,
        dt: () => 1 / 60,
        time: () => 0,
        shake: () => { },
        add: vi.fn(() => ({
            opacity: 1,
            pos: { x: 0, y: 0 },
            onUpdate: vi.fn(),
            destroy: vi.fn(),
        })),
        text: (text) => ({ text }),
        color: (...args) => ({ color: args }),
        pos: (x, y) => ({ x, y }),
        anchor: () => ({}),
        z: () => ({}),
        move: () => ({}),
        scale: () => ({}),
        opacity: () => ({}),
        circle: () => ({}),
        rect: () => ({}),
        lifespan: () => ({}),
    };
}

function makeEnemy({ hp = 1, boss = false } = {}) {
    let destroyed = false;
    const enemy = {
        hp,
        dead: false,
        pos: { x: 100, y: 100 },
        color: null,
        bossColor: boss ? [255, 100, 150] : undefined,
        is: (tag) => (tag === "boss" ? boss : false),
        exists: () => !destroyed,
        destroy: vi.fn(() => { destroyed = true; }),
    };
    return enemy;
}

describe('damageEnemy', () => {
    let k;

    beforeEach(() => {
        state.reset();
        k = makeK();
        Pools.particles = { get: vi.fn(makeParticle) };
    });

    it('kills a non-boss enemy and awards score exactly once', () => {
        const enemy = makeEnemy({ hp: 1 });

        damageEnemy(k, enemy, 1, {});

        expect(enemy.dead).toBe(true);
        expect(enemy.hp).toBe(0);
        expect(state.score).toBe(20);
        expect(enemy.destroy).toHaveBeenCalledTimes(1);

        // A second hit on the dead enemy must not award again.
        damageEnemy(k, enemy, 1, {});
        expect(state.score).toBe(20);
        expect(enemy.destroy).toHaveBeenCalledTimes(1);
    });

    it('leaves boss death to boss.js', () => {
        const enemy = makeEnemy({ hp: 1, boss: true });

        damageEnemy(k, enemy, 5, {});

        expect(enemy.hp).toBe(-4);
        expect(enemy.dead).toBe(false);
        expect(enemy.destroy).not.toHaveBeenCalled();
        expect(state.score).toBe(0);
    });
});
