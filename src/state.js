// ============================================
// Global State Management
// ============================================

export const state = {
    score: 0,
    levelIndex: 0,

    reset() {
        this.score = 0;
        this.levelIndex = 0;
    },

    addScore(points) {
        this.score += points;
    },

    nextLevel() {
        this.levelIndex++;
    }
};
