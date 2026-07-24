// Core geometric types
export interface Vector2 {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Game state management
export enum GameState {
  READY = 'ready',
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

// Game configuration
export interface GameConfig {
  canvas: {
    width: number;
    height: number;
  };
  physics: {
    gravity: number;
    flapStrength: number;
    birdSpeed: number;
    pipeSpeed: number;
    terminalVelocity: number;
  };
  gameplay: {
    pipeSpacing: number;
    pipeGapSize: number;
    pipeWidth: number;
    minPipeHeight: number;
    maxPipeHeight: number;
  };
  rendering: {
    targetFPS: number;
    backgroundColor: string;
    birdColor: string;
    pipeColor: string;
  };
}

// Entity interfaces
export interface Entity {
  position: Vector2;
  velocity: Vector2;
  bounds: Rectangle;
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
}

export interface Bird extends Entity {
  flap(): void;
  applyGravity(deltaTime: number): void;
  isGrounded(): boolean;
}

export interface Pipe extends Entity {
  gapPosition: number;
  gapSize: number;
  hasBeenPassed: boolean;
  checkCollision(bird: Bird): boolean;
}

// Game state data structures
export interface BirdState {
  position: Vector2;
  velocity: Vector2;
  bounds: Rectangle;
  isAlive: boolean;
  rotation: number;
}

export interface PipeState {
  position: Vector2;
  bounds: Rectangle;
  gapPosition: number;
  gapSize: number;
  hasBeenPassed: boolean;
}

export interface GameSession {
  score: number;
  highScore: number;
  startTime: number;
  endTime?: number;
  pipes: PipeState[];
  bird: BirdState;
  state: GameState;
}

// System interfaces
export interface PhysicsSystem {
  gravity: number;
  terminalVelocity: number;
  flapStrength: number;
  
  applyGravity(entity: Entity, deltaTime: number): void;
  updatePosition(entity: Entity, deltaTime: number): void;
  clampVelocity(entity: Entity): void;
}

export interface GameStateManager {
  currentState: GameState;
  transitionTo(newState: GameState): void;
  canTransition(from: GameState, to: GameState): boolean;
}

export interface GameEngine {
  initialize(): void;
  start(): void;
  pause(): void;
  restart(): void;
  update(deltaTime: number): void;
  render(): void;
  getState(): GameState;
  getScore(): number;
  getHighScore(): number;
}

// Input handling types
export enum InputType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  TOUCH = 'touch'
}

export interface InputEvent {
  type: InputType;
  timestamp: number;
  originalEvent: Event;
}

export interface InputConfig {
  debounceTime: number;
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
}

export type InputCallback = (event: InputEvent) => void;

export interface InputHandler {
  initialize(targetElement?: HTMLElement): void;
  destroy(): void;
  onFlap(callback: InputCallback): void;
  onRestart(callback: InputCallback): void;
  removeFlap(callback: InputCallback): void;
  removeRestart(callback: InputCallback): void;
  updateConfig(config: Partial<InputConfig>): void;
  getConfig(): InputConfig;
}

export interface ScoreManager {
  currentScore: number;
  highScore: number;
  incrementScore(points?: number): void;
  resetScore(): void;
  resetAll(): void;
  onScoreChange(callback: () => void): void;
  removeScoreChangeCallback(callback: () => void): void;
  getScoreData(): { currentScore: number; highScore: number };
}