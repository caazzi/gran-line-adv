# Gran Line Adventure ⛵🏴‍☠️

A 2D pirate adventure game inspired by One Piece, built with [Kaplay](https://kaplayjs.com/). Sail the Grand Line aboard the Thousand Sunny, collect treasures, eat Devil Fruits, and battle iconic marines!

## 📊 Project Status

| Area | Status |
|---|---|
| Core Gameplay | ✅ Complete — 3 levels with progressive difficulty |
| Boss Fights | ✅ Complete — Alvida, Smoker, Aokiji with enrage mechanics |
| Powers (Akuma no Mi) | ✅ Complete — 4 fruits with unique abilities |
| UI/UX | ✅ Complete — Custom fonts, wooden plank buttons, floating combat text |
| Performance | ✅ Complete — Object pooling, event bus, pool reset on scene transitions |
| Architecture | ✅ Complete — Modular weapons system, UI components, centralized config |

## 🎮 How to Play

| Control | Action |
|---|---|
| `W/A/S/D` or `Arrow Keys` | Move the Thousand Sunny |
| `Spacebar` | Gaon Cannon (main attack, 0.33s cooldown) |
| `E` | Coup de Burst (energy beam, 8s cooldown) |
| `F` | Haoshoku Haki (screen clear, 15s cooldown) |

### 🍎 Akuma no Mi (Devil Fruits)

Collect glowing fruits to gain temporary powers:

| Fruit | Color | Effect | Duration |
|---|---|---|---|
| **Soldier Dock** | 🟣 Purple | Auto-turrets fire spread shots | 10s |
| **Mera Mera** | 🟠 Orange | Triple fire projectiles | 12s |
| **Bari Bari** | 🟢 Green | Invincibility shield | 15s |
| **Pika Pika** | 🟡 Yellow | Light-speed dash attack (ultra rare) | 10s |

## ✨ Features

- **3 Progressive Levels:** East Blue → Loguetown → Grand Line, each with escalating difficulty.
- **Boss Enrage System:** Bosses switch to faster, deadlier attack patterns when HP drops low.
- **Difficulty Scaling:** Enemy HP, fire rate, coin value, and obstacle frequency all scale per level.
- **Level Intro Announcements:** Dramatic fade-in/out of the level name at the start of each stage.
- **Custom Pixel Art:** Sprites for the Thousand Sunny, Marine ships, Devil Fruits, and bosses.
- **Object Pooling:** Bullets, particles, and enemy projectiles are recycled for smooth performance.
- **Modular Architecture:** Weapons system, UI components, and event bus are all decoupled modules.
- **Persistent High Score:** Bounty is tracked via localStorage and displayed on Game Over/Victory screens.
- **Score Accumulation:** Bounty carries over between levels — the final score is the sum of all 3 stages.

## 🚀 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Open your browser at:** `http://localhost:3256`

## 🛠️ Architecture & Tech Stack

- **Engine:** [Kaplay](https://kaplayjs.com/) (v3001)
- **Environment:** Node.js + Vite
- **Structure:**
  - `src/main.js` — Game initialization, asset loading, scene registration.
  - `src/config.js` — Centralized constants (speeds, HP, spawn rates, level configs).
  - `src/entities/` — Factories: Player, Boss, Enemy, Treasure, Obstacle.
  - `src/scenes/` — Scene logic: Menu, Game, GameOver, Victory.
  - `src/systems/` — Weapons, Collisions, Object Pools, Event Bus.
  - `src/ui/` — HUD, reusable UI components (wooden buttons).
  - `src/utils/` — Pool utility (generic object recycling).

---

## 🗺️ Roadmap — Melhorias Futuras

### 🎨 Arte & Estética

- [ ] **Trocar o ícone do tesouro para um Baú do Tesouro** — o sprite atual da moeda é genérico. Um baú animado (abrindo ao ser coletado) daria mais personalidade.
- [ ] **Efeitos de partículas temáticos por nível** — Level 1: gaivotas voando; Level 2: fumaça de canhões; Level 3: flocos de gelo.
- [ ] **Parallax scrolling no background** — adicionar camadas de nuvens, ondas, e ilhas distantes que se movem em velocidades diferentes para dar profundidade.
- [ ] **Sprite sheets animados** — substituir sprites estáticos por animações frame-by-frame (navio balançando, inimigos com thrust de motor, frutas girando).
- [ ] **Uniformizar toda a estética com Pixel Art** — atualmente a mistura de resoluções entre sprites gera inconsistências. Migrar todos os assets para uma paleta Pixel Art de resolução consistente (ex: 32×32 ou 64×64).

### ⚔️ Gameplay & Mecânicas

- [ ] **Sistema de Combo** — acertar inimigos consecutivos sem tomar dano aumenta um multiplicador de score (×2, ×3, ×4...).
- [ ] **Power-up temporários passivos** — além das Akuma no Mi, adicionar speed boost, double damage, e magnet (atrai moedas automaticamente).
- [ ] **Sistema de Waves por nível** — em vez de spawn contínuo por 60-90s, dividir cada nível em 3-5 waves com descanso entre elas e um contador "Wave 3/5".
- [ ] **Mini-boss intermediário** — spawnar um mini-boss (ex: Morgan, Buggy) na metade do tempo de cada nível para quebrar a monotonia.
- [ ] **Novos tipos de inimigos por nível** — Level 1: barcos pequenos; Level 2: fragatas com escudo; Level 3: navios de guerra que atiram em 3 direções.
- [ ] **Boss com fases múltiplas** — ao invés de uma única barra de HP, dividir em 2-3 fases com cutscenes curtas e mudanças visuais (ex: Smoker ganha aura, Aokiji congela a tela parcialmente).

### 🏗️ Infraestrutura & QoL

- [ ] **Pause Menu** — ESC para pausar com opções de continuar, reiniciar, e voltar ao menu.
- [ ] **Settings Screen** — controle de volume (BGM e SFX separados), toggle de screen shake, e rebind de teclas.
- [ ] **Leaderboard local** — armazenar os top 5 scores com nome do jogador via `localStorage`.
- [ ] **Tutorial interativo** — no primeiro jogo, exibir tooltips com os controles conforme o jogador avança.
- [ ] **i18n** — suporte a Português e Inglês com toggle no menu.
- [ ] **Mobile touch controls** — joystick virtual e botões de ataque para jogar no celular.

### 🎵 Áudio

- [ ] **SFX para cada Akuma no Mi** — som único ao coletar cada fruta.
- [ ] **Victory jingle** — fanfarra curta ao derrotar o boss.
- [ ] **Boss entrance fanfare** — som dramático quando o boss aparece.
- [ ] **BGM diferente por nível** — cada mar tem sua trilha temática.

---

## 📄 License

Created for fun and adventure. 🏴‍☠️
