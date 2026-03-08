// ============================================
// Event Bus — Centralized Game Events
// Decouples collision detection from visual/audio effects.
// ============================================

/**
 * Lightweight pub/sub event system using Kaplay's built-in
 * k.on()/k.trigger() for game-scoped events.
 *
 * Event Types:
 *   "entity_damaged"   → { entity, damage, source }
 *   "entity_killed"    → { entity, killer, pos }
 *   "treasure_collected" → { player, treasure, points, typeTag }
 *   "player_damaged"   → { player, damage, pos }
 *   "player_died"      → { player, score, level }
 *   "boss_defeated"    → { boss, score }
 */

/** Register all global event listeners for audio/visual side effects */
export function setupGameEvents(k) {
    // -- Entity Killed: play sound + spawn explosion particles --
    k.on("entity_killed", (data) => {
        playExplosionSFX(0.6);
        k.shake(2);
    });

    // -- Player Damaged: screen shake --
    k.on("player_damaged", (data) => {
        k.shake(4);
        playExplosionSFX(0.4);
    });

    // -- Boss Defeated: big explosion --
    k.on("boss_defeated", (data) => {
        k.shake(12);
        playExplosionSFX(1.0);
    });
}

/** Fire an event on the Kaplay context */
export function emit(k, eventName, data) {
    k.trigger(eventName, data);
}
