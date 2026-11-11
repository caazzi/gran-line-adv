import { describe, it, expect, beforeEach, vi } from "vitest";
import { spawnEnemyLoop } from "./enemy.js";
import { Pools } from "../systems/pools.js";
import { ENEMY, GAME } from "../config.js";
import { makePooledObject } from "../test/factories.js";
import { makeK } from "../test/kaplay.js";

describe("enemy spawning", () => {
    beforeEach(() => {
        Pools.enemyBullets = { get: vi.fn(makePooledObject) };
    });

    it("schedules enemies at a level-scaled interval", () => {
        const k = makeK();
        spawnEnemyLoop(k, { enemySpawnMult: 2 });

        expect(k.waits[0].time).toBeCloseTo((ENEMY.SPAWN_INTERVAL[0] + ENEMY.SPAWN_INTERVAL[1]) / 4);
    });

    it("spawns enemies with scaled HP and fire rate", () => {
        const k = makeK();
        spawnEnemyLoop(k, {
            enemySpawnMult: 1,
            enemyHpMult: 1.5,
            enemyFireRateMult: 0.8,
        });

        k.runWaits();
        const enemy = k.get("enemy")[0];

        expect(enemy).toBeDefined();
        expect(enemy.is("harmful")).toBe(true);
        expect(enemy.hp).toBe(Math.ceil(ENEMY.HP * 1.5));
        expect(enemy.fireTimer).toBeCloseTo((0.5 + ENEMY.FIRE_RATE * 0.8) / 2, 5);
        expect(enemy.pos).toEqual({ x: GAME.WIDTH + 30, y: (40 + GAME.HEIGHT - 40) / 2 });
        expect(k.waits.filter((entry) => !entry.done)).toHaveLength(1);
    });

    it("falls back to base stats when level multipliers are missing", () => {
        const k = makeK();
        spawnEnemyLoop(k, {});
        k.runWaits();

        const enemy = k.get("enemy")[0];
        expect(enemy.hp).toBe(ENEMY.HP);
        expect(enemy.fireTimer).toBeCloseTo((0.5 + ENEMY.FIRE_RATE) / 2);
    });

    it("fires pooled bullets from the enemy's bow on a timer", () => {
        const k = makeK();
        spawnEnemyLoop(k, {});
        k.runWaits();
        const enemy = k.get("enemy")[0];
        enemy.fireTimer = 0.01;
        k.dtValue = 0.02;

        enemy.updates[0].callback();

        expect(Pools.enemyBullets.get).toHaveBeenCalledTimes(1);
        expect(Pools.enemyBullets.get.mock.results[0].value.pos).toEqual({
            x: GAME.WIDTH + 30 - ENEMY.WIDTH / 2,
            y: enemy.pos.y,
        });
        expect(enemy.fireTimer).toBeCloseTo(ENEMY.FIRE_RATE);
    });
});
