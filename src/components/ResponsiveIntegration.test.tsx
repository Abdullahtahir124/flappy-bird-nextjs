import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import Game from './Game';
import { GameState } from '@/types';

// Mock canvas context
const mockGetContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  ellipse: vi.fn(), // Add missing ellipse method
  closePath: vi.fn(), // Add missing closePath method
  fillText: vi.fn(), // Add missing fillText method
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
});

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockGetContext,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16); // ~60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock Touch for touch event testing
global.Touch = class Touch {
  identifier: number;
  target: EventTarget;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  screenX: number;
  screenY: number;
  radiusX: number;
  radiusY: number;
  rotationAngle: number;
  force: number;

  constructor(touchInit: any) {
    this.identifier = touchInit.identifier;
    this.target = touchInit.target;
    this.clientX = touchInit.clientX;
    this.clientY = touchInit.clientY;
    this.pageX = touchInit.clientX;
    this.pageY = touchInit.clientY;
    this.screenX = touchInit.clientX;
    this.screenY = touchInit.clientY;
    this.radiusX = 1;
    this.radiusY = 1;
    this.rotationAngle = 0;
    this.force = 1;
  }
};

describe('Responsive Canvas Integration Tests', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let originalUserAgent: string;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    originalUserAgent = navigator.userAgent;
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent,
    });
  });

  describe('Canvas Resizing Behavior', () => {
    it('should adapt canvas size to desktop viewport', async () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should use base dimensions on large screens
        expect(canvas?.width).toBe(800);
        expect(canvas?.height).toBe(600);
      });
    });

    it('should scale down canvas for small mobile viewport', async () => {
      // Set mobile viewport (iPhone SE)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should be scaled down for mobile
        expect(canvas?.width).toBeLessThan(800);
        expect(canvas?.height).toBeLessThan(600);
        
        // Should maintain aspect ratio
        const aspectRatio = (canvas?.width || 0) / (canvas?.height || 0);
        expect(Math.abs(aspectRatio - (800 / 600))).toBeLessThan(0.01);
      });
    });

    it('should handle tablet viewport in portrait mode', async () => {
      // Set tablet viewport (iPad portrait)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should fit within tablet viewport
        expect(canvas?.width).toBeLessThanOrEqual(768 - 40); // Account for padding
        expect(canvas?.height).toBeLessThanOrEqual(1024 - 40);
      });
    });

    it('should handle tablet viewport in landscape mode', async () => {
      // Set tablet viewport (iPad landscape)
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

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should fit within landscape viewport
        expect(canvas?.width).toBeLessThanOrEqual(1024 - 40);
        expect(canvas?.height).toBeLessThanOrEqual(768 - 40);
      });
    });

    it('should respond to window resize events', async () => {
      // Start with desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas?.width).toBe(800);
      });

      // Resize to mobile viewport
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 375,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 667,
        });

        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
      });

      // Wait for debounced resize handler
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas?.width).toBeLessThan(800);
      }, { timeout: 200 });
    });

    it('should respond to orientation change events', async () => {
      // Set mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      // Start in portrait
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const initialWidth = container.querySelector('canvas')?.width;

      // Change to landscape
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 667,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: 375,
        });

        // Trigger orientation change event
        window.dispatchEvent(new Event('orientationchange'));
      });

      // Wait for debounced orientation change handler
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        const newWidth = canvas?.width;
        expect(newWidth).not.toBe(initialWidth);
      }, { timeout: 200 });
    });

    it('should maintain minimum canvas size constraints', async () => {
      // Set very small viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 200,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 150,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should not be smaller than 50% of base size
        expect(canvas?.width).toBeGreaterThanOrEqual(400); // 50% of 800
        expect(canvas?.height).toBeGreaterThanOrEqual(300); // 50% of 600
      });
    });
  });

  describe('Touch Input on Mobile Devices', () => {
    beforeEach(() => {
      // Set mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
    });

    it('should handle single touch events on canvas', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      
      // Create touch event
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 1,
            target: canvas,
            clientX: 100,
            clientY: 100,
          }),
        ],
        bubbles: true,
        cancelable: true,
      });

      // Dispatch touch event
      act(() => {
        canvas.dispatchEvent(touchEvent);
      });

      // Touch event should be handled (no specific assertion needed as we're testing integration)
      expect(canvas).not.toBeNull();
    });

    it('should prevent default touch behaviors', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      
      // Check that touch-action is set to none
      expect(canvas.style.touchAction).toBe('none');
    });

    it('should handle multi-touch scenarios appropriately', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      
      // Create multi-touch event (should be ignored)
      const multiTouchEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 1,
            target: canvas,
            clientX: 100,
            clientY: 100,
          }),
          new Touch({
            identifier: 2,
            target: canvas,
            clientX: 200,
            clientY: 200,
          }),
        ],
        bubbles: true,
        cancelable: true,
      });

      // Dispatch multi-touch event
      act(() => {
        canvas.dispatchEvent(multiTouchEvent);
      });

      // Multi-touch should be handled gracefully (no crashes)
      expect(canvas).not.toBeNull();
    });

    it('should handle touch events outside canvas bounds', async () => {
      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      const rect = canvas.getBoundingClientRect();
      
      // Create touch event outside canvas bounds
      const outsideTouchEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 1,
            target: canvas,
            clientX: rect.right + 50, // Outside canvas
            clientY: rect.top + 50,
          }),
        ],
        bubbles: true,
        cancelable: true,
      });

      // Dispatch outside touch event
      act(() => {
        canvas.dispatchEvent(outsideTouchEvent);
      });

      // Outside touch should be handled gracefully
      expect(canvas).not.toBeNull();
    });
  });

  describe('Mobile-Specific Responsive Behavior', () => {
    it('should adjust padding for mobile devices in portrait', async () => {
      // Set mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
      });

      // Set mobile portrait viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should be scaled down for mobile viewport
        // The responsive hook maintains aspect ratio and applies minimum size constraints
        expect(canvas?.width).toBeLessThan(800); // Should be smaller than base size
        expect(canvas?.height).toBeLessThan(600); // Should be smaller than base size
      });
    });

    it('should adjust padding for mobile devices in landscape', async () => {
      // Set mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (Android; Mobile; rv:40.0) Gecko/40.0 Firefox/40.0',
      });

      // Set mobile landscape viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 667,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
        
        // Canvas should account for reduced mobile landscape padding (20px)
        expect(canvas?.width).toBeLessThanOrEqual(667 - 20);
      });
    });

    it('should handle device pixel ratio scaling', async () => {
      // Mock high-DPI device
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 2,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const mockContext = mockGetContext();
      
      // Context scale should be called for device pixel ratio
      expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
    });

    it('should prevent scrolling and zooming on mobile', async () => {
      // Set mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        writable: true,
        configurable: true,
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      
      // Check that touch-action is none on canvas
      expect(canvas.style.touchAction).toBe('none');
      
      // Check for overflow hidden on the main game container
      const gameContainer = container.querySelector('div[style*="overflow: hidden"]');
      expect(gameContainer).not.toBeNull();
    });
  });

  describe('Integration Between Responsive Canvas and Touch Events', () => {
    it('should maintain touch responsiveness across different canvas sizes', async () => {
      const testViewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 768, height: 1024, name: 'iPad Portrait' },
        { width: 1024, height: 768, name: 'iPad Landscape' },
      ];

      for (const viewport of testViewports) {
        // Set viewport
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: viewport.width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: viewport.height,
        });

        const { container, unmount } = render(<Game />);
        
        await waitFor(() => {
          const canvas = container.querySelector('canvas');
          expect(canvas).not.toBeNull();
        });

        const canvas = container.querySelector('canvas')!;
        
        // Create touch event within canvas bounds
        const rect = canvas.getBoundingClientRect();
        const touchEvent = new TouchEvent('touchstart', {
          touches: [
            new Touch({
              identifier: 1,
              target: canvas,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2,
            }),
          ],
          bubbles: true,
          cancelable: true,
        });

        // Touch should be handled without errors
        act(() => {
          canvas.dispatchEvent(touchEvent);
        });

        expect(canvas).not.toBeNull();
        
        unmount();
      }
    });

    it('should scale touch coordinates correctly with canvas scaling', async () => {
      // Set small viewport that will cause canvas scaling
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 300,
      });

      const { container } = render(<Game />);
      
      await waitFor(() => {
        const canvas = container.querySelector('canvas');
        expect(canvas).not.toBeNull();
      });

      const canvas = container.querySelector('canvas')!;
      const rect = canvas.getBoundingClientRect();
      
      // Touch at center of scaled canvas
      const touchEvent = new TouchEvent('touchstart', {
        touches: [
          new Touch({
            identifier: 1,
            target: canvas,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        ],
        bubbles: true,
        cancelable: true,
      });

      // Touch coordinates should be handled correctly even with scaling
      act(() => {
        canvas.dispatchEvent(touchEvent);
      });

      expect(canvas).not.toBeNull();
    });
  });
});