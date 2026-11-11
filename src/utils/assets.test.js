import { describe, it, expect } from "vitest";
import { loadAssets } from "./assets.js";
import { makeK } from "../test/kaplay.js";

describe("loadAssets", () => {
    it("queues fonts, every sprite and the BGM", () => {
        const k = makeK();

        loadAssets(k);

        expect(k.loadFont.mock.calls).toEqual([
            ["Bangers", "fonts/bangers.woff"],
            ["Outfit", "fonts/outfit.woff"],
        ]);

        const sprites = k.loadSprite.mock.calls.map(([name]) => name);
        expect(sprites).toEqual([
            "sunny",
            "marine",
            "ocean",
            "rock",
            "sea_monster",
            "chest",
            "akuma",
            "boss_alvida",
            "boss_smoker",
            "boss_aokiji",
        ]);
        expect(k.loadSound).toHaveBeenCalledWith("bgm", "sounds/bgm.wav");
    });

    it("slices animated sheets and maps every boss to the shared config", () => {
        const k = makeK();

        loadAssets(k);

        const sunny = k.loadSprite.mock.calls.find(([name]) => name === "sunny")[2];
        expect(sunny.sliceX).toBe(2);
        expect(sunny.anims.idle).toEqual({ from: 0, to: 1, speed: 4, loop: true });

        const chest = k.loadSprite.mock.calls.find(([name]) => name === "chest")[2];
        expect(chest.sliceX).toBe(2);
        expect(chest.sliceY).toBe(2);
        expect(chest.anims.open).toEqual({ from: 0, to: 3, speed: 5, loop: false });

        const bosses = k.loadSprite.mock.calls.filter(([name]) => name.startsWith("boss_"));
        expect(bosses).toHaveLength(3);
        bosses.forEach(([, path, config]) => {
            expect(path).toMatch(/^sprites\/boss_.*\.png$/);
            expect(config).toEqual(bosses[0][2]);
        });
    });
});
