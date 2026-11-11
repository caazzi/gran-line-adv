import { describe, it, expect, beforeEach, vi } from 'vitest';

// zzfx creates an AudioContext at module load, so stub audio before importing damage.js.
vi.mock("../systems/audio.js", () => ({
    playCoinSFX: vi.fn(),
    playExplosionSFX: vi.fn(),
}));

import { damageEnemy } from "./damage.js";
import { Pools } from "./pools.js";
import { state } from "../state.js";
import { ENEMY } from "../config.js";
import { makePooledObject } from "../test/factories.js";
import { makeK as makeKaplay } from "../test/kaplay.js";

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
        k = makeKaplay();
        Pools.particles = { get: vi.fn(makePooledObject) };
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

describe('damageEnemy side effects', () => {
    beforeEach(() => {
        state.reset();
        Pools.particles = { get: vi.fn(makePooledObject) };
    });

    it('ignores missing, destroyed and already-dead enemies', () => {
        const k = makeKaplay();
        const dead = { dead: true, hp: 1, exists: () => true, is: () => false };

        expect(() => damageEnemy(k, null, 1, {})).not.toThrow();
        expect(() => damageEnemy(k, { hp: 1, exists: () => false, is: () => false }, 1, {})).not.toThrow();
        damageEnemy(k, dead, 1, {});

        expect(dead.hp).toBe(1);
        expect(state.score).toBe(0);
    });

    it('restores a regular enemy to the shared enemy color after the hit flash', () => {
        const k = makeKaplay();
        const enemy = makeEnemy({ hp: 5 });

        damageEnemy(k, enemy, 1, {});

        expect(enemy.color).toEqual({ color: [255, 255, 255] });
        k.runWaits();
        expect(enemy.color).toEqual({ color: ENEMY.COLOR });
    });

    it('restores a boss to its own color after the hit flash', () => {
        const k = makeKaplay();
        const enemy = makeEnemy({ hp: 5, boss: true });

        damageEnemy(k, enemy, 1, {});
        k.runWaits();

        expect(enemy.color).toEqual({ color: [255, 100, 150] });
    });

    it('heals one life when a kill happens below max lives', () => {
        const k = makeKaplay();
        const player = k.add(['player', { lives: 3 }]);
        const enemy = makeEnemy({ hp: 1 });

        damageEnemy(k, enemy, 1, { player, source: 'haki' });

        expect(player.lives).toBe(4);
        expect(k.objects.some((obj) => obj.text === '+1 ♥')).toBe(true);
    });

    it('does not heal above the maximum life count', () => {
        const k = makeKaplay();
        const player = k.add(['player', { lives: 5 }]);
        const enemy = makeEnemy({ hp: 1 });

        damageEnemy(k, enemy, 1, { player });

        expect(player.lives).toBe(5);
    });

    it('fades and destroys its floating damage text', () => {
        const k = makeKaplay();
        const enemy = makeEnemy({ hp: 5 });

        damageEnemy(k, enemy, 2, {});
        const text = k.objects.find((obj) => obj.text === '2');
        expect(text).toBeDefined();

        k.dtValue = 1;
        k.runUpdates();

        expect(text.destroyed).toBe(true);
    });
});
