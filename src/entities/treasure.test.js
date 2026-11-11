import { describe, it, expect, vi } from "vitest";
import { spawnTreasureLoop } from "./treasure.js";
import { TREASURE } from "../config.js";
import { makeK } from "../test/kaplay.js";

function spawnOne(randValues, levelConfig = {}) {
    const rand = vi.fn();
    randValues.forEach((value) => rand.mockReturnValueOnce(value));
    const k = makeK({ rand });
    spawnTreasureLoop(k, levelConfig);
    k.runWaits();
    return k.get("treasure")[0];
}

describe("treasure spawning", () => {
    it("spawns a level-scaled coin when the fruit roll fails", () => {
        const coin = spawnOne([1, 0.5, 300], { coinValue: 25 });

        expect(coin.is("treasure")).toBe(true);
        expect(coin.is("coin")).toBe(true);
        expect(coin.points).toBe(25);
        expect(coin.pos).toEqual({ x: 820, y: 300 });
        expect(coin.scale).toEqual({ x: (TREASURE.COIN.SIZE * 2) / 320, y: (TREASURE.COIN.SIZE * 2) / 320 });
    });

    it("uses the base coin value when the level has none", () => {
        const coin = spawnOne([1, 0.5, 300]);
        expect(coin.points).toBe(TREASURE.COIN.POINTS);
    });

    it.each([
        [0.05, "pika_pika", TREASURE.PIKA_PIKA.POINTS],
        [0.3, "akuma", TREASURE.AKUMA.POINTS],
        [0.6, "mera_mera", TREASURE.MERA_MERA.POINTS],
        [0.9, "bari_bari", TREASURE.BARI_BARI.POINTS],
    ])("rolls a %.2f fruit roll into %s", (roll, tag, points) => {
        const fruit = spawnOne([1, 0.1, roll, 300]);

        expect(fruit.is("treasure")).toBe(true);
        expect(fruit.is(tag)).toBe(true);
        expect(fruit.points).toBe(points);
    });

    it("tints and pulses Devil Fruits", () => {
        const fruit = spawnOne([1, 0.1, 0.6, 300]);
        const initialOpacity = fruit.opacity;

        fruit.updates[0].callback();

        expect(fruit.color).toBeDefined();
        expect(fruit.opacity).not.toBe(initialOpacity);
    });

    it("scales the spawn interval with the level multiplier", () => {
        const k = makeK();
        spawnTreasureLoop(k, { enemySpawnMult: 2 });

        expect(k.waits[0].time).toBeCloseTo(
            (TREASURE.SPAWN_INTERVAL[0] + TREASURE.SPAWN_INTERVAL[1]) / 4
        );
    });
});
