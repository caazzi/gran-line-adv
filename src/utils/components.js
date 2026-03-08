// ============================================
// Custom Kaplay Components
// ============================================

// Component for the Sea King bobbing animation
export function bobbing(amplitude = 20, speed = 4) {
    let t = 0;
    let initialY = 0;
    return {
        id: "bobbing",
        require: ["pos"],
        add() {
            initialY = this.pos.y;
        },
        update() {
            t += this.dt() * speed;
            this.pos.y = initialY + Math.sin(t) * amplitude;
        }
    };
}

// Component for Boss Enrage behavior
export function enrageable(config) {
    let isEnraged = false;
    return {
        id: "enrageable",
        require: ["health"],
        update() {
            if (!isEnraged && this.hp() <= config.hp * config.enrageThreshold) {
                isEnraged = true;

                // Visual feedback
                this.color = this.k.rgb(255, 100, 100);
                this.k.shake(10);

                // The new states are handled in boss.js by reading this component's property
                this.isEnraged = true;
            }
        }
    };
}
