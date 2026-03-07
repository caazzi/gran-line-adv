// ============================================
// Gran Line Adventure — Main Entry Point
// ============================================
import kaplay from "kaplay";
import { GAME } from "./config.js";
import { menuScene } from "./scenes/menu.js";
import { gameScene } from "./scenes/game.js";
import { gameOverScene } from "./scenes/gameOver.js";
import { victoryScene } from "./scenes/victory.js";



// Initialize Kaplay
const k = kaplay({
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
    background: GAME.BACKGROUND,
    crisp: true,
    canvas: document.querySelector("canvas") || undefined,
    global: false,
});
// Load global assets
k.loadSprite("sunny", "sprites/sunny.png");
k.loadSprite("marine", "sprites/marine.png");
k.loadSprite("ocean", "sprites/ocean.png");
k.loadSprite("coin", "sprites/coin.png");
k.loadSprite("akuma", "sprites/akuma.png");
k.loadSprite("boss_alvida", "sprites/boss_alvida.png");
k.loadSprite("boss_smoker", "sprites/boss_smoker.png");
k.loadSprite("boss_aokiji", "sprites/boss_aokiji.png");

// Load sound effects and BGM
k.loadSound("shoot", "sounds/shoot.wav");
k.loadSound("coin", "sounds/coin.wav");
k.loadSound("explosion", "sounds/explosion.wav");
k.loadSound("bgm", "sounds/bgm.wav");

// Register scenes
k.scene("menu", menuScene(k));
k.scene("game", gameScene(k));
k.scene("gameOver", gameOverScene(k));
k.scene("victory", victoryScene(k));

// Start at menu
k.go("menu");
