// ============================================
// Gran Line Adventure — Game Configuration
// ============================================

export const GAME = {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND: [10, 10, 46], // deep navy
    SPRITE_BASE_RES: 640,
    PLAYER_SCALE: 2.5,
    BOSS_SCALE: 2.5,
    TREASURE_SCALE: 2.0,
};

// -- Player (Thousand Sunny) --
export const PLAYER = {
    SPEED: 280,
    LIVES: 5,
    INVINCIBLE_TIME: 1.5, // seconds after taking damage
    WIDTH: 64,
    HEIGHT: 40,
};

// -- Gaon Cannon (Space) --
export const GAON_CANNON = {
    SPEED: 600,
    DAMAGE: 1,
    FIRE_RATE: 0.33, // seconds between shots
    WIDTH: 16,
    HEIGHT: 6,
    COLOR: [255, 200, 50], // golden
};

// -- Coup de Burst (E) --
export const COUP_DE_BURST = {
    SPEED: 400,
    DAMAGE: 3,
    COOLDOWN: 8, // seconds
    WIDTH: 40,
    HEIGHT: 580,
    COLOR: [100, 200, 255], // energy blue
};

// -- Soldier Dock Cannons (auto after Akuma no Mi) --
export const SOLDIER_DOCK = {
    SPEED: 500,
    DAMAGE: 1,
    DURATION: 10, // seconds active
    FIRE_RATE: 0.5,
    WIDTH: 10,
    HEIGHT: 4,
    COLOR: [255, 150, 50],
};

// -- Treasures --
export const TREASURE = {
    COIN: { POINTS: 10, COLOR: [255, 215, 0], SIZE: 16 },
    AKUMA: { POINTS: 50, COLOR: [148, 0, 211], SIZE: 22 },
    SPAWN_INTERVAL: [1.5, 3.5], // random range in seconds
    SPEED: 180,
};

// -- Enemies --
export const ENEMY = {
    SPEED: 120,
    FIRE_RATE: 2.0,    // seconds between shots
    BULLET_SPEED: 300,
    BULLET_DAMAGE: 1,
    HP: 2,
    SPAWN_INTERVAL: [2.0, 4.0],
    WIDTH: 48,
    HEIGHT: 28,
    COLOR: [100, 100, 180], // marine blue-gray
    BULLET_COLOR: [255, 80, 80],
};

// -- Levels & Bosses --
export const LEVELS = [
    {
        id: 1,
        name: "East Blue",
        duration: 60, // seconds before boss
        enemySpeedMult: 1.0,
        enemySpawnMult: 1.0,
        boss: {
            name: "Alvida",
            hp: 20,
            speed: 80,
            color: [200, 50, 100],
            width: 72,
            height: 48,
            attacks: ["charge", "spread"],
        },
    },
    {
        id: 2,
        name: "Loguetown",
        duration: 75,
        enemySpeedMult: 1.3,
        enemySpawnMult: 1.2,
        boss: {
            name: "Smoker",
            hp: 35,
            speed: 100,
            color: [180, 180, 180],
            width: 80,
            height: 52,
            attacks: ["charge", "spread", "smoke_wave"],
        },
    },
    {
        id: 3,
        name: "Grand Line",
        duration: 90,
        enemySpeedMult: 1.6,
        enemySpawnMult: 1.5,
        boss: {
            name: "Aokiji",
            hp: 50,
            speed: 120,
            color: [50, 150, 255],
            width: 88,
            height: 56,
            attacks: ["charge", "spread", "ice_age"],
        },
    },
];


