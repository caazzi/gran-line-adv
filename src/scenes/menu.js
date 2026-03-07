// ============================================
// Menu Scene — Title Screen
// ============================================
import { GAME } from "../config.js";

let bgmStarted = false;

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
        k.add([
            k.text("GRAN LINE", { size: 52 }),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, 120),
            k.anchor("center"),
        ]);

        k.add([
            k.text("ADVENTURE", { size: 36 }),
            k.color(255, 160, 30),
            k.pos(GAME.WIDTH / 2, 170),
            k.anchor("center"),
        ]);

        // Subtitle
        k.add([
            k.text("A Thousand Sunny Voyage", { size: 16 }),
            k.color(150, 200, 255),
            k.pos(GAME.WIDTH / 2, 210),
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

        // -- Start Button --
        const btnY = GAME.HEIGHT - 110;

        const btn = k.add([
            k.rect(200, 50, { radius: 12 }),
            k.color(200, 50, 30),
            k.pos(GAME.WIDTH / 2, btnY),
            k.anchor("center"),
            k.area(),
            "start_btn",
        ]);

        const btnText = k.add([
            k.text("⛵ ZARPAR!", { size: 22 }),
            k.color(255, 255, 255),
            k.pos(GAME.WIDTH / 2, btnY),
            k.anchor("center"),
        ]);

        // Button hover effect
        btn.onHover(() => {
            btn.color = k.Color.fromArray([240, 80, 50]);
            k.setCursor("pointer");
        });
        btn.onHoverEnd(() => {
            btn.color = k.Color.fromArray([200, 50, 30]);
            k.setCursor("default");
        });

        function startGame() {
            if (!bgmStarted) {
                k.play("bgm", { loop: true, volume: 0.15 });
                bgmStarted = true;
            }
            k.go("game", 0);
        }

        // Click to start
        btn.onClick(() => startGame());

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
