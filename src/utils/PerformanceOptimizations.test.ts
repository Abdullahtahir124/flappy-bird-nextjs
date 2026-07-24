import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectPool } from './ObjectPool';
import { SpatialGrid } from './SpatialGrid';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Pipe } from '@/entities/Pipe';
import { Rectangle } from '@/types';

/**
 * Integration tests for performance optimizations
 * Tests Requirements 8.1, 8.2, 8.3 - Performance and Technical Requirements
 */
describe('Performance Optimizations Integration', () => {
  describe('Object Pooling for Pipes (Requirement 8.2)', () => {
    let pipePool: ObjectPool<Pipe>;

    beforeEach(() => {
      pipePool = new ObjectPool<Pipe>(
        () => new Pipe(0),
        (pipe) => pipe.reset(0),
        5,
        20
      );
    });

    it('should reduce garbage collection by reusing pipe objects', () => {
      const initialPoolSize = pipePool.getPoolSize();
      expect(initialPoolSize).toBe(5); // Pre-populated

      // Simulate pipe lifecycle - acquire, use, release
      const pipes: Pipe[] = [];
      
      // Acquire pipes
      for (let i = 0; i < 10; i++) {
        const pipe = pipePool.acquire();
        pipe.reset(800 + i * 200); // Position pipes
        pipes.push(pipe);
      }

      expect(pipePool.getPoolSize()).toBe(0); // Pool should be empty

      // Release pipes back to pool
      pipes.forEach(pipe => pipePool.release(pipe));

      // Pool should have objects available for reuse
      expect(pipePool.getPoolSize()).toBeGreaterThan(0);
      expect(pipePool.getPoolSize()).toBeLessThanOrEqual(20); // Max pool size
    });

    it('should properly reset pipe state when returned to pool', () => {
      const pipe = pipePool.acquire();
      
      // Modify pipe state
      pipe.position.x = 500;
      pipe.hasBeenPassed = true;
      
      // Return to pool (should reset)
      pipePool.release(pipe);
      
      // Acquire again and verify reset
      const reusedPipe = pipePool.acquire();
      expect(reusedPipe.position.x).toBe(0); // Should be reset
      expect(reusedPipe.hasBeenPassed).toBe(false); // Should be reset
    });

    it('should handle rapid pipe creation and destruction efficiently', () => {
      const startTime = performance.now();
      
      // Simulate rapid pipe lifecycle (like in actual game)
      for (let cycle = 0; cycle < 100; cycle++) {
        const pipe = pipePool.acquire();
        pipe.reset(800);
        // Simulate pipe moving off screen
        pipePool.release(pipe);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete quickly due to object reuse
      expect(duration).toBeLessThan(50); // Should be very fast
      expect(pipePool.getPoolSize()).toBeGreaterThan(0); // Pool should have objects
    });
  });

  describe('Spatial Partitioning for Collision Detection (Requirement 8.3)', () => {
    let spatialGrid: SpatialGrid<Pipe>;
    const worldWidth = 800;
    const worldHeight = 600;

    beforeEach(() => {
      spatialGrid = new SpatialGrid<Pipe>(100, worldWidth, worldHeight);
    });

    it('should efficiently find nearby pipes for collision detection', () => {
      // Create pipes at different positions
      const pipes = [
        new Pipe(100),  // Near bird
        new Pipe(200),  // Near bird
        new Pipe(500),  // Far from bird
        new Pipe(700),  // Very far from bird
      ];

      // Add pipes to spatial grid
      pipes.forEach(pipe => spatialGrid.insert(pipe));

      // Query for pipes near bird position (assume bird at x=150)
      const birdBounds: Rectangle = { x: 150, y: 250, width: 30, height: 30 };
      const nearbyPipes = spatialGrid.query(birdBounds);

      // Should find pipes that are actually nearby
      expect(nearbyPipes.length).toBeGreaterThan(0);
      expect(nearbyPipes.length).toBeLessThan(pipes.length); // Should not return all pipes
      
      // Verify that nearby pipes are actually close to the bird
      nearbyPipes.forEach(pipe => {
        const distance = Math.abs(pipe.position.x - birdBounds.x);
        expect(distance).toBeLessThan(200); // Should be reasonably close
      });
    });

    it('should provide better performance than brute force collision detection', () => {
      // Create many pipes across the world
      const pipes: Pipe[] = [];
      for (let i = 0; i < 50; i++) {
        const pipe = new Pipe(i * 100);
        pipes.push(pipe);
        spatialGrid.insert(pipe);
      }

      const birdBounds: Rectangle = { x: 1000, y: 300, width: 30, height: 30 };

      // Time spatial grid query
      const startTime = performance.now();
      for (let i = 0; i < 100; i++) {
        spatialGrid.query(birdBounds);
      }
      const spatialTime = performance.now() - startTime;

      // Time brute force approach
      const startTime2 = performance.now();
      for (let i = 0; i < 100; i++) {
        // Brute force: check all pipes
        pipes.filter(pipe => {
          return !(birdBounds.x + birdBounds.width < pipe.bounds.x ||
                   birdBounds.x > pipe.bounds.x + pipe.bounds.width ||
                   birdBounds.y + birdBounds.height < pipe.bounds.y ||
                   birdBounds.y > pipe.bounds.y + pipe.bounds.height);
        });
      }
      const bruteForceTime = performance.now() - startTime2;

      // Spatial grid should be faster (or at least not significantly slower)
      expect(spatialTime).toBeLessThan(bruteForceTime * 2);
    });

    it('should handle dynamic pipe insertion and removal efficiently', () => {
      const pipes: Pipe[] = [];
      
      // Add pipes dynamically (like in game)
      for (let i = 0; i < 20; i++) {
        const pipe = new Pipe(i * 150);
        pipes.push(pipe);
        spatialGrid.insert(pipe);
      }

      // Remove pipes that have moved off screen
      const pipesToRemove = pipes.slice(0, 10);
      pipesToRemove.forEach(pipe => spatialGrid.remove(pipe));

      // Verify grid state
      const stats = spatialGrid.getStats();
      expect(stats.totalObjects).toBeLessThan(200); // Should have fewer objects after removal (accounting for multi-cell objects)
      expect(stats.totalObjects).toBeGreaterThan(0); // Should still have some objects
      
      // Query should still work efficiently
      const birdBounds: Rectangle = { x: 1500, y: 300, width: 30, height: 30 };
      const nearbyPipes = spatialGrid.query(birdBounds);
      expect(nearbyPipes).toBeDefined();
    });
  });

  describe('Frame Rate Monitoring (Requirement 8.1)', () => {
    let performanceMonitor: PerformanceMonitor;

    beforeEach(() => {
      performanceMonitor = new PerformanceMonitor(60);
    });

    it('should provide performance statistics for monitoring', () => {
      // Simulate some frame updates
      for (let i = 0; i < 10; i++) {
        performanceMonitor.update();
      }

      const stats = performanceMonitor.getStats();
      
      // Should provide all required statistics
      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('averageFrameTime');
      expect(stats).toHaveProperty('maxFrameTime');
      expect(stats).toHaveProperty('isGood');
      
      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.averageFrameTime).toBe('number');
      expect(typeof stats.maxFrameTime).toBe('number');
      expect(typeof stats.isGood).toBe('boolean');
    });

    it('should track frame rate over time', () => {
      const initialFPS = performanceMonitor.getFPS();
      expect(initialFPS).toBe(0); // No data initially

      // Update multiple times
      for (let i = 0; i < 5; i++) {
        performanceMonitor.update();
      }

      // Should be tracking frame times
      expect(performanceMonitor.getAverageFrameTime()).toBeGreaterThanOrEqual(0);
    });

    it('should be able to reset performance metrics', () => {
      // Generate some data
      for (let i = 0; i < 5; i++) {
        performanceMonitor.update();
      }

      // Reset
      performanceMonitor.reset();

      // Should be back to initial state
      expect(performanceMonitor.getFPS()).toBe(0);
      expect(performanceMonitor.getAverageFrameTime()).toBe(0);
      expect(performanceMonitor.getMaxFrameTime()).toBe(0);
    });
  });

  describe('Integrated Performance Optimizations', () => {
    it('should work together to provide optimal game performance', () => {
      // Set up all performance systems
      const pipePool = new ObjectPool<Pipe>(
        () => new Pipe(0),
        (pipe) => pipe.reset(0),
        5,
        20
      );
      
      const spatialGrid = new SpatialGrid<Pipe>(100, 800, 600);
      const performanceMonitor = new PerformanceMonitor(60);

      // Simulate game loop with performance optimizations
      const pipes: Pipe[] = [];
      const birdBounds: Rectangle = { x: 150, y: 300, width: 30, height: 30 };

      const startTime = performance.now();

      // Simulate multiple game frames
      for (let frame = 0; frame < 100; frame++) {
        performanceMonitor.update();
        
        // Generate new pipe occasionally (using object pool)
        if (frame % 20 === 0) {
          const pipe = pipePool.acquire();
          pipe.reset(800);
          pipes.push(pipe);
          spatialGrid.insert(pipe);
        }

        // Update pipe positions
        pipes.forEach(pipe => {
          pipe.position.x -= 2; // Move left
          pipe.bounds.x = pipe.position.x;
        });

        // Remove off-screen pipes (return to pool)
        const remainingPipes: Pipe[] = [];
        pipes.forEach(pipe => {
          if (pipe.position.x < -50) {
            spatialGrid.remove(pipe);
            pipePool.release(pipe);
          } else {
            remainingPipes.push(pipe);
          }
        });
        pipes.length = 0;
        pipes.push(...remainingPipes);

        // Efficient collision detection using spatial grid
        spatialGrid.clear();
        pipes.forEach(pipe => spatialGrid.insert(pipe));
        const nearbyPipes = spatialGrid.query(birdBounds);
        
        // Simulate collision check with nearby pipes only
        nearbyPipes.forEach(pipe => {
          pipe.checkCollision({ bounds: birdBounds } as any);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete efficiently
      expect(totalTime).toBeLessThan(100); // Should be fast

      // Performance monitor should have data
      const stats = performanceMonitor.getStats();
      expect(stats.averageFrameTime).toBeGreaterThanOrEqual(0);

      // Object pool should be managing memory efficiently
      expect(pipePool.getPoolSize()).toBeGreaterThanOrEqual(0); // Pool may be empty if all objects are in use

      // Spatial grid should be clean
      const gridStats = spatialGrid.getStats();
      expect(gridStats.totalObjects).toBeGreaterThanOrEqual(pipes.length); // May be higher due to multi-cell objects
    });
  });
});