import { describe, it, expect, vi } from 'vitest';
import { createPool } from './pool.js';

describe('Object Pooling Lifecycle', () => {
    it('should create a pool with the exact initial size', () => {
        const mockFactory = vi.fn(() => ({ hidden: true, pos: { x: 0, y: 0 } }));
        const mockK = {};

        const pool = createPool(mockK, 10, mockFactory);

        expect(pool.size()).toBe(10);
        expect(mockFactory).toHaveBeenCalledTimes(10);
    });

    it('should retrieve a hidden object from the pool instead of creating a new one', () => {
        // Mock object with essential Kaplay pool properties
        const mockObject = { hidden: true, pos: { x: 0, y: 0 } };
        const mockFactory = vi.fn(() => mockObject);
        const mockK = {};

        const pool = createPool(mockK, 1, mockFactory);
        expect(pool.size()).toBe(1);

        const retrieved = pool.get();
        expect(retrieved).toBe(mockObject);
        expect(retrieved.hidden).toBe(false);
        expect(mockFactory).toHaveBeenCalledTimes(1); // Factory wasn't called again
    });

    it('should create a new object if pool is exhausted', () => {
        // First object starts hidden
        const mockObject1 = { hidden: true, pos: { x: 0, y: 0 } };
        // Any subsequent object created by factory
        const mockObject2 = { hidden: true, pos: { x: 0, y: 0 } };

        const mockFactory = vi.fn()
            .mockReturnValueOnce(mockObject1)
            .mockReturnValueOnce(mockObject2);

        const mockK = {};

        const pool = createPool(mockK, 1, mockFactory);

        // Exhaust the pool
        const first = pool.get();
        expect(first).toBe(mockObject1);

        // Ask for another one while the first is not hidden
        const second = pool.get();
        expect(second).toBe(mockObject2);

        // Pool should have expanded
        expect(pool.size()).toBe(2);
        expect(mockFactory).toHaveBeenCalledTimes(2);
    });

    it('should force reset all objects on resetAll()', () => {
        const mockObjectFactory = () => {
            const obj = {
                hidden: false,
                pos: { x: 50, y: 50 }
            };
            return obj;
        };
        const mockK = {};

        // We do not mock destroy here because createPool physically overwrites obj.destroy!
        const pool = createPool(mockK, 3, mockObjectFactory);

        // Force them all to be "active" (not hidden)
        pool.getAll().forEach(obj => obj.hidden = false);

        pool.resetAll();

        // verify states reset
        pool.getAll().forEach(obj => {
            expect(obj.hidden).toBe(true);
            expect(obj.pos.x).toBe(-9999);
        });
    });
});
