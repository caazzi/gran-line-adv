// ============================================
// Object Pool Utility for Kaplay (Performance)
// ============================================

export function createPool(k, initialSize, createFn) {
    const pool = [];

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
        const obj = createFn(k);
        obj.hidden = true;
        obj.paused = true;
        obj.pos.x = -9999;
        obj.pos.y = -9999;

        // Override destroy to release back to pool instead of GC
        obj.destroy = () => {
            obj.hidden = true;
            obj.paused = true;
            obj.pos.x = -9999;
            obj.pos.y = -9999;
        };

        pool.push(obj);
    }

    return {
        get() {
            // Find an available hidden object
            for (let i = 0; i < pool.length; i++) {
                if (pool[i].hidden) {
                    const obj = pool[i];
                    obj.hidden = false;
                    obj.paused = false;
                    obj.opacity = 1; // Reset opacity for reuse
                    return obj;
                }
            }
            // If pool is exhausted, create a new one to expand it
            const obj = createFn(k);
            obj.destroy = () => {
                obj.hidden = true;
                obj.paused = true;
                obj.pos.x = -9999;
                obj.pos.y = -9999;
            };
            pool.push(obj);
            return obj;
        },

        /** Return all objects in pool to hidden state */
        resetAll() {
            for (let i = 0; i < pool.length; i++) {
                pool[i].hidden = true;
                pool[i].paused = true;
                pool[i].pos.x = -9999;
                pool[i].pos.y = -9999;
            }
        },

        /** Get the count of currently active (visible) objects */
        activeCount() {
            let count = 0;
            for (let i = 0; i < pool.length; i++) {
                if (!pool[i].hidden) count++;
            }
            return count;
        },

        getAll() {
            return pool;
        },

        /** Total capacity */
        size() {
            return pool.length;
        }
    };
}
