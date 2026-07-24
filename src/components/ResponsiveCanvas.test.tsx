import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import Canvas from './Canvas';

// Mock canvas context
const mockGetContext = vi.fn().mockReturnValue({
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
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

describe('Responsive Canvas Integration Tests', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    
    // Clear all mocks
    vi.clearAllMocks();
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
  });

  describe('Canvas Component Responsive Features', () => {
    it('should render canvas with specified dimensions', () => {
      const { container } = render(
        <Canvas width={400} height={300} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      expect(canvas?.width).toBe(400);
      expect(canvas?.height).toBe(300);
    });

    it('should apply responsive styling', () => {
      const { container } = render(
        <Canvas width={800} height={600} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      
      // Check that responsive styles are applied
      expect(canvas?.style.maxWidth).toBe('100%');
      expect(canvas?.style.maxHeight).toBe('100%');
    });

    it('should prevent touch actions for mobile', () => {
      const { container } = render(
        <Canvas width={400} height={300} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      
      // Check that touch-action is set to none
      expect(canvas?.style.touchAction).toBe('none');
    });

    it('should handle scale parameter', () => {
      const mockContext = mockGetContext();
      const { container } = render(
        <Canvas width={400} height={300} scale={0.5} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      
      // Context scale should be called with the scale factor
      expect(mockContext.scale).toHaveBeenCalledWith(0.5, 0.5);
    });

    it('should handle device pixel ratio scaling', () => {
      const mockContext = mockGetContext();
      const { container } = render(
        <Canvas width={400} height={300} scale={1} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      
      // Context scale should be called once for device pixel ratio (even when responsive scale is 1)
      expect(mockContext.scale).toHaveBeenCalledTimes(1);
      // First call should be for device pixel ratio
      expect(mockContext.scale).toHaveBeenCalledWith(1, 1); // Assuming devicePixelRatio is 1 in test environment
    });
  });

  describe('Touch Event Handling', () => {
    it('should have proper touch event configuration', () => {
      const { container } = render(
        <Canvas width={400} height={300} />
      );

      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeNull();
      
      // Canvas should have touch-action: none to prevent default behaviors
      expect(canvas?.style.touchAction).toBe('none');
    });
  });
});