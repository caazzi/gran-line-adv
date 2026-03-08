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

// -- Haoshoku Haki (F) --
export const HAOSHOKU_HAKI = {
    COOLDOWN: 15, // seconds 
    COLOR: [255, 0, 50], // crimson red
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

// -- Mera Mera no Mi (Fire Spread) --
export const MERA_MERA = {
    SPEED: 450,
    DAMAGE: 2,
    DURATION: 12,
    FIRE_RATE: 0.25,
    WIDTH: 12,
    HEIGHT: 12,
    COLOR: [255, 100, 20], // intense orange-red
};

// -- Bari Bari no Mi (Shield) --
export const BARI_BARI = {
    DURATION: 15,
    COLOR: [50, 255, 150], // barrier green
};

// -- Pika Pika no Mi (Light Dash) --
export const PIKA_PIKA = {
    DURATION: 10,
    DASH_SPEED: 2500,
    DAMAGE: 10,
    COOLDOWN: 1.5,
    COLOR: [255, 255, 50], // bright yellow
};

// -- Treasures --
export const TREASURE = {
    COIN: { POINTS: 10, COLOR: [255, 215, 0], SIZE: 16 },
    AKUMA: { POINTS: 50, COLOR: [148, 0, 211], SIZE: 22 }, // Base generic devil fruit
    MERA_MERA: { POINTS: 100, COLOR: [255, 100, 20], SIZE: 24 },
    BARI_BARI: { POINTS: 100, COLOR: [50, 255, 150], SIZE: 24 },
    PIKA_PIKA: { POINTS: 500, COLOR: [255, 255, 50], SIZE: 24 }, // Ultra rare
    SPAWN_INTERVAL: [1.5, 3.5], // random range in seconds
    SPEED: 180,
};

// -- Enemies --
export const ENEMY = {
    SPEED: 120,
    FIRE_RATE: 2.0,    // BASE seconds between shots (modified by level)
    BULLET_SPEED: 300,
    BULLET_DAMAGE: 1,
    HP: 2,             // BASE hp (modified by level)
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
        duration: 60,
        enemySpeedMult: 1.0,
        enemySpawnMult: 1.0,
        enemyHpMult: 1.0,         // Enemies have base HP
        enemyFireRateMult: 1.0,   // Normal fire rate
        coinValue: 10,            // Base coin value
        treasureSpeedMult: 1.0,   // Treasure drifts normally
        obstacles: ["rock"],      // Gentle intro to obstacles
        obstacleSpawnMult: 0.5,   // Half frequency
        boss: {
            name: "Alvida",
            hp: 20,
            speed: 80,
            color: [200, 50, 100],
            width: 72,
            height: 48,
            attacks: ["charge", "spread"],
            enrageAttacks: ["charge", "spread", "spread"], // More spread when low HP
            enrageThreshold: 0.3,  // Enrage below 30% HP
            baseAttackTimer: 2.5,
            enrageAttackTimer: 1.5, // Faster attacks when enraged
        },
    },
    {
        id: 2,
        name: "Loguetown",
        duration: 75,
        enemySpeedMult: 1.3,
        enemySpawnMult: 1.2,
        enemyHpMult: 1.5,         // Enemies are tougher
        enemyFireRateMult: 0.8,   // Fire 20% faster
        coinValue: 20,            // More rewarding
        treasureSpeedMult: 1.2,   // Slightly faster drift
        obstacles: ["rock", "whirlpool"],
        obstacleSpawnMult: 1.0,
        boss: {
            name: "Smoker",
            hp: 35,
            speed: 100,
            color: [180, 180, 180],
            width: 80,
            height: 52,
            attacks: ["charge", "spread", "smoke_wave"],
            enrageAttacks: ["smoke_wave", "spread", "charge", "smoke_wave"],
            enrageThreshold: 0.35,
            baseAttackTimer: 2.2,
            enrageAttackTimer: 1.2,
        },
    },
    {
        id: 3,
        name: "Grand Line",
        duration: 90,
        enemySpeedMult: 1.6,
        enemySpawnMult: 1.5,
        enemyHpMult: 2.0,         // Enemies are very tough
        enemyFireRateMult: 0.6,   // Fire 40% faster
        coinValue: 30,            // Highest reward
        treasureSpeedMult: 1.4,   // Fastest drift
        obstacles: ["rock", "whirlpool", "sea_king"],
        obstacleSpawnMult: 1.3,
        boss: {
            name: "Aokiji",
            hp: 50,
            speed: 120,
            color: [50, 150, 255],
            width: 88,
            height: 56,
            attacks: ["charge", "spread", "ice_age"],
            enrageAttacks: ["ice_age", "spread", "ice_age", "charge", "spread"],
            enrageThreshold: 0.4,  // Enrages earlier (40% HP)
            baseAttackTimer: 2.0,
            enrageAttackTimer: 1.0, // Relentless at low HP
        },
    },
];


