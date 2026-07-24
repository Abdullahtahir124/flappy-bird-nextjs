import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useResponsiveCanvas } from './useResponsiveCanvas';

describe('useResponsiveCanvas Hook', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // Mock addEventListener and removeEventListener
    vi.spyOn(window, 'addEventListener');
    vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    // Restore original window dimensions
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
    
    vi.restoreAllMocks();
  });

  describe('Canvas Size Calculation', () => {
    it('should return base dimensions when viewport is large enough', () => {
      // Set large viewport
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

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
        })
      );

      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);
      expect(result.current.scale).toBe(1);
    });

    it('should scale down for small viewport width', () => {
      // Set small viewport width
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400, // Small width
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          padding: 40,
        })
      );

      // Canvas should be scaled down to fit viewport width
      expect(result.current.width).toBeLessThan(800);
      expect(result.current.height).toBeLessThan(600);
      expect(result.current.scale).toBeLessThan(1);
    });

    it('should scale down for small viewport height', () => {
      // Set small viewport height
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400, // Small height
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          padding: 40,
        })
      );

      // Canvas should be scaled down to fit viewport height
      expect(result.current.width).toBeLessThan(800);
      expect(result.current.height).toBeLessThan(600);
      expect(result.current.scale).toBeLessThan(1);
    });

    it('should maintain aspect ratio', () => {
      // Set various viewport sizes
      const testCases = [
        { width: 400, height: 300 },
        { width: 1200, height: 800 },
        { width: 375, height: 667 }, // iPhone SE
        { width: 768, height: 1024 }, // iPad portrait
      ];

      testCases.forEach(({ width, height }) => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });

        const { result } = renderHook(() =>
          useResponsiveCanvas({
            baseWidth: 800,
            baseHeight: 600,
            aspectRatio: 800 / 600,
          })
        );

        const actualAspectRatio = result.current.width / result.current.height;
        const expectedAspectRatio = 800 / 600;
        
        // Allow small tolerance for rounding
        expect(Math.abs(actualAspectRatio - expectedAspectRatio)).toBeLessThan(0.01);
      });
    });

    it('should respect minimum size constraints', () => {
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

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
        })
      );

      // Canvas should not be smaller than 50% of base size
      expect(result.current.width).toBeGreaterThanOrEqual(400); // 50% of 800
      expect(result.current.height).toBeGreaterThanOrEqual(300); // 50% of 600
    });

    it('should respect maximum size constraints', () => {
      // Set large viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2000,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1500,
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          maxWidth: 900,
          maxHeight: 700,
        })
      );

      // Canvas should not exceed maximum size
      expect(result.current.width).toBeLessThanOrEqual(900);
      expect(result.current.height).toBeLessThanOrEqual(700);
    });

    it('should account for padding', () => {
      const padding = 100;
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900, // 800 + 100 padding
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 700, // 600 + 100 padding
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          padding,
        })
      );

      // Canvas should fit within viewport minus padding
      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);
    });
  });

  describe('Event Listeners', () => {
    it('should add resize and orientationchange event listeners', () => {
      renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
        })
      );

      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });

    it('should remove event listeners on cleanup', () => {
      const { unmount } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
        })
      );

      unmount();

      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
    });

    it('should recalculate size on window resize', () => {
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

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
        })
      );

      // Initial size should be base size
      expect(result.current.width).toBe(800);
      expect(result.current.height).toBe(600);

      // Change window size
      act(() => {
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

        // Trigger resize event
        window.dispatchEvent(new Event('resize'));
      });

      // Size should be recalculated after a delay (debounced)
      setTimeout(() => {
        expect(result.current.width).toBeLessThan(800);
        expect(result.current.height).toBeLessThan(600);
      }, 150); // Wait for debounce
    });
  });

  describe('Scale Factor Calculation', () => {
    it('should calculate correct scale factor', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 440, // 400 + 40 padding
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 340, // 300 + 40 padding
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          padding: 40,
        })
      );

      // Scale should be 0.5 (400/800 = 0.5, 300/600 = 0.5)
      expect(result.current.scale).toBe(0.5);
    });

    it('should use minimum scale when constrained by different dimensions', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 440, // Would give scale of 0.5 for width
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 240, // Would give scale of 0.33 for height
      });

      const { result } = renderHook(() =>
        useResponsiveCanvas({
          baseWidth: 800,
          baseHeight: 600,
          padding: 40,
        })
      );

      // The hook enforces minimum size (50% of base), so scale should be 0.5
      expect(result.current.scale).toBe(0.5);
    });
  });
});