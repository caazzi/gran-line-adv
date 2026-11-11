// Shared factories for pooled Kaplay objects used by systems and entities.

import { vi } from "vitest";

export function makePooledObject(overrides = {}) {
    return {
        pos: { x: 0, y: 0 },
        angle: 0,
        opacity: 1,
        scale: { x: 1, y: 1 },
        color: null,
        velX: 0,
        velY: 0,
        shrinkRate: 1,
        destroy: vi.fn(),
        ...overrides,
    };
}
