# Gran Line Adventure ⛵🏴‍☠️

A 2D pirate adventure game built with [Kaplay](https://kaplayjs.com/). Sail the Grand Line, collect treasures, avoid sea monsters, and battle iconic marines!

## 🎮 How to Play

- **Move:** `W/A/S/D` or `Arrow Keys`
- **Gaon Cannon:** `Spacebar` (Main attack)
- **Coup de Burst:** `E` (Special attack - 8s cooldown)

## ✨ Features

- **Pixel Art Aesthetics:** Custom sprites for ships, coins, Devil Fruits, and bosses.
- **Boss Fights:** Encounter Alvida, Smoker, and Aokiji with unique attack patterns.
- **Upgrades:** Collect *Akuma no Mi* to temporarily activate the *Soldier Dock System* (auto-turrets).
- **Enemies & Obstacles:** Dodge whirlpools, sea kings, marine ships, and rocks!
- **Audio & BGM:** Immersive sound effects and looping background music.

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open your browser at:** `http://localhost:5173`

## 🛠️ Architecture & Tech Stack

- **Engine:** [Kaplay](https://kaplayjs.com/) (v3001)
- **Environment:** Node.js + Vite
- **Structure:**
  - `src/main.js`: Game initialization and scene registration.
  - `src/config.js`: Centralized constants (speeds, health, spawn rates).
  - `src/entities/`: Factories for game objects (Player, Boss, Enemy, Treasure, Obstacle).
  - `src/scenes/`: Logic isolated per game state (Menu, Game, GameOver, Victory).

## 📄 License

Created for fun and adventure.
