import { GameState, GameStateManager } from '@/types';

/**
 * Input event types that can trigger game actions
 */
export enum InputType {
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  TOUCH = 'touch'
}

/**
 * Input event data structure
 */
export interface InputEvent {
  type: InputType;
  timestamp: number;
  originalEvent: Event;
}

/**
 * Input handler configuration
 */
export interface InputConfig {
  debounceTime: number; // milliseconds
  enableKeyboard: boolean;
  enableMouse: boolean;
  enableTouch: boolean;
}

/**
 * Callback function type for input events
 */
export type InputCallback = (event: InputEvent) => void;

/**
 * Handles user input from keyboard, mouse, and touch events
 * Implements input debouncing and state-based filtering
 */
export class InputHandler {
  private _config: InputConfig;
  private _gameStateManager: GameStateManager;
  private _flapCallbacks: InputCallback[] = [];
  private _restartCallbacks: InputCallback[] = [];
  private _lastInputTime: number = 0;
  private _isInitialized: boolean = false;
  private _targetElement: HTMLElement | null = null;

  // Event listener references for cleanup
  private _keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private _clickListener: ((event: MouseEvent) => void) | null = null;
  private _touchListener: ((event: TouchEvent) => void) | null = null;

  constructor(gameStateManager: GameStateManager, config?: Partial<InputConfig>) {
    this._gameStateManager = gameStateManager;
    this._config = {
      debounceTime: 100, // 100ms debounce by default
      enableKeyboard: true,
      enableMouse: true,
      enableTouch: true,
      ...config
    };
  }

  /**
   * Initializes the input handler and sets up event listeners
   * @param targetElement The element to attach event listeners to (defaults to document)
   */
  initialize(targetElement?: HTMLElement): void {
    if (this._isInitialized) {
      console.warn('InputHandler is already initialized');
      return;
    }

    this._targetElement = targetElement || document.documentElement;
    this._setupEventListeners();
    this._isInitialized = true;
    console.log('InputHandler initialized');
  }

  /**
   * Cleans up event listeners and resets the handler
   */
  destroy(): void {
    if (!this._isInitialized) {
      return;
    }

    this._removeEventListeners();
    this._flapCallbacks = [];
    this._restartCallbacks = [];
    this._targetElement = null;
    this._isInitialized = false;
    console.log('InputHandler destroyed');
  }

  /**
   * Registers a callback for flap input events
   * @param callback Function to call when flap input is detected
   */
  onFlap(callback: InputCallback): void {
    this._flapCallbacks.push(callback);
  }

  /**
   * Registers a callback for restart input events
   * @param callback Function to call when restart input is detected
   */
  onRestart(callback: InputCallback): void {
    this._restartCallbacks.push(callback);
  }

  /**
   * Removes a flap callback
   * @param callback The callback to remove
   */
  removeFlap(callback: InputCallback): void {
    const index = this._flapCallbacks.indexOf(callback);
    if (index > -1) {
      this._flapCallbacks.splice(index, 1);
    }
  }

  /**
   * Removes a restart callback
   * @param callback The callback to remove
   */
  removeRestart(callback: InputCallback): void {
    const index = this._restartCallbacks.indexOf(callback);
    if (index > -1) {
      this._restartCallbacks.splice(index, 1);
    }
  }

  /**
   * Updates the input configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<InputConfig>): void {
    this._config = { ...this._config, ...config };
    
    // Re-setup event listeners if initialized
    if (this._isInitialized) {
      this._removeEventListeners();
      this._setupEventListeners();
    }
  }

  /**
   * Gets the current input configuration
   */
  getConfig(): InputConfig {
    return { ...this._config };
  }

  /**
   * Sets up event listeners based on configuration
   */
  private _setupEventListeners(): void {
    if (!this._targetElement) {
      return;
    }

    // Keyboard events (spacebar)
    if (this._config.enableKeyboard) {
      this._keydownListener = (event: KeyboardEvent) => {
        this._handleKeyboardInput(event);
      };
      this._targetElement.addEventListener('keydown', this._keydownListener);
    }

    // Mouse events (click)
    if (this._config.enableMouse) {
      this._clickListener = (event: MouseEvent) => {
        this._handleMouseInput(event);
      };
      this._targetElement.addEventListener('click', this._clickListener);
    }

    // Touch events (tap)
    if (this._config.enableTouch) {
      this._touchListener = (event: TouchEvent) => {
        this._handleTouchInput(event);
      };
      this._targetElement.addEventListener('touchstart', this._touchListener, { passive: false });
    }
  }

  /**
   * Removes all event listeners
   */
  private _removeEventListeners(): void {
    if (!this._targetElement) {
      return;
    }

    if (this._keydownListener) {
      this._targetElement.removeEventListener('keydown', this._keydownListener);
      this._keydownListener = null;
    }

    if (this._clickListener) {
      this._targetElement.removeEventListener('click', this._clickListener);
      this._clickListener = null;
    }

    if (this._touchListener) {
      this._targetElement.removeEventListener('touchstart', this._touchListener);
      this._touchListener = null;
    }
  }

  /**
   * Handles keyboard input events
   * @param event The keyboard event
   */
  private _handleKeyboardInput(event: KeyboardEvent): void {
    // Only handle spacebar
    if (event.code !== 'Space') {
      return;
    }

    // Prevent default behavior (page scroll)
    event.preventDefault();

    const inputEvent: InputEvent = {
      type: InputType.KEYBOARD,
      timestamp: Date.now(),
      originalEvent: event
    };

    this._processInput(inputEvent);
  }

  /**
   * Handles mouse input events
   * @param event The mouse event
   */
  private _handleMouseInput(event: MouseEvent): void {
    // Only handle left click
    if (event.button !== 0) {
      return;
    }

    const inputEvent: InputEvent = {
      type: InputType.MOUSE,
      timestamp: Date.now(),
      originalEvent: event
    };

    this._processInput(inputEvent);
  }

  /**
   * Handles touch input events
   * @param event The touch event
   */
  private _handleTouchInput(event: TouchEvent): void {
    // Prevent default touch behaviors (scrolling, zooming, pull-to-refresh)
    event.preventDefault();
    event.stopPropagation();
    
    // Only handle single touch
    if (event.touches.length !== 1) {
      return;
    }

    // Additional mobile-specific handling
    const touch = event.touches[0];
    
    // Ensure the touch is within the game area (if target element is set)
    if (this._targetElement && this._targetElement !== document.documentElement) {
      const rect = this._targetElement.getBoundingClientRect();
      const touchX = touch.clientX;
      const touchY = touch.clientY;
      
      // Check if touch is within the canvas bounds
      if (touchX < rect.left || touchX > rect.right || touchY < rect.top || touchY > rect.bottom) {
        return; // Touch is outside the game area
      }
    }

    const inputEvent: InputEvent = {
      type: InputType.TOUCH,
      timestamp: Date.now(),
      originalEvent: event
    };

    this._processInput(inputEvent);
  }

  /**
   * Processes input events with debouncing and state filtering
   * @param inputEvent The input event to process
   */
  private _processInput(inputEvent: InputEvent): void {
    // Apply debouncing
    if (this._shouldDebounce(inputEvent.timestamp)) {
      return;
    }

    this._lastInputTime = inputEvent.timestamp;

    // Apply state-based filtering
    const currentState = this._gameStateManager.currentState;

    switch (currentState) {
      case GameState.READY:
      case GameState.PLAYING:
        // Flap input is allowed in ready and playing states
        this._triggerFlapCallbacks(inputEvent);
        break;

      case GameState.GAME_OVER:
        // Only restart input is allowed in game over state
        this._triggerRestartCallbacks(inputEvent);
        break;

      default:
        // Unknown state, ignore input
        console.warn(`Input received in unknown game state: ${currentState}`);
        break;
    }
  }

  /**
   * Checks if input should be debounced
   * @param timestamp Current input timestamp
   * @returns True if input should be ignored due to debouncing
   */
  private _shouldDebounce(timestamp: number): boolean {
    return timestamp - this._lastInputTime < this._config.debounceTime;
  }

  /**
   * Triggers all registered flap callbacks
   * @param inputEvent The input event that triggered the flap
   */
  private _triggerFlapCallbacks(inputEvent: InputEvent): void {
    this._flapCallbacks.forEach(callback => {
      try {
        callback(inputEvent);
      } catch (error) {
        console.error('Error executing flap callback:', error);
      }
    });
  }

  /**
   * Triggers all registered restart callbacks
   * @param inputEvent The input event that triggered the restart
   */
  private _triggerRestartCallbacks(inputEvent: InputEvent): void {
    this._restartCallbacks.forEach(callback => {
      try {
        callback(inputEvent);
      } catch (error) {
        console.error('Error executing restart callback:', error);
      }
    });
  }
}