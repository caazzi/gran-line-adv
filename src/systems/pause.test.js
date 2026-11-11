import { describe, it, expect, beforeEach } from "vitest";
import { pauseState, isPaused, setPaused, resetPause } from "./pause.js";

describe("pause state", () => {
    beforeEach(() => {
        resetPause();
    });

    it("starts inactive", () => {
        expect(pauseState.active).toBe(false);
        expect(isPaused()).toBe(false);
    });

    it("setPaused updates the shared flag", () => {
        expect(setPaused(true)).toBe(true);
        expect(isPaused()).toBe(true);
        expect(setPaused(false)).toBe(false);
        expect(isPaused()).toBe(false);
    });

    it("resetPause clears both the flag and Kaplay's native pause", () => {
        const k = { debug: { paused: false } };
        setPaused(true);
        k.debug.paused = true;

        resetPause(k);

        expect(isPaused()).toBe(false);
        expect(k.debug.paused).toBe(false);
    });

    it("resetPause is safe without a Kaplay context", () => {
        setPaused(true);
        expect(() => resetPause()).not.toThrow();
        expect(isPaused()).toBe(false);
    });
});
