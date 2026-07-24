import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialGrid } from './SpatialGrid';
import { Rectangle } from '@/types';

// Mock object for testing spatial grid
interface TestEntity {
  bounds: Rectangle;
  id: number;
}

describe('SpatialGrid', () => {
  let grid: SpatialGrid<TestEntity>;
  const worldWidth = 800;
  const worldHeight = 600;
  const cellSize = 100;

  beforeEach(() => {
    grid = new SpatialGrid<TestEntity>(cellSize, worldWidth, worldHeight);
  });

  const createEntity = (x: number, y: number, width: number = 50, height: number = 50, id: number = 1): TestEntity => ({
    bounds: { x, y, width, height },
    id
  });

  describe('initialization', () => {
    it('should initialize with empty grid', () => {
      const stats = grid.getStats();
      expect(stats.occupiedCells).toBe(0);
      expect(stats.totalObjects).toBe(0);
    });

    it('should calculate correct total cells', () => {
      const stats = grid.getStats();
      const expectedCells = Math.ceil(worldWidth / cellSize) * Math.ceil(worldHeight / cellSize);
      expect(stats.totalCells).toBe(expectedCells);
    });
  });

  describe('insert', () => {
    it('should insert object into correct cell', () => {
      const entity = createEntity(150, 250);
      grid.insert(entity);

      const stats = grid.getStats();
      expect(stats.occupiedCells).toBeGreaterThan(0);
      expect(stats.totalObjects).toBeGreaterThan(0);
    });

    it('should handle objects spanning multiple cells', () => {
      // Large object that spans multiple cells
      const entity = createEntity(90, 90, 120, 120);
      grid.insert(entity);

      const stats = grid.getStats();
      expect(stats.occupiedCells).toBeGreaterThan(1);
      expect(stats.totalObjects).toBeGreaterThan(1); // Object appears in multiple cells
    });

    it('should insert multiple objects', () => {
      const entity1 = createEntity(50, 50, 30, 30, 1);
      const entity2 = createEntity(200, 200, 30, 30, 2);
      
      grid.insert(entity1);
      grid.insert(entity2);

      const stats = grid.getStats();
      expect(stats.occupiedCells).toBe(2);
      expect(stats.totalObjects).toBe(2);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      // Set up test entities in different cells
      grid.insert(createEntity(50, 50, 30, 30, 1));    // Cell (0,0)
      grid.insert(createEntity(150, 150, 30, 30, 2));  // Cell (1,1)
      grid.insert(createEntity(250, 250, 30, 30, 3));  // Cell (2,2)
      grid.insert(createEntity(350, 350, 30, 30, 4));  // Cell (3,3)
    });

    it('should return objects in queried area', () => {
      const queryBounds = { x: 40, y: 40, width: 50, height: 50 };
      const results = grid.query(queryBounds);
      
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe(1);
    });

    it('should return multiple objects when query spans multiple cells', () => {
      const queryBounds = { x: 40, y: 40, width: 200, height: 200 };
      const results = grid.query(queryBounds);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      const ids = results.map(r => r.id);
      expect(ids).toContain(1);
      expect(ids).toContain(2);
    });

    it('should return empty array when no objects in queried area', () => {
      const queryBounds = { x: 500, y: 500, width: 50, height: 50 };
      const results = grid.query(queryBounds);
      
      expect(results).toHaveLength(0);
    });

    it('should not return duplicate objects', () => {
      // Insert object that spans multiple cells
      const largeEntity = createEntity(90, 90, 120, 120, 5);
      grid.insert(largeEntity);

      const queryBounds = { x: 80, y: 80, width: 140, height: 140 };
      const results = grid.query(queryBounds);
      
      // Should only return the large entity once, even though it's in multiple cells
      const largeEntityResults = results.filter(r => r.id === 5);
      expect(largeEntityResults).toHaveLength(1);
    });
  });

  describe('remove', () => {
    let entity1: TestEntity;
    let entity2: TestEntity;

    beforeEach(() => {
      entity1 = createEntity(50, 50, 30, 30, 1);
      entity2 = createEntity(150, 150, 30, 30, 2);
      grid.insert(entity1);
      grid.insert(entity2);
    });

    it('should remove object from grid', () => {
      grid.remove(entity1);
      
      const queryBounds = { x: 40, y: 40, width: 50, height: 50 };
      const results = grid.query(queryBounds);
      
      expect(results).toHaveLength(0);
    });

    it('should clean up empty cells', () => {
      const initialStats = grid.getStats();
      grid.remove(entity1);
      grid.remove(entity2);
      
      const finalStats = grid.getStats();
      expect(finalStats.occupiedCells).toBe(0);
      expect(finalStats.totalObjects).toBe(0);
    });

    it('should handle removing non-existent object gracefully', () => {
      const nonExistentEntity = createEntity(999, 999, 30, 30, 999);
      
      expect(() => grid.remove(nonExistentEntity)).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all objects from grid', () => {
      grid.insert(createEntity(50, 50, 30, 30, 1));
      grid.insert(createEntity(150, 150, 30, 30, 2));
      
      grid.clear();
      
      const stats = grid.getStats();
      expect(stats.occupiedCells).toBe(0);
      expect(stats.totalObjects).toBe(0);
    });
  });

  describe('performance characteristics', () => {
    it('should efficiently handle many objects', () => {
      const startTime = performance.now();
      
      // Insert many objects
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * worldWidth;
        const y = Math.random() * worldHeight;
        grid.insert(createEntity(x, y, 20, 20, i));
      }
      
      const insertTime = performance.now() - startTime;
      expect(insertTime).toBeLessThan(100); // Should complete in reasonable time
    });

    it('should provide efficient spatial queries', () => {
      // Insert objects across the grid
      for (let i = 0; i < 100; i++) {
        const x = (i % 10) * 80;
        const y = Math.floor(i / 10) * 60;
        grid.insert(createEntity(x, y, 20, 20, i));
      }

      const startTime = performance.now();
      
      // Perform many queries
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * worldWidth;
        const y = Math.random() * worldHeight;
        grid.query({ x, y, width: 100, height: 100 });
      }
      
      const queryTime = performance.now() - startTime;
      expect(queryTime).toBeLessThan(50); // Should be fast
    });

    it('should scale well with grid size', () => {
      const smallGrid = new SpatialGrid<TestEntity>(50, 400, 300);
      const largeGrid = new SpatialGrid<TestEntity>(50, 1600, 1200);

      const entity = createEntity(100, 100, 30, 30, 1);

      const startTime1 = performance.now();
      smallGrid.insert(entity);
      smallGrid.query({ x: 90, y: 90, width: 50, height: 50 });
      const smallTime = performance.now() - startTime1;

      const startTime2 = performance.now();
      largeGrid.insert(entity);
      largeGrid.query({ x: 90, y: 90, width: 50, height: 50 });
      const largeTime = performance.now() - startTime2;

      // Performance should not degrade significantly with larger world
      expect(largeTime).toBeLessThan(smallTime * 3);
    });
  });

  describe('edge cases', () => {
    it('should handle objects at world boundaries', () => {
      const entity = createEntity(worldWidth - 10, worldHeight - 10, 20, 20);
      
      expect(() => grid.insert(entity)).not.toThrow();
      
      const results = grid.query({ x: worldWidth - 20, y: worldHeight - 20, width: 30, height: 30 });
      expect(results).toHaveLength(1);
    });

    it('should handle zero-size objects', () => {
      const entity = createEntity(100, 100, 0, 0);
      
      expect(() => grid.insert(entity)).not.toThrow();
      
      const results = grid.query({ x: 100, y: 100, width: 1, height: 1 });
      expect(results).toHaveLength(1);
    });

    it('should handle negative coordinates', () => {
      const entity = createEntity(-10, -10, 20, 20);
      
      expect(() => grid.insert(entity)).not.toThrow();
      
      const results = grid.query({ x: -15, y: -15, width: 30, height: 30 });
      expect(results).toHaveLength(1);
    });
  });
});