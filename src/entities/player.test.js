import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../systems/weapons.js", () => ({
    spawnGaonBullet: vi.fn(),
    spawnCoupDeBurst: vi.fn(),
    spawnSoldierDockBullets: vi.fn(),
    spawnMeraMeraBullets: vi.fn(),
    triggerHaoshokuHaki: vi.fn(),
    triggerYataNoKagami: vi.fn(),
}));

import { createPlayer, activateSoldierDock } from "./player.js";
import {
    spawnCoupDeBurst,
    spawnGaonBullet,
    spawnMeraMeraBullets,
    spawnSoldierDockBullets,
    triggerHaoshokuHaki,
    triggerYataNoKagami,
} from "../systems/weapons.js";
import { resetPause, setPaused } from "../systems/pause.js";
import { COUP_DE_BURST, GAME, GAON_CANNON, HAOSHOKU_HAKI, PIKA_PIKA } from "../config.js";
import { makeK } from "../test/kaplay.js";

describe("player", () => {
    let k;
    let player;

    beforeEach(() => {
        vi.clearAllMocks();
        resetPause();
        k = makeK();
        player = createPlayer(k);
    });

    it("starts with full lives, cooldowns ready and all abilities off", () => {
        expect(player.is("player")).toBe(true);
        expect(player.pos).toEqual({ x: 100, y: GAME.HEIGHT / 2 });
        expect(player.lives).toBe(5);
        expect(player.gaonCooldown).toBe(0);
        expect(player.coupCooldown).toBe(0);
        expect(player.hakiCooldown).toBe(0);
        expect(player.meraMeraActive).toBe(false);
        expect(player.bariBariActive).toBe(false);
        expect(player.pikaPikaActive).toBe(false);
    });

    it("moves with WASD and clamps to the play area", () => {
        k.hold("d");
        k.hold("s");
        k.dtValue = 1;
        k.runUpdates();

        expect(player.pos.x).toBe(100 + 280);
        expect(player.pos.y).toBe(GAME.HEIGHT - 20 - 10);

        k = makeK();
        player = createPlayer(k);
        ["a", "w"].forEach((key) => k.hold(key));
        k.dtValue = 1;
        k.runUpdates();

        expect(player.pos.x).toBe(32);
        expect(player.pos.y).toBe(30);
    });

    it("counts down weapon cooldowns", () => {
        player.coupCooldown = 5;
        player.hakiCooldown = 2;
        player.gaonCooldown = 0.5;
        k.dtValue = 1;

        k.runUpdates();

        expect(player.coupCooldown).toBe(4);
        expect(player.hakiCooldown).toBe(1);
        expect(player.gaonCooldown).toBeLessThanOrEqual(0);
    });

    it("fires Gaon Cannon on Space and respects its fire rate", () => {
        k.keyDown("space");

        expect(spawnGaonBullet).toHaveBeenCalledWith(k, player.pos);
        expect(player.gaonCooldown).toBe(GAON_CANNON.FIRE_RATE);

        k.keyDown("space");
        expect(spawnGaonBullet).toHaveBeenCalledTimes(1);
    });

    it("uses Yata no Kagami on Space while Pika Pika is active", () => {
        player.pikaPikaActive = true;
        player.pikaPikaCooldown = 0;

        k.keyDown("space");

        expect(triggerYataNoKagami).toHaveBeenCalledWith(k, player);
        expect(player.pikaPikaCooldown).toBe(PIKA_PIKA.COOLDOWN);
        expect(spawnGaonBullet).not.toHaveBeenCalled();
    });

    it("fires Coup de Burst and Haki on their keys", () => {
        k.press("e");
        k.press("f");

        expect(spawnCoupDeBurst).toHaveBeenCalledWith(k, player.pos);
        expect(k.shake).toHaveBeenCalledWith(6);
        expect(player.coupCooldown).toBe(COUP_DE_BURST.COOLDOWN);
        expect(triggerHaoshokuHaki).toHaveBeenCalledWith(k, player);
        expect(player.hakiCooldown).toBe(HAOSHOKU_HAKI.COOLDOWN);
    });

    it("ignores weapon input while paused or after death", () => {
        setPaused(true);
        k.keyDown("space");
        k.press("e");
        k.press("f");
        expect(spawnGaonBullet).not.toHaveBeenCalled();
        expect(spawnCoupDeBurst).not.toHaveBeenCalled();
        expect(triggerHaoshokuHaki).not.toHaveBeenCalled();

        setPaused(false);
        player.destroy();
        k.keyDown("space");
        expect(spawnGaonBullet).not.toHaveBeenCalled();
    });

    it("auto-fires Soldier Dock until its timer expires", () => {
        activateSoldierDock(player);
        player.soldierDockTimer = 0.5;
        k.dtValue = 0.6;

        k.runUpdates();

        expect(spawnSoldierDockBullets).toHaveBeenCalledTimes(1);
        expect(player.soldierDockActive).toBe(false);
    });

    it("auto-fires Mera Mera until its timer expires", () => {
        player.meraMeraActive = true;
        player.meraMeraTimer = 0.5;
        player.meraMeraFireTimer = 0;
        k.dtValue = 0.6;

        k.runUpdates();

        expect(spawnMeraMeraBullets).toHaveBeenCalledTimes(1);
        expect(player.meraMeraActive).toBe(false);
    });

    it("expires Bari Bari and Pika Pika at the end of their timers", () => {
        player.bariBariActive = true;
        player.bariBariTimer = 0.1;
        player.pikaPikaActive = true;
        player.pikaPikaTimer = 0.1;
        player.pikaPikaCooldown = 0.5;
        k.dtValue = 0.2;

        k.runUpdates();

        expect(player.bariBariActive).toBe(false);
        expect(player.pikaPikaActive).toBe(false);
        expect(player.pikaPikaCooldown).toBe(0.3);
    });
});
