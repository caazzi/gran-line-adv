import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./audio.js", () => ({
    playShootSFX: vi.fn(),
    playExplosionSFX: vi.fn(),
}));

vi.mock("./damage.js", () => ({
    damageEnemy: vi.fn(),
}));

import {
    spawnGaonBullet,
    spawnCoupDeBurst,
    spawnSoldierDockBullets,
    spawnMeraMeraBullets,
    triggerHaoshokuHaki,
    triggerYataNoKagami,
} from "./weapons.js";
import { damageEnemy } from "./damage.js";
import { playExplosionSFX, playShootSFX } from "./audio.js";
import { Pools } from "./pools.js";
import { COUP_DE_BURST, PIKA_PIKA, PLAYER } from "../config.js";
import { makePooledObject } from "../test/factories.js";
import { makeK } from "../test/kaplay.js";

describe("weapon spawning", () => {
    let k;

    beforeEach(() => {
        vi.clearAllMocks();
        k = makeK();
        Pools.gaonBullets = { get: vi.fn(makePooledObject) };
        Pools.soldierBullets = { get: vi.fn(makePooledObject) };
        Pools.meraBullets = { get: vi.fn(makePooledObject) };
        Pools.particles = { get: vi.fn(makePooledObject) };
    });

    it("spawns Gaon Cannon bullets at the player's bow", () => {
        spawnGaonBullet(k, { x: 100, y: 200 });

        const bullet = Pools.gaonBullets.get.mock.results[0].value;
        expect(bullet.pos).toEqual({ x: 100 + PLAYER.WIDTH / 2, y: 200 });
    });

    it("spawns a damaging Coup de Burst projectile that fades out", () => {
        spawnCoupDeBurst(k, { x: 50, y: 300 });
        const burst = k.get("player_bullet")[0];

        expect(burst.is("player_bullet")).toBe(true);
        expect(burst.damage).toBe(COUP_DE_BURST.DAMAGE);
        expect(burst.pos.x).toBe(50 + PLAYER.WIDTH / 2);
        expect(playExplosionSFX).toHaveBeenCalledWith(0.8);

        k.dtValue = 3;
        k.runUpdates();
        expect(burst.destroyed).toBe(true);
    });

    it("fires Soldier Dock bullets in two opposite diagonals", () => {
        const first = makePooledObject();
        const second = makePooledObject();
        Pools.soldierBullets.get
            .mockReturnValueOnce(first)
            .mockReturnValueOnce(second);

        spawnSoldierDockBullets(k, { x: 10, y: 20 });

        expect(first.angle).toBe(-30);
        expect(first.pos).toEqual({ x: 10 + PLAYER.WIDTH / 2, y: 5 });
        expect(second.angle).toBe(30);
        expect(second.pos).toEqual({ x: 10 + PLAYER.WIDTH / 2, y: 35 });
        expect(playShootSFX).toHaveBeenCalledWith(0.4);
    });

    it("fires the Mera Mera three-way spread", () => {
        const bullets = [makePooledObject(), makePooledObject(), makePooledObject()];
        Pools.meraBullets.get
            .mockReturnValueOnce(bullets[0])
            .mockReturnValueOnce(bullets[1])
            .mockReturnValueOnce(bullets[2]);

        spawnMeraMeraBullets(k, { x: 0, y: 0 });

        expect(bullets.map((bullet) => bullet.angle)).toEqual([0, -15, 15]);
        bullets.forEach((bullet) => {
            expect(bullet.pos).toEqual({ x: PLAYER.WIDTH / 2, y: 0 });
        });
    });

    it("Haki damages every non-boss enemy and clears enemy bullets", () => {
        const regular = makeK().add(["enemy"]);
        const boss = makeK().add(["enemy", "boss"]);
        const bullet = makeK().add(["enemy_bullet"]);
        k.get = vi.fn((tag) => {
            if (tag === "enemy") return [regular, boss];
            if (tag === "enemy_bullet") return [bullet];
            return [];
        });

        triggerHaoshokuHaki(k, { pos: { x: 200, y: 200 } });

        expect(damageEnemy).toHaveBeenCalledTimes(1);
        expect(damageEnemy).toHaveBeenCalledWith(
            k,
            regular,
            999,
            expect.objectContaining({ source: "haki" })
        );
        expect(bullet.destroy).toHaveBeenCalled();
        expect(k.shake).toHaveBeenCalledWith(12);
        expect(playExplosionSFX).toHaveBeenCalledWith(0.9, 0.5);
    });

    it("Yata no Kagami dashes right and damages only enemies in the beam", () => {
        const inBeam = makeK().add(["enemy"]);
        inBeam.pos = { x: 200, y: 300 };
        const offAxis = makeK().add(["enemy"]);
        offAxis.pos = { x: 200, y: 400 };
        const behind = makeK().add(["enemy"]);
        behind.pos = { x: 50, y: 300 };
        k.get = vi.fn(() => [inBeam, offAxis, behind]);

        const player = { pos: { x: 100, y: 300 } };
        triggerYataNoKagami(k, player);

        expect(player.pos.x).toBe(550);
        expect(damageEnemy).toHaveBeenCalledTimes(1);
        expect(damageEnemy).toHaveBeenCalledWith(
            k,
            inBeam,
            PIKA_PIKA.DAMAGE,
            expect.objectContaining({ source: "pika_pika" })
        );
        expect(offAxis.destroyed).toBe(false);
        expect(behind.destroyed).toBe(false);
    });

    it("clamps the Yata dash so the player stays on screen", () => {
        k.get = vi.fn(() => []);
        const player = { pos: { x: 700, y: 300 } };

        triggerYataNoKagami(k, player);

        expect(player.pos.x).toBe(800 - PLAYER.WIDTH / 2);
    });
});
