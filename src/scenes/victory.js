// ============================================
// Victory Scene — Game Complete
// ============================================
import { GAME } from "../config.js";

export function victoryScene(k) {
    return ({ score = 0 } = {}) => {
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
            k.text("🏴‍☠️ VITÓRIA!", { size: 48 }),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, 120),
            k.anchor("center"),
        ]);

        k.add([
            k.text("O Thousand Sunny conquistou\na Grand Line!", { size: 20, align: "center" }),
            k.color(200, 180, 120),
            k.pos(GAME.WIDTH / 2, 190),
            k.anchor("center"),
        ]);

        // Score
        k.add([
            k.text(`Score Total: ${score}`, { size: 28 }),
            k.color(255, 215, 0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 20),
            k.anchor("center"),
        ]);

        // One Piece found text
        const opText = k.add([
            k.text("O One Piece... existe!", { size: 18 }),
            k.color(255, 200, 100),
            k.opacity(0),
            k.pos(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 70),
            k.anchor("center"),
        ]);

        let opT = 0;
        opText.onUpdate(() => {
            opT += k.dt();
            if (opT > 1.5) {
                opText.opacity = Math.min(1, opText.opacity + k.dt());
            }
        });

        // Play again
        k.wait(2, () => {
            const btn = k.add([
                k.rect(200, 45, { radius: 10 }),
                k.color(200, 50, 30),
                k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 100),
                k.anchor("center"),
                k.area(),
            ]);

            k.add([
                k.text("Jogar de Novo", { size: 18 }),
                k.color(255, 255, 255),
                k.pos(GAME.WIDTH / 2, GAME.HEIGHT - 100),
                k.anchor("center"),
            ]);

            btn.onHover(() => {
                btn.color = k.Color.fromArray([240, 80, 50]);
                k.setCursor("pointer");
            });
            btn.onHoverEnd(() => {
                btn.color = k.Color.fromArray([200, 50, 30]);
                k.setCursor("default");
            });

            btn.onClick(() => k.go("menu"));
            k.onKeyPress("enter", () => k.go("menu"));
        });
    };
}
