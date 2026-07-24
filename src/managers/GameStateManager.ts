import { GameState, GameStateManager as IGameStateManager } from '@/types';

/**
 * Manages game state transitions and validates state changes
 * Implements state-specific behavior controls and transition guards
 */
export class GameStateManager implements IGameStateManager {
  private _currentState: GameState = GameState.READY;
  private _stateChangeCallbacks: Map<GameState, (() => void)[]> = new Map();

  constructor() {
    // Initialize callback arrays for each state
    Object.values(GameState).forEach(state => {
      this._stateChangeCallbacks.set(state, []);
    });
  }

  /**
   * Gets the current game state
   */
  get currentState(): GameState {
    return this._currentState;
  }

  /**
   * Transitions to a new game state if the transition is valid
   * @param newState The state to transition to
   * @throws Error if the transition is invalid
   */
  transitionTo(newState: GameState): void {
    if (!this.canTransition(this._currentState, newState)) {
      throw new Error(`Invalid state transition from ${this._currentState} to ${newState}`);
    }

    const previousState = this._currentState;
    this._currentState = newState;

    // Execute state change callbacks
    this._executeStateChangeCallbacks(newState);

    console.log(`Game state changed: ${previousState} -> ${newState}`);
  }

  /**
   * Checks if a state transition is valid
   * @param from Current state
   * @param to Target state
   * @returns True if transition is allowed
   */
  canTransition(from: GameState, to: GameState): boolean {
    // Define valid state transitions
    const validTransitions: Record<GameState, GameState[]> = {
      [GameState.READY]: [GameState.PLAYING],
      [GameState.PLAYING]: [GameState.GAME_OVER],
      [GameState.GAME_OVER]: [GameState.READY]
    };

    // Allow staying in the same state
    if (from === to) {
      return true;
    }

    return validTransitions[from]?.includes(to) ?? false;
  }

  /**
   * Checks if the game is currently in a playing state
   */
  isPlaying(): boolean {
    return this._currentState === GameState.PLAYING;
  }

  /**
   * Checks if the game is in ready state (waiting for first input)
   */
  isReady(): boolean {
    return this._currentState === GameState.READY;
  }

  /**
   * Checks if the game is in game over state
   */
  isGameOver(): boolean {
    return this._currentState === GameState.GAME_OVER;
  }

  /**
   * Registers a callback to be executed when entering a specific state
   * @param state The state to listen for
   * @param callback The function to execute when entering the state
   */
  onStateEnter(state: GameState, callback: () => void): void {
    const callbacks = this._stateChangeCallbacks.get(state);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  /**
   * Removes a callback for a specific state
   * @param state The state to remove the callback from
   * @param callback The callback function to remove
   */
  removeStateCallback(state: GameState, callback: () => void): void {
    const callbacks = this._stateChangeCallbacks.get(state);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Resets the state manager to initial state
   */
  reset(): void {
    this._currentState = GameState.READY;
    console.log('Game state manager reset to READY');
  }

  /**
   * Executes all callbacks registered for a specific state
   * @param state The state that was entered
   */
  private _executeStateChangeCallbacks(state: GameState): void {
    const callbacks = this._stateChangeCallbacks.get(state);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`Error executing state change callback for ${state}:`, error);
        }
      });
    }
  }
}