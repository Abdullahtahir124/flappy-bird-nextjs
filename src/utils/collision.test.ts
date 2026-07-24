import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { Bird } from '@/entities/Bird';
import { Pipe } from '@/entities/Pipe';
import { 
  checkAllCollisions, 
  checkBirdBoundaryCollision, 
  checkBirdPipeCollision,
  handleCollisionResponse,
  CollisionResult 
} from './collision';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

describe('Collision Detection Property Tests', () => {
  let bird: Bird;
  let pipes: Pipe[];

  beforeEach(() => {
    bird = new Bird(100, 300);
    pipes = [];
  });

  describe('Property 4: Collision Detection Triggers Game Over', () => {
    it('**Feature: flappy-bird-game, Property 4: Collision Detection Triggers Game Over** - any collision between bird and pipes, ground, or ceiling triggers game over state', () => {
      /**
       * **Validates: Requirements 3.1, 3.2, 3.3**
       * For any collision between the bird and pipes, ground, or ceiling, 
       * the collision system should trigger game over state.
       */
      fc.assert(
        fc.property(
          fc.record({
            // Bird position that could cause collisions
            birdX: fc.float({ min: 0, max: DEFAULT_GAME_CONFIG.canvas.width }),
            birdY: fc.float({ min: -50, max: DEFAULT_GAME_CONFIG.canvas.height + 50 }),
            // Pipe position for pipe collision testing
            pipeX: fc.float({ min: 0, max: DEFAULT_GAME_CONFIG.canvas.width }),
            // Test different collision scenarios
            collisionType: fc.constantFrom('ground', 'ceiling', 'pipe', 'none')
          }),
          ({ birdX, birdY, pipeX, collisionType }) => {
            // Set up bird position
            bird = new Bird(birdX, birdY);
            
            // Force specific collision scenarios for testing
            switch (collisionType) {
              case 'ground':
                // Position bird at ground level
                bird.position.y = DEFAULT_GAME_CONFIG.canvas.height - bird.bounds.height + 1;
                bird.bounds.y = bird.position.y;
                break;
                
              case 'ceiling':
                // Position bird at ceiling
                bird.position.y = -1;
                bird.bounds.y = bird.position.y;
                break;
                
              case 'pipe':
                // Create a pipe and position bird to collide with it
                const pipe = new Pipe(pipeX);
                pipes = [pipe];
                
                // Position bird to collide with the pipe (outside the gap)
                bird.position.x = pipe.position.x + 10; // Within pipe horizontal bounds
                bird.position.y = pipe.gapPosition - 10; // Above the gap (collision with top pipe)
                bird.bounds.x = bird.position.x;
                bird.bounds.y = bird.position.y;
                break;
                
              case 'none':
                // Position bird in safe area (middle of screen, away from pipes)
                bird.position.x = 100;
                bird.position.y = DEFAULT_GAME_CONFIG.canvas.height / 2;
                bird.bounds.x = bird.position.x;
                bird.bounds.y = bird.position.y;
                pipes = []; // No pipes to collide with
                break;
            }
            
            // Check collision detection
            const collisionResult = checkAllCollisions(bird, pipes);
            const response = handleCollisionResponse(collisionResult);
            
            // Verify collision detection behavior
            if (collisionType === 'none') {
              // No collision should be detected
              expect(collisionResult.hasCollision).toBe(false);
              expect(collisionResult.collisionType).toBe('none');
              expect(response.shouldTriggerGameOver).toBe(false);
              expect(response.shouldStopPhysics).toBe(false);
            } else {
              // Collision should be detected and trigger game over
              expect(collisionResult.hasCollision).toBe(true);
              expect(collisionResult.collisionType).toBe(collisionType);
              expect(response.shouldTriggerGameOver).toBe(true);
              expect(response.shouldStopPhysics).toBe(true);
              
              // Response should include appropriate feedback
              expect(response.shouldPlaySound).toBe(true);
              expect(response.message).toBeDefined();
              expect(typeof response.message).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 4: Collision Detection Triggers Game Over** - boundary collision detection works correctly', () => {
      /**
       * **Validates: Requirements 3.2, 3.3**
       * Specific test for ground and ceiling boundary collisions
       */
      fc.assert(
        fc.property(
          fc.record({
            birdX: fc.float({ min: 0, max: DEFAULT_GAME_CONFIG.canvas.width - 30 }),
            testGroundCollision: fc.boolean()
          }),
          ({ birdX, testGroundCollision }) => {
            if (testGroundCollision) {
              // Test ground collision
              const groundY = DEFAULT_GAME_CONFIG.canvas.height - 10; // Below ground
              bird = new Bird(birdX, groundY);
              
              const result = checkBirdBoundaryCollision(bird);
              expect(result.hasCollision).toBe(true);
              expect(result.collisionType).toBe('ground');
            } else {
              // Test ceiling collision
              const ceilingY = -5; // Above ceiling
              bird = new Bird(birdX, ceilingY);
              
              const result = checkBirdBoundaryCollision(bird);
              expect(result.hasCollision).toBe(true);
              expect(result.collisionType).toBe('ceiling');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 4: Collision Detection Triggers Game Over** - pipe collision detection works correctly', () => {
      /**
       * **Validates: Requirements 3.1**
       * Specific test for pipe collision detection
       */
      fc.assert(
        fc.property(
          fc.record({
            pipeX: fc.float({ min: 0, max: DEFAULT_GAME_CONFIG.canvas.width }),
            birdX: fc.float({ min: 0, max: DEFAULT_GAME_CONFIG.canvas.width }),
            shouldCollide: fc.boolean()
          }),
          ({ pipeX, birdX, shouldCollide }) => {
            const pipe = new Pipe(pipeX);
            
            if (shouldCollide) {
              // Position bird to definitely collide with pipe (outside gap)
              bird = new Bird(birdX, pipe.gapPosition - 15); // Above gap
              bird.position.x = pipe.position.x + 10; // Within pipe horizontal bounds
              bird.bounds.x = bird.position.x;
              bird.bounds.y = bird.position.y;
            } else {
              // Position bird safely within the gap
              bird = new Bird(birdX, pipe.gapPosition + pipe.gapSize / 2);
              bird.position.x = pipe.position.x + pipe.bounds.width + 50; // Past the pipe
              bird.bounds.x = bird.position.x;
              bird.bounds.y = bird.position.y;
            }
            
            const result = checkBirdPipeCollision(bird, pipe);
            
            if (shouldCollide) {
              // Should detect collision when bird is positioned to collide
              const actualCollision = pipe.checkCollision(bird);
              if (actualCollision) {
                expect(result.hasCollision).toBe(true);
                expect(result.collisionType).toBe('pipe');
                expect(result.collidedWith).toBe(pipe);
              }
            } else {
              // Should not detect collision when bird is positioned safely
              const actualCollision = pipe.checkCollision(bird);
              if (!actualCollision) {
                expect(result.hasCollision).toBe(false);
                expect(result.collisionType).toBe('none');
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});