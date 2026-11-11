import { describe, it, expect, beforeEach, vi } from "vitest";
import { spawnBoss } from "./boss.js";
import { Pools } from "../systems/pools.js";
import { GAME, LEVELS } from "../config.js";
import { makePooledObject } from "../test/factories.js";
import { makeK } from "../test/kaplay.js";

function spawn(overrides = {}) {
    const k = makeK(overrides);
    const config = { ...LEVELS[0].boss, ...overrides.bossConfig };
    const onDefeated = vi.fn();
    const boss = spawnBoss(k, config, onDefeated);
    return { k, config, boss, onDefeated };
}

describe("boss lifecycle", () => {
    beforeEach(() => {
        Pools.particles = { get: vi.fn(makePooledObject) };
    });

    it("spawns with its configured stats, name and HP bars", () => {
        const { boss, config } = spawn();

        expect(boss.is("boss")).toBe(true);
        expect(boss.is("enemy")).toBe(true);
        expect(boss.hp).toBe(config.hp);
        expect(boss.maxHp).toBe(config.hp);
        expect(boss.bossName).toBe(config.name);
        expect(boss.phase).toBe("enter");

        const labels = boss.children.filter((child) => child.text === config.name);
        expect(labels).toHaveLength(1);
        const bars = boss.children.filter((child) => child.width === config.width + 20);
        expect(bars).toHaveLength(2);
    });

    it("enters the screen before it starts fighting", () => {
        const { k, boss } = spawn();
        k.dtValue = 1;

        boss.updates[0].callback();
        expect(boss.pos.x).toBe(GAME.WIDTH + 50 - 120);
        expect(boss.phase).toBe("enter");

        boss.updates[0].callback();
        expect(boss.pos.x).toBeLessThanOrEqual(GAME.WIDTH - 100);
        expect(boss.phase).toBe("fight");
    });

    it("oscillates vertically and reflects at the screen edges", () => {
        const { k, boss } = spawn();
        boss.phase = "fight";
        boss.pos.y = GAME.HEIGHT - 39;
        boss.moveDir = 1;
        k.dtValue = 1;

        boss.updates[0].callback();

        expect(boss.moveDir).toBe(-1);

        boss.pos.y = 39;
        boss.moveDir = -1;
        boss.updates[0].callback();
        expect(boss.moveDir).toBe(1);
    });

    it("keeps the HP bar in sync with damage", () => {
        const { boss, config } = spawn();
        const fill = boss.children.find((child) => child.color?.[0] === 220);
        boss.phase = "fight";
        boss.hp = config.hp / 2;

        boss.updates[0].callback();

        expect(fill.width).toBeCloseTo((config.width + 20) / 2);
    });

    it("cycles attacks on the base timer", () => {
        const { k, boss, config } = spawn({ bossConfig: { attacks: ["charge"] } });
        boss.phase = "fight";
        boss.attackTimer = 0.01;
        k.dtValue = 0.02;

        boss.updates[0].callback();

        expect(boss.patternIndex).toBe(1);
        expect(boss.attackTimer).toBe(config.baseAttackTimer);
        expect(k.tweens).toHaveLength(1);
    });

    it("switches to enrage attacks and timers below the threshold", () => {
        const config = {
            ...LEVELS[0].boss,
            hp: 10,
            enrageThreshold: 0.3,
            enrageAttacks: ["spread"],
            enrageAttackTimer: 0.75,
        };
        const k = makeK();
        const boss = spawnBoss(k, config, vi.fn());
        boss.phase = "fight";
        boss.hp = 2;
        boss.attackTimer = 0.01;
        k.dtValue = 0.02;
        Pools.enemyBullets = { get: vi.fn(makePooledObject) };

        boss.updates[0].callback();

        expect(boss._enraged).toBe(true);
        expect(k.shake).toHaveBeenCalledWith(8);
        expect(boss.attackTimer).toBe(0.75);
        expect(Pools.enemyBullets.get).toHaveBeenCalledTimes(5);
    });

    it("explodes, destroys itself and invokes the defeat callback", () => {
        const { k, boss, onDefeated } = spawn();
        boss.phase = "fight";
        boss.attackTimer = 10;
        boss.hp = 0;

        boss.updates[0].callback();

        expect(Pools.particles.get).toHaveBeenCalledTimes(8);
        expect(boss.destroyed).toBe(true);
        expect(onDefeated).toHaveBeenCalledTimes(1);
        expect(k.shake).toHaveBeenCalledWith(12);
    });

    it("spawns smoke walls for Smoker's special", () => {
        const { k, boss } = spawn({ bossConfig: { attacks: ["smoke_wave"] } });
        boss.phase = "fight";
        boss.attackTimer = 0.01;
        k.dtValue = 0.02;

        boss.updates[0].callback();

        expect(k.get("enemy_bullet")).toHaveLength(1);
    });

    it("spawns six staggered ice crystal pairs for Aokiji's special", () => {
        const { k, boss } = spawn({ bossConfig: { attacks: ["ice_age"] } });
        boss.phase = "fight";
        boss.attackTimer = 0.01;
        k.dtValue = 0.02;

        boss.updates[0].callback();
        k.runWaits();

        expect(k.get("enemy_bullet")).toHaveLength(12);
    });
});
