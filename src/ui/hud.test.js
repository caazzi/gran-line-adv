import { describe, it, expect, beforeEach } from "vitest";
import { setupHUD } from "./hud.js";
import { GAME } from "../config.js";
import { state } from "../state.js";
import { makeK } from "../test/kaplay.js";

const levelConfig = { id: 2, name: "Loguetown", duration: 60 };

function findText(k, prefix) {
    return k.objects.find((obj) => typeof obj.text === "string" && obj.text.startsWith(prefix));
}

describe("HUD", () => {
    let k;
    let player;
    let updateHUD;

    beforeEach(() => {
        state.reset();
        k = makeK();
        player = k.add(["player", { lives: 3, coupCooldown: 0, hakiCooldown: 0 }]);
        updateHUD = setupHUD(k, player, levelConfig);
    });

    it("renders the level label and starting values", () => {
        expect(findText(k, "Nível 2: Loguetown")).toBeDefined();
        expect(findText(k, "Bounty:").text).toBe("Bounty: ฿ 0");
        expect(findText(k, "♥").text).toContain("♥");
    });

    it("updates bounty and remaining lives", () => {
        state.addScore(12);
        player.lives = 2;

        updateHUD(0, false);

        expect(findText(k, "Bounty:").text).toBe("Bounty: ฿ 12,000");
        expect(findText(k, "♥").text).toBe("♥ ♥♥");
    });

    it("switches cooldown labels between seconds and READY", () => {
        player.coupCooldown = 5;
        player.hakiCooldown = 2;
        updateHUD(0, false);

        expect(findText(k, "(E)").text).toBe("(E) Coup de Burst: 5s");
        expect(findText(k, "(F)").text).toBe("(F) Haki: 2s");

        player.coupCooldown = 0;
        player.hakiCooldown = 0;
        updateHUD(0, false);

        expect(findText(k, "(E)").text).toBe("(E) Coup de Burst: READY");
        expect(findText(k, "(F)").text).toBe("(F) Haki: READY");
    });

    it("shows the active Devil Fruit ability with its remaining time", () => {
        player.pikaPikaActive = true;
        player.pikaPikaTimer = 4;
        updateHUD(0, false);
        expect(findText(k, "⚡").text).toBe("⚡ Pika Pika: 4s");

        player.pikaPikaActive = false;
        player.meraMeraActive = true;
        player.meraMeraTimer = 3;
        updateHUD(0, false);
        expect(findText(k, "🌋").text).toBe("🌋 Mera Mera: 3s");

        player.meraMeraActive = false;
        player.bariBariActive = true;
        player.bariBariTimer = 2;
        updateHUD(0, false);
        expect(findText(k, "🛡️").text).toBe("🛡️ Bari Bari: 2s");
    });

    it("shows Soldier Dock time only while active", () => {
        player.soldierDockActive = true;
        player.soldierDockTimer = 6;
        updateHUD(0, false);
        const dock = findText(k, "🔥");
        expect(dock.text).toBe("🔥 Soldier Dock: 6s");

        player.soldierDockActive = false;
        updateHUD(0, false);
        expect(dock.text).toBe("");
    });

    it("fills the progress bar, then turns it red when the boss arrives", () => {
        const progressBar = k.objects.find((obj) => obj.width === 1 && obj.height === 4);
        updateHUD(30, false);
        expect(progressBar.width).toBeCloseTo((GAME.WIDTH - 32) / 2);

        updateHUD(30, true);
        expect(progressBar.width).toBe(GAME.WIDTH - 32);
        expect(progressBar.color).toEqual({ color: [255, 50, 50] });
    });

    it("stops updating after the player is destroyed", () => {
        const bounty = findText(k, "Bounty:");
        state.addScore(10);
        player.destroy();

        updateHUD(0, false);

        expect(bounty.text).toBe("Bounty: ฿ 0");
    });
});
