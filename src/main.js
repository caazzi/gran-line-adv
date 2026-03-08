// ============================================
// Gran Line Adventure — Main Entry Point
// ============================================
import kaplay from "kaplay";
import { GAME } from "./config.js";
import { loadAssets } from "./utils/assets.js";
import { menuScene } from "./scenes/menu.js";
import { gameScene } from "./scenes/game.js";
import { gameOverScene } from "./scenes/gameOver.js";
import { cutsceneScene } from "./scenes/cutscene.js";
import { victoryScene } from "./scenes/victory.js";



// Initialize Kaplay
const k = kaplay({
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    letterbox: true,
    background: GAME.BACKGROUND,
    crisp: true,
    canvas: document.querySelector("canvas") || undefined,
    global: false,
    font: "Outfit", // Default font for normal text
});

// Load all external assets
loadAssets(k);

// Register scenes
k.scene("menu", menuScene(k));
k.scene("game", gameScene(k));
k.scene("gameOver", gameOverScene(k));
k.scene("cutscene", cutsceneScene(k));
k.scene("victory", victoryScene(k));

// Start at menu
k.go("menu");
