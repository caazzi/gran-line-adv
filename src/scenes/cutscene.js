import { Z_LAYERS, GAME } from "../config.js";
import { stopBGM } from "../systems/audio.js";

export function cutsceneScene(k) {
    return () => {
        stopBGM();

        // 1. Scene Background (Ocean and Sky)
        k.add([
            k.rect(GAME.WIDTH, GAME.HEIGHT),
            k.color(135, 206, 235), // Sky blue
            k.pos(0, 0),
        ]);

        const ocean = k.add([
            k.sprite("ocean", { width: GAME.WIDTH, height: GAME.HEIGHT, tiled: true }),
            k.pos(-GAME.WIDTH, 0), // Start shifted to pan
            k.z(Z_LAYERS.EFFECTS),
        ]);

        // Ocean scrolling effect
        ocean.onUpdate(() => {
            ocean.pos.x -= 100 * k.dt();
            if (ocean.pos.x <= -GAME.WIDTH * 2) {
                ocean.pos.x = -GAME.WIDTH;
            }
        });

        // 2. Add islands (Raftel) in the background
        const islands = k.add([
            k.pos(GAME.WIDTH, GAME.HEIGHT / 2 - 50),
            k.z(Z_LAYERS.BACKGROUND + 5)
        ]);

        // Draw 4 distinct island peaks
        for (let i = 0; i < 4; i++) {
            islands.add([
                k.polygon([
                    k.vec2(0, 0),
                    k.vec2(150, -200 + k.rand(-50, 50)),
                    k.vec2(300, 0)
                ]),
                k.color(30, 100, 50),
                k.pos(i * 200 - 100, 50),
            ]);
        }

        // Pan islands in slowly
        k.tween(GAME.WIDTH, GAME.WIDTH / 2 - 400, 6, (v) => { islands.pos.x = v }, k.easings.easeOutQuad);

        // 3. The Thousand Sunny
        const sunny = k.add([
            k.sprite("sunny", { anim: "idle" }),
            k.scale(GAME.PLAYER_SCALE / 2), // Slightly smaller for perspective
            k.pos(-100, GAME.HEIGHT / 2 + 50),
            k.anchor("center"),
            k.z(Z_LAYERS.ENEMIES)
        ]);

        // Step 1: Sunny sails in
        k.wait(1, () => {
            k.tween(-100, GAME.WIDTH / 2 - 150, 4, (v) => { sunny.pos.x = v }, k.easings.easeOutQuad)
                .then(() => {
                    // Step 2: The One Piece appears
                    const chest = k.add([
                        k.sprite("chest", { anim: "idle" }),
                        k.scale(3),
                        k.pos(GAME.WIDTH / 2 + 100, GAME.HEIGHT / 2 + 50),
                        k.anchor("center"),
                        k.opacity(0),
                        k.z(Z_LAYERS.ENEMIES)
                    ]);

                    // Chest fades and glows
                    k.tween(0, 1, 2, (v) => { chest.opacity = v })
                        .then(() => {
                            chest.play("open");
                            k.shake(20);

                            // Golden aura explosion
                            const aura = k.add([
                                k.rect(GAME.WIDTH, GAME.HEIGHT),
                                k.color(255, 215, 0),
                                k.opacity(0),
                                k.pos(0, 0),
                                k.z(Z_LAYERS.EFFECTS)
                            ]);

                            k.tween(0, 1, 1.5, (v) => { aura.opacity = v })
                                .then(() => {
                                    k.wait(0.5, () => {
                                        k.go("victory");
                                    });
                                });
                        });
                });
        });

        // Skip cutscene logic
        k.add([
            k.text("Press Enter to Skip", { size: 16 }),
            k.pos(GAME.WIDTH - 10, GAME.HEIGHT - 10),
            k.anchor("botright"),
            k.color(255, 255, 255),
            k.opacity(0.8),
            k.z(Z_LAYERS.EFFECTS)
        ]);

        k.onKeyPress("enter", () => {
            k.go("victory");
        });
    };
}
