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
vi.mock("../systems/audio.js", () => ({
    stopBGM: vi.fn(),
    playVictoryJingle: vi.fn(),
}));
vi.mock("../systems/runTelemetry.js", () => ({ recordRunEnded: vi.fn() }));

import { victoryScene } from "./victory.js";
import { addToLeaderboard, renderLeaderboard } from "../systems/leaderboard.js";
import { playVictoryJingle, stopBGM } from "../systems/audio.js";
import { recordRunEnded } from "../systems/runTelemetry.js";
import { state } from "../state.js";
import { GAME } from "../config.js";
import { makeK } from "../test/kaplay.js";

function startScene(score = 10) {
    const k = makeK();
    mocks.buttons = [];
    state.score = score;
    state.levelIndex = 2;
    victoryScene(k)();
    return k;
}

describe("victory scene", () => {
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

    it("records the run, plays the jingle and saves the score", () => {
        const k = startScene(40);

        expect(stopBGM).toHaveBeenCalled();
        expect(playVictoryJingle).toHaveBeenCalledWith(k);
        expect(recordRunEnded).toHaveBeenCalledWith("victory");
        expect(addToLeaderboard).toHaveBeenCalledWith("Pirata", 40);
        expect(renderLeaderboard).toHaveBeenCalledWith(k, GAME.HEIGHT / 2 + 90);
    });

    it("shows the final bounty and a new record badge", () => {
        storage.getItem.mockReturnValue("10000");

        const k = startScene(40);

        expect(storage.setItem).toHaveBeenCalledWith("highestBounty", "40000");
        expect(k.objects.some((obj) => obj.text === "Bounty Final: ฿ 40,000")).toBe(true);
        expect(k.objects.some((obj) => obj.text === "NEW RECORD!")).toBe(true);
    });

    it("fades in the One Piece line after a delay", () => {
        const k = startScene(40);
        const line = k.objects.find((obj) => obj.text === "O One Piece... existe!");
        expect(line.opacity).toBe(0);

        k.dtValue = 2;
        line.updates[0].callback();

        expect(line.opacity).toBe(1);
    });

    it("creates the end buttons after the intro and wires them up", () => {
        const k = startScene(40);
        expect(k.waits).toHaveLength(1);

        k.runWaits();

        expect(mocks.buttons.map((button) => button.text)).toEqual([
            "🔄 Jogar de Novo",
            "Menu",
        ]);

        mocks.buttons[0].onClick();
        expect(state.score).toBe(0);
        expect(k.go).toHaveBeenCalledWith("game");

        mocks.buttons[1].onClick();
        expect(k.go).toHaveBeenLastCalledWith("menu");
    });

    it("restarts with Enter once the end screen is interactive", () => {
        const k = startScene(40);
        k.runWaits();

        k.press("enter");

        expect(state.score).toBe(0);
        expect(k.go).toHaveBeenCalledWith("game");
    });
});
