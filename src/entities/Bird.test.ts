import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Bird } from './Bird';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

describe('Bird Entity Property Tests', () => {
  let bird: Bird;

  beforeEach(() => {
    bird = new Bird(100, 300);
  });

  describe('Property 1: Stationary Horizontal Position', () => {
    it('**Feature: flappy-bird-game, Property 1: Stationary Horizontal Position** - bird maintains fixed horizontal position during gameplay', () => {
      /**
       * **Validates: Requirements 1.1**
       * The bird should remain at a fixed horizontal position while pipes move toward it.
       */
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) }), // deltaTime in seconds
          (deltaTime) => {
            // Ensure deltaTime is valid
            fc.pre(!isNaN(deltaTime) && isFinite(deltaTime) && deltaTime > 0);
            
            // Reset bird to known state
            bird = new Bird(100, 300);
            const initialX = bird.position.x;
            const initialHorizontalVelocity = bird.velocity.x;
            
            // Update bird
            bird.update(deltaTime);
            
            // Horizontal velocity should be zero
            expect(bird.velocity.x).toBe(0);
            expect(initialHorizontalVelocity).toBe(0);
            
            // Position should remain unchanged horizontally
            expect(bird.position.x).toBe(initialX);
            expect(bird.bounds.x).toBe(initialX);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 2: Gravity Application', () => {
    it('**Feature: flappy-bird-game, Property 2: Gravity Application** - bird velocity increases downward when no flap input occurs', () => {
      /**
       * **Validates: Requirements 1.2**
       * For any game frame where no flap input occurs, the bird's downward 
       * velocity should increase due to gravity application.
       */
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(0.1) }), // deltaTime in seconds
          fc.float({ min: Math.fround(-100), max: Math.fround(400) }), // initial vertical velocity
          (deltaTime, initialVelocityY) => {
            // Ensure inputs are valid
            fc.pre(!isNaN(deltaTime) && isFinite(deltaTime) && deltaTime > 0);
            fc.pre(!isNaN(initialVelocityY) && isFinite(initialVelocityY));
            
            // Reset bird to known state and set initial vertical velocity
            bird = new Bird(100, 300);
            bird.velocity.y = initialVelocityY;
            const initialVerticalVelocity = bird.velocity.y;
            
            // Apply gravity (no flap input)
            bird.applyGravity(deltaTime);
            
            // Vertical velocity should increase (become more positive/downward)
            // unless already at terminal velocity
            if (initialVerticalVelocity < DEFAULT_GAME_CONFIG.physics.terminalVelocity) {
              expect(bird.velocity.y).toBeGreaterThan(initialVerticalVelocity);
            } else {
              // Should be clamped at terminal velocity
              expect(bird.velocity.y).toBe(DEFAULT_GAME_CONFIG.physics.terminalVelocity);
            }
            
            // Ensure result is not NaN
            expect(bird.velocity.y).not.toBeNaN();
            expect(isFinite(bird.velocity.y)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Flap Input Response', () => {
    it('**Feature: flappy-bird-game, Property 3: Flap Input Response** - flap input results in immediate upward velocity change', () => {
      /**
       * **Validates: Requirements 1.3, 6.1, 6.2, 6.3**
       * For any valid input method (spacebar, click, or touch), triggering the 
       * input should result in immediate upward velocity change for the bird.
       */
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-500), max: Math.fround(500) }), // initial vertical velocity
          (initialVelocityY) => {
            // Ensure input is valid
            fc.pre(!isNaN(initialVelocityY) && isFinite(initialVelocityY));
            
            // Reset bird to known state and set initial vertical velocity
            bird = new Bird(100, 300);
            bird.velocity.y = initialVelocityY;
            
            // Trigger flap input
            bird.flap();
            
            // Velocity should be set to flap strength (negative for upward)
            expect(bird.velocity.y).toBe(DEFAULT_GAME_CONFIG.physics.flapStrength);
            expect(bird.velocity.y).toBeLessThan(0); // Upward is negative
            
            // Ensure result is not NaN
            expect(bird.velocity.y).not.toBeNaN();
            expect(isFinite(bird.velocity.y)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});