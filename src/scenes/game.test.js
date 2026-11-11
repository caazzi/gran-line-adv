import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    player: null,
    bossCallback: null,
    muted: false,
    updateHUD: null,
}));

vi.mock("../entities/player.js", () => ({
    createPlayer: vi.fn(() => mocks.player),
}));

vi.mock("../entities/treasure.js", () => ({ spawnTreasureLoop: vi.fn() }));
vi.mock("../entities/enemy.js", () => ({ spawnEnemyLoop: vi.fn() }));
vi.mock("../entities/obstacle.js", () => ({ spawnObstacleLoop: vi.fn() }));
vi.mock("../entities/boss.js", () => ({
    spawnBoss: vi.fn((k, config, onDefeated) => {
        mocks.bossCallback = onDefeated;
        return { destroy: vi.fn() };
    }),
}));
vi.mock("../systems/collisions.js", () => ({ setupCollisions: vi.fn() }));
vi.mock("../systems/pools.js", () => ({
    initPools: vi.fn(),
    resetAllPools: vi.fn(),
}));
vi.mock("../ui/hud.js", () => ({
    setupHUD: vi.fn(() => mocks.updateHUD),
}));
vi.mock("../systems/audio.js", () => ({
    playLevelBGM: vi.fn(),
    playBossFanfare: vi.fn(),
    playBossDefeatedJingle: vi.fn(),
    toggleMute: vi.fn(() => (mocks.muted = !mocks.muted)),
    isMuted: () => mocks.muted,
}));
vi.mock("../systems/telemetry.js", () => {
    const span = {
        setAttribute: vi.fn(function () { return this; }),
        setAttributes: vi.fn(function () { return this; }),
        end: vi.fn(),
    };
    const level = {
        attributes: { "game.level.id": 1 },
        debug: vi.fn(),
        info: vi.fn(),
        counter: vi.fn(),
        histogram: vi.fn(),
        startSpan: vi.fn(() => span),
        withAttributes: vi.fn(() => level),
    };
    return {
        telemetry: {
            withAttributes: vi.fn(() => level),
            currentSpan: vi.fn(() => span),
            gauge: vi.fn(),
            info: vi.fn(),
            counter: vi.fn(),
            debug: vi.fn(),
        },
    };
});

import { gameScene } from "./game.js";
import { createPlayer } from "../entities/player.js";
import { spawnBoss } from "../entities/boss.js";
import { spawnTreasureLoop } from "../entities/treasure.js";
import { spawnEnemyLoop } from "../entities/enemy.js";
import { spawnObstacleLoop } from "../entities/obstacle.js";
import { setupCollisions } from "../systems/collisions.js";
import { setupHUD } from "../ui/hud.js";
import { initPools, resetAllPools } from "../systems/pools.js";
import {
    playBossFanfare,
    playBossDefeatedJingle,
    playLevelBGM,
    toggleMute,
} from "../systems/audio.js";
import { isPaused, resetPause } from "../systems/pause.js";
import { state } from "../state.js";
import { LEVELS } from "../config.js";
import { makeK } from "../test/kaplay.js";

function startScene() {
    const k = makeK();
    mocks.player = k.add(["player", { lives: 5, exists: () => true }]);
    mocks.updateHUD = vi.fn();
    state.levelIndex = 0;
    state.score = 0;
    resetPause();
    gameScene(k)();
    return k;
}

function triggerBoss(k) {
    k.dtValue = LEVELS[0].duration + 0.1;
    k.runUpdates();
}

describe("game scene", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.player = null;
        mocks.bossCallback = null;
        mocks.muted = false;
        mocks.updateHUD = vi.fn();
        state.reset();
        resetPause();
    });

    it("starts level 1 with its systems, player and HUD wired up", () => {
        const k = startScene();

        expect(createPlayer).toHaveBeenCalledWith(k);
        expect(playLevelBGM).toHaveBeenCalledWith(k, LEVELS[0].id);
        expect(spawnTreasureLoop).toHaveBeenCalledWith(k, LEVELS[0]);
        expect(spawnEnemyLoop).toHaveBeenCalledWith(k, LEVELS[0]);
        expect(spawnObstacleLoop).toHaveBeenCalledWith(k, LEVELS[0]);
        expect(initPools).toHaveBeenCalledWith(k);
        expect(resetAllPools).toHaveBeenCalled();
        expect(setupCollisions).toHaveBeenCalledWith(k, mocks.player, LEVELS[0]);
        expect(setupHUD).toHaveBeenCalledWith(k, mocks.player, LEVELS[0]);
    });

    it("updates the HUD every frame and only spawns the boss at the level duration", () => {
        const k = startScene();
        k.dtValue = LEVELS[0].duration - 1;

        k.runUpdates();

        expect(mocks.updateHUD).toHaveBeenCalledWith(0, false);
        expect(spawnBoss).not.toHaveBeenCalled();

        k.dtValue = 1.01;
        k.runUpdates();

        expect(spawnBoss).toHaveBeenCalledTimes(1);
        expect(playBossFanfare).toHaveBeenCalledWith(k);
        expect(k.shake).toHaveBeenCalledWith(10);
        expect(mocks.updateHUD).toHaveBeenLastCalledWith(LEVELS[0].duration - 1, false);
    });

    it("clears regular enemies and obstacles when the boss arrives", () => {
        const k = startScene();
        const enemy = k.add(["enemy"]);
        const boss = k.add(["enemy", "boss"]);
        const obstacle = k.add(["obstacle"]);

        triggerBoss(k);

        expect(enemy.destroyed).toBe(true);
        expect(obstacle.destroyed).toBe(true);
        expect(boss.destroyed).toBe(false);
    });

    it("grants the boss bonus and moves to the next level on victory", () => {
        const k = startScene();
        triggerBoss(k);
        state.score = 50;

        mocks.bossCallback();

        expect(state.score).toBe(150);
        expect(state.levelIndex).toBe(1);
        expect(playBossDefeatedJingle).toHaveBeenCalledWith(k);

        k.runWaits();
        expect(k.go).toHaveBeenCalledWith("game");
    });

    it("goes to the cutscene after the final boss", () => {
        const k = startScene();
        state.levelIndex = LEVELS.length - 1;
        triggerBoss(k);

        mocks.bossCallback();

        expect(state.levelIndex).toBe(LEVELS.length);
        expect(k.go).toHaveBeenCalledWith("cutscene");
    });

    it("toggles pause, freezes Kaplay and tears the overlay down on resume", () => {
        const k = startScene();
        const before = k.objects.length;

        k.press("p");

        expect(isPaused()).toBe(true);
        expect(k.debug.paused).toBe(true);
        expect(k.objects.length).toBeGreaterThan(before);

        k.press("escape");

        expect(isPaused()).toBe(false);
        expect(k.debug.paused).toBe(false);
        expect(k.objects.filter((obj) => !obj.destroyed)).toHaveLength(before);
    });

    it("toggles mute and refreshes the pause label", () => {
        const k = startScene();
        k.press("p");

        k.press("m");

        expect(toggleMute).toHaveBeenCalledWith(k, { "ui.scene": "game" });
        expect(k.objects.some((obj) => obj.text === "SOM: MUDO")).toBe(true);
    });

    it("restarts a run from any state", () => {
        const k = startScene();
        state.addScore(200);
        k.press("p");

        k.press("r");

        expect(state.score).toBe(0);
        expect(isPaused()).toBe(false);
        expect(k.go).toHaveBeenCalledWith("game");
    });

    it("clears pause state and ends the boss span on scene leave", () => {
        const k = startScene();
        const beforePause = k.objects.length;
        k.press("p");

        k.leaveScene("menu");

        expect(isPaused()).toBe(false);
        expect(k.debug.paused).toBe(false);
        expect(k.objects.filter((obj) => !obj.destroyed)).toHaveLength(beforePause);
    });

    it("thrusts the player upward inside a knock-up stream", () => {
        const k = startScene();
        const stream = k.add(["knock_up_stream", { width: 200, pullStrength: -400 }]);
        stream.pos = { x: 100, y: 300 };
        mocks.player.pos = { x: 100, y: 300 };
        k.dtValue = 0.5;

        k.runUpdates();

        expect(mocks.player.pos.y).toBe(100);
    });
});
