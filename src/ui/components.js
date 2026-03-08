// ============================================
// UI Components
// Reusable UI elements across scenes
// ============================================

/**
 * Creates a stylized interactive wooden plank button.
 * 
 * @param {import("kaplay").KaplayCtx} k Kaplay context
 * @param {string} text The text to display on the button
 * @param {import("kaplay").Vec2} pos The center position of the button
 * @param {function} onClick Callback when the button is clicked
 * @param {object} options Optional configurations (width, height, textSize)
 * @returns {import("kaplay").GameObj} The button group container
 */
export function createWoodenButton(k, text, pos, onClick, options = {}) {
    const width = options.width || 220;
    const height = options.height || 45;
    const textSize = options.textSize || 24;

    const btnGroup = k.add([
        k.pos(pos.x, pos.y),
        k.anchor("center"),
        k.area({ shape: new k.Rect(k.vec2(0), width, height) }),
        "wooden_btn",
    ]);

    // Drop shadow
    btnGroup.add([
        k.rect(width, height, { radius: 8 }),
        k.color(30, 20, 10),
        k.pos(3, 3), // slight offset
        k.anchor("center"),
    ]);

    // Main wooden board
    const base = btnGroup.add([
        k.rect(width, height, { radius: 8 }),
        k.color(130, 70, 40), // Standard wood color
        k.pos(0, 0),
        k.anchor("center"),
    ]);

    // Nails
    const nailX = width / 2 - 15;
    const nailY = height / 2 - 7;
    const nails = [
        [-nailX, -nailY], // top left
        [nailX, -nailY],  // top right
        [-nailX, nailY],  // bottom left
        [nailX, nailY]    // bottom right
    ];

    nails.forEach(nPos => {
        btnGroup.add([
            k.circle(3),
            k.color(60, 60, 60),
            k.pos(nPos[0], nPos[1]),
            k.anchor("center")
        ]);
    });

    // Text
    const label = btnGroup.add([
        k.text(text, { size: textSize, font: "Bangers" }),
        k.color(255, 220, 180),
        k.pos(0, -2), // slight visual alignment up
        k.anchor("center"),
    ]);

    // Interaction states
    btnGroup.onHover(() => {
        base.color = k.Color.fromArray([150, 90, 50]); // Lighter wood
        label.color = k.Color.fromArray([255, 240, 200]); // Brighter text
        btnGroup.scale = k.vec2(1.05);
        k.setCursor("pointer");
    });

    btnGroup.onHoverEnd(() => {
        base.color = k.Color.fromArray([130, 70, 40]); // Reset wood
        label.color = k.Color.fromArray([255, 220, 180]); // Reset text
        btnGroup.scale = k.vec2(1.0);
        k.setCursor("default");
    });

    // We can't use generic Enter/Space keys globally safely without binding to the scene
    // So we only bind the mouse click here. The scene handler can bind global keys if needed.
    btnGroup.onClick(onClick);

    return btnGroup;
}
