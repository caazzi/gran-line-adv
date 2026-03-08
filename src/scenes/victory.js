// ============================================
// Victory Scene — Game Complete
// ============================================
import { Z_LAYERS, GAME } from "../config.js";
import { createWoodenButton } from "../ui/components.js";
import { addToLeaderboard, renderLeaderboard } from "../systems/leaderboard.js";
import { stopBGM, playVictoryJingle } from "../systems/audio.js";
import { state } from "../state.js";

export function victoryScene(k) {
    return () => {
        // Stop level BGM and play victory jingle
        stopBGM();
        playVictoryJingle(k);

        // Auto-save to leaderboard
        addToLeaderboard("Pirata", state.score);

        // Golden background
        k.add([
            k.rect(GAME.WIDTH, GAME.HEIGHT),
            k.color(20, 15, 5),
            k.pos(0, 0),
        ]);

        // Sparkle particles
        for (let i = 0; i < 30; i++) {
            const spark = k.add([
                k.circle(k.rand(1, 4)),
                k.color(255, 215, 0),
                k.opacity(0),
                k.pos(k.rand(0, GAME.WIDTH), k.rand(0, GAME.HEIGHT)),
                k.anchor("center"),
            ]);
            const delay = k.rand(0, 3);
            const speed = k.rand(1, 3);
            spark.onUpdate(() => {
                spark.opacity = Math.max(0, Math.sin((k.time() - delay) * speed) * 0.8);
            });
        }

        // Title
        k.add([
            k.text("🏴‍☠️ VITÓRIA!", { size: 36, font: "Bangers" }),
            k.scale(2),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, 80),
            k.anchor("center"),
            k.z(Z_LAYERS.EFFECTS),
        ]);

        // Title drop shadow
        k.add([
            k.text("🏴‍☠️ VITÓRIA!", { size: 36, font: "Bangers" }),
            k.scale(2),
            k.color(60, 40, 0),
            k.pos(GAME.WIDTH / 2 + 3, 80 + 3),
            k.anchor("center"),
            k.z(Z_LAYERS.EFFECTS - 1),
        ]);

        k.add([
            k.text("O Thousand Sunny conquistou\na Grand Line!", { size: 24, align: "center", font: "Bangers" }),
            k.color(200, 180, 120),
            k.pos(GAME.WIDTH / 2, 160),
            k.anchor("center"),
        ]);

        // LocalStorage Highest Bounty logic
        const currentBounty = state.score * 1000;
        let highestBounty = parseInt(localStorage.getItem("highestBounty") || "0");
        let isNewRecord = false;

        if (currentBounty > highestBounty) {
            highestBounty = currentBounty;
            localStorage.setItem("highestBounty", highestBounty.toString());
            isNewRecord = true;
        }

        const formatBounty = (val) => Intl.NumberFormat('en-US').format(val);

        // Score
        k.add([
            k.text(`Bounty Final: ฿ ${formatBounty(currentBounty)}`, { size: 20, font: "Bangers" }),
            k.scale(2),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2),
            k.anchor("center"),
        ]);

        k.add([
            k.text(`Highest Bounty: ฿ ${formatBounty(highestBounty)}`, { size: 18, font: "Outfit" }),
            k.color(isNewRecord ? [255, 100, 100] : [200, 200, 200]),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 40),
            k.anchor("center"),
        ]);

        if (isNewRecord) {
            k.add([
                k.text("NEW RECORD!", { size: 16, font: "Bangers" }),
                k.scale(2),
                k.color(255, 50, 50),
                k.pos(GAME.WIDTH / 2 + 160, GAME.HEIGHT / 2),
                k.anchor("center"),
                k.rotate(15),
            ]);
        }

        // One Piece found text
        const opText = k.add([
            k.text("O One Piece... existe!", { size: 18 }),
            k.color(255, 200, 100),
            k.opacity(0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 65),
            k.anchor("center"),
        ]);

        let opT = 0;
        opText.onUpdate(() => {
            opT += k.dt();
            if (opT > 1.5) {
                opText.opacity = Math.min(1, opText.opacity + k.dt());
            }
        });

        // -- Leaderboard --
        renderLeaderboard(k, GAME.HEIGHT / 2 + 90);

        // Play again & Menu Buttons
        k.wait(2, () => {
            // Container to fade both buttons in together
            const btnContainer = k.add([
                k.opacity(0),
            ]);

            k.tween(0, 1, 1, (v) => btnContainer.opacity = v);

            // -- Retry Button (Wooden Plank) --
            const retryBtn = createWoodenButton(
                k,
                "🔄 Jogar de Novo",
                k.vec2(GAME.WIDTH / 2, GAME.HEIGHT - 120),
                () => { state.reset(); k.go("game"); }
            );
            btnContainer.add(retryBtn);

            k.onKeyPress("enter", () => { state.reset(); k.go("game"); });

            // -- Menu Button (Wooden Plank) --
            const menuBtn = createWoodenButton(
                k,
                "Menu",
                k.vec2(GAME.WIDTH / 2, GAME.HEIGHT - 60),
                () => k.go("menu"),
                { width: 180, height: 40, textSize: 22 }
            );
            btnContainer.add(menuBtn);
        });
    };
}
