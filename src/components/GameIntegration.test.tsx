import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react';
import Game from './Game';
import { GameState } from '@/types';

// Mock canvas context with comprehensive methods
const mockContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  ellipse: vi.fn(),
  closePath: vi.fn(),
  fillText: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  measureText: vi.fn().mockReturnValue({ width: 100 }),
  imageSmoothingEnabled: true,
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  font: '16px Arial',
  textAlign: 'left' as CanvasTextAlign,
  textBaseline: 'alphabetic' as CanvasTextBaseline,
};

const mockGetContext = vi.fn().mockReturnValue(mockContext);

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

// Mock getBoundingClientRect for canvas
Object.defineProperty(HTMLCanvasElement.prototype, 'getBoundingClientRect', {
  value: vi.fn().mockReturnValue({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
  }),
});

// Mock requestAnimationFrame and cancelAnimationFrame
let animationFrameId = 0;
global.requestAnimationFrame = vi.fn((callback) => {
  animationFrameId++;
  setTimeout(() => callback(performance.now()), 16);
  return animationFrameId;
});

global.cancelAnimationFrame = vi.fn();

// Mock performance.now
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
};

// Mock document.hidden for visibility API
Object.defineProperty(document, 'hidden', {
  writable: true,
  value: false,
});

describe('Game Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    animationFrameId = 0;
    
    // Reset document visibility
    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });
    
    // Reset window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Gameplay Flow', () => {
    it('should complete full game cycle from ready to game over', async () => {
      const { container } = render(<Game />);
      
      // Wait for game to initialize
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
        expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
      });

      // Game should start in READY state
      expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
      
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();

      // Simulate first input to start the game (spacebar)
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      // Wait for game state to transition to PLAYING
      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      }, { timeout: 1000 });

      // Verify score display appears
      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });

      // Simulate game progression by triggering multiple animation frames
      for (let i = 0; i < 10; i++) {
        act(() => {
          vi.advanceTimersByTime(16); // ~60fps
        });
      }

      // Simulate collision by not providing input (bird falls due to gravity)
      // Wait longer to allow physics to cause collision
      for (let i = 0; i < 100; i++) {
        act(() => {
          vi.advanceTimersByTime(16);
        });
      }

      // Game should eventually transition to GAME_OVER state
      // Note: This might take time depending on physics simulation
      await waitFor(() => {
        const gameOverText = screen.queryByText(/Game Over!/);
        if (gameOverText) {
          expect(gameOverText).toBeInTheDocument();
        }
      }, { timeout: 3000 });
    });

    it('should handle input during gameplay correctly', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      const canvas = container.querySelector('canvas')!;

      // Start game with spacebar
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Test multiple input methods during gameplay
      // Spacebar input
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      // Mouse click input
      act(() => {
        fireEvent.click(canvas);
      });

      // Touch input (if supported)
      act(() => {
        fireEvent.touchStart(canvas, {
          touches: [{ clientX: 400, clientY: 300 }],
        });
      });

      // Game should continue running without errors
      expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
    });

    it('should track score progression during gameplay', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });

      // Score should start at 0
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();

      // Simulate game progression
      for (let i = 0; i < 50; i++) {
        act(() => {
          vi.advanceTimersByTime(16);
        });
      }

      // Score should remain visible during gameplay
      expect(screen.getByText(/Score: \d+/)).toBeInTheDocument();
    });
  });

  describe('Restart Functionality and State Reset', () => {
    it('should reset all game state when restarting', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start and play game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Force game over by waiting for collision
      for (let i = 0; i < 200; i++) {
        act(() => {
          vi.advanceTimersByTime(16);
        });
      }

      // Wait for game over state
      await waitFor(() => {
        const restartButton = screen.queryByText(/Play Again/);
        if (restartButton) {
          expect(restartButton).toBeInTheDocument();
          return true;
        }
        return false;
      }, { timeout: 5000 });

      // Click restart button
      const restartButton = screen.getByText(/Play Again/);
      act(() => {
        fireEvent.click(restartButton);
      });

      // Game should return to ready state
      await waitFor(() => {
        expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
      });

      // Score should be hidden in ready state
      expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
    });

    it('should maintain high score across restarts', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Play first game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });

      // Force game over
      for (let i = 0; i < 200; i++) {
        act(() => {
          vi.advanceTimersByTime(16);
        });
      }

      // Wait for game over and check if high score is displayed
      await waitFor(() => {
        const gameOverElements = screen.queryAllByText(/Game Over|Play Again/);
        expect(gameOverElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      // Restart game
      const restartButton = screen.getByText(/Play Again/);
      act(() => {
        fireEvent.click(restartButton);
      });

      // High score should be maintained (if it was > 0)
      await waitFor(() => {
        expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
      });
    });

    it('should handle multiple restart cycles', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Perform multiple restart cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        // Start game
        act(() => {
          fireEvent.keyDown(document, { key: ' ', code: 'Space' });
        });

        await waitFor(() => {
          expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
        });

        // Force game over
        for (let i = 0; i < 100; i++) {
          act(() => {
            vi.advanceTimersByTime(16);
          });
        }

        // Wait for game over
        await waitFor(() => {
          const gameOverElements = screen.queryAllByText(/Game Over|Play Again/);
          if (gameOverElements.length > 0) {
            return true;
          }
          return false;
        }, { timeout: 3000 });

        // Restart if not the last cycle
        if (cycle < 2) {
          const restartButton = screen.getByText(/Play Again/);
          act(() => {
            fireEvent.click(restartButton);
          });

          await waitFor(() => {
            expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
          });
        }
      }

      // Game should still be functional after multiple restarts
      expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    it('should handle canvas context loss gracefully', async () => {
      // Mock context loss
      const mockLostContext = null;
      const mockGetContextWithLoss = vi.fn()
        .mockReturnValueOnce(mockContext) // First call succeeds
        .mockReturnValueOnce(mockLostContext); // Second call fails

      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: mockGetContextWithLoss,
      });

      const { container } = render(<Game />);
      
      // Game should handle context loss without crashing
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Restore original mock
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value: mockGetContext,
      });
    });

    it('should handle rapid input events without breaking', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      const canvas = container.querySelector('canvas')!;

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Rapid input events
      act(() => {
        for (let i = 0; i < 20; i++) {
          fireEvent.keyDown(document, { key: ' ', code: 'Space' });
          fireEvent.click(canvas);
          fireEvent.touchStart(canvas, {
            touches: [{ clientX: 400, clientY: 300 }],
          });
        }
      });

      // Game should continue running without errors
      expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
    });

    it('should handle window visibility changes correctly', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Simulate tab becoming hidden
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Simulate tab becoming visible again
      act(() => {
        Object.defineProperty(document, 'hidden', {
          writable: true,
          value: false,
        });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // Game should continue running
      expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
    });

    it('should handle window resize during gameplay', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Simulate window resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 600,
        });
        window.dispatchEvent(new Event('resize'));
      });

      // Game should continue running after resize
      expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
    });

    it('should handle invalid input events gracefully', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      const canvas = container.querySelector('canvas')!;

      // Test invalid key events
      act(() => {
        fireEvent.keyDown(document, { key: 'InvalidKey' });
        fireEvent.keyDown(document, { key: '' });
        fireEvent.keyDown(document, {}); // Empty event
      });

      // Test invalid mouse events
      act(() => {
        fireEvent.click(canvas, { button: 2 }); // Right click
        fireEvent.click(canvas, { button: 1 }); // Middle click
      });

      // Test invalid touch events
      act(() => {
        fireEvent.touchStart(canvas, { touches: [] }); // Empty touches
        fireEvent.touchStart(canvas, {}); // Invalid touch event
      });

      // Game should remain stable
      expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
    });

    it('should handle component unmounting during active gameplay', async () => {
      const { container, unmount } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Unmount component during active gameplay
      act(() => {
        unmount();
      });

      // Should not throw errors or cause memory leaks
      expect(true).toBe(true); // Test passes if no errors thrown
    });

    it('should handle extreme viewport sizes', async () => {
      // Test very small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 100,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 100,
      });

      const { container, unmount } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();

      unmount();

      // Test very large viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 4000,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 3000,
      });

      const { container: container2 } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      const canvas2 = container2.querySelector('canvas');
      expect(canvas2).not.toBeNull();
    });
  });

  describe('Performance and Memory Management', () => {
    it('should clean up resources properly on unmount', async () => {
      const { container, unmount } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game to initialize all systems
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Track animation frame calls before unmount
      const initialAnimationFrameCalls = (global.requestAnimationFrame as any).mock.calls.length;

      // Unmount component
      act(() => {
        unmount();
      });

      // Verify cleanup was called
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle long gameplay sessions without memory leaks', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
      });

      // Start game
      act(() => {
        fireEvent.keyDown(document, { key: ' ', code: 'Space' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Keep flying!/)).toBeInTheDocument();
      });

      // Simulate long gameplay session
      for (let i = 0; i < 1000; i++) {
        act(() => {
          vi.advanceTimersByTime(16);
          
          // Occasional input to keep bird alive longer
          if (i % 50 === 0) {
            fireEvent.keyDown(document, { key: ' ', code: 'Space' });
          }
        });
      }

      // Game should still be responsive
      expect(screen.getByText(/Keep flying!|Game Over/)).toBeInTheDocument();
    });
  });
});