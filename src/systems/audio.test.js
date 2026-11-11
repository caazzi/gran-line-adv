import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../utils/zzfx.js", () => ({
    zzfx: vi.fn(),
}));

import {
    isMuted,
    toggleMute,
    playLevelBGM,
    stopBGM,
    playShootSFX,
    playExplosionSFX,
    playHitSFX,
    playCoinSFX,
    playFruitSFX,
    playBossFanfare,
    playVictoryJingle,
    playBossDefeatedJingle,
} from "./audio.js";
import { zzfx } from "../utils/zzfx.js";
import { telemetry } from "./telemetry.js";
import { makeK } from "../test/kaplay.js";

describe("audio", () => {
    let k;

    beforeEach(() => {
        vi.clearAllMocks();
        stopBGM();
        k = makeK();
        k.setVolume(0.7);
        if (isMuted()) toggleMute(k);
        k.setVolume(0.7);
    });

    it("mutes by zeroing volume and restores the saved volume", () => {
        expect(isMuted()).toBe(false);

        expect(toggleMute(k, { "ui.scene": "game" })).toBe(true);
        expect(isMuted()).toBe(true);
        expect(k.getVolume()).toBe(0);

        expect(toggleMute(k)).toBe(false);
        expect(isMuted()).toBe(false);
        expect(k.getVolume()).toBe(0.7);
    });

    it("plays level BGM with per-level speed and volume, replacing the previous track", () => {
        playLevelBGM(k, 2);
        expect(k.play).toHaveBeenCalledWith("bgm", { loop: true, volume: 0.18, speed: 1.1 });
        const firstTrack = k.play.mock.results[0].value;

        playLevelBGM(k, 99);

        expect(firstTrack.stop).toHaveBeenCalled();
        expect(k.play).toHaveBeenLastCalledWith("bgm", { loop: true, volume: 0.15, speed: 1.0 });
    });

    it("reports BGM failures instead of crashing the scene", () => {
        k.play.mockImplementation(() => {
            throw new Error("audio blocked");
        });
        const counter = vi.spyOn(telemetry, "counter");

        expect(() => playLevelBGM(k, 1)).not.toThrow();
        expect(counter).toHaveBeenCalledWith("audio.bgm.failures", 1, { "audio.level": 1 });

        counter.mockRestore();
    });

    it("stops the current track", () => {
        playLevelBGM(k, 1);
        const track = k.play.mock.results[0].value;

        stopBGM();

        expect(track.stop).toHaveBeenCalled();
        expect(() => stopBGM()).not.toThrow();
    });

    it("routes all SFX helpers through zzfx", () => {
        playShootSFX();
        playExplosionSFX();
        playHitSFX();
        playCoinSFX();
        playFruitSFX(k, "mera_mera");

        expect(zzfx).toHaveBeenCalledTimes(6);
        expect(zzfx.mock.calls[0][0]).toBe(1);
    });

    it("adds the extra fruit chord for each fruit type", () => {
        playFruitSFX(k, "akuma");
        playFruitSFX(k, "mera_mera");
        playFruitSFX(k, "bari_bari");
        playFruitSFX(k, "pika_pika");
        playFruitSFX(k, "unknown");

        expect(zzfx).toHaveBeenCalledTimes(9);
    });

    it("schedules fanfare and jingle notes on the scene clock", () => {
        playBossFanfare(k);
        playVictoryJingle(k);
        playBossDefeatedJingle(k);

        expect(k.waits).toHaveLength(2 + 6 + 3);
        k.runWaits();
        expect(zzfx).toHaveBeenCalledTimes(1 + 2 + 6 + 4);
    });
});
