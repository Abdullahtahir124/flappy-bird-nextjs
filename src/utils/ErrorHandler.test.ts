import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandler, ErrorType } from './ErrorHandler';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;
  let mockCallback: any;

  beforeEach(() => {
    mockCallback = vi.fn();
    errorHandler = new ErrorHandler(mockCallback);
    
    // Clear console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleError', () => {
    it('should create and store error correctly', () => {
      const error = errorHandler.handleError(
        ErrorType.CANVAS_CONTEXT_ERROR,
        'Test error message',
        { testContext: true }
      );

      expect(error).toBeDefined();
      expect(error.canRecover).toBe(false);
      expect(error.userMessage).toContain('Canvas rendering is not supported');
      
      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe(ErrorType.CANVAS_CONTEXT_ERROR);
      expect(history[0].message).toBe('Test error message');
      expect(history[0].context).toEqual({ testContext: true });
    });

    it('should call error callback when provided', () => {
      errorHandler.handleError(ErrorType.INPUT_ERROR, 'Input error');

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.INPUT_ERROR,
          message: 'Input error'
        }),
        expect.objectContaining({
          canRecover: true
        })
      );
    });

    it('should limit error history to maxErrorHistory', () => {
      // Add more than 50 errors (default max)
      for (let i = 0; i < 55; i++) {
        errorHandler.handleError(ErrorType.UNKNOWN_ERROR, `Error ${i}`);
      }

      const history = errorHandler.getErrorHistory();
      expect(history).toHaveLength(50);
      expect(history[0].message).toBe('Error 5'); // First 5 should be removed
      expect(history[49].message).toBe('Error 54');
    });
  });

  describe('validateCanvasContext', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      mockContext = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: ''
      } as any;

      mockCanvas = {
        getContext: vi.fn().mockReturnValue(mockContext)
      } as any;
    });

    it('should return context when canvas is valid', () => {
      const result = errorHandler.validateCanvasContext(mockCanvas);

      expect(result).toBe(mockContext);
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 1, 1);
    });

    it('should handle null context gracefully', () => {
      mockCanvas.getContext = vi.fn().mockReturnValue(null);

      const result = errorHandler.validateCanvasContext(mockCanvas);

      expect(result).toBeNull();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.CANVAS_CONTEXT_ERROR,
          message: 'Failed to get 2D rendering context from canvas'
        }),
        expect.any(Object)
      );
    });

    it('should handle context operation failures', () => {
      mockContext.save = vi.fn().mockImplementation(() => {
        throw new Error('Context operation failed');
      });

      const result = errorHandler.validateCanvasContext(mockCanvas);

      expect(result).toBeNull();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.CANVAS_CONTEXT_ERROR,
          message: 'Canvas context failed basic operation test'
        }),
        expect.any(Object)
      );
    });

    it('should handle unexpected errors during validation', () => {
      mockCanvas.getContext = vi.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = errorHandler.validateCanvasContext(mockCanvas);

      expect(result).toBeNull();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.CANVAS_CONTEXT_ERROR,
          message: 'Unexpected error during canvas context validation'
        }),
        expect.any(Object)
      );
    });
  });

  describe('validateGameState', () => {
    const validGameState = {
      bird: {
        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        bounds: { x: 0, y: 0, width: 10, height: 10 }
      },
      pipes: [],
      score: 0
    };

    it('should return true for valid game state', () => {
      const result = errorHandler.validateGameState(validGameState);
      expect(result).toBe(true);
    });

    it('should handle missing required properties', () => {
      const invalidState = { bird: validGameState.bird, pipes: [] };
      
      const result = errorHandler.validateGameState(invalidState);
      
      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.GAME_STATE_CORRUPTION,
          message: 'Game state missing required property: score'
        }),
        expect.any(Object)
      );
    });

    it('should handle invalid bird state', () => {
      const invalidState = {
        ...validGameState,
        bird: {} // Empty object instead of null
      };
      
      const result = errorHandler.validateGameState(invalidState);
      
      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.GAME_STATE_CORRUPTION,
          message: 'Bird missing required property: position'
        }),
        expect.any(Object)
      );
    });

    it('should handle invalid pipes array', () => {
      const invalidState = {
        ...validGameState,
        pipes: 'not an array'
      };
      
      const result = errorHandler.validateGameState(invalidState);
      
      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.GAME_STATE_CORRUPTION,
          message: 'Pipes is not an array'
        }),
        expect.any(Object)
      );
    });

    it('should handle invalid score', () => {
      const invalidState = {
        ...validGameState,
        score: -1
      };
      
      const result = errorHandler.validateGameState(invalidState);
      
      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.GAME_STATE_CORRUPTION,
          message: 'Invalid score value'
        }),
        expect.any(Object)
      );
    });

    it('should handle unexpected errors during validation', () => {
      // Create a state that will cause an error when accessing properties
      const problematicState = {};
      Object.defineProperty(problematicState, 'bird', {
        get() {
          throw new Error('Property access error');
        }
      });
      
      const result = errorHandler.validateGameState(problematicState);
      
      expect(result).toBe(false);
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.GAME_STATE_CORRUPTION,
          message: 'Unexpected error during game state validation'
        }),
        expect.any(Object)
      );
    });
  });

  describe('handleResourceError', () => {
    it('should handle resource loading errors', () => {
      const error = new Error('Failed to load');
      const result = errorHandler.handleResourceError('image', '/path/to/image.png', error);

      expect(result.canRecover).toBe(true);
      expect(result.userMessage).toContain('Some game resources failed to load');
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.RESOURCE_LOADING_ERROR,
          message: 'Failed to load image: /path/to/image.png'
        }),
        expect.any(Object)
      );
    });
  });

  describe('handlePerformanceIssue', () => {
    it('should handle performance degradation', () => {
      const result = errorHandler.handlePerformanceIssue(30, 60);

      expect(result.canRecover).toBe(true);
      expect(result.userMessage).toContain('Performance issues detected');
      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.PERFORMANCE_ERROR,
          message: 'Performance degradation detected: 30fps (target: 60fps)'
        }),
        expect.any(Object)
      );
    });
  });

  describe('getErrorStats', () => {
    it('should return correct error statistics', () => {
      // Add some errors
      errorHandler.handleError(ErrorType.CANVAS_CONTEXT_ERROR, 'Error 1');
      errorHandler.handleError(ErrorType.CANVAS_CONTEXT_ERROR, 'Error 2');
      errorHandler.handleError(ErrorType.INPUT_ERROR, 'Error 3');

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByType[ErrorType.CANVAS_CONTEXT_ERROR]).toBe(2);
      expect(stats.errorsByType[ErrorType.INPUT_ERROR]).toBe(1);
      expect(stats.recentErrors).toBe(3); // All errors are recent
    });

    it('should correctly identify recent errors', () => {
      // Mock Date.now to control timestamps
      const originalNow = Date.now;
      let mockTime = 1000000;
      Date.now = vi.fn(() => mockTime);

      // Add an old error
      errorHandler.handleError(ErrorType.UNKNOWN_ERROR, 'Old error');
      
      // Advance time by more than 1 minute
      mockTime += 70000;
      
      // Add a recent error
      errorHandler.handleError(ErrorType.INPUT_ERROR, 'Recent error');

      const stats = errorHandler.getErrorStats();

      expect(stats.totalErrors).toBe(2);
      expect(stats.recentErrors).toBe(1); // Only the recent error

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('clearErrorHistory', () => {
    it('should clear all errors from history', () => {
      errorHandler.handleError(ErrorType.UNKNOWN_ERROR, 'Error 1');
      errorHandler.handleError(ErrorType.INPUT_ERROR, 'Error 2');

      expect(errorHandler.getErrorHistory()).toHaveLength(2);

      errorHandler.clearErrorHistory();

      expect(errorHandler.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('recovery strategies', () => {
    it('should provide correct recovery strategy for canvas errors', () => {
      const result = errorHandler.handleError(ErrorType.CANVAS_CONTEXT_ERROR, 'Canvas error');

      expect(result.canRecover).toBe(false);
      expect(result.userMessage).toContain('Canvas rendering is not supported');
      expect(result.fallbackAction).toBeDefined();
    });

    it('should provide correct recovery strategy for resource errors', () => {
      const result = errorHandler.handleError(ErrorType.RESOURCE_LOADING_ERROR, 'Resource error');

      expect(result.canRecover).toBe(true);
      expect(result.recoveryAction).toBeDefined();
      expect(result.userMessage).toContain('Some game resources failed to load');
    });

    it('should provide correct recovery strategy for game state corruption', () => {
      const result = errorHandler.handleError(ErrorType.GAME_STATE_CORRUPTION, 'State error');

      expect(result.canRecover).toBe(true);
      expect(result.recoveryAction).toBeDefined();
      expect(result.userMessage).toContain('Game state error detected');
    });

    it('should provide correct recovery strategy for performance errors', () => {
      const result = errorHandler.handleError(ErrorType.PERFORMANCE_ERROR, 'Performance error');

      expect(result.canRecover).toBe(true);
      expect(result.recoveryAction).toBeDefined();
      expect(result.userMessage).toContain('Performance issues detected');
    });

    it('should provide correct recovery strategy for input errors', () => {
      const result = errorHandler.handleError(ErrorType.INPUT_ERROR, 'Input error');

      expect(result.canRecover).toBe(true);
      expect(result.recoveryAction).toBeDefined();
      expect(result.userMessage).toContain('Input error detected');
    });

    it('should provide fallback strategy for unknown errors', () => {
      const result = errorHandler.handleError(ErrorType.UNKNOWN_ERROR, 'Unknown error');

      expect(result.canRecover).toBe(false);
      expect(result.userMessage).toContain('An unexpected error occurred');
      expect(result.fallbackAction).toBeDefined();
    });
  });

  describe('global error handlers', () => {
    it('should handle unhandled promise rejections', () => {
      // Simulate unhandled promise rejection
      const rejectionEvent = new Event('unhandledrejection') as any;
      rejectionEvent.reason = 'Promise rejection reason';

      window.dispatchEvent(rejectionEvent);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.UNKNOWN_ERROR,
          message: 'Unhandled promise rejection'
        }),
        expect.any(Object)
      );
    });

    it('should handle general JavaScript errors', () => {
      // Simulate JavaScript error
      const errorEvent = new ErrorEvent('error', {
        message: 'JavaScript error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
        error: new Error('Test error')
      });

      window.dispatchEvent(errorEvent);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.UNKNOWN_ERROR,
          message: 'JavaScript error'
        }),
        expect.any(Object)
      );
    });
  });
});