import { describe, it, expect, beforeEach } from "vitest";
import { initPools, resetAllPools, Pools } from "./pools.js";
import { GAME, GAON_CANNON, MERA_MERA, SOLDIER_DOCK, ENEMY } from "../config.js";
import { makeK } from "../test/kaplay.js";

describe("object pools", () => {
    let k;

    beforeEach(() => {
        k = makeK();
        initPools(k);
    });

    it("initializes every pool with its bounded capacity", () => {
        expect(Pools.particles.size()).toBe(50);
        expect(Pools.gaonBullets.size()).toBe(10);
        expect(Pools.meraBullets.size()).toBe(30);
        expect(Pools.soldierBullets.size()).toBe(20);
        expect(Pools.enemyBullets.size()).toBe(30);
    });

    it("builds bullets with the damage and tags from config", () => {
        const gaon = Pools.gaonBullets.getAll()[0];
        expect(gaon.is("player_bullet")).toBe(true);
        expect(gaon.damage).toBe(GAON_CANNON.DAMAGE);

        const mera = Pools.meraBullets.getAll()[0];
        expect(mera.damage).toBe(MERA_MERA.DAMAGE);

        const soldier = Pools.soldierBullets.getAll()[0];
        expect(soldier.damage).toBe(SOLDIER_DOCK.DAMAGE);

        const enemy = Pools.enemyBullets.getAll()[0];
        expect(enemy.is("enemy_bullet")).toBe(true);
        expect(enemy.is("harmful")).toBe(true);
        expect(enemy.damage).toBe(ENEMY.BULLET_DAMAGE);
    });

    it("recycles bullets that leave the screen", () => {
        const bullet = Pools.gaonBullets.get();
        bullet.pos.x = GAME.WIDTH - 10;
        bullet.pos.y = 100;
        k.dtValue = 1;

        k.runUpdates();

        expect(bullet.hidden).toBe(true);
        expect(Pools.gaonBullets.activeCount()).toBe(0);
    });

    it("moves straight bullets and angled bullets differently", () => {
        const straight = Pools.gaonBullets.get();
        straight.pos.x = 100;
        straight.pos.y = 100;
        k.dtValue = 0.1;
        k.runUpdates();
        expect(straight.pos.x).toBeCloseTo(100 + GAON_CANNON.SPEED * 0.1);

        const angled = Pools.soldierBullets.get();
        angled.pos.x = 100;
        angled.pos.y = 100;
        angled.angle = 30;
        k.runUpdates();
        expect(angled.pos.x).toBeGreaterThan(100);
        expect(angled.pos.y).toBeGreaterThan(100);
    });

    it("moves enemy bullets left unless they have a spread angle", () => {
        const standard = Pools.enemyBullets.get();
        standard.pos.x = 300;
        standard.pos.y = 100;
        k.dtValue = 0.1;
        k.runUpdates();
        expect(standard.pos.x).toBeCloseTo(300 - ENEMY.BULLET_SPEED * 0.1);

        const spread = Pools.enemyBullets.get();
        spread.pos.x = 300;
        spread.pos.y = 100;
        spread._spreadAngle = 150;
        spread._spreadSpeed = 200;
        k.runUpdates();
        expect(spread.pos.x).toBeLessThan(300);
    });

    it("fades particles and recycles them", () => {
        const particle = Pools.particles.get();
        particle.opacity = 0.01;
        particle.shrinkRate = 2;
        particle.velX = 60;
        particle.velY = -60;
        particle.pos.x = 10;
        particle.pos.y = 10;
        k.dtValue = 0.1;

        k.runUpdates();

        expect(particle.hidden).toBe(true);
        expect(particle.pos).toEqual({ x: -9999, y: -9999 });
    });

    it("resets active objects on scene transitions", () => {
        const gaon = Pools.gaonBullets.get();
        const enemy = Pools.enemyBullets.get();
        gaon.pos.x = 50;
        enemy.pos.x = 50;

        resetAllPools();

        expect(gaon.hidden).toBe(true);
        expect(enemy.hidden).toBe(true);
        expect(Pools.gaonBullets.activeCount()).toBe(0);
        expect(Pools.enemyBullets.activeCount()).toBe(0);
    });
});
