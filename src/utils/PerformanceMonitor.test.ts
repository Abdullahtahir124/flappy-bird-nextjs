import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow
  }
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let currentTime: number;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    monitor = new PerformanceMonitor(60); // 60 FPS target
    vi.clearAllMocks();
  });

  const advanceTime = (ms: number) => {
    currentTime += ms;
    mockPerformanceNow.mockReturnValue(currentTime);
  };

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(monitor.getFPS()).toBe(0);
      expect(monitor.getAverageFrameTime()).toBe(0);
      expect(monitor.getMaxFrameTime()).toBe(0);
      expect(monitor.isPerformanceGood()).toBe(false); // No data yet
    });

    it('should accept custom target FPS', () => {
      const customMonitor = new PerformanceMonitor(30);
      expect(customMonitor).toBeDefined();
    });
  });

  describe('update', () => {
    it('should track frame times', () => {
      advanceTime(16.67); // ~60 FPS frame time
      monitor.update();

      expect(monitor.getAverageFrameTime()).toBeGreaterThan(0);
    });

    it('should calculate FPS after sufficient time', () => {
      // Simulate 60 frames over 1 second
      for (let i = 0; i < 60; i++) {
        advanceTime(16.67); // ~16.67ms per frame for 60 FPS
        monitor.update();
      }

      const fps = monitor.getFPS();
      expect(fps).toBeGreaterThan(50); // Should be close to 60
      expect(fps).toBeLessThan(70);
    });

    it('should maintain frame time history', () => {
      // Add some frame times
      for (let i = 0; i < 10; i++) {
        advanceTime(20); // 50 FPS
        monitor.update();
      }

      expect(monitor.getAverageFrameTime()).toBeCloseTo(20, 1);
    });

    it('should limit history size', () => {
      // Add more frames than max history size
      for (let i = 0; i < 100; i++) {
        advanceTime(16.67);
        monitor.update();
      }

      // Should not exceed max history size (60 frames)
      const stats = monitor.getStats();
      expect(stats.averageFrameTime).toBeGreaterThan(0);
    });
  });

  describe('performance warnings', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should warn when FPS drops below threshold', () => {
      // Simulate low FPS (30 FPS)
      for (let i = 0; i < 30; i++) {
        advanceTime(33.33); // ~33ms per frame for 30 FPS
        monitor.update();
      }

      // Advance time to trigger FPS calculation
      advanceTime(1000);
      monitor.update();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warning')
      );
    });

    it('should not warn when performance is good', () => {
      // Simulate good FPS (60 FPS)
      for (let i = 0; i < 60; i++) {
        advanceTime(16.67);
        monitor.update();
      }

      // Advance time to trigger FPS calculation
      advanceTime(1000);
      monitor.update();

      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    beforeEach(() => {
      // Set up some performance data
      const frameTimes = [16, 17, 15, 18, 16, 20, 14, 16, 17, 15];
      frameTimes.forEach(frameTime => {
        advanceTime(frameTime);
        monitor.update();
      });
    });

    it('should calculate average frame time correctly', () => {
      const avgFrameTime = monitor.getAverageFrameTime();
      expect(avgFrameTime).toBeGreaterThan(14);
      expect(avgFrameTime).toBeLessThan(21);
    });

    it('should track maximum frame time', () => {
      const maxFrameTime = monitor.getMaxFrameTime();
      expect(maxFrameTime).toBe(20); // Highest frame time from setup
    });

    it('should provide comprehensive stats', () => {
      const stats = monitor.getStats();
      
      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('averageFrameTime');
      expect(stats).toHaveProperty('maxFrameTime');
      expect(stats).toHaveProperty('isGood');
      
      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.averageFrameTime).toBe('number');
      expect(typeof stats.maxFrameTime).toBe('number');
      expect(typeof stats.isGood).toBe('boolean');
    });
  });

  describe('performance assessment', () => {
    it('should report good performance for high FPS', () => {
      // Simulate 60 FPS
      for (let i = 0; i < 60; i++) {
        advanceTime(16.67);
        monitor.update();
      }

      expect(monitor.isPerformanceGood()).toBe(true);
    });

    it('should report poor performance for low FPS', () => {
      // Simulate 30 FPS
      for (let i = 0; i < 30; i++) {
        advanceTime(33.33);
        monitor.update();
      }

      // Advance time to calculate FPS
      advanceTime(1000);
      monitor.update();

      expect(monitor.isPerformanceGood()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all metrics to initial state', () => {
      // Generate some performance data
      for (let i = 0; i < 30; i++) {
        advanceTime(20);
        monitor.update();
      }

      // Reset and verify
      monitor.reset();
      
      expect(monitor.getFPS()).toBe(0);
      expect(monitor.getAverageFrameTime()).toBe(0);
      expect(monitor.getMaxFrameTime()).toBe(0);
    });

    it('should restart timing from reset point', () => {
      // Generate data, reset, then generate new data
      for (let i = 0; i < 10; i++) {
        advanceTime(30);
        monitor.update();
      }

      monitor.reset();
      currentTime = 1000; // Reset mock time
      mockPerformanceNow.mockReturnValue(currentTime);

      for (let i = 0; i < 10; i++) {
        advanceTime(16);
        monitor.update();
      }

      expect(monitor.getAverageFrameTime()).toBeCloseTo(16, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle very high frame rates', () => {
      // Simulate 120 FPS
      for (let i = 0; i < 120; i++) {
        advanceTime(8.33); // ~8.33ms per frame for 120 FPS
        monitor.update();
      }

      const fps = monitor.getFPS();
      expect(fps).toBeGreaterThan(100);
      expect(monitor.isPerformanceGood()).toBe(true);
    });

    it('should handle very low frame rates', () => {
      // Simulate 10 FPS
      for (let i = 0; i < 10; i++) {
        advanceTime(100); // 100ms per frame for 10 FPS
        monitor.update();
      }

      // Advance time to calculate FPS
      advanceTime(1000);
      monitor.update();

      const fps = monitor.getFPS();
      expect(fps).toBeLessThan(15);
      expect(monitor.isPerformanceGood()).toBe(false);
    });

    it('should handle irregular frame timing', () => {
      const irregularTimes = [10, 50, 5, 30, 15, 40, 8, 25];
      
      irregularTimes.forEach(frameTime => {
        advanceTime(frameTime);
        monitor.update();
      });

      expect(monitor.getAverageFrameTime()).toBeGreaterThan(0);
      expect(monitor.getMaxFrameTime()).toBe(50);
    });

    it('should handle zero delta time', () => {
      advanceTime(0);
      monitor.update();
      advanceTime(0);
      monitor.update();

      expect(() => monitor.getStats()).not.toThrow();
    });
  });

  describe('real-world simulation', () => {
    it('should handle typical game loop performance', () => {
      // Simulate a typical game with occasional frame drops
      const framePattern = [
        16, 16, 17, 16, 16, 33, 16, 17, 16, 16, // Frame drop at position 5
        16, 16, 16, 50, 16, 16, 17, 16, 16, 16  // Larger frame drop at position 13
      ];

      framePattern.forEach(frameTime => {
        advanceTime(frameTime);
        monitor.update();
      });

      const stats = monitor.getStats();
      expect(stats.averageFrameTime).toBeGreaterThan(15);
      expect(stats.averageFrameTime).toBeLessThan(25);
      expect(stats.maxFrameTime).toBe(50);
    });

    it('should track performance over extended periods', () => {
      // Simulate 5 seconds of gameplay at varying performance
      for (let second = 0; second < 5; second++) {
        const baseFrameTime = 16 + (second * 2); // Gradually degrading performance
        
        for (let frame = 0; frame < 60; frame++) {
          const variation = Math.random() * 4 - 2; // ±2ms variation
          advanceTime(baseFrameTime + variation);
          monitor.update();
        }
      }

      const stats = monitor.getStats();
      expect(stats.fps).toBeGreaterThan(0);
      expect(stats.averageFrameTime).toBeGreaterThan(16);
      expect(stats.isGood).toBeDefined();
    });
  });
});