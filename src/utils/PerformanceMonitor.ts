/**
 * Performance monitoring utility for tracking frame rate and performance metrics
 */
export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private frameTimeHistory: number[] = [];
  private maxHistorySize: number = 60; // Track last 60 frames
  private targetFPS: number = 60;
  private performanceWarningThreshold: number = 45; // Warn if FPS drops below this

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
    this.lastTime = performance.now();
  }

  /**
   * Update performance metrics - call this every frame
   */
  update(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    
    this.frameCount++;
    this.frameTimeHistory.push(deltaTime);
    
    // Keep history size manageable
    if (this.frameTimeHistory.length > this.maxHistorySize) {
      this.frameTimeHistory.shift();
    }
    
    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      // Check for performance issues
      if (this.fps < this.performanceWarningThreshold) {
        console.warn(`Performance warning: FPS dropped to ${this.fps}`);
      }
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get average frame time in milliseconds
   */
  getAverageFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    
    const sum = this.frameTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameTimeHistory.length;
  }

  /**
   * Get maximum frame time in the recent history
   */
  getMaxFrameTime(): number {
    if (this.frameTimeHistory.length === 0) return 0;
    return Math.max(...this.frameTimeHistory);
  }

  /**
   * Check if performance is acceptable
   */
  isPerformanceGood(): boolean {
    return this.fps >= this.performanceWarningThreshold;
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    fps: number;
    averageFrameTime: number;
    maxFrameTime: number;
    isGood: boolean;
  } {
    return {
      fps: this.getFPS(),
      averageFrameTime: this.getAverageFrameTime(),
      maxFrameTime: this.getMaxFrameTime(),
      isGood: this.isPerformanceGood()
    };
  }

  /**
   * Reset performance metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.fps = 0;
    this.frameTimeHistory = [];
    this.lastTime = performance.now();
  }
}