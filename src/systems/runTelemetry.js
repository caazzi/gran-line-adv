// ============================================
// Run Telemetry — shared terminal event
// ============================================
import { LEVELS } from "../config.js";
import { state } from "../state.js";
import { telemetry } from "./telemetry.js";

/**
 * Record how a run ended. Used by both gameOver and victory so the shape of
 * the event (and its metric) cannot drift between the two screens.
 */
export function recordRunEnded(outcome) {
    // nextLevel() runs before the victory screen, so clamp the index to the
    // last real level instead of reporting one past the campaign.
    const level = LEVELS[Math.min(state.levelIndex, LEVELS.length - 1)];

    telemetry.info("Run ended", {
        "game.outcome": outcome,
        "game.score": state.score,
        "game.level.id": level.id,
        "game.bounty": state.score * 1000,
    });
    telemetry.counter("game.run.ended", 1, { outcome });
}
