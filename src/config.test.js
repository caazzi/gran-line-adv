import { describe, it, expect } from 'vitest';
import { GAME, LEVELS, PLAYER } from './config.js';

describe('Game Configuration', () => {

    it('should have correct base game dimensions', () => {
        expect(GAME.WIDTH).toBe(800);
        expect(GAME.HEIGHT).toBe(600);
        expect(GAME.SPRITE_BASE_RES).toBe(640);
    });

    it('player should start with 5 lives', () => {
        expect(PLAYER.LIVES).toBe(5);
    });

    describe('Level Configurations', () => {
        it('should have exactly 3 levels', () => {
            expect(LEVELS.length).toBe(3);
        });

        it('levels should increase in difficulty sequentially', () => {
            expect(LEVELS[0].enemyHpMult).toBeLessThan(LEVELS[1].enemyHpMult);
            expect(LEVELS[1].enemyHpMult).toBeLessThan(LEVELS[2].enemyHpMult);

            expect(LEVELS[0].enemySpeedMult).toBeLessThan(LEVELS[1].enemySpeedMult);
            expect(LEVELS[1].enemySpeedMult).toBeLessThan(LEVELS[2].enemySpeedMult);
        });

        it('each level should have a uniquely named boss', () => {
            const bossNames = LEVELS.map(l => l.boss.name);
            const uniqueBosses = new Set(bossNames);
            expect(uniqueBosses.size).toBe(3);
            expect(bossNames).toContain("Miss Love Duck");
            expect(bossNames).toContain("Marine Warship");
            expect(bossNames).toContain("Moby Dick");
        });

        it('bosses should enrage properly when threshold is hit', () => {
            LEVELS.forEach(level => {
                const boss = level.boss;
                expect(boss.enrageThreshold).toBeGreaterThan(0);
                expect(boss.enrageThreshold).toBeLessThan(1);
                // Enrage timer should be faster than base timer
                expect(boss.enrageAttackTimer).toBeLessThan(boss.baseAttackTimer);
                // Should change attacks when enraged
                expect(boss.enrageAttacks.length).toBeGreaterThanOrEqual(boss.attacks.length);
            });
        });
    });
});
