// ============================================
// Game Over Scene
// ============================================
import { GAME } from "../config.js";

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
            k.text("GAME OVER", { size: 48 }),
            k.color(200, 30, 30),
            k.pos(GAME.WIDTH / 2, 150),
            k.anchor("center"),
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

        // Stats
        k.add([
            k.text(`Score Final: ${score}`, { size: 24 }),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20),
            k.anchor("center"),
        ]);

        k.add([
            k.text(`Nível alcançado: ${level}`, { size: 16 }),
            k.color(150, 150, 180),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 55),
            k.anchor("center"),
        ]);

        // Retry button
        const btn = k.add([
            k.rect(200, 45, { radius: 10 }),
            k.color(50, 100, 200),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 130),
            k.anchor("center"),
            k.area(),
        ]);

        k.add([
            k.text("🔄 Tentar de Novo", { size: 18 }),
            k.color(255, 255, 255),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 130),
            k.anchor("center"),
        ]);

        btn.onHover(() => {
            btn.color = k.Color.fromArray([80, 140, 240]);
            k.setCursor("pointer");
        });
        btn.onHoverEnd(() => {
            btn.color = k.Color.fromArray([50, 100, 200]);
            k.setCursor("default");
        });

        btn.onClick(() => k.go("game", 0));
        k.onKeyPress("enter", () => k.go("game", 0));
        k.onKeyPress("space", () => k.go("game", 0));

        // Menu button
        const menuBtn = k.add([
            k.rect(160, 40, { radius: 10 }),
            k.color(80, 80, 100),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 70),
            k.anchor("center"),
            k.area(),
        ]);

        k.add([
            k.text("Menu", { size: 16 }),
            k.color(200, 200, 220),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 70),
            k.anchor("center"),
        ]);

        menuBtn.onHover(() => {
            menuBtn.color = k.Color.fromArray([110, 110, 140]);
            k.setCursor("pointer");
        });
        menuBtn.onHoverEnd(() => {
            menuBtn.color = k.Color.fromArray([80, 80, 100]);
            k.setCursor("default");
        });

        menuBtn.onClick(() => k.go("menu"));
    };
}
