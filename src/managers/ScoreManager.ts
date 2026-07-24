import { ScoreManager as IScoreManager } from '@/types';

/**
 * Manages game score tracking, persistence, and reset functionality
 * Handles score increments on pipe passage and maintains score during game session
 */
export class ScoreManager implements IScoreManager {
  private _currentScore: number = 0;
  private _highScore: number = 0;
  private _scoreChangeCallbacks: (() => void)[] = [];

  constructor() {
    // Load high score from localStorage if available
    this._loadHighScore();
  }

  /**
   * Gets the current score
   */
  get currentScore(): number {
    return this._currentScore;
  }

  /**
   * Gets the high score
   */
  get highScore(): number {
    return this._highScore;
  }

  /**
   * Increments the score by the specified amount (default: 1)
   * Updates high score if current score exceeds it
   * @param points Number of points to add (default: 1)
   */
  incrementScore(points: number = 1): void {
    if (points < 0) {
      throw new Error('Score increment must be non-negative');
    }

    this._currentScore += points;

    // Update high score if current score exceeds it
    if (this._currentScore > this._highScore) {
      this._highScore = this._currentScore;
      this._saveHighScore();
    }

    // Notify callbacks of score change
    this._notifyScoreChange();

    console.log(`Score incremented by ${points}. Current score: ${this._currentScore}`);
  }

  /**
   * Resets the current score to zero
   * High score is preserved
   */
  resetScore(): void {
    this._currentScore = 0;
    this._notifyScoreChange();
    console.log('Score reset to 0');
  }

  /**
   * Resets both current score and high score to zero
   * This is typically used for testing or complete game reset
   */
  resetAll(): void {
    this._currentScore = 0;
    this._highScore = 0;
    this._saveHighScore();
    this._notifyScoreChange();
    console.log('All scores reset to 0');
  }

  /**
   * Registers a callback to be executed when the score changes
   * @param callback Function to execute when score changes
   */
  onScoreChange(callback: () => void): void {
    this._scoreChangeCallbacks.push(callback);
  }

  /**
   * Removes a score change callback
   * @param callback The callback function to remove
   */
  removeScoreChangeCallback(callback: () => void): void {
    const index = this._scoreChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this._scoreChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Gets the current game session score data
   */
  getScoreData(): { currentScore: number; highScore: number } {
    return {
      currentScore: this._currentScore,
      highScore: this._highScore
    };
  }

  /**
   * Loads high score from localStorage
   */
  private _loadHighScore(): void {
    try {
      const savedHighScore = localStorage.getItem('flappy-bird-high-score');
      if (savedHighScore !== null) {
        const parsedScore = parseInt(savedHighScore, 10);
        if (!isNaN(parsedScore) && parsedScore >= 0) {
          this._highScore = parsedScore;
        }
      }
    } catch (error) {
      console.warn('Failed to load high score from localStorage:', error);
    }
  }

  /**
   * Saves high score to localStorage
   */
  private _saveHighScore(): void {
    try {
      localStorage.setItem('flappy-bird-high-score', this._highScore.toString());
    } catch (error) {
      console.warn('Failed to save high score to localStorage:', error);
    }
  }

  /**
   * Notifies all registered callbacks of score changes
   */
  private _notifyScoreChange(): void {
    this._scoreChangeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error executing score change callback:', error);
      }
    });
  }
}