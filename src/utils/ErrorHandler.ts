/**
 * Comprehensive error handling utilities for the game engine
 */

export enum ErrorType {
  CANVAS_CONTEXT_ERROR = 'CANVAS_CONTEXT_ERROR',
  RESOURCE_LOADING_ERROR = 'RESOURCE_LOADING_ERROR',
  GAME_STATE_CORRUPTION = 'GAME_STATE_CORRUPTION',
  PERFORMANCE_ERROR = 'PERFORMANCE_ERROR',
  INPUT_ERROR = 'INPUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface GameError {
  type: ErrorType;
  message: string;
  timestamp: number;
  stack?: string;
  context?: any;
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  recoveryAction?: () => void;
  fallbackAction?: () => void;
  userMessage?: string;
}

/**
 * Central error handler for the game
 */
export class ErrorHandler {
  private errors: GameError[] = [];
  private maxErrorHistory: number = 50;
  private onErrorCallback?: (error: GameError, recovery: ErrorRecoveryStrategy) => void;

  constructor(onErrorCallback?: (error: GameError, recovery: ErrorRecoveryStrategy) => void) {
    this.onErrorCallback = onErrorCallback;
    
    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Handle a game error with recovery strategy
   */
  handleError(
    type: ErrorType,
    message: string,
    context?: any,
    stack?: string
  ): ErrorRecoveryStrategy {
    const error: GameError = {
      type,
      message,
      timestamp: Date.now(),
      stack,
      context
    };

    // Add to error history
    this.errors.push(error);
    if (this.errors.length > this.maxErrorHistory) {
      this.errors.shift();
    }

    // Determine recovery strategy
    const recovery = this.determineRecoveryStrategy(error);

    // Log error
    console.error(`Game Error [${type}]: ${message}`, { error, recovery });

    // Notify callback if provided
    if (this.onErrorCallback) {
      this.onErrorCallback(error, recovery);
    }

    return recovery;
  }

  /**
   * Validate canvas context and handle errors
   */
  validateCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    try {
      const context = canvas.getContext('2d');
      
      if (!context) {
        this.handleError(
          ErrorType.CANVAS_CONTEXT_ERROR,
          'Failed to get 2D rendering context from canvas',
          { canvas }
        );
        return null;
      }

      // Test basic canvas operations
      try {
        context.save();
        context.restore();
        context.fillStyle = '#000000';
        context.fillRect(0, 0, 1, 1);
      } catch (testError) {
        this.handleError(
          ErrorType.CANVAS_CONTEXT_ERROR,
          'Canvas context failed basic operation test',
          { canvas, testError }
        );
        return null;
      }

      return context;
    } catch (error) {
      this.handleError(
        ErrorType.CANVAS_CONTEXT_ERROR,
        'Unexpected error during canvas context validation',
        { canvas, error }
      );
      return null;
    }
  }

  /**
   * Validate game state integrity
   */
  validateGameState(gameState: any): boolean {
    try {
      // Check for required properties
      const requiredProperties = ['bird', 'pipes', 'score'];
      for (const prop of requiredProperties) {
        if (gameState[prop] === undefined || gameState[prop] === null) {
          this.handleError(
            ErrorType.GAME_STATE_CORRUPTION,
            `Game state missing required property: ${prop}`,
            { gameState, missingProperty: prop }
          );
          return false;
        }
      }

      // Validate bird state
      if (!this.validateBirdState(gameState.bird)) {
        return false;
      }

      // Validate pipes array
      if (!Array.isArray(gameState.pipes)) {
        this.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Pipes is not an array',
          { gameState, pipesType: typeof gameState.pipes }
        );
        return false;
      }

      // Validate score
      if (typeof gameState.score !== 'number' || gameState.score < 0) {
        this.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Invalid score value',
          { gameState, score: gameState.score }
        );
        return false;
      }

      return true;
    } catch (error) {
      this.handleError(
        ErrorType.GAME_STATE_CORRUPTION,
        'Unexpected error during game state validation',
        { gameState, error }
      );
      return false;
    }
  }

  /**
   * Handle resource loading errors gracefully
   */
  handleResourceError(resourceType: string, resourcePath: string, error: any): ErrorRecoveryStrategy {
    return this.handleError(
      ErrorType.RESOURCE_LOADING_ERROR,
      `Failed to load ${resourceType}: ${resourcePath}`,
      { resourceType, resourcePath, error }
    );
  }

  /**
   * Handle performance issues
   */
  handlePerformanceIssue(fps: number, targetFPS: number): ErrorRecoveryStrategy {
    return this.handleError(
      ErrorType.PERFORMANCE_ERROR,
      `Performance degradation detected: ${fps}fps (target: ${targetFPS}fps)`,
      { currentFPS: fps, targetFPS }
    );
  }

  /**
   * Get error history
   */
  getErrorHistory(): GameError[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    recentErrors: number;
  } {
    const now = Date.now();
    const recentThreshold = 60000; // 1 minute
    
    const errorsByType = {} as Record<ErrorType, number>;
    let recentErrors = 0;

    for (const error of this.errors) {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      
      if (now - error.timestamp < recentThreshold) {
        recentErrors++;
      }
    }

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors
    };
  }

  /**
   * Determine recovery strategy based on error type
   */
  private determineRecoveryStrategy(error: GameError): ErrorRecoveryStrategy {
    switch (error.type) {
      case ErrorType.CANVAS_CONTEXT_ERROR:
        return {
          canRecover: false,
          userMessage: 'Canvas rendering is not supported in your browser. Please try a different browser.',
          fallbackAction: () => {
            // Could show a fallback message or redirect
            console.log('Canvas not supported - showing fallback message');
          }
        };

      case ErrorType.RESOURCE_LOADING_ERROR:
        return {
          canRecover: true,
          recoveryAction: () => {
            // Could retry loading or use fallback resources
            console.log('Attempting to recover from resource loading error');
          },
          userMessage: 'Some game resources failed to load. The game will continue with basic graphics.'
        };

      case ErrorType.GAME_STATE_CORRUPTION:
        return {
          canRecover: true,
          recoveryAction: () => {
            // Reset game state to a known good state
            console.log('Recovering from game state corruption by resetting');
          },
          userMessage: 'Game state error detected. Restarting the game.'
        };

      case ErrorType.PERFORMANCE_ERROR:
        return {
          canRecover: true,
          recoveryAction: () => {
            // Could reduce quality settings or adjust frame rate
            console.log('Attempting to recover from performance issues');
          },
          userMessage: 'Performance issues detected. Adjusting game settings for better performance.'
        };

      case ErrorType.INPUT_ERROR:
        return {
          canRecover: true,
          recoveryAction: () => {
            // Reset input handlers
            console.log('Recovering from input error by resetting handlers');
          },
          userMessage: 'Input error detected. Please try again.'
        };

      default:
        return {
          canRecover: false,
          userMessage: 'An unexpected error occurred. Please refresh the page.',
          fallbackAction: () => {
            console.log('Unknown error - suggesting page refresh');
          }
        };
    }
  }

  /**
   * Validate bird state
   */
  private validateBirdState(bird: any): boolean {
    if (!bird || typeof bird !== 'object') {
      this.handleError(
        ErrorType.GAME_STATE_CORRUPTION,
        'Bird state is invalid or missing',
        { bird }
      );
      return false;
    }

    // Check required bird properties
    const requiredProps = ['position', 'velocity', 'bounds'];
    for (const prop of requiredProps) {
      if (!bird[prop]) {
        this.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          `Bird missing required property: ${prop}`,
          { bird, missingProperty: prop }
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Unhandled promise rejection',
        { reason: event.reason }
      );
    });

    // Handle general JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        ErrorType.UNKNOWN_ERROR,
        event.message,
        { 
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        event.error?.stack
      );
    });
  }
}