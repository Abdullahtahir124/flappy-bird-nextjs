import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { Pipe } from './Pipe';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

describe('Pipe Entity Property Tests', () => {
  describe('Property 7: Valid Pipe Gap Generation', () => {
    it('**Feature: flappy-bird-game, Property 7: Valid Pipe Gap Generation** - generated pipe gaps are within valid navigable bounds', () => {
      /**
       * **Validates: Requirements 2.2, 2.5**
       * For any generated pipe, the gap position should be within valid bounds 
       * that ensure the gap is navigable.
       */
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0), max: Math.fround(1000) }), // x position
          (xPosition) => {
            const pipe = new Pipe(xPosition);
            
            // Gap position should be within valid bounds
            const minValidGapTop = DEFAULT_GAME_CONFIG.gameplay.minPipeHeight;
            const maxValidGapTop = DEFAULT_GAME_CONFIG.canvas.height - 
              DEFAULT_GAME_CONFIG.gameplay.minPipeHeight - 
              DEFAULT_GAME_CONFIG.gameplay.pipeGapSize;
            
            // Gap position should be within the valid range
            expect(pipe.gapPosition).toBeGreaterThanOrEqual(minValidGapTop);
            expect(pipe.gapPosition).toBeLessThanOrEqual(maxValidGapTop);
            
            // Gap size should match configuration
            expect(pipe.gapSize).toBe(DEFAULT_GAME_CONFIG.gameplay.pipeGapSize);
            
            // Gap should be navigable (there should be space above and below)
            const spaceAbove = pipe.gapPosition;
            const spaceBelow = DEFAULT_GAME_CONFIG.canvas.height - (pipe.gapPosition + pipe.gapSize);
            
            expect(spaceAbove).toBeGreaterThanOrEqual(DEFAULT_GAME_CONFIG.gameplay.minPipeHeight);
            expect(spaceBelow).toBeGreaterThanOrEqual(DEFAULT_GAME_CONFIG.gameplay.minPipeHeight);
            
            // Gap should be within canvas bounds
            expect(pipe.gapPosition).toBeGreaterThanOrEqual(0);
            expect(pipe.gapPosition + pipe.gapSize).toBeLessThanOrEqual(DEFAULT_GAME_CONFIG.canvas.height);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});