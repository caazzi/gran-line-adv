import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    buttonGroup: null,
}));

vi.mock("../ui/components.js", () => ({
    createWoodenButton: vi.fn(() => mocks.buttonGroup),
}));
vi.mock("../systems/audio.js", () => ({
    toggleMute: vi.fn(),
}));
vi.mock("../systems/telemetry.js", () => ({
    telemetry: {
        info: vi.fn(),
        counter: vi.fn(),
        gauge: vi.fn(),
    },
}));

import { menuScene } from "./menu.js";
import { createWoodenButton } from "../ui/components.js";
import { toggleMute } from "../systems/audio.js";
import { telemetry } from "../systems/telemetry.js";
import { state } from "../state.js";
import { makeK } from "../test/kaplay.js";

function startScene() {
    const k = makeK();
    mocks.buttonGroup = { scale: null };
    menuScene(k)();
    return k;
}

describe("menu scene", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal("window", { open: vi.fn() });
        state.reset();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("renders the title, ocean, stars and start button", () => {
        const k = startScene();

        expect(k.objects.some((obj) => obj.text === "GRAN LINE")).toBe(true);
        expect(k.objects.some((obj) => obj.text === "ADVENTURE")).toBe(true);
        expect(k.objects.some((obj) => obj.spriteName === "ocean")).toBe(true);
        expect(k.objects.filter((obj) => obj.radius !== undefined)).toHaveLength(60);
        expect(createWoodenButton).toHaveBeenCalledWith(
            k,
            "⛵ ZARPAR!",
            expect.anything(),
            expect.any(Function),
            { textSize: 28 }
        );
    });

    it.each(["enter", "space"])("starts a fresh run with %s", (key) => {
        const k = startScene();
        state.addScore(999);

        k.press(key);

        expect(state.score).toBe(0);
        expect(k.go).toHaveBeenCalledWith("game");
        expect(telemetry.counter).toHaveBeenCalledWith("game.run.started", 1, { source: "menu" });
    });

    it("starts after the wooden button punch animation", () => {
        const k = startScene();
        const onClick = createWoodenButton.mock.calls[0][3];

        onClick();

        expect(mocks.buttonGroup.scale).toEqual({ x: 0.95, y: 0.95 });
        expect(k.go).not.toHaveBeenCalled();
        k.runWaits();
        expect(k.go).toHaveBeenCalledWith("game");
    });

    it("opens the feedback form and toggles mute", () => {
        const k = startScene();

        k.press("h");
        k.press("m");

        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining("github.com/caazzi/gran-line-adv/issues/new"),
            "_blank",
            "noopener,noreferrer"
        );
        expect(telemetry.counter).toHaveBeenCalledWith("ui.feedback.opened");
        expect(toggleMute).toHaveBeenCalledWith(k, { "ui.scene": "menu" });
    });
});
