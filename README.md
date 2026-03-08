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

3. **Run the Test Suite:**
   ```bash
   npm run test
   ```

4. **Open your browser at:** `http://localhost:3256`

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

- [x] **Trocar o ícone do tesouro para um Baú do Tesouro** — o sprite atual da moeda é genérico. Um baú animado (abrindo ao ser coletado) daria mais personalidade.
- [ ] **Efeitos de partículas temáticos por nível** — Level 1: gaivotas voando; Level 2: fumaça de canhões; Level 3: flocos de gelo.
- [ ] **Parallax scrolling no background** — adicionar camadas de nuvens, ondas, e ilhas distantes que se movem em velocidades diferentes para dar profundidade.
- [x] **Sprite sheets animados** — substituir sprites estáticos por animações frame-by-frame (navio balançando, inimigos com thrust de motor, frutas girando).
- [x] **Uniformizar toda a estética com Pixel Art** — atualmente a mistura de resoluções entre sprites gera inconsistências. Migrar todos os assets para uma paleta Pixel Art de resolução consistente (ex: 32×32 ou 64×64).

### ⚔️ Gameplay & Mecânicas

- [ ] **Sistema de Combo** — acertar inimigos consecutivos sem tomar dano aumenta um multiplicador de score (×2, ×3, ×4...).
- [ ] **Power-up temporários passivos** — além das Akuma no Mi, adicionar speed boost, double damage, e magnet (atrai moedas automaticamente).
- [ ] **Sistema de Waves por nível** — em vez de spawn contínuo por 60-90s, dividir cada nível em 3-5 waves com descanso entre elas e um contador "Wave 3/5".
- [x] **Cutscene de Vitória** — ao vencer o último boss, exibir uma animação onde o Thousand Sunny navega até uma baía com 4 ilhas (entrando pela esquerda). O navio desliza até o centro das ilhas e encontra o One Piece, com efeito de brilho dourado e revelação dramática antes do leaderboard.
- [ ] **Mini-boss intermediário** — spawnar um mini-boss (ex: Morgan, Buggy) na metade do tempo de cada nível para quebrar a monotonia.
- [ ] **Novos tipos de inimigos por nível** — Level 1: barcos pequenos; Level 2: fragatas com escudo; Level 3: navios de guerra que atiram em 3 direções.
- [ ] **Boss com fases múltiplas** — ao invés de uma única barra de HP, dividir em 2-3 fases com cutscenes curtas e mudanças visuais (ex: Smoker ganha aura, Aokiji congela a tela parcialmente).

### 🏗️ Infraestrutura & QoL

- [x] **Leaderboard local** — armazenar os top 5 scores com nome do jogador via `localStorage`.
- [x] **Testes Unitários Básicos (Vitest)** — Configuração base do Vitest com a primeira spec testando o `config.js` e status de Chefões.
- [x] **Testes de Lógica de Jogo (Game Logic)** — Testar a integridade da progressão de dificuldade, multiplicadores e cooldowns.
- [ ] **Testes de Colisão (Hitboxes)** — Validar hitboxes de nave, baús, inimigos, rochas e sea kings baseando-se no offset e escala dos sprites.
- [x] **Testes de Gestão de Estado (Store/LocalStorage)** — Garantir o salvamento da pontuação máxima, persistência e leitura do *Highest Bounty*.
- [x] **Testes de Reciclagem (Object Pools)** — Testar o ciclo de vida dos projéteis para impedir memory leaks.
- [ ] **Testes de Integração de Eventos** — Verificar se a bus event (`on("player_damaged")`, etc) está disparando e deduzindo as vidas corretamente.

### 🎵 Áudio

- [x] **SFX para cada Akuma no Mi** — som único ao coletar cada fruta.
- [x] **Victory jingle** — fanfarra curta ao derrotar o boss.
- [x] **Boss entrance fanfare** — som dramático quando o boss aparece.
- [x] **BGM diferente por nível** — cada mar tem sua trilha temática.

### 🏗️ Arquitetura & Código (Code Quality)

- [x] **Extração do Asset Loader (Single Responsibility):** O arquivo `src/main.js` atual possui mais de 100 linhas carregando fontes, sprites em pixel art (com configurações pesadas de _slices_ e _anims_) e sons. Extrair todo esse carregamento para um `src/utils/assets.js` assíncrono, mantendo o `main.js` limpo.
- [x] **Componentização Dinâmica no Kaplay:** Em vez de usarmos `k.onUpdate(() => {...})` atrelado aos objetos nos *factories* (ex: o nado do *Sea King* ou a checagem de *Enrage* dos Bosses), criar componentes customizados do Kaplay (`function enrageable() { return { id: "enrage", update() {...} } }`). Isso evita vazamentos de memória e deixa os comportamentos perfeitamente reaproveitáveis para novos inimigos.
- [x] **Centralização de Estado Global (State Management):** A pontuação atual e índice do nível são passados sequencialmente através da injeção de dependência na renderização nativa da cena (ex: `k.go("game", { score, levelIndex })`). Devemos implementar um `store` global (`src/state.js`) ou usar o nativo `k.setData/k.getData` para coordenar o estado do progresso sem sujar a assinatura das `scenes`.
- [x] **Eliminação de "Magic Numbers" (Z-Index e Layering):** Espalhados pelos sistemas e fábricas de entidades existem hardcodings (`k.z(100)`, `k.z(20)`). Extrair essas constantes para um `Z_LAYERS = { bg: -10, player: 10, ui: 100 }` no `config.js` resolve conflitos visuais e simplifica futuras atualizações da UI.
- [x] **Melhoria da Detecção de Física (Performace):** A checagem ampla em `collisions.js` (ex: iterar ou colidir entre várias pequenas tags separadamente) pode pesar. Podemos agrupar componentes genéricos de colisão usando *Tags de Categoria* (ex: todo objeto que causa dano ao player vira a tag `harmful`), resolvendo dezenas de colisões em apenas um `.onCollide("player", "harmful")`.
- [x] **Design Responsivo / Letterboxing (Scale & Layout):** A tela do Kaplay está engessada em `width: 800, height: 600`. Ativar `letterbox: true` e atrelar a `canvas` dinamicamente com base nas dimensões de janela (`window.innerWidth`) utilizando escalas percentuais de layout do Kaplay fará o jogo funcionar responsivamente em monitores maiores e Mobile PWA.

### 🚀 Futuro & Escalabilidade (Phase 2)

Agora que a fundação arquitetural está sólida e testada, as próximas fronteiras de evolução técnica podem incluir:

- [ ] **Controles Mobile (Touch UI)** — Já que implementamos o *Letterboxing* e o jogo é responsivo, adicionar Joysticks virtuais e botões nativos de Touch (`k.onTouchStart`) permitirá empacotar o jogo como um PWA (Progressive Web App) para celulares.
- [ ] **Integração Contínua (CI/CD via GitHub Actions)** — Criar um arquivo `.github/workflows/test.yml` para rodar nosso recém-criado `npm run test` e `npm run build` automaticamente em cada `git push` ou Pull Request, blindando a branch principal.
- [ ] **Internacionalização (i18n)** — Extrair textos hardcoded (como "TOP PIRATAS", "Nível", e nomes das Akuma no Mi) para um dicionário, permitindo que o jogo alterne entre Português e Inglês dinamicamente no Menu.
- [ ] **Testes E2E Visuais (Playwright)** — Complementar nossos testes unitários lógicos com automação de navegador ponta-a-ponta, testando cliques reais no canvas do Kaplay e mudanças cromáticas (como a aura do Boss Enrage).
- [ ] **Save States / Checkpoints** — Evoluir o sistema de `localStorage` atual (que guarda apenas o Bounty final) para salvar o estado global do meio de uma run, permitindo que o jogador feche o navegador e continue a jornada do Mar em que parou.

---

## 📄 License

Created for fun and adventure. 🏴‍☠️
