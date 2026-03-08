// ============================================
// Game Over Scene
// ============================================
import { GAME } from "../config.js";
import { createWoodenButton } from "../ui/components.js";

export function gameOverScene(k) {
    return ({ score = 0, level = 1 } = {}) => {
        // Dark background
        k.add([
            k.rect(GAME.WIDTH, GAME.HEIGHT),
            k.color(15, 5, 5),
            k.pos(0, 0),
        ]);

        // Red vignette effect
        for (let i = 0; i < 3; i++) {
            k.add([
                k.rect(GAME.WIDTH, GAME.HEIGHT),
                k.color(80, 0, 0),
                k.opacity(0.1 - i * 0.03),
                k.pos(0, 0),
            ]);
        }

        // Title
        k.add([
            k.text("GAME OVER", { size: 36, font: "Bangers" }),
            k.scale(2),
            k.color(200, 30, 30),
            k.pos(GAME.WIDTH / 2, 110),
            k.anchor("center"),
            k.z(10),
        ]);

        // Title drop shadow
        k.add([
            k.text("GAME OVER", { size: 36, font: "Bangers" }),
            k.scale(2),
            k.color(30, 0, 0),
            k.pos(GAME.WIDTH / 2 + 4, 110 + 4),
            k.anchor("center"),
            k.z(9),
        ]);

        // Sinking ship
        const sinkY = 280;
        const ship = k.add([
            k.rect(60, 30),
            k.color(100, 60, 30),
            k.pos(GAME.WIDTH / 2, sinkY),
            k.anchor("center"),
            k.rotate(15),
            k.opacity(0.7),
        ]);

        ship.onUpdate(() => {
            ship.pos.y += 5 * k.dt();
            ship.angle += 3 * k.dt();
            ship.opacity -= 0.15 * k.dt();
            if (ship.opacity <= 0) ship.destroy();
        });

        // LocalStorage Highest Bounty logic
        const currentBounty = score * 1000;
        let highestBounty = parseInt(localStorage.getItem("highestBounty") || "0");
        let isNewRecord = false;

        if (currentBounty > highestBounty) {
            highestBounty = currentBounty;
            localStorage.setItem("highestBounty", highestBounty.toString());
            isNewRecord = true;
        }

        const formatBounty = (val) => Intl.NumberFormat('en-US').format(val);

        // Wanted Poster Background
        const posterY = GAME.HEIGHT / 2 + 20;
        k.add([
            k.rect(340, 220), // Wider poster
            k.color(210, 180, 140), // Paper color
            k.pos(GAME.WIDTH / 2, posterY),
            k.anchor("center"),
            k.rotate(-5),
        ]);

        k.add([
            k.text("WANTED", { size: 24, font: "Bangers" }),
            k.scale(2),
            k.color(50, 20, 10),
            k.pos(GAME.WIDTH / 2 - 10, posterY - 65),
            k.anchor("center"),
            k.rotate(-5),
        ]);

        k.add([
            k.text("DEAD OR ALIVE", { size: 16, font: "Outfit" }),
            k.color(80, 30, 20),
            k.pos(GAME.WIDTH / 2 - 15, posterY - 25),
            k.anchor("center"),
            k.rotate(-5),
        ]);

        // Stats on poster
        k.add([
            k.text(`฿ ${formatBounty(currentBounty)}`, { size: 20, font: "Bangers" }),
            k.scale(2),
            k.color(20, 20, 20),
            k.pos(GAME.WIDTH / 2 - 25, posterY + 25),
            k.anchor("center"),
            k.rotate(-5),
        ]);

        k.add([
            k.text(`Highest: ฿ ${formatBounty(highestBounty)}`, { size: 16, font: "Outfit" }),
            k.color(isNewRecord ? [255, 50, 50] : [100, 100, 100]),
            k.pos(GAME.WIDTH / 2 - 35, posterY + 65),
            k.anchor("center"),
            k.rotate(-5),
        ]);

        if (isNewRecord) {
            k.add([
                k.text("NEW RECORD!", { size: 22, font: "Bangers" }),
                k.color(255, 50, 50),
                k.pos(GAME.WIDTH / 2 + 100, posterY - 80),
                k.anchor("center"),
                k.rotate(15),
            ]);

            // Confetti for new record
            for (let i = 0; i < 30; i++) {
                k.add([
                    k.rect(4, 8),
                    k.color(k.rand(100, 255), k.rand(100, 255), k.rand(100, 255)),
                    k.pos(GAME.WIDTH / 2, posterY),
                    k.move(k.rand(0, 360), k.rand(100, 400)),
                    k.lifespan(2, { fade: 0.5 })
                ]);
            }
        }

        k.add([
            k.text(`Nível alcançado: ${level}`, { size: 18, font: "Outfit" }),
            k.color(255, 255, 255),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 170),
            k.anchor("center"),
        ]);

        // -- Retry Button (Wooden Plank) --
        createWoodenButton(
            k,
            "🔄 Tentar de Novo",
            k.vec2(GAME.WIDTH / 2, GAME.HEIGHT - 120),
            () => k.go("game", 0)
        );

        k.onKeyPress("enter", () => k.go("game", 0));
        k.onKeyPress("space", () => k.go("game", 0));

        // -- Menu Button (Wooden Plank) --
        createWoodenButton(
            k,
            "Menu",
            k.vec2(GAME.WIDTH / 2, GAME.HEIGHT - 60),
            () => k.go("menu"),
            { width: 180, height: 40, textSize: 22 }
        );
    };
}
