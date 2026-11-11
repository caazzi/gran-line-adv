import { describe, it, expect, vi } from "vitest";
import { createWoodenButton } from "./components.js";
import { makeK } from "../test/kaplay.js";

describe("createWoodenButton", () => {
    it("builds a tagged button with a shadow, board, nails and label", () => {
        const k = makeK();
        const button = createWoodenButton(
            k,
            "ZARPAR!",
            { x: 400, y: 300 },
            vi.fn(),
            { width: 200, height: 40, textSize: 24 }
        );

        expect(button.is("wooden_btn")).toBe(true);
        expect(button.pos).toEqual({ x: 400, y: 300 });
        expect(button.children).toHaveLength(7);
        expect(button.children.filter((child) => child.text === "ZARPAR!")).toHaveLength(1);
        expect(button.children.filter((child) => child.radius === 3)).toHaveLength(4);
    });

    it("uses the default dimensions when none are given", () => {
        const k = makeK();
        const button = createWoodenButton(k, "Menu", { x: 0, y: 0 }, vi.fn());

        const board = button.children.find((child) => child.color?.[0] === 130);
        expect(board.width).toBe(220);
        expect(board.height).toBe(45);
    });

    it("highlights on hover and restores on hover end", () => {
        const k = makeK();
        const button = createWoodenButton(k, "Menu", { x: 0, y: 0 }, vi.fn());
        const board = button.children.find((child) => child.color?.[0] === 130);
        const label = button.children.find((child) => child.text === "Menu");

        button.onHover.mock.calls[0][0]();

        expect(board.color).toEqual({ color: [150, 90, 50] });
        expect(label.color).toEqual({ color: [255, 240, 200] });
        expect(button.scale).toEqual({ x: 1.05, y: 1.05 });
        expect(k.setCursor).toHaveBeenCalledWith("pointer");

        button.onHoverEnd.mock.calls[0][0]();

        expect(board.color).toEqual({ color: [130, 70, 40] });
        expect(label.color).toEqual({ color: [255, 220, 180] });
        expect(button.scale).toEqual({ x: 1, y: 1 });
        expect(k.setCursor).toHaveBeenCalledWith("default");
    });

    it("forwards clicks", () => {
        const k = makeK();
        const onClick = vi.fn();
        const button = createWoodenButton(k, "Menu", { x: 0, y: 0 }, onClick);

        button.onClick.mock.calls[0][0]();

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
