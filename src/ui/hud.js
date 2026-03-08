import { GAME } from "../config.js";

export function setupHUD(k, player, levelConfig) {
    // Top-Left Panel (Bounty & Lives)
    k.add([
        k.rect(200, 75, { radius: 8 }),
        k.color(20, 20, 30),
        k.opacity(0.8),
        k.pos(10, 10),
        k.fixed(),
        k.z(199)
    ]);

    // Bounty
    const bountyText = k.add([
        k.text("Bounty: ฿ 0", { size: 24, font: "Bangers" }),
        k.color(255, 215, 0),
        k.pos(20, 22),
        k.fixed(),
        k.z(200),
    ]);

    // Lives
    const livesText = k.add([
        k.text(`♥ ${player.lives}`, { size: 20, font: "Outfit" }),
        k.color(255, 80, 80),
        k.pos(20, 50),
        k.fixed(),
        k.z(200),
    ]);

    // Top-Right Panel Container (Level & Cooldowns)
    k.add([
        k.rect(230, 125, { radius: 8 }),
        k.color(20, 20, 30),
        k.opacity(0.8),
        k.pos(GAME.WIDTH - 10, 10),
        k.anchor("topright"),
        k.fixed(),
        k.z(199)
    ]);

    // Level
    k.add([
        k.text(`Nível ${levelConfig.id}: ${levelConfig.name}`, { size: 16, font: "Outfit" }),
        k.color(150, 200, 255),
        k.pos(GAME.WIDTH - 20, 24),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Coup de Burst cooldown indicator
    const coupIndicator = k.add([
        k.text("(E) Coup de Burst: READY", { size: 14, font: "Outfit" }),
        k.color(100, 200, 255),
        k.pos(GAME.WIDTH - 20, 46),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Soldier Dock indicator
    const dockIndicator = k.add([
        k.text("", { size: 14, font: "Outfit" }),
        k.color(255, 150, 50),
        k.pos(GAME.WIDTH - 20, 66),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Mera Mera / Bari Bari shared ability indicator
    const abilityIndicator = k.add([
        k.text("", { size: 14, font: "Outfit" }),
        k.color(255, 255, 255),
        k.pos(GAME.WIDTH - 20, 86),
        k.anchor("topright"),
        k.fixed(),
        k.z(200),
    ]);

    // Haoshoku Haki cooldown indicator
    const hakiIndicator = k.add([
        k.text("(F) Haki: READY", { size: 14, font: "Outfit" }),
        k.color(255, 0, 50),
        k.pos(GAME.WIDTH - 20, 106),
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

        const formattedBounty = Intl.NumberFormat('en-US').format(player.score * 1000);
        bountyText.text = `Bounty: ฿ ${formattedBounty}`;
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

        // Akuma no Mi Special Abilities
        if (player.pikaPikaActive) {
            abilityIndicator.text = `⚡ Pika Pika: ${Math.ceil(player.pikaPikaTimer)}s`;
            abilityIndicator.color = k.Color.fromArray([255, 255, 50]);
        } else if (player.meraMeraActive) {
            abilityIndicator.text = `🌋 Mera Mera: ${Math.ceil(player.meraMeraTimer)}s`;
            abilityIndicator.color = k.Color.fromArray([255, 100, 20]);
        } else if (player.bariBariActive) {
            abilityIndicator.text = `🛡️ Bari Bari: ${Math.ceil(player.bariBariTimer)}s`;
            abilityIndicator.color = k.Color.fromArray([50, 255, 150]);
        } else {
            abilityIndicator.text = "";
        }

        // Haki cooldown
        if (player.hakiCooldown > 0) {
            hakiIndicator.text = `(F) Haki: ${Math.ceil(player.hakiCooldown)}s`;
            hakiIndicator.color = k.Color.fromArray([100, 100, 100]);
        } else {
            hakiIndicator.text = "(F) Haki: READY";
            hakiIndicator.color = k.Color.fromArray([255, 0, 50]);
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
