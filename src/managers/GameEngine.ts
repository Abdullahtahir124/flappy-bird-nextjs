import { GameEngine as IGameEngine, GameState, Vector2 } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';
import { Bird } from '@/entities/Bird';
import { Pipe } from '@/entities/Pipe';
import { GameStateManager } from './GameStateManager';
import { InputHandler } from './InputHandler';
import { ScoreManager } from './ScoreManager';
import { Renderer } from '@/rendering';
import { checkAllCollisions, handleCollisionResponse } from '@/utils/collision';
import { ObjectPool } from '@/utils/ObjectPool';
import { PerformanceMonitor } from '@/utils/PerformanceMonitor';
import { SpatialGrid } from '@/utils/SpatialGrid';
import { ErrorHandler, ErrorType } from '@/utils/ErrorHandler';

/**
 * Core game engine that manages the main game loop, entity management,
 * and coordinates all game systems including physics, collision, and rendering
 */
export class GameEngine implements IGameEngine {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private config = DEFAULT_GAME_CONFIG;
  private renderer: Renderer;
  
  // Game systems
  private gameStateManager: GameStateManager;
  private inputHandler: InputHandler;
  private scoreManager: ScoreManager;
  
  // Game entities
  private bird: Bird;
  private pipes: Pipe[] = [];
  
  // Performance optimizations
  private pipePool: ObjectPool<Pipe>;
  private performanceMonitor: PerformanceMonitor;
  private spatialGrid: SpatialGrid<Pipe>;
  
  // Error handling
  private errorHandler: ErrorHandler;
  private isInErrorState: boolean = false;
  
  // Game loop management
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  
  // Pipe generation timing
  private lastPipeGenerationTime: number = 0;
  private pipeGenerationInterval: number;
  
  // Visibility change handling for pause/resume
  private visibilityChangeHandler: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Initialize error handler first
    this.errorHandler = new ErrorHandler((error, recovery) => {
      this.handleGameError(error, recovery);
    });
    
    // Validate canvas context with error handling
    const context = this.errorHandler.validateCanvasContext(canvas);
    if (!context) {
      this.isInErrorState = true;
      throw new Error('Failed to initialize canvas context');
    }
    this.context = context;
    
    // Initialize renderer with error handling
    try {
      this.renderer = new Renderer(context, this.config);
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.RESOURCE_LOADING_ERROR,
        'Failed to initialize renderer',
        { error }
      );
      this.isInErrorState = true;
      throw error;
    }
    
    // Initialize performance optimizations with error handling
    try {
      this.performanceMonitor = new PerformanceMonitor(this.config.rendering.targetFPS);
      this.spatialGrid = new SpatialGrid<Pipe>(
        this.config.gameplay.pipeWidth * 2, // Cell size based on pipe width
        this.config.canvas.width,
        this.config.canvas.height
      );
      
      // Initialize pipe object pool
      this.pipePool = new ObjectPool<Pipe>(
        () => new Pipe(0), // Create function
        (pipe) => pipe.reset(0), // Reset function
        5, // Initial pool size
        20 // Max pool size
      );
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Failed to initialize performance systems',
        { error }
      );
      // Continue without optimizations if they fail
      this.performanceMonitor = new PerformanceMonitor(this.config.rendering.targetFPS);
      this.spatialGrid = new SpatialGrid<Pipe>(100, this.config.canvas.width, this.config.canvas.height);
      this.pipePool = new ObjectPool<Pipe>(() => new Pipe(0), (pipe) => pipe.reset(0), 1, 5);
    }
    
    // Initialize game systems with error handling
    try {
      this.gameStateManager = new GameStateManager();
      this.inputHandler = new InputHandler(this.gameStateManager);
      this.scoreManager = new ScoreManager();
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.GAME_STATE_CORRUPTION,
        'Failed to initialize game systems',
        { error }
      );
      this.isInErrorState = true;
      throw error;
    }
    
    // Initialize bird at starting position with error handling
    try {
      const startX = this.config.canvas.width * 0.2; // 20% from left edge
      const startY = this.config.canvas.height * 0.5; // Center vertically
      this.bird = new Bird(startX, startY);
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.GAME_STATE_CORRUPTION,
        'Failed to initialize bird entity',
        { error }
      );
      this.isInErrorState = true;
      throw error;
    }
    
    // Calculate pipe generation interval based on spacing and speed
    this.pipeGenerationInterval = this.config.gameplay.pipeSpacing / this.config.physics.pipeSpeed;
    
    // Set up visibility change handler for pause/resume
    this.visibilityChangeHandler = () => this.handleVisibilityChange();
    
    this.setupInputHandlers();
    this.setupStateChangeHandlers();
  }

  /**
   * Updates canvas size and scaling for responsive design
   * @param width New canvas width
   * @param height New canvas height
   * @param scale Scaling factor for responsive design
   */
  updateCanvasSize(width: number, height: number, scale: number = 1): void {
    // Handle high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;
    
    // Update canvas dimensions accounting for device pixel ratio
    this.canvas.width = width * devicePixelRatio;
    this.canvas.height = height * devicePixelRatio;
    
    // Update canvas CSS size
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Scale the drawing context
    this.context.scale(devicePixelRatio, devicePixelRatio);
    
    // Update renderer with new scaling
    this.renderer.updateScale(scale);
    
    // Re-configure context for crisp rendering
    this.context.imageSmoothingEnabled = false;
    
    // Apply additional scaling for responsive design
    if (scale !== 1) {
      this.context.scale(scale, scale);
    }
    
    console.log(`Canvas size updated: ${width}x${height}, scale: ${scale}, devicePixelRatio: ${devicePixelRatio}`);
  }

  /**
   * Initializes the game engine and prepares for gameplay
   */
  initialize(): void {
    // Set canvas size
    this.canvas.width = this.config.canvas.width;
    this.canvas.height = this.config.canvas.height;
    
    // Initialize input handler
    this.inputHandler.initialize(this.canvas);
    
    // Add visibility change listener for pause/resume functionality
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    
    // Reset to initial state
    this.reset();
    
    console.log('GameEngine initialized');
  }

  /**
   * Starts the game loop
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Game is already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
    
    console.log('Game started');
  }

  /**
   * Pauses the game loop
   */
  pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    this.isPaused = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Game paused');
  }

  /**
   * Resumes the game loop from pause
   */
  resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    
    this.isPaused = false;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
    
    console.log('Game resumed');
  }

  /**
   * Restarts the game by resetting all systems and returning to ready state
   */
  restart(): void {
    this.reset();
    this.gameStateManager.transitionTo(GameState.READY);
    console.log('Game restarted');
  }

  /**
   * Updates all game systems and entities
   * @param deltaTime Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    // Skip update if in error state
    if (this.isInErrorState) {
      return;
    }

    try {
      // Validate game state periodically
      if (Math.random() < 0.01) { // 1% chance per frame
        this.validateGameStateIntegrity();
      }

      const currentState = this.gameStateManager.currentState;
      
      // Only update physics and entities during active gameplay
      if (currentState === GameState.PLAYING) {
        this.updateGameplay(deltaTime);
      }
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Error during game update',
        { deltaTime, error }
      );
    }
  }

  /**
   * Renders all game elements to the canvas
   */
  render(): void {
    // Skip render if in error state
    if (this.isInErrorState) {
      this.renderErrorState();
      return;
    }

    try {
      const currentScore = this.scoreManager.currentScore;
      const currentState = this.gameStateManager.currentState;
      
      // Use the comprehensive renderer to render the complete frame
      this.renderer.renderFrame(this.bird, this.pipes, currentScore, currentState);
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Error during rendering',
        { error }
      );
      this.renderErrorState();
    }
  }

  /**
   * Gets the current game state
   */
  getState(): GameState {
    return this.gameStateManager.currentState;
  }

  /**
   * Gets the current score
   */
  getScore(): number {
    return this.scoreManager.currentScore;
  }

  /**
   * Gets the high score
   */
  getHighScore(): number {
    return this.scoreManager.highScore;
  }

  /**
   * Gets performance statistics including error information
   */
  getPerformanceStats(): {
    fps: number;
    averageFrameTime: number;
    maxFrameTime: number;
    isGood: boolean;
    pipePoolSize: number;
    spatialGridStats: any;
    errorStats: any;
    isInErrorState: boolean;
  } {
    return {
      ...this.performanceMonitor.getStats(),
      pipePoolSize: this.pipePool.getPoolSize(),
      spatialGridStats: this.spatialGrid.getStats(),
      errorStats: this.errorHandler.getErrorStats(),
      isInErrorState: this.isInErrorState
    };
  }

  /**
   * Cleans up resources and stops the game engine
   */
  destroy(): void {
    // Stop game loop
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Clean up input handler
    this.inputHandler.destroy();
    
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    
    console.log('GameEngine destroyed');
  }

  /**
   * Main game loop that runs every frame
   * @param currentTime Current timestamp from requestAnimationFrame
   */
  private gameLoop(currentTime: number): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    
    try {
      // Update performance monitoring
      this.performanceMonitor.update();
      
      // Check for performance issues
      const stats = this.performanceMonitor.getStats();
      if (!stats.isGood && Math.random() < 0.1) { // 10% chance to report performance issues
        this.errorHandler.handlePerformanceIssue(stats.fps, 60);
      }
      
      // Calculate delta time in seconds
      const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 1/30); // Cap at 30fps minimum
      this.lastFrameTime = currentTime;
      
      // Update and render
      this.update(deltaTime);
      this.render();
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Critical error in game loop',
        { currentTime, error }
      );
      
      // Try to recover by restarting the game loop
      if (!this.isInErrorState) {
        setTimeout(() => {
          if (this.isRunning && !this.isPaused) {
            this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
          }
        }, 100);
      }
    }
  }

  /**
   * Updates gameplay systems during active play
   * @param deltaTime Time elapsed since last frame in seconds
   */
  private updateGameplay(deltaTime: number): void {
    // Clear spatial grid for this frame
    this.spatialGrid.clear();
    
    // Apply gravity to bird
    this.bird.applyGravity(deltaTime);
    
    // Update bird physics
    this.bird.update(deltaTime);
    
    // Update pipes and add them to spatial grid
    this.pipes.forEach(pipe => {
      pipe.update(deltaTime);
      this.spatialGrid.insert(pipe);
    });
    
    // Generate new pipes
    this.updatePipeGeneration(deltaTime);
    
    // Clean up off-screen pipes
    this.cleanupPipes();
    
    // Check for scoring (bird passing pipes)
    this.checkScoring();
    
    // Check for collisions using spatial partitioning
    this.checkCollisionsOptimized();
  }

  /**
   * Manages pipe generation timing
   * @param deltaTime Time elapsed since last frame in seconds
   */
  private updatePipeGeneration(deltaTime: number): void {
    this.lastPipeGenerationTime += deltaTime;
    
    if (this.lastPipeGenerationTime >= this.pipeGenerationInterval) {
      this.generatePipe();
      this.lastPipeGenerationTime = 0;
    }
  }

  /**
   * Generates a new pipe at the right edge of the screen using object pooling
   */
  private generatePipe(): void {
    const pipeX = this.config.canvas.width;
    const pipe = this.pipePool.acquire();
    pipe.reset(pipeX);
    this.pipes.push(pipe);
  }

  /**
   * Removes pipes that have moved off-screen and returns them to the object pool
   */
  private cleanupPipes(): void {
    const remainingPipes: Pipe[] = [];
    
    for (const pipe of this.pipes) {
      if (pipe.isOffScreen()) {
        // Return pipe to pool instead of letting it be garbage collected
        this.pipePool.release(pipe);
      } else {
        remainingPipes.push(pipe);
      }
    }
    
    this.pipes = remainingPipes;
  }

  /**
   * Checks if bird has passed any pipes and updates score
   */
  private checkScoring(): void {
    this.pipes.forEach(pipe => {
      if (pipe.hasPassedBird(this.bird)) {
        pipe.markAsPassed();
        this.scoreManager.incrementScore();
      }
    });
  }

  /**
   * Checks for collisions using spatial partitioning for better performance
   */
  private checkCollisionsOptimized(): void {
    // Get only nearby pipes using spatial grid
    const nearbyPipes = this.spatialGrid.query(this.bird.bounds);
    
    const collisionResult = checkAllCollisions(this.bird, nearbyPipes);
    
    if (collisionResult.hasCollision) {
      const response = handleCollisionResponse(collisionResult);
      
      if (response.shouldTriggerGameOver) {
        this.gameStateManager.transitionTo(GameState.GAME_OVER);
      }
    }
  }

  /**
   * Checks for collisions and handles game over (legacy method for compatibility)
   */
  private checkCollisions(): void {
    this.checkCollisionsOptimized();
  }

  /**
   * Handles browser visibility changes for pause/resume functionality
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      // Tab became inactive - pause the game
      if (this.gameStateManager.isPlaying()) {
        this.pause();
      }
    } else {
      // Tab became active - resume the game if it was playing
      if (this.gameStateManager.isPlaying() && this.isPaused) {
        this.resume();
      }
    }
  }

  /**
   * Sets up input event handlers
   */
  private setupInputHandlers(): void {
    // Handle flap input
    this.inputHandler.onFlap(() => {
      const currentState = this.gameStateManager.currentState;
      
      if (currentState === GameState.READY) {
        // First input starts the game
        this.gameStateManager.transitionTo(GameState.PLAYING);
        this.bird.flap();
      } else if (currentState === GameState.PLAYING) {
        // Subsequent inputs make bird flap
        this.bird.flap();
      }
    });
    
    // Handle restart input
    this.inputHandler.onRestart(() => {
      if (this.gameStateManager.isGameOver()) {
        this.restart();
      }
    });
  }

  /**
   * Sets up game state change handlers
   */
  private setupStateChangeHandlers(): void {
    // Handle transition to game over state
    this.gameStateManager.onStateEnter(GameState.GAME_OVER, () => {
      // Game over actions are handled by the collision system
      // This is where we could add game over effects, sounds, etc.
    });
    
    // Handle transition to ready state
    this.gameStateManager.onStateEnter(GameState.READY, () => {
      // Ready state setup is handled by reset()
    });
    
    // Handle transition to playing state
    this.gameStateManager.onStateEnter(GameState.PLAYING, () => {
      // Playing state setup - ensure game loop is running
      if (!this.isRunning) {
        this.start();
      }
    });
  }

  /**
   * Resets all game systems to initial state
   */
  private reset(): void {
    // Return all pipes to the pool before clearing
    for (const pipe of this.pipes) {
      this.pipePool.release(pipe);
    }
    
    // Reset bird to starting position
    const startX = this.config.canvas.width * 0.2;
    const startY = this.config.canvas.height * 0.5;
    this.bird = new Bird(startX, startY);
    
    // Clear all pipes
    this.pipes = [];
    
    // Clear spatial grid
    this.spatialGrid.clear();
    
    // Reset pipe generation timing
    this.lastPipeGenerationTime = 0;
    
    // Reset score
    this.scoreManager.resetScore();
    
    // Reset game state to ready
    this.gameStateManager.reset();
    
    // Reset performance monitor
    this.performanceMonitor.reset();
  }

  /**
   * Handle game errors and attempt recovery
   */
  private handleGameError(error: any, recovery: any): void {
    console.error('Game error occurred:', error);
    
    if (recovery.canRecover && recovery.recoveryAction) {
      try {
        recovery.recoveryAction();
        console.log('Error recovery attempted');
      } catch (recoveryError) {
        console.error('Error recovery failed:', recoveryError);
        this.isInErrorState = true;
      }
    } else if (recovery.fallbackAction) {
      try {
        recovery.fallbackAction();
      } catch (fallbackError) {
        console.error('Fallback action failed:', fallbackError);
        this.isInErrorState = true;
      }
    } else {
      this.isInErrorState = true;
    }
  }

  /**
   * Validate game state integrity
   */
  private validateGameStateIntegrity(): void {
    const gameState = {
      bird: this.bird,
      pipes: this.pipes,
      score: this.scoreManager.currentScore
    };

    if (!this.errorHandler.validateGameState(gameState)) {
      // Game state is corrupted, attempt recovery
      this.recoverFromStateCorruption();
    }
  }

  /**
   * Recover from game state corruption
   */
  private recoverFromStateCorruption(): void {
    try {
      console.log('Attempting to recover from game state corruption');
      
      // Reset to a known good state
      this.reset();
      this.gameStateManager.transitionTo(GameState.READY);
      
      console.log('Game state recovery successful');
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.GAME_STATE_CORRUPTION,
        'Failed to recover from game state corruption',
        { error }
      );
      this.isInErrorState = true;
    }
  }

  /**
   * Render error state to inform user
   */
  private renderErrorState(): void {
    try {
      this.context.fillStyle = '#ff0000';
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.context.fillStyle = '#ffffff';
      this.context.font = '24px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(
        'Game Error - Please Refresh',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
    } catch (renderError) {
      console.error('Failed to render error state:', renderError);
    }
  }
}