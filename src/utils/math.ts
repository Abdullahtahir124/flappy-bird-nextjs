import { Vector2, Rectangle } from '@/types';

// Vector2 utility functions
export const createVector2 = (x: number = 0, y: number = 0): Vector2 => ({ x, y });

export const addVectors = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const scaleVector = (vector: Vector2, scale: number): Vector2 => ({
  x: vector.x * scale,
  y: vector.y * scale,
});

export const clampVector = (vector: Vector2, min: Vector2, max: Vector2): Vector2 => ({
  x: Math.max(min.x, Math.min(max.x, vector.x)),
  y: Math.max(min.y, Math.min(max.y, vector.y)),
});

// Rectangle utility functions
export const createRectangle = (x: number = 0, y: number = 0, width: number = 0, height: number = 0): Rectangle => ({
  x, y, width, height
});

export const rectanglesIntersect = (a: Rectangle, b: Rectangle): boolean => {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
};

export const pointInRectangle = (point: Vector2, rect: Rectangle): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

// Math utility functions
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};