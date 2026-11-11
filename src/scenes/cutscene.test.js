import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../systems/audio.js", () => ({ stopBGM: vi.fn() }));
vi.mock("../systems/telemetry.js", () => ({
    telemetry: {
        info: vi.fn(),
        counter: vi.fn(),
        gauge: vi.fn(),
    },
}));

import { cutsceneScene } from "./cutscene.js";
import { stopBGM } from "../systems/audio.js";
import { telemetry } from "../systems/telemetry.js";
import { state } from "../state.js";
import { makeK } from "../test/kaplay.js";

describe("victory cutscene", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.reset();
    });

    it("stops the BGM, records the cutscene and renders the ocean", () => {
        const k = makeK();
        cutsceneScene(k)();

        expect(stopBGM).toHaveBeenCalled();
        expect(telemetry.counter).toHaveBeenCalledWith("game.cutscene.started");
        expect(k.objects.some((obj) => obj.spriteName === "ocean")).toBe(true);
        expect(k.objects.some((obj) => obj.spriteName === "sunny")).toBe(true);
        expect(k.objects.some((obj) => obj.text === "Press Enter to Skip")).toBe(true);
    });

    it("scrolls and wraps the ocean background", () => {
        const k = makeK();
        cutsceneScene(k)();
        const ocean = k.objects.find((obj) => obj.spriteName === "ocean");
        ocean.pos.x = -1601;
        k.dtValue = 1;

        ocean.updates[0].callback();

        expect(ocean.pos.x).toBe(-800);
    });

    it("skips straight to the victory scene with Enter", () => {
        const k = makeK();
        cutsceneScene(k)();

        k.press("enter");

        expect(k.go).toHaveBeenCalledWith("victory");
    });

    it("plays the full chest reveal before going to victory", () => {
        const k = makeK();
        k.autoRunTweens = true;
        cutsceneScene(k)();

        k.runWaits();
        expect(k.shake).toHaveBeenCalledWith(20);
        const chest = k.objects.find((obj) => obj.spriteName === "chest");
        expect(chest).toBeDefined();
        expect(chest.play).toHaveBeenCalledWith("open");

        k.runWaits();
        expect(k.go).toHaveBeenCalledWith("victory");
    });
});
