import { Rectangle, Vector2, Bird, Pipe } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

/**
 * Collision detection utilities for the Flappy Bird game
 * Implements AABB collision detection and boundary collision detection
 */

/**
 * Axis-Aligned Bounding Box (AABB) collision detection
 * Returns true if two rectangles overlap
 */
export function checkAABBCollision(rect1: Rectangle, rect2: Rectangle): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Check if a rectangle is colliding with the ground boundary
 */
export function checkGroundCollision(bounds: Rectangle): boolean {
  const groundLevel = DEFAULT_GAME_CONFIG.canvas.height;
  return bounds.y + bounds.height >= groundLevel;
}

/**
 * Check if a rectangle is colliding with the ceiling boundary
 */
export function checkCeilingCollision(bounds: Rectangle): boolean {
  return bounds.y <= 0;
}

/**
 * Check if a rectangle is within the screen boundaries
 */
export function isWithinBounds(bounds: Rectangle): boolean {
  return (
    bounds.x >= 0 &&
    bounds.y >= 0 &&
    bounds.x + bounds.width <= DEFAULT_GAME_CONFIG.canvas.width &&
    bounds.y + bounds.height <= DEFAULT_GAME_CONFIG.canvas.height
  );
}

/**
 * Comprehensive collision detection for bird against all boundaries
 * Returns collision type for appropriate response handling
 */
export interface CollisionResult {
  hasCollision: boolean;
  collisionType: 'none' | 'ground' | 'ceiling' | 'pipe';
  collidedWith?: any; // The object that was collided with (for pipe collisions)
}

/**
 * Check bird collision with boundaries (ground and ceiling)
 */
export function checkBirdBoundaryCollision(bird: Bird): CollisionResult {
  // Check ground collision
  if (checkGroundCollision(bird.bounds)) {
    return {
      hasCollision: true,
      collisionType: 'ground'
    };
  }

  // Check ceiling collision
  if (checkCeilingCollision(bird.bounds)) {
    return {
      hasCollision: true,
      collisionType: 'ceiling'
    };
  }

  return {
    hasCollision: false,
    collisionType: 'none'
  };
}

/**
 * Check bird collision with a pipe using the pipe's built-in collision method
 */
export function checkBirdPipeCollision(bird: Bird, pipe: Pipe): CollisionResult {
  if (pipe.checkCollision(bird)) {
    return {
      hasCollision: true,
      collisionType: 'pipe',
      collidedWith: pipe
    };
  }

  return {
    hasCollision: false,
    collisionType: 'none'
  };
}

/**
 * Check bird collision with multiple pipes
 */
export function checkBirdPipesCollision(bird: Bird, pipes: Pipe[]): CollisionResult {
  for (const pipe of pipes) {
    const result = checkBirdPipeCollision(bird, pipe);
    if (result.hasCollision) {
      return result;
    }
  }

  return {
    hasCollision: false,
    collisionType: 'none'
  };
}

/**
 * Comprehensive collision detection for bird against all possible collision sources
 */
export function checkAllCollisions(bird: Bird, pipes: Pipe[]): CollisionResult {
  // Check boundary collisions first
  const boundaryResult = checkBirdBoundaryCollision(bird);
  if (boundaryResult.hasCollision) {
    return boundaryResult;
  }

  // Check pipe collisions
  const pipeResult = checkBirdPipesCollision(bird, pipes);
  if (pipeResult.hasCollision) {
    return pipeResult;
  }

  return {
    hasCollision: false,
    collisionType: 'none'
  };
}

/**
 * Collision response handler - determines what should happen when collision occurs
 */
export interface CollisionResponse {
  shouldTriggerGameOver: boolean;
  shouldStopPhysics: boolean;
  shouldPlaySound?: boolean;
  message?: string;
}

/**
 * Handle collision response based on collision type
 */
export function handleCollisionResponse(collisionResult: CollisionResult): CollisionResponse {
  if (!collisionResult.hasCollision) {
    return {
      shouldTriggerGameOver: false,
      shouldStopPhysics: false
    };
  }

  // All collision types trigger game over in Flappy Bird
  switch (collisionResult.collisionType) {
    case 'ground':
      return {
        shouldTriggerGameOver: true,
        shouldStopPhysics: true,
        shouldPlaySound: true,
        message: 'Hit the ground!'
      };
    
    case 'ceiling':
      return {
        shouldTriggerGameOver: true,
        shouldStopPhysics: true,
        shouldPlaySound: true,
        message: 'Hit the ceiling!'
      };
    
    case 'pipe':
      return {
        shouldTriggerGameOver: true,
        shouldStopPhysics: true,
        shouldPlaySound: true,
        message: 'Hit a pipe!'
      };
    
    default:
      return {
        shouldTriggerGameOver: false,
        shouldStopPhysics: false
      };
  }
}