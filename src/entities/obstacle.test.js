import { describe, it, expect, vi } from "vitest";
import { spawnObstacleLoop } from "./obstacle.js";
import { GAME } from "../config.js";
import { makeK } from "../test/kaplay.js";

function spawnOne(type, randValues = []) {
    const rand = vi.fn();
    randValues.forEach((value) => rand.mockReturnValueOnce(value));
    rand.mockImplementation((min = 0, max) => {
        if (max === undefined) return 0.5;
        return (min + max) / 2;
    });
    const k = makeK({ rand, choose: () => type });
    spawnObstacleLoop(k, { obstacles: [type], obstacleSpawnMult: 1 });
    k.runWaits();
    return k;
}

describe("obstacle spawning", () => {
    it("does nothing when a level has no obstacle types", () => {
        const k = makeK();
        spawnObstacleLoop(k, {});
        expect(k.waits).toHaveLength(0);
    });

    it("schedules obstacles faster on higher levels", () => {
        const k = makeK();
        spawnObstacleLoop(k, { obstacles: ["rock"], obstacleSpawnMult: 2 });
        expect(k.waits[0].time).toBeCloseTo(4.5 / 2);
    });

    it("spawns a damaging rock at a random size and height", () => {
        const k = spawnOne("rock", [0, 200, 300]);
        const rock = k.get("obstacle")[0];

        expect(rock.is("rock")).toBe(true);
        expect(rock.is("harmful")).toBe(true);
        expect(rock.damage).toBe(1);
        expect(rock.pos).toEqual({ x: GAME.WIDTH + 200, y: 300 });
        expect(rock.scale).toEqual({ x: 200 / 640, y: 200 / 640 });
    });

    it("spawns a knock-up stream with rising water streaks", () => {
        const k = spawnOne("whirlpool", [0, 120]);
        const stream = k.get("obstacle")[0];

        expect(stream.is("knock_up_stream")).toBe(true);
        expect(stream.pullStrength).toBe(-400);
        expect(stream.children).toHaveLength(15);

        const streak = stream.children[0];
        const startY = streak.pos.y;
        streak.updates[0].callback();
        expect(streak.pos.y).toBeLessThan(startY);
    });

    it("spawns a high-damage Sea King with bobbing behaviour", () => {
        const k = spawnOne("sea_king", [0, 300]);
        const seaKing = k.get("obstacle")[0];

        expect(seaKing.is("sea_king")).toBe(true);
        expect(seaKing.damage).toBe(2);
        expect(seaKing.pos).toEqual({ x: GAME.WIDTH + 300, y: 300 });
        expect(seaKing.id).toBe("bobbing");
    });
});
