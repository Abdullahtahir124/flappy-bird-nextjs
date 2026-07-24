import { describe, it, expect, beforeEach } from 'vitest';
import { ObjectPool } from './ObjectPool';

// Mock object for testing
interface TestObject {
  id: number;
  value: string;
  reset(): void;
}

class MockTestObject implements TestObject {
  public id: number = 0;
  public value: string = '';

  reset(): void {
    this.id = 0;
    this.value = '';
  }
}

describe('ObjectPool', () => {
  let pool: ObjectPool<TestObject>;
  let createCount: number;

  beforeEach(() => {
    createCount = 0;
    pool = new ObjectPool<TestObject>(
      () => {
        createCount++;
        return new MockTestObject();
      },
      (obj) => obj.reset(),
      3, // Initial size
      10 // Max size
    );
  });

  describe('initialization', () => {
    it('should pre-populate pool with initial objects', () => {
      expect(createCount).toBe(3);
      expect(pool.getPoolSize()).toBe(3);
    });
  });

  describe('acquire', () => {
    it('should return object from pool when available', () => {
      const obj = pool.acquire();
      expect(obj).toBeInstanceOf(MockTestObject);
      expect(pool.getPoolSize()).toBe(2);
    });

    it('should create new object when pool is empty', () => {
      // Exhaust the pool
      pool.acquire();
      pool.acquire();
      pool.acquire();
      expect(pool.getPoolSize()).toBe(0);

      // Should create new object
      const obj = pool.acquire();
      expect(obj).toBeInstanceOf(MockTestObject);
      expect(createCount).toBe(4);
    });
  });

  describe('release', () => {
    it('should return object to pool and reset it', () => {
      const obj = pool.acquire();
      obj.id = 123;
      obj.value = 'test';

      pool.release(obj);

      expect(pool.getPoolSize()).toBe(3);
      expect(obj.id).toBe(0);
      expect(obj.value).toBe('');
    });

    it('should not exceed max pool size', () => {
      // Fill pool to max capacity
      const objects: TestObject[] = [];
      for (let i = 0; i < 10; i++) {
        objects.push(pool.acquire());
      }

      // Release all objects
      objects.forEach(obj => pool.release(obj));

      expect(pool.getPoolSize()).toBe(10); // Should not exceed max size
    });

    it('should discard objects when pool is full', () => {
      // Fill pool beyond max capacity
      const objects: TestObject[] = [];
      for (let i = 0; i < 15; i++) {
        objects.push(pool.acquire());
      }

      // Release all objects
      objects.forEach(obj => pool.release(obj));

      expect(pool.getPoolSize()).toBe(10); // Should cap at max size
    });
  });

  describe('clear', () => {
    it('should empty the pool', () => {
      expect(pool.getPoolSize()).toBe(3);
      pool.clear();
      expect(pool.getPoolSize()).toBe(0);
    });
  });

  describe('performance characteristics', () => {
    it('should reuse objects efficiently', () => {
      const initialCreateCount = createCount;
      
      // Acquire and release objects multiple times
      for (let i = 0; i < 100; i++) {
        const obj = pool.acquire();
        pool.release(obj);
      }

      // Should not create many new objects due to reuse
      expect(createCount - initialCreateCount).toBeLessThan(10);
    });

    it('should handle rapid acquire/release cycles', () => {
      const objects: TestObject[] = [];
      
      // Rapid acquisition
      for (let i = 0; i < 50; i++) {
        objects.push(pool.acquire());
      }

      // Rapid release
      objects.forEach(obj => pool.release(obj));

      expect(pool.getPoolSize()).toBe(10); // Should maintain max size limit
    });
  });
});