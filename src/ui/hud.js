import { GAME } from "../config.js";

export function setupHUD(k, player, levelConfig) {
    // Score
    const scoreText = k.add([
        k.text("Score: 0", { size: 18 }),
        k.color(255, 215, 0),
        k.pos(16, 12),
        k.fixed(),
        k.z(200),
    ]);

    // Lives
    const livesText = k.add([
        k.text(`♥ ${player.lives}`, { size: 18 }),
        k.color(255, 80, 80),
        k.pos(16, 36),
        k.fixed(),
        k.z(200),
    ]);

    // Level
    k.add([
        k.text(`Nível ${levelConfig.id}: ${levelConfig.name}`, { size: 14 }),
        k.color(150, 200, 255),
        k.pos(GAME.WIDTH - 16, 12),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Coup de Burst cooldown indicator
    const coupIndicator = k.add([
        k.text("(E) Coup de Burst: READY", { size: 12 }),
        k.color(100, 200, 255),
        k.pos(GAME.WIDTH - 16, 36),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Soldier Dock indicator
    const dockIndicator = k.add([
        k.text("", { size: 12 }),
        k.color(255, 150, 50),
        k.pos(GAME.WIDTH - 16, 54),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Level timer / progress bar background
    k.add([
        k.rect(GAME.WIDTH - 32, 4),
        k.color(40, 40, 60),
        k.pos(16, GAME.HEIGHT - 16),
        k.fixed(),
        k.z(200),
    ]);

    const progressBar = k.add([
        k.rect(1, 4),
        k.color(50, 200, 100),
        k.pos(16, GAME.HEIGHT - 16),
        k.fixed(),
        k.z(201),
    ]);

    // Return the update HUD hook
    return function updateHUD(levelTimer, bossSpawned) {
        if (!player.exists()) return;

        scoreText.text = `Score: ${player.score}`;
        livesText.text = `♥ ${"♥".repeat(Math.max(0, player.lives))}`;

        // Coup de Burst cooldown
        if (player.coupCooldown > 0) {
            coupIndicator.text = `(E) Coup de Burst: ${Math.ceil(player.coupCooldown)}s`;
            coupIndicator.color = k.Color.fromArray([100, 100, 100]);
        } else {
            coupIndicator.text = "(E) Coup de Burst: READY";
            coupIndicator.color = k.Color.fromArray([100, 200, 255]);
        }

        // Soldier Dock status
        if (player.soldierDockActive) {
            dockIndicator.text = `🔥 Soldier Dock: ${Math.ceil(player.soldierDockTimer)}s`;
        } else {
            dockIndicator.text = "";
        }

        // Progress bar
        if (!bossSpawned) {
            const progress = Math.min(levelTimer / levelConfig.duration, 1);
            progressBar.width = (GAME.WIDTH - 32) * progress;
        } else {
            progressBar.color = k.Color.fromArray([255, 50, 50]);
            progressBar.width = GAME.WIDTH - 32;
        }
    };
}
