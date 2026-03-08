// ============================================
// Asset Loader
// ============================================

export function loadAssets(k) {
    // Load Fonts
    k.loadFont("Bangers", "fonts/bangers.woff");
    k.loadFont("Outfit", "fonts/outfit.woff");

    // Load global sprites
    k.loadSprite("sunny", "sprites/sunny_anim.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: { from: 0, to: 1, speed: 4, loop: true }
        }
    });

    k.loadSprite("marine", "sprites/marine_anim.png", {
        sliceX: 2,
        sliceY: 1,
        anims: {
            idle: { from: 0, to: 1, speed: 4, loop: true }
        }
    });

    k.loadSprite("ocean", "sprites/ocean.png");
    k.loadSprite("rock", "sprites/rock.png");
    k.loadSprite("sea_monster", "sprites/sea_monster.png");

    k.loadSprite("chest", "sprites/chest.png", {
        sliceX: 2,
        sliceY: 2,
        anims: {
            idle: { from: 0, to: 0 },
            open: { from: 0, to: 3, speed: 5, loop: false }
        }
    });

    k.loadSprite("akuma", "sprites/akuma.png", {
        sliceX: 2,
        sliceY: 2,
        anims: {
            idle: { from: 0, to: 3, speed: 8, loop: true }
        }
    });

    const bossConfig = {
        sliceX: 2,
        sliceY: 2,
        anims: {
            idle: { from: 0, to: 1, speed: 4, loop: true },
            attack: { from: 2, to: 3, speed: 8, loop: false }
        }
    };

    k.loadSprite("boss_alvida", "sprites/boss_alvida.png", bossConfig);
    k.loadSprite("boss_smoker", "sprites/boss_smoker.png", bossConfig);
    k.loadSprite("boss_aokiji", "sprites/boss_aokiji.png", bossConfig);

    // Load static BGM
    k.loadSound("bgm", "sounds/bgm.wav");
}
