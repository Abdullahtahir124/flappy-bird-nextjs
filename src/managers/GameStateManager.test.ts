import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { GameStateManager } from './GameStateManager';
import { GameState } from '@/types';

describe('GameStateManager Property Tests', () => {
  let stateManager: GameStateManager;

  beforeEach(() => {
    stateManager = new GameStateManager();
  });

  describe('Property 11: Game State Transitions', () => {
    it('**Feature: flappy-bird-game, Property 11: Game State Transitions** - valid state transitions occur correctly and all associated systems update appropriately', () => {
      /**
       * **Validates: Requirements 5.2, 5.3, 5.4**
       * For any valid game state transition (ready→playing, playing→game_over, game_over→ready), 
       * the state change should occur correctly and all associated systems should update appropriately.
       */
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Valid transition sequences
            [GameState.READY, GameState.PLAYING],
            [GameState.PLAYING, GameState.GAME_OVER],
            [GameState.GAME_OVER, GameState.READY],
            // Self-transitions (should be allowed)
            [GameState.READY, GameState.READY],
            [GameState.PLAYING, GameState.PLAYING],
            [GameState.GAME_OVER, GameState.GAME_OVER]
          ),
          ([fromState, toState]) => {
            // Reset state manager and set initial state
            stateManager.reset();
            
            // If we need to start from a non-READY state, transition there first
            if (fromState !== GameState.READY) {
              if (fromState === GameState.PLAYING) {
                stateManager.transitionTo(GameState.PLAYING);
              } else if (fromState === GameState.GAME_OVER) {
                stateManager.transitionTo(GameState.PLAYING);
                stateManager.transitionTo(GameState.GAME_OVER);
              }
            }
            
            // Verify we're in the expected initial state
            expect(stateManager.currentState).toBe(fromState);
            
            // Verify the transition is considered valid
            expect(stateManager.canTransition(fromState, toState)).toBe(true);
            
            // Perform the transition
            stateManager.transitionTo(toState);
            
            // Verify the state changed correctly
            expect(stateManager.currentState).toBe(toState);
            
            // Verify state-specific helper methods work correctly
            expect(stateManager.isReady()).toBe(toState === GameState.READY);
            expect(stateManager.isPlaying()).toBe(toState === GameState.PLAYING);
            expect(stateManager.isGameOver()).toBe(toState === GameState.GAME_OVER);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 11: Game State Transitions** - invalid state transitions are rejected', () => {
      /**
       * **Validates: Requirements 5.2, 5.3, 5.4**
       * Invalid state transitions should be rejected and not change the current state.
       */
      fc.assert(
        fc.property(
          fc.constantFrom(
            // Invalid transition sequences
            [GameState.READY, GameState.GAME_OVER],
            [GameState.PLAYING, GameState.READY],
            [GameState.GAME_OVER, GameState.PLAYING]
          ),
          ([fromState, toState]) => {
            // Reset state manager and set initial state
            stateManager.reset();
            
            // If we need to start from a non-READY state, transition there first
            if (fromState !== GameState.READY) {
              if (fromState === GameState.PLAYING) {
                stateManager.transitionTo(GameState.PLAYING);
              } else if (fromState === GameState.GAME_OVER) {
                stateManager.transitionTo(GameState.PLAYING);
                stateManager.transitionTo(GameState.GAME_OVER);
              }
            }
            
            // Verify we're in the expected initial state
            expect(stateManager.currentState).toBe(fromState);
            
            // Verify the transition is considered invalid
            expect(stateManager.canTransition(fromState, toState)).toBe(false);
            
            // Attempt the invalid transition should throw an error
            expect(() => stateManager.transitionTo(toState)).toThrow();
            
            // Verify the state did not change
            expect(stateManager.currentState).toBe(fromState);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('**Feature: flappy-bird-game, Property 11: Game State Transitions** - state callbacks are executed correctly on transitions', () => {
      /**
       * **Validates: Requirements 5.2, 5.3, 5.4**
       * State change callbacks should be executed when entering a new state.
       */
      fc.assert(
        fc.property(
          fc.constantFrom(GameState.READY, GameState.PLAYING, GameState.GAME_OVER),
          (targetState) => {
            // Reset state manager
            stateManager.reset();
            
            // Track callback execution
            let callbackExecuted = false;
            const callback = () => { callbackExecuted = true; };
            
            // Register callback for target state
            stateManager.onStateEnter(targetState, callback);
            
            // Transition to target state (if not already there)
            if (targetState !== GameState.READY) {
              if (targetState === GameState.PLAYING) {
                stateManager.transitionTo(GameState.PLAYING);
              } else if (targetState === GameState.GAME_OVER) {
                stateManager.transitionTo(GameState.PLAYING);
                stateManager.transitionTo(GameState.GAME_OVER);
              }
              
              // Callback should have been executed
              expect(callbackExecuted).toBe(true);
            } else {
              // For READY state, we need to transition away and back
              stateManager.transitionTo(GameState.PLAYING);
              stateManager.transitionTo(GameState.GAME_OVER);
              callbackExecuted = false; // Reset flag
              stateManager.transitionTo(GameState.READY);
              
              // Callback should have been executed
              expect(callbackExecuted).toBe(true);
            }
            
            // Clean up callback
            stateManager.removeStateCallback(targetState, callback);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});