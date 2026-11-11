import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { state } from "../state.js";
import { telemetry } from "./telemetry.js";
import { recordRunEnded } from "./runTelemetry.js";

describe("recordRunEnded", () => {
    beforeEach(() => {
        telemetry.reset();
        telemetry.setConsoleEnabled(false);
        state.reset();
    });

    afterAll(() => {
        telemetry.reset();
        telemetry.setConsoleEnabled(true);
    });

    it("records the outcome, score, level and bounty with one shared shape", () => {
        state.addScore(250);
        state.nextLevel();

        recordRunEnded("victory");

        const snapshot = telemetry.getSnapshot();
        const log = snapshot.logs.find((entry) => entry.body === "Run ended");
        expect(log.attributes).toEqual({
            "game.outcome": "victory",
            "game.score": 250,
            "game.level.id": 2,
            "game.bounty": 250000,
        });

        const counter = snapshot.metrics.series.find((entry) => entry.name === "game.run.ended");
        expect(counter).toMatchObject({
            kind: "counter",
            value: 1,
            attributes: { outcome: "victory" },
        });

        const gauge = snapshot.metrics.series.find((entry) => entry.name === "game.score");
        expect(gauge).toMatchObject({ kind: "gauge", value: 250 });
    });
});
