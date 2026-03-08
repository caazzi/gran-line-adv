import { describe, it, expect, vi } from 'vitest';
import { enrageable, bobbing } from './components.js';

describe('Kaplay Custom Components', () => {
    describe('bobbing', () => {
        it('should return a valid Kaplay component object', () => {
            const component = bobbing(20, 4);
            expect(component.id).toBe("bobbing");
            expect(component.require).toContain("pos");
            expect(typeof component.add).toBe("function");
            expect(typeof component.update).toBe("function");
        });

        it('should update Y position based on sine wave over time', () => {
            const component = bobbing(20, 4);

            // Mock object context 'this' inside Kaplay components
            const mockContext = {
                pos: { y: 100 },
                dt: vi.fn(() => 0.5) // dt is 0.5 seconds
            };

            // Bind explicitly
            component.add.call(mockContext);
            expect(mockContext.pos.y).toBe(100);

            // Time advances
            component.update.call(mockContext);

            // Math.sin(0.5 * 4 speed) = Math.sin(2) * 20 amp = ~18.18
            // 100 + 18.18 = ~118.18
            expect(mockContext.pos.y).toBeGreaterThan(118);
            expect(mockContext.pos.y).toBeLessThan(119);
        });
    });

    describe('enrageable', () => {
        it('should return a valid Kaplay component object', () => {
            const config = { hp: 100, enrageThreshold: 0.3 };
            const component = enrageable(config);

            expect(component.id).toBe("enrageable");
            expect(component.require).toContain("health");
            expect(typeof component.update).toBe("function");
        });

        it('should trigger enrage when HP drops below threshold', () => {
            const config = { hp: 100, enrageThreshold: 0.3 };
            const component = enrageable(config);

            const mockContext = {
                hp: vi.fn(),
                color: null,
                k: {
                    rgb: vi.fn(() => 'rgb(255, 100, 100)'), // mocked rgb struct
                    shake: vi.fn()
                }
            };

            // Before dropping below 30
            mockContext.hp.mockReturnValue(50);
            component.update.call(mockContext);
            expect(mockContext.isEnraged).toBeUndefined();

            // Drop below threshold
            mockContext.hp.mockReturnValue(20);
            component.update.call(mockContext);

            expect(mockContext.isEnraged).toBe(true);
            expect(mockContext.color).toBe('rgb(255, 100, 100)');
            expect(mockContext.k.shake).toHaveBeenCalledWith(10);
        });

        it('should only trigger enrage exactly once', () => {
            const config = { hp: 100, enrageThreshold: 0.3 };
            const component = enrageable(config);

            const mockContext = {
                hp: vi.fn(() => 10), // start low
                color: null,
                k: {
                    rgb: vi.fn(),
                    shake: vi.fn()
                }
            };

            // First tick below
            component.update.call(mockContext);
            expect(mockContext.k.shake).toHaveBeenCalledTimes(1);

            // Second tick below
            component.update.call(mockContext);
            expect(mockContext.k.shake).toHaveBeenCalledTimes(1); // Should not increase
        });
    });
});
