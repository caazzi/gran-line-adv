import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    buttons: [],
}));

vi.mock("../ui/components.js", () => ({
    createWoodenButton: vi.fn((k, text, pos, onClick) => {
        const button = { text, onClick };
        mocks.buttons.push(button);
        return button;
    }),
}));
vi.mock("../systems/leaderboard.js", () => ({
    addToLeaderboard: vi.fn(),
    renderLeaderboard: vi.fn(),
}));
vi.mock("../systems/audio.js", () => ({ stopBGM: vi.fn() }));
vi.mock("../systems/runTelemetry.js", () => ({ recordRunEnded: vi.fn() }));

import { gameOverScene } from "./gameOver.js";
import { createWoodenButton } from "../ui/components.js";
import { addToLeaderboard, renderLeaderboard } from "../systems/leaderboard.js";
import { stopBGM } from "../systems/audio.js";
import { recordRunEnded } from "../systems/runTelemetry.js";
import { state } from "../state.js";
import { GAME } from "../config.js";
import { makeK } from "../test/kaplay.js";

function startScene(score = 10) {
    const k = makeK();
    mocks.buttons = [];
    state.score = score;
    state.levelIndex = 1;
    gameOverScene(k)();
    return k;
}

describe("game over scene", () => {
    let storage;

    beforeEach(() => {
        vi.clearAllMocks();
        storage = { getItem: vi.fn(() => null), setItem: vi.fn() };
        vi.stubGlobal("localStorage", storage);
        state.reset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("records the run and auto-saves the score", () => {
        const k = startScene(25);

        expect(stopBGM).toHaveBeenCalled();
        expect(recordRunEnded).toHaveBeenCalledWith("game_over");
        expect(addToLeaderboard).toHaveBeenCalledWith("Pirata", 25);
        expect(renderLeaderboard).toHaveBeenCalledWith(k, GAME.HEIGHT - 180);
    });

    it("stores a new highest bounty and shows the record badge", () => {
        storage.getItem.mockReturnValue("5000");

        const k = startScene(10);

        expect(storage.setItem).toHaveBeenCalledWith("highestBounty", "10000");
        expect(k.objects.some((obj) => obj.text === "NEW RECORD!")).toBe(true);
    });

    it("keeps the existing record when the score is lower", () => {
        storage.getItem.mockReturnValue("50000");

        const k = startScene(10);

        expect(storage.setItem).not.toHaveBeenCalled();
        expect(k.objects.some((obj) => obj.text === "NEW RECORD!")).toBe(false);
    });

    it.each(["enter", "space"])("restarts from the keyboard with %s", (key) => {
        const k = startScene(10);
        state.levelIndex = 2;

        k.press(key);

        expect(state.score).toBe(0);
        expect(state.levelIndex).toBe(0);
        expect(k.go).toHaveBeenCalledWith("game");
    });

    it("wires both wooden buttons", () => {
        const k = startScene(10);
        expect(createWoodenButton).toHaveBeenCalledTimes(2);

        mocks.buttons[0].onClick();
        expect(k.go).toHaveBeenCalledWith("game");

        mocks.buttons[1].onClick();
        expect(k.go).toHaveBeenLastCalledWith("menu");
    });

    it("sinks and fades the ship until it is destroyed", () => {
        const k = startScene(10);
        const ship = k.objects.find((obj) => obj.angle === 15 && obj.width === 60);

        k.dtValue = 10;
        k.runUpdates();

        expect(ship.destroyed).toBe(true);
    });
});
