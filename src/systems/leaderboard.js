// ============================================
// Leaderboard — Top 5 Local Scores
// Uses localStorage for persistence.
// ============================================

const STORAGE_KEY = "granline_leaderboard";
const MAX_ENTRIES = 5;

/**
 * @typedef {{ name: string, score: number, date: string }} LeaderboardEntry
 */

/**
 * Get the current leaderboard from localStorage
 * @returns {LeaderboardEntry[]}
 */
export function getLeaderboard() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

/**
 * Check if a score qualifies for the leaderboard
 * @param {number} score
 * @returns {boolean}
 */
export function isHighScore(score) {
    const board = getLeaderboard();
    if (board.length < MAX_ENTRIES) return true;
    return score > board[board.length - 1].score;
}

/**
 * Add a new entry to the leaderboard (sorted desc, max 5)
 * @param {string} name
 * @param {number} score
 * @returns {LeaderboardEntry[]} Updated leaderboard
 */
export function addToLeaderboard(name, score) {
    const board = getLeaderboard();
    const entry = {
        name: name.trim().substring(0, 12) || "Pirata",
        score,
        date: new Date().toLocaleDateString("pt-BR"),
    };
    board.push(entry);
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
}

/**
 * Render the leaderboard UI in a Kaplay scene
 * @param {import("kaplay").KaplayCtx} k
 * @param {number} startY — Y position to start rendering
 * @returns {number} — The Y position after the last row
 */
export function renderLeaderboard(k, startY) {
    const board = getLeaderboard();
    const x = k.width() / 2;

    // Title
    k.add([
        k.text("🏴‍☠️ TOP PIRATAS", { size: 18, font: "Bangers" }),
        k.color(255, 215, 0),
        k.pos(x, startY),
        k.anchor("center"),
    ]);

    if (board.length === 0) {
        k.add([
            k.text("Nenhum pirata ainda...", { size: 14, font: "Outfit" }),
            k.color(150, 150, 150),
            k.pos(x, startY + 28),
            k.anchor("center"),
        ]);
        return startY + 50;
    }

    const medals = ["🥇", "🥈", "🥉", "4.", "5."];
    let rowY = startY + 28;

    board.forEach((entry, i) => {
        const medal = medals[i] || `${i + 1}.`;
        const bounty = Intl.NumberFormat("en-US").format(entry.score * 1000);

        k.add([
            k.text(`${medal} ${entry.name}`, { size: 14, font: "Outfit" }),
            k.color(i === 0 ? [255, 215, 0] : i === 1 ? [200, 200, 210] : i === 2 ? [205, 127, 50] : [180, 180, 180]),
            k.pos(x - 120, rowY),
            k.anchor("left"),
        ]);

        k.add([
            k.text(`฿ ${bounty}`, { size: 14, font: "Outfit" }),
            k.color(i === 0 ? [255, 215, 0] : [200, 200, 200]),
            k.pos(x + 120, rowY),
            k.anchor("right"),
        ]);

        rowY += 22;
    });

    return rowY;
}
