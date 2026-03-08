// ============================================
// Menu Scene — Title Screen
// ============================================
import { GAME } from "../config.js";
import { createWoodenButton } from "../ui/components.js";

export function menuScene(k) {
    return () => {
        // Background
        k.add([
            k.rect(GAME.WIDTH, GAME.HEIGHT),
            k.color(8, 12, 40),
            k.pos(0, 0),
        ]);

        // Stars
        for (let i = 0; i < 60; i++) {
            const star = k.add([
                k.circle(k.rand(1, 3)),
                k.color(255, 255, 255),
                k.opacity(k.rand(0.2, 0.8)),
                k.pos(k.rand(0, GAME.WIDTH), k.rand(0, GAME.HEIGHT)),
                k.anchor("center"),
            ]);
            // Twinkle
            const speed = k.rand(1, 3);
            const offset = k.rand(0, Math.PI * 2);
            star.onUpdate(() => {
                star.opacity = 0.3 + Math.sin(k.time() * speed + offset) * 0.4;
            });
        }

        // Ocean Sprite
        k.add([
            k.sprite("ocean", { width: GAME.WIDTH, height: GAME.HEIGHT / 3, tiled: true }),
            k.pos(0, GAME.HEIGHT * 2 / 3),
        ]);

        // -- Title --
        // Render at half size and scale to prevent custom font bounding box clipping
        k.add([
            k.text("GRAN LINE", { size: 32, font: "Bangers" }),
            k.scale(2),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, 110),
            k.anchor("center"),
            k.z(10),
        ]);

        // Title drop shadow
        k.add([
            k.text("GRAN LINE", { size: 32, font: "Bangers" }),
            k.scale(2),
            k.color(30, 20, 10),
            k.pos(GAME.WIDTH / 2 + 3, 110 + 3),
            k.anchor("center"),
            k.z(9),
        ]);

        k.add([
            k.text("ADVENTURE", { size: 24, font: "Bangers" }),
            k.scale(2),
            k.color(255, 100, 30),
            k.pos(GAME.WIDTH / 2, 175),
            k.anchor("center"),
            k.z(10),
        ]);

        // Subtitle drop shadow
        k.add([
            k.text("ADVENTURE", { size: 24, font: "Bangers" }),
            k.scale(2),
            k.color(40, 10, 5),
            k.pos(GAME.WIDTH / 2 + 3, 175 + 3),
            k.anchor("center"),
            k.z(9),
        ]);

        // Subtitle
        k.add([
            k.text("A Thousand Sunny Voyage", { size: 18, font: "Outfit" }),
            k.color(150, 200, 255),
            k.pos(GAME.WIDTH / 2, 225),
            k.anchor("center"),
        ]);

        // -- Ship illustration (Sunny) --
        const shipY = GAME.HEIGHT / 2 + 70;
        const shipGroup = k.add([
            k.pos(GAME.WIDTH / 2, shipY),
            k.anchor("center"),
        ]);

        shipGroup.add([
            k.sprite("sunny"),
            k.scale(0.45),
            k.anchor("center"),
        ]);

        // Floating animation for ship
        let floatT = 0;
        shipGroup.onUpdate(() => {
            floatT += k.dt();
            shipGroup.pos.y = shipY + Math.sin(floatT * 1.5) * 8;
        });

        // -- Start Button (Wooden Plank) --
        const btnY = GAME.HEIGHT - 120;

        function startGame() {
            k.go("game", { levelIndex: 0, score: 0 });
        }

        const btnGroup = createWoodenButton(
            k,
            "⛵ ZARPAR!",
            k.vec2(GAME.WIDTH / 2, btnY),
            () => {
                btnGroup.scale = k.vec2(0.95); // click punch effect
                k.wait(0.1, startGame);
            },
            { textSize: 28 }
        );

        // Or press Enter/Space
        k.onKeyPress("enter", () => startGame());
        k.onKeyPress("space", () => startGame());

        // Controls hint
        k.add([
            k.text("WASD / Setas = Mover  |  Espaço = Gaon Cannon  |  E = Coup de Burst", { size: 11 }),
            k.color(120, 140, 180),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 30),
            k.anchor("center"),
        ]);
    };
}
