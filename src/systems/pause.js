// ============================================
// Pause State — Shared, dependency-free
// ============================================
// Imported by gameplay code (player input guards) and the game scene.
// Deliberately knows nothing about Kaplay: callers drive k.debug.paused.

export const pauseState = { active: false };

export function isPaused() {
    return pauseState.active;
}

export function setPaused(active) {
    pauseState.active = !!active;
    return pauseState.active;
}

// Resets both our flag and Kaplay's native pause. Safe with no k (tests).
export function resetPause(k) {
    pauseState.active = false;
    if (k?.debug) k.debug.paused = false;
}
