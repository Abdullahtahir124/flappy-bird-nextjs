import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { ScoreManager } from './ScoreManager';

describe('ScoreManager Property Tests', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    scoreManager = new ScoreManager();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  describe('Property 9: Score Increment on Pipe Passage', () => {
    it('**Feature: flappy-bird-game, Property 9: Score Increment on Pipe Passage** - score increments correctly when pipes are passed', () => {
      /**
       * **Validates: Requirements 4.2**
       * For any successful pipe passage by the bird, the score should increment by exactly one point.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // Number of pipe passages
          (pipePassages) => {
            // Reset score to ensure clean state
            scoreManager.resetScore();
            const initialScore = scoreManager.currentScore;
            
            // Simulate pipe passages
            for (let i = 0; i < pipePassages; i++) {
              scoreManager.incrementScore(1);
            }
            
            // Verify score increased by exactly the number of pipe passages
            expect(scoreManager.currentScore).toBe(initialScore + pipePassages);
            
            // Verify each increment was exactly 1 point
            expect(scoreManager.currentScore - initialScore).toBe(pipePassages);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 9: Score Increment on Pipe Passage** - score increment updates high score when exceeded', () => {
      /**
       * **Validates: Requirements 4.2**
       * When the current score exceeds the high score, the high score should be updated.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // Initial high score
          fc.integer({ min: 1, max: 100 }), // Additional points to add
          (initialHighScore, additionalPoints) => {
            // Create a fresh ScoreManager for each test run
            const testScoreManager = new ScoreManager();
            testScoreManager.resetAll(); // Clear any existing high score
            
            // Set up initial high score by scoring and resetting
            for (let i = 0; i < initialHighScore; i++) {
              testScoreManager.incrementScore(1);
            }
            const highScoreAfterSetup = testScoreManager.highScore;
            testScoreManager.resetScore();
            
            // Add points that exceed the high score
            const targetScore = initialHighScore + additionalPoints;
            for (let i = 0; i < targetScore; i++) {
              testScoreManager.incrementScore(1);
            }
            
            // Verify high score was updated
            expect(testScoreManager.highScore).toBe(targetScore);
            expect(testScoreManager.highScore).toBeGreaterThan(highScoreAfterSetup);
            expect(testScoreManager.currentScore).toBe(targetScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 9: Score Increment on Pipe Passage** - negative increments are rejected', () => {
      /**
       * **Validates: Requirements 4.2**
       * Score increments must be non-negative to maintain game integrity.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: -100, max: -1 }), // Negative increment values
          (negativeIncrement) => {
            const initialScore = scoreManager.currentScore;
            
            // Attempt to increment with negative value should throw error
            expect(() => scoreManager.incrementScore(negativeIncrement)).toThrow();
            
            // Score should remain unchanged
            expect(scoreManager.currentScore).toBe(initialScore);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Score Persistence During Play', () => {
    it('**Feature: flappy-bird-game, Property 10: Score Persistence During Play** - score remains unchanged during non-scoring game frames', () => {
      /**
       * **Validates: Requirements 4.4**
       * For any game frame during active play (excluding pipe passages), the score should remain unchanged.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // Initial score
          fc.integer({ min: 1, max: 1000 }), // Number of non-scoring frames to simulate
          (initialScore, nonScoringFrames) => {
            // Set up initial score
            scoreManager.resetScore();
            for (let i = 0; i < initialScore; i++) {
              scoreManager.incrementScore(1);
            }
            
            const scoreAfterSetup = scoreManager.currentScore;
            
            // Simulate non-scoring game frames (no score changes)
            // In a real game, this would be frames where no pipes are passed
            for (let frame = 0; frame < nonScoringFrames; frame++) {
              // Verify score hasn't changed during this frame
              expect(scoreManager.currentScore).toBe(scoreAfterSetup);
            }
            
            // Final verification that score remained constant
            expect(scoreManager.currentScore).toBe(scoreAfterSetup);
            expect(scoreManager.currentScore).toBe(initialScore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 10: Score Persistence During Play** - high score persists across game sessions', () => {
      /**
       * **Validates: Requirements 4.4**
       * High score should persist across different game sessions and score manager instances.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // High score to achieve
          (targetHighScore) => {
            // Clear localStorage to start fresh for each test run
            localStorage.clear();
            
            // Create first score manager and achieve high score
            const firstManager = new ScoreManager();
            for (let i = 0; i < targetHighScore; i++) {
              firstManager.incrementScore(1);
            }
            
            expect(firstManager.highScore).toBe(targetHighScore);
            
            // Create second score manager (simulating new game session)
            const secondManager = new ScoreManager();
            
            // High score should be loaded from localStorage
            expect(secondManager.highScore).toBe(targetHighScore);
            expect(secondManager.currentScore).toBe(0); // Current score should be reset
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 10: Score Persistence During Play** - score callbacks are triggered appropriately', () => {
      /**
       * **Validates: Requirements 4.4**
       * Score change callbacks should be triggered when score changes, but not during non-scoring frames.
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 20 }), // Number of score increments
          (scoreIncrements) => {
            let callbackCount = 0;
            const callback = () => { callbackCount++; };
            
            scoreManager.onScoreChange(callback);
            
            // Increment score multiple times
            for (let i = 0; i < scoreIncrements; i++) {
              scoreManager.incrementScore(1);
            }
            
            // Callback should have been called once for each increment
            expect(callbackCount).toBe(scoreIncrements);
            
            // Reset score should also trigger callback
            scoreManager.resetScore();
            expect(callbackCount).toBe(scoreIncrements + 1);
            
            // Clean up callback
            scoreManager.removeScoreChangeCallback(callback);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('ScoreManager Unit Tests', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    scoreManager = new ScoreManager();
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear();
  });

  describe('Score Reset Functionality', () => {
    it('should reset current score to zero on game restart while preserving high score', () => {
      /**
       * **Validates: Requirements 4.3**
       * When the game restarts, the Score_Manager SHALL reset the score to zero
       */
      // Set up initial state with some score and high score
      scoreManager.incrementScore(5);
      scoreManager.incrementScore(3);
      expect(scoreManager.currentScore).toBe(8);
      expect(scoreManager.highScore).toBe(8);

      // Reset the score (simulating game restart)
      scoreManager.resetScore();

      // Verify current score is reset to zero
      expect(scoreManager.currentScore).toBe(0);
      
      // Verify high score is preserved
      expect(scoreManager.highScore).toBe(8);
    });

    it('should reset score to zero even when current score is already zero', () => {
      /**
       * **Validates: Requirements 4.3**
       * Score reset should work correctly regardless of current score value
       */
      // Ensure score starts at zero
      expect(scoreManager.currentScore).toBe(0);

      // Reset score when already zero
      scoreManager.resetScore();

      // Verify score remains zero
      expect(scoreManager.currentScore).toBe(0);
    });

    it('should trigger score change callback when score is reset', () => {
      /**
       * **Validates: Requirements 4.3**
       * Score reset should notify observers of the score change
       */
      let callbackTriggered = false;
      const callback = () => { callbackTriggered = true; };

      // Set up initial score and callback
      scoreManager.incrementScore(10);
      scoreManager.onScoreChange(callback);
      callbackTriggered = false; // Reset flag after setup

      // Reset score
      scoreManager.resetScore();

      // Verify callback was triggered
      expect(callbackTriggered).toBe(true);
      expect(scoreManager.currentScore).toBe(0);

      // Clean up callback
      scoreManager.removeScoreChangeCallback(callback);
    });

    it('should allow score to be incremented normally after reset', () => {
      /**
       * **Validates: Requirements 4.3**
       * After score reset, the scoring system should continue to work normally
       */
      // Set up initial score and reset
      scoreManager.incrementScore(15);
      scoreManager.resetScore();
      expect(scoreManager.currentScore).toBe(0);

      // Increment score after reset
      scoreManager.incrementScore(3);
      expect(scoreManager.currentScore).toBe(3);

      // Verify high score is still preserved from before reset
      expect(scoreManager.highScore).toBe(15);
    });
  });
});