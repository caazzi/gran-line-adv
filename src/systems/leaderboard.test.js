import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToLeaderboard } from './leaderboard.js';

// Polyfill localStorage for Node.js environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = String(value); }),
        clear: vi.fn(() => { store = {}; })
    };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('Leaderboard Data Management', () => {

    beforeEach(() => {
        // Reset local storage
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should save the first entry correctly', () => {
        addToLeaderboard('Luffy', 500);
        const data = JSON.parse(localStorage.getItem('granline_leaderboard'));

        expect(data).toBeDefined();
        expect(data.length).toBe(1);
        expect(data[0].name).toBe('Luffy');
        expect(data[0].score).toBe(500);
    });

    it('should sort entries descending by score', () => {
        addToLeaderboard('Buggy', 100);
        addToLeaderboard('Zoro', 1000);
        addToLeaderboard('Nami', 300);

        const data = JSON.parse(localStorage.getItem('granline_leaderboard'));

        expect(data.length).toBe(3);
        expect(data[0].score).toBe(1000);
        expect(data[1].score).toBe(300);
        expect(data[2].score).toBe(100);
    });

    it('should keep exactly 5 entries and drop lowest', () => {
        addToLeaderboard('A', 100);
        addToLeaderboard('B', 200);
        addToLeaderboard('C', 300);
        addToLeaderboard('D', 400);
        addToLeaderboard('E', 500);

        // This 6th one should push 'A' out
        addToLeaderboard('F', 600);

        const data = JSON.parse(localStorage.getItem('granline_leaderboard'));

        expect(data.length).toBe(5);
        expect(data[0].name).toBe('F'); // Highest

        const lowestScoreName = data[data.length - 1].name;
        expect(lowestScoreName).toBe('B'); // B was 200, A (100) was pushed out

        const aExists = data.some(entry => entry.name === 'A');
        expect(aExists).toBe(false);
    });

    it('should not add a score lower than the 5th place', () => {
        // Fill top 5 with high scores
        addToLeaderboard('H1', 1000);
        addToLeaderboard('H2', 900);
        addToLeaderboard('H3', 800);
        addToLeaderboard('H4', 700);
        addToLeaderboard('H5', 600);

        // Try adding a low score
        addToLeaderboard('Noob', 10);

        const data = JSON.parse(localStorage.getItem('granline_leaderboard'));
        expect(data.length).toBe(5);

        const noobExists = data.some(entry => entry.name === 'Noob');
        expect(noobExists).toBe(false);
    });
});
