# 🐦 Flappy Bird — Next.js

A fully featured, browser-based Flappy Bird clone built with **Next.js 14**, **TypeScript**, and the **HTML5 Canvas API**. Playable on desktop and mobile, with responsive scaling, object pooling, and a full property-based test suite.

🔗 **Live Demo**: flappy-bird-nextjs-theta.vercel.app

---

## ✨ Features

- 🎮 Smooth 60 FPS game loop via `requestAnimationFrame`
- 📱 Fully responsive — scales to any screen size
- ⌨️ Multi-input support: Spacebar, Mouse click, Touch tap
- 🏆 High score tracking (persisted in memory per session)
- ⚡ Object pooling for pipes to minimise garbage collection
- 🗺️ Spatial grid partitioning for efficient collision detection
- 🐛 Robust error handling with recovery strategies
- ♿ Accessibility-friendly UI labels and semantic HTML
- 🧪 Comprehensive test suite with Vitest + property-based tests (fast-check)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Rendering | HTML5 Canvas API |
| Styling | Inline styles (no CSS framework dependency) |
| Testing | Vitest + Testing Library + fast-check |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+

## 🗂️ Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout — metadata, viewport, body styles
│   └── page.tsx            # Home page — mounts the Game component
│
├── components/
│   ├── Canvas.tsx          # Canvas element wrapper with error handling & HiDPI support
│   ├── Game.tsx            # Top-level game component — wires all systems together
│   ├── GameOverOverlay.tsx # Game-over screen with score display and restart button
│   └── ReadyStateOverlay.tsx # "Tap to start" overlay shown before first input
│
├── config/
│   └── gameConfig.ts       # All tunable game constants (physics, canvas size, colours)
│
├── entities/
│   ├── Bird.ts             # Bird entity — gravity, flap, rendering, bounds
│   └── Pipe.ts             # Pipe entity — movement, gap generation, off-screen check
│
├── hooks/
│   └── useResponsiveCanvas.ts  # Custom hook — calculates canvas size for current viewport
│
├── managers/
│   ├── GameEngine.ts       # Main game loop, entity coordination, state orchestration
│   ├── GameStateManager.ts # FSM — READY → PLAYING → GAME_OVER → READY
│   ├── InputHandler.ts     # Unified input (keyboard / mouse / touch) with debounce
│   └── ScoreManager.ts     # Score & high score tracking with change callbacks
│
├── rendering/
│   └── Renderer.ts         # Canvas drawing — background, bird, pipes, score HUD
│
├── types/
│   └── index.ts            # All shared TypeScript interfaces and enums
│
└── utils/
    ├── collision.ts        # AABB collision detection helpers
    ├── ErrorHandler.ts     # Centralised error handling with recovery strategies
    ├── math.ts             # Shared maths utilities (clamp, lerp, random range)
    ├── ObjectPool.ts       # Generic object pool for reusable entities
    ├── PerformanceMonitor.ts # FPS tracking and performance budget warnings
    └── SpatialGrid.ts      # 2D spatial hash grid for broad-phase collision culling
```

---

## 🎮 How to Play

| Control | Action |
|---|---|
| `Space` | Flap / Start game |
| `Mouse click` | Flap / Start game |
| `Tap` (mobile) | Flap / Start game |

Navigate the bird through the gaps between the green pipes. Each pipe pair you pass scores **1 point**. The game ends when the bird hits a pipe or the ground.

---

## 🏗️ Architecture Overview

```
Game (React component)
│
├── useResponsiveCanvas      ← calculates viewport-aware canvas dimensions
├── Canvas                   ← manages HTMLCanvasElement lifecycle & HiDPI scaling
│
└── GameEngine               ← drives the game loop
    ├── GameStateManager     ← finite state machine (READY / PLAYING / GAME_OVER)
    ├── InputHandler         ← keyboard + mouse + touch → flap / restart events
    ├── ScoreManager         ← score increment, high-score persistence
    ├── Renderer             ← all canvas draw calls
    ├── Bird                 ← position, velocity, gravity, rendering
    ├── Pipe[]               ← pool-managed, spatial-grid indexed
    ├── ObjectPool<Pipe>     ← reduces GC pressure
    ├── SpatialGrid<Pipe>    ← broad-phase collision culling
    ├── PerformanceMonitor   ← FPS sampling & budget tracking
    └── ErrorHandler         ← structured error recovery
```

### Game Loop (60 FPS target)

```
requestAnimationFrame
  │
  ├─ performanceMonitor.update()
  ├─ deltaTime calculation (capped at 1/30 s to avoid tunnelling)
  ├─ update(deltaTime)
  │     ├─ bird.applyGravity() + bird.update()
  │     ├─ pipe.update() × N  (move left, update bounds)
  │     ├─ generatePipe()     (interval-based)
  │     ├─ cleanupPipes()     (return off-screen pipes to pool)
  │     ├─ checkScoring()     (bird x-position past pipe centre)
  │     └─ checkCollisions()  (spatial grid → AABB test)
  └─ render()
        └─ Renderer.renderFrame(bird, pipes, score, state)
```

---

## 🧪 Testing

The project uses **Vitest** for fast unit tests and **fast-check** for property-based tests.

```bash
npm run test          # single run (for CI / pre-commit)
npm run test:watch    # watch mode for development
```

Key test files:

| File | What it tests |
|---|---|
| `Bird.test.ts` | Physics invariants (gravity accumulation, terminal velocity, boundary clamping) |
| `Pipe.test.ts` | Pipe generation, movement, off-screen detection |
| `GameStateManager.test.ts` | Valid FSM transitions, guard conditions |
| `collision.test.ts` | AABB collision — property-based edge cases |
| `ScoreManager.test.ts` | Score increments, reset, high-score updates |
| `ObjectPool.test.ts` | Acquire/release cycle, pool growth limits |
| `SpatialGrid.test.ts` | Insert, query, clear — property-based |
| `PerformanceMonitor.test.ts` | FPS sampling accuracy |
| `GameIntegration.test.tsx` | Full component render + game loop integration |

---

> 👉 Play it live: flappy-bird-nextjs-theta.vercel.app
> 🔗 Source code: https://github.com/Abdullahtahir124/flappy-bird-nextjs
> #nextjs #typescript #gamedev #webdev #javascript #opensourcce

---

## 📄 License

MIT — feel free to fork, remix, and learn from it.
