// ============================================
// Minimal Kaplay test double
// ============================================
// Only implements the surface the game actually uses. Game objects record
// their components so tests can drive update/collision callbacks directly.

import { vi } from "vitest";

function applyComponent(obj, component) {
    if (typeof component === "string") {
        obj.tags.add(component);
        return;
    }
    if (!component || typeof component !== "object") return;

    if (component.__pos) {
        obj.pos = component.__pos;
        return;
    }
    if (component.__scale !== undefined) {
        const value = component.__scale;
        obj.scale = typeof value === "number" ? { x: value, y: value } : value;
        return;
    }
    if (component.__rect) {
        obj.width = component.width;
        obj.height = component.height;
        return;
    }
    if (component.__circle) {
        obj.radius = component.radius;
        return;
    }
    if (component.__text !== undefined) {
        obj.text = component.__text;
        obj.textOptions = component.options;
        return;
    }
    if (component.__sprite) {
        obj.spriteName = component.__sprite;
        obj.anim = component.options?.anim;
        return;
    }
    if (component.__health !== undefined) {
        obj.hp = component.__health;
        obj.maxHp = component.__health;
        return;
    }
    if (component.__opacity !== undefined) {
        obj.opacity = component.__opacity;
        return;
    }
    if (component.__color !== undefined) {
        obj.color = component.__color;
        return;
    }
    if (component.__angle !== undefined) {
        obj.angle = component.__angle;
        return;
    }

    for (const [key, value] of Object.entries(component)) {
        if (!key.startsWith("__")) obj[key] = value;
    }
}

export function makeK(overrides = {}) {
    const objects = [];
    const globalUpdates = [];
    const tagUpdates = new Map();
    const keyDownHandlers = new Map();
    const keyPressHandlers = new Map();
    const collideHandlers = [];
    const waits = [];
    const tweens = [];
    const sceneLeaveHandlers = [];
    const volume = { value: 1 };
    const heldKeys = new Set();

    const k = {
        debug: { paused: false },
        dtValue: 1 / 60,
        timeValue: 0,
        autoRunWaits: false,
        autoRunTweens: false,
        objects,
        waits,
        tweens,

        add(components = []) {
            components = Array.isArray(components) ? components : [components];
            const obj = {
                tags: new Set(),
                pos: { x: 0, y: 0 },
                scale: { x: 1, y: 1 },
                opacity: 1,
                angle: 0,
                hidden: false,
                paused: false,
                destroyed: false,
                children: [],
                updates: [],
                exists() {
                    return !obj.destroyed;
                },
                is(tag) {
                    return obj.tags.has(tag);
                },
                destroy: vi.fn(() => {
                    obj.destroyed = true;
                    obj.hidden = true;
                }),
                add(childComponents) {
                    const child = k.add(childComponents);
                    child.parent = obj;
                    obj.children.push(child);
                    return child;
                },
                use(...used) {
                    used.forEach((component) => applyComponent(obj, component));
                    return obj;
                },
                unuse(tag) {
                    obj.tags.delete(tag);
                    return obj;
                },
                play: vi.fn(),
                onUpdate(callback) {
                    const entry = { callback, active: true };
                    obj.updates.push(entry);
                    return {
                        cancel() {
                            entry.active = false;
                        },
                    };
                },
                onCollide: vi.fn(),
                onHover: vi.fn(),
                onHoverEnd: vi.fn(),
                onClick: vi.fn(),
            };

            components.forEach((component) => applyComponent(obj, component));
            objects.push(obj);
            return obj;
        },

        get(tag) {
            return objects.filter((obj) => !obj.destroyed && obj.is(tag));
        },

        onUpdate(tagOrCallback, maybeCallback) {
            if (typeof tagOrCallback === "function") {
                const entry = { callback: tagOrCallback, active: true };
                globalUpdates.push(entry);
                return {
                    cancel() {
                        entry.active = false;
                    },
                };
            }
            if (!tagUpdates.has(tagOrCallback)) tagUpdates.set(tagOrCallback, []);
            tagUpdates.get(tagOrCallback).push(maybeCallback);
        },

        onKeyDown(key, callback) {
            keyDownHandlers.set(key, callback);
        },

        onKeyPress(key, callback) {
            const keys = Array.isArray(key) ? key : [key];
            keys.forEach((item) => keyPressHandlers.set(item, callback));
        },

        onSceneLeave(callback) {
            sceneLeaveHandlers.push(callback);
        },

        onCollide(tagA, tagB, callback) {
            collideHandlers.push({ tagA, tagB, callback });
        },

        wait(time, callback) {
            const entry = { time, callback, done: false };
            waits.push(entry);
            if (k.autoRunWaits) k.runWaits();
            return entry;
        },

        tween(from, to, duration, setter, easing) {
            const entry = { from, to, duration, setter, easing, done: false };
            tweens.push(entry);
            return {
                then(callback) {
                    entry.then = callback;
                    if (k.autoRunTweens) {
                        entry.done = true;
                        callback?.();
                    }
                    return this;
                },
            };
        },

        press(key) {
            keyPressHandlers.get(key)?.();
        },

        keyDown(key) {
            keyDownHandlers.get(key)?.();
        },

        triggerCollide(tagA, tagB, first, second) {
            const handler = collideHandlers.find(
                (item) => item.tagA === tagA && item.tagB === tagB
            );
            if (!handler) {
                throw new Error(`No collision handler for ${tagA} -> ${tagB}`);
            }
            handler.callback(first, second);
        },

        runUpdates() {
            globalUpdates.forEach((entry) => {
                if (entry.active) entry.callback();
            });
            tagUpdates.forEach((callbacks, tag) => {
                k.get(tag).forEach((obj) => {
                    callbacks.forEach((callback) => callback(obj));
                });
            });
            objects.forEach((obj) => {
                if (obj.destroyed) return;
                obj.updates.forEach((entry) => {
                    if (entry.active) entry.callback();
                });
            });
        },

        runWaits() {
            // Snapshot first: callbacks may schedule follow-up waits that should
            // only run when the test explicitly advances time again.
            const pending = waits.filter((entry) => !entry.done);
            pending.forEach((entry) => {
                entry.done = true;
                entry.callback();
            });
        },

        leaveScene(nextScene) {
            sceneLeaveHandlers.forEach((callback) => callback(nextScene));
        },

        dt() {
            return k.dtValue;
        },

        time() {
            return k.timeValue;
        },

        clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        },

        isKeyDown(key) {
            return heldKeys.has(key);
        },

        hold(key) {
            heldKeys.add(key);
        },

        rand(min = 0, max) {
            if (max === undefined) {
                max = min;
                min = 0;
            }
            return (min + max) / 2;
        },

        choose(items) {
            return items[0];
        },

        vec2(x = 0, y = x) {
            return { x, y };
        },

        rgb(r, g, b) {
            return { r, g, b };
        },

        shake: vi.fn(),
        setCursor: vi.fn(),
        go: vi.fn(),
        onLoad: vi.fn(),
        onLoadError: vi.fn(),
        onError: vi.fn(),
        scene: vi.fn(),
        loadFont: vi.fn(),
        loadSprite: vi.fn(),
        loadSound: vi.fn(),

        width() {
            return 800;
        },

        height() {
            return 600;
        },

        setVolume(value) {
            volume.value = value;
        },

        getVolume() {
            return volume.value;
        },

        play: vi.fn(() => ({ stop: vi.fn() })),

        // Component constructors -------------------------------------------
        pos(x = 0, y = 0) {
            return { __pos: { x, y } };
        },
        scale(value = 1) {
            return { __scale: value };
        },
        rect(width = 0, height = 0) {
            return { __rect: true, width, height };
        },
        circle(radius = 0) {
            return { __circle: true, radius };
        },
        text(value, options = {}) {
            return { __text: value, options };
        },
        sprite(name, options = {}) {
            return { __sprite: name, options };
        },
        health(value) {
            return { __health: value };
        },
        opacity(value) {
            return { __opacity: value };
        },
        color(...values) {
            return { __color: values };
        },
        anchor: () => ({}),
        z: () => ({}),
        fixed: () => ({}),
        area: () => ({}),
        offscreen: () => ({}),
        lifespan: () => ({}),
        rotate(angle = 0) {
            return { __angle: angle };
        },
        move: () => ({}),
        polygon: () => ({}),

        Color: {
            fromArray: (values) => ({ color: [...values] }),
        },
        Vec2: {
            fromAngle: (angle) => ({
                x: Math.cos((angle * Math.PI) / 180),
                y: Math.sin((angle * Math.PI) / 180),
                scale(factor) {
                    return { x: this.x * factor, y: this.y * factor };
                },
            }),
        },
        Rect: class Rect {
            constructor(position, width, height) {
                this.position = position;
                this.width = width;
                this.height = height;
            }
        },
        easings: {
            easeOutQuad: vi.fn(),
            easeInQuad: vi.fn(),
        },
    };

    return Object.assign(k, overrides);
}
