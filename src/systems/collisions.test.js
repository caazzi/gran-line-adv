import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./audio.js", () => ({
    playFruitSFX: vi.fn(),
    playExplosionSFX: vi.fn(),
}));

vi.mock("./damage.js", () => ({
    damageEnemy: vi.fn(),
}));

import { setupCollisions } from "./collisions.js";
import { damageEnemy } from "./damage.js";
import { playExplosionSFX, playFruitSFX } from "./audio.js";
import { Pools } from "./pools.js";
import { state } from "../state.js";
import { makeK } from "../test/kaplay.js";

function makePlayer(k, overrides = {}) {
    const player = k.add(["player"]);
    Object.assign(player, {
        lives: 5,
        invincible: false,
        bariBariActive: false,
        pikaPikaActive: false,
        ...overrides,
    });
    return player;
}

function makeTreasure(k, tags, points = 10) {
    return k.add(["treasure", ...tags, { points, isCollected: false }]);
}

function setup(overrides = {}) {
    const k = makeK();
    const player = makePlayer(k, overrides.player);
    setupCollisions(k, player, { id: 1 });
    return { k, player };
}

describe("collision handlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.reset();
        Pools.particles = {
            get: vi.fn(() => ({
                pos: { x: 0, y: 0 },
                scale: { x: 1, y: 1 },
                opacity: 1,
                color: null,
                velX: 0,
                velY: 0,
                shrinkRate: 0,
            })),
        };
    });

    it("collects a coin once and destroys it after its open animation", () => {
        const { k } = setup();
        const coin = makeTreasure(k, ["coin"], 30);

        k.triggerCollide("player", "treasure", k.get("player")[0], coin);

        expect(coin.isCollected).toBe(true);
        expect(state.score).toBe(30);
        expect(coin.play).toHaveBeenCalledWith("open");
        expect(coin.is("move")).toBe(false);

        // The coin plays its opening animation before disappearing.
        expect(coin.destroyed).toBe(false);
        k.runWaits();
        expect(coin.destroyed).toBe(true);

        // A second overlap must not award score again.
        k.triggerCollide("player", "treasure", k.get("player")[0], coin);
        expect(state.score).toBe(30);
    });

    it("applies the Mera Mera timer and fires its collect sound", () => {
        const { k, player } = setup();
        const fruit = makeTreasure(k, ["mera_mera"], 100);

        k.triggerCollide("player", "treasure", player, fruit);

        expect(player.meraMeraActive).toBe(true);
        expect(player.meraMeraTimer).toBe(12);
        expect(player.meraMeraFireTimer).toBe(0);
        expect(playFruitSFX).toHaveBeenCalledWith(k, "mera_mera");
        expect(fruit.destroyed).toBe(true);
    });

    it("applies the Bari Bari shield and removes it when the timer ends", () => {
        const { k, player } = setup();
        const fruit = makeTreasure(k, ["bari_bari"], 100);

        k.triggerCollide("player", "treasure", player, fruit);

        expect(player.bariBariActive).toBe(true);
        expect(player.bariBariTimer).toBe(15);
        const shield = player.children.find((child) => child.radius === 74);
        expect(shield).toBeDefined();

        player.bariBariActive = false;
        k.runUpdates();
        expect(shield.destroyed).toBe(true);
    });

    it("applies the Pika Pika dash timers", () => {
        const { k, player } = setup();
        const fruit = makeTreasure(k, ["pika_pika"], 500);

        k.triggerCollide("player", "treasure", player, fruit);

        expect(player.pikaPikaActive).toBe(true);
        expect(player.pikaPikaTimer).toBe(10);
        expect(player.pikaPikaCooldown).toBe(0);
    });

    it("activates Soldier Dock for a generic Akuma no Mi", () => {
        const { k, player } = setup();
        const fruit = makeTreasure(k, ["akuma"], 50);

        k.triggerCollide("player", "treasure", player, fruit);

        expect(player.soldierDockActive).toBe(true);
        expect(player.soldierDockTimer).toBe(10);
        expect(player.soldierDockFireTimer).toBe(0);
    });

    it("passes bullet damage to the shared damage system", () => {
        const { k } = setup();
        const bullet = k.add(["player_bullet", { damage: 3 }]);
        const enemy = k.add(["enemy"]);

        k.triggerCollide("player_bullet", "enemy", bullet, enemy);

        expect(damageEnemy).toHaveBeenCalledWith(
            k,
            enemy,
            3,
            expect.objectContaining({ source: "bullet" })
        );
        expect(bullet.destroy).toHaveBeenCalled();
    });

    it("damages the player, grants i-frames and destroys the harmful object", () => {
        const { k, player } = setup();
        const rock = k.add(["harmful", { damage: 2 }]);

        k.triggerCollide("harmful", "player", rock, player);

        expect(player.lives).toBe(3);
        expect(player.invincible).toBe(true);
        expect(rock.destroyed).toBe(true);
        expect(playExplosionSFX).toHaveBeenCalledWith(0.4);
        expect(k.shake).toHaveBeenCalledWith(4);

        k.runWaits();
        expect(player.invincible).toBe(false);
        expect(player.opacity).toBe(1);
    });

    it("ignores damage while invincible, shielded or in light form", () => {
        for (const overrides of [
            { invincible: true },
            { bariBariActive: true },
            { pikaPikaActive: true },
        ]) {
            const { k, player } = setup({ player: overrides });
            const rock = k.add(["harmful", { damage: 2 }]);

            k.triggerCollide("harmful", "player", rock, player);

            expect(player.lives).toBe(5);
            expect(rock.destroyed).toBe(true);
        }
    });

    it("does not let knock-up streams or boss bodies deal contact damage", () => {
        for (const tags of [["harmful", "knock_up_stream"], ["harmful", "boss"]]) {
            const { k, player } = setup();
            const harmful = k.add(tags);

            k.triggerCollide("harmful", "player", harmful, player);

            expect(player.lives).toBe(5);
            expect(harmful.destroyed).toBe(false);
        }
    });

    it("ends the run when the last life is lost", () => {
        const { k, player } = setup({ player: { lives: 1 } });
        const rock = k.add(["harmful", { damage: 1 }]);

        k.triggerCollide("harmful", "player", rock, player);

        expect(player.lives).toBe(0);
        expect(k.go).toHaveBeenCalledWith("gameOver", { level: 1 });
    });
});
