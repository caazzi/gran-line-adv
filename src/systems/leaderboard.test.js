import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    addToLeaderboard,
    getLeaderboard,
    isHighScore,
    renderLeaderboard,
} from './leaderboard.js';
import { telemetry } from './telemetry.js';
import { makeK } from '../test/kaplay.js';

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

describe('Leaderboard reads and rendering', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it('returns an empty board when nothing is stored', () => {
        expect(getLeaderboard()).toEqual([]);
    });

    it('recovers from invalid JSON and non-array payloads', () => {
        const counter = vi.spyOn(telemetry, 'counter');
        localStorage.setItem('granline_leaderboard', '{not json');
        expect(getLeaderboard()).toEqual([]);
        expect(counter).toHaveBeenCalledWith('storage.leaderboard.read_errors');

        localStorage.setItem('granline_leaderboard', JSON.stringify({ score: 1 }));
        expect(getLeaderboard()).toEqual([]);
    });

    it('only qualifies scores that beat a full board', () => {
        expect(isHighScore(1)).toBe(true);

        [1000, 900, 800, 700, 600].forEach((score, index) => {
            addToLeaderboard(`P${index}`, score);
        });

        expect(isHighScore(500)).toBe(false);
        expect(isHighScore(601)).toBe(true);
    });

    it('trims names and falls back to a default pirate name', () => {
        addToLeaderboard('   ', 10);
        addToLeaderboard('A very long pirate name', 20);

        const board = JSON.parse(localStorage.getItem('granline_leaderboard'));
        expect(board[0].name).toBe('A very long ');
        expect(board[1].name).toBe('Pirata');
        expect(board[0].date).toEqual(expect.any(String));
    });

    it('returns the sorted board even when storage writes fail', () => {
        const counter = vi.spyOn(telemetry, 'counter');
        localStorage.setItem.mockImplementationOnce(() => {
            throw new Error('quota');
        });

        const board = addToLeaderboard('Luffy', 500);

        expect(board).toHaveLength(1);
        expect(counter).toHaveBeenCalledWith('storage.leaderboard.write_errors');
    });

    it('renders the empty state and returns the next Y position', () => {
        const k = makeK();

        const nextY = renderLeaderboard(k, 100);

        expect(nextY).toBe(150);
        expect(k.objects.some((obj) => obj.text === 'Nenhum pirata ainda...')).toBe(true);
    });

    it('renders one row per entry with medals and formatted bounties', () => {
        addToLeaderboard('Luffy', 500);
        addToLeaderboard('Zoro', 300);
        addToLeaderboard('Nami', 100);
        const k = makeK();

        const nextY = renderLeaderboard(k, 100);

        expect(nextY).toBe(100 + 28 + 3 * 22);
        expect(k.objects.some((obj) => obj.text === '🥇 Luffy')).toBe(true);
        expect(k.objects.some((obj) => obj.text === '🥈 Zoro')).toBe(true);
        expect(k.objects.some((obj) => obj.text === '🥉 Nami')).toBe(true);
        expect(k.objects.some((obj) => obj.text === '฿ 500,000')).toBe(true);
    });
});
