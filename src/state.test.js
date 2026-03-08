import { describe, it, expect, beforeEach } from 'vitest';
import { state } from './state.js';

describe('Global State Management', () => {
    beforeEach(() => {
        state.reset();
    });

    it('should initialize with score 0 and level 0', () => {
        expect(state.score).toBe(0);
        expect(state.levelIndex).toBe(0);
    });

    it('should add score correctly', () => {
        state.addScore(150);
        expect(state.score).toBe(150);

        state.addScore(50);
        expect(state.score).toBe(200);
    });

    it('should increment level correctly', () => {
        state.nextLevel();
        expect(state.levelIndex).toBe(1);

        state.nextLevel();
        expect(state.levelIndex).toBe(2);
    });

    it('should reset score and level', () => {
        state.addScore(500);
        state.nextLevel();

        expect(state.score).toBe(500);
        expect(state.levelIndex).toBe(1);

        state.reset();

        expect(state.score).toBe(0);
        expect(state.levelIndex).toBe(0);
    });
});
