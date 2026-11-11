// ============================================
// Global State Management
// ============================================
import { telemetry } from "./systems/telemetry.js";

export const state = {
    score: 0,
    levelIndex: 0,

    reset() {
        this.score = 0;
        this.levelIndex = 0;
        telemetry.gauge("game.score", 0);
        telemetry.gauge("game.level.index", 0);
    },

    addScore(points) {
        this.score += points;
        telemetry.gauge("game.score", this.score);
    },

    nextLevel() {
        this.levelIndex++;
        telemetry.gauge("game.level.index", this.levelIndex);
    }
};
