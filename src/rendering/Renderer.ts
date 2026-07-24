import { Bird, Pipe, GameConfig, GameState } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';
import { ErrorHandler, ErrorType } from '@/utils/ErrorHandler';

export class Renderer {
  private context: CanvasRenderingContext2D;
  private config: GameConfig;
  private groundHeight = 50;
  private scale: number = 1;
  private errorHandler: ErrorHandler;
  private isInErrorState: boolean = false;

  constructor(context: CanvasRenderingContext2D, config: GameConfig = DEFAULT_GAME_CONFIG) {
    this.context = context;
    this.config = config;
    
    // Initialize error handler
    this.errorHandler = new ErrorHandler((error, recovery) => {
      console.error('Renderer error:', error);
      
      if (recovery.canRecover && recovery.recoveryAction) {
        try {
          recovery.recoveryAction();
          this.isInErrorState = false;
        } catch (recoveryError) {
          console.error('Renderer recovery failed:', recoveryError);
          this.isInErrorState = true;
        }
      } else {
        this.isInErrorState = true;
      }
    });
    
    // Validate context on initialization
    this.validateContext();
  }

  /**
   * Updates the rendering scale for responsive design
   * @param scale The new scale factor
   */
  public updateScale(scale: number): void {
    try {
      if (scale <= 0 || !isFinite(scale)) {
        this.errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid scale factor provided to renderer',
          { scale }
        );
        return;
      }
      
      this.scale = scale;
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Error updating renderer scale',
        { error, scale }
      );
    }
  }

  /**
   * Validates the rendering context
   */
  private validateContext(): boolean {
    try {
      if (!this.context) {
        this.errorHandler.handleError(
          ErrorType.CANVAS_CONTEXT_ERROR,
          'Renderer context is null or undefined'
        );
        return false;
      }

      // Test basic context operations
      this.context.save();
      this.context.restore();
      
      return true;
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.CANVAS_CONTEXT_ERROR,
        'Renderer context validation failed',
        { error }
      );
      return false;
    }
  }

  /**
   * Safe wrapper for context operations
   */
  private safeContextOperation<T>(operation: () => T, operationName: string, fallback?: T): T | undefined {
    try {
      if (this.isInErrorState) {
        return fallback;
      }
      
      return operation();
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        `Error during ${operationName}`,
        { error }
      );
      return fallback;
    }
  }

  public clear(): void {
    this.safeContextOperation(() => {
      this.context.clearRect(0, 0, this.config.canvas.width, this.config.canvas.height);
    }, 'canvas clear');
  }

  public renderBackground(): void {
    this.safeContextOperation(() => {
      // Sky gradient background
      const gradient = this.context.createLinearGradient(0, 0, 0, this.config.canvas.height);
      gradient.addColorStop(0, '#87CEEB'); // Sky blue at top
      gradient.addColorStop(0.7, '#98D8E8'); // Lighter blue
      gradient.addColorStop(1, '#B0E0E6'); // Powder blue at bottom
      
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);

      // Add some simple cloud effects
      this.renderClouds();
    }, 'background rendering');
  }

  private renderClouds(): void {
    this.safeContextOperation(() => {
      this.context.fillStyle = 'rgba(255, 255, 255, 0.6)';
      
      // Simple cloud shapes
      const clouds = [
        { x: 100, y: 80, size: 30 },
        { x: 300, y: 120, size: 25 },
        { x: 600, y: 90, size: 35 },
        { x: 750, y: 140, size: 20 }
      ];

      clouds.forEach(cloud => {
        this.context.beginPath();
        this.context.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        this.context.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.8, 0, Math.PI * 2);
        this.context.arc(cloud.x + cloud.size * 1.2, cloud.y, cloud.size * 0.7, 0, Math.PI * 2);
        this.context.fill();
      });
    }, 'cloud rendering');
  }

  public renderGround(): void {
    const groundY = this.config.canvas.height - this.groundHeight;
    
    // Ground gradient
    const gradient = this.context.createLinearGradient(0, groundY, 0, this.config.canvas.height);
    gradient.addColorStop(0, '#8B4513'); // Saddle brown
    gradient.addColorStop(0.3, '#A0522D'); // Sienna
    gradient.addColorStop(1, '#654321'); // Dark brown
    
    this.context.fillStyle = gradient;
    this.context.fillRect(0, groundY, this.config.canvas.width, this.groundHeight);

    // Ground texture lines
    this.context.strokeStyle = 'rgba(139, 69, 19, 0.5)';
    this.context.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = groundY + (i + 1) * (this.groundHeight / 6);
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(this.config.canvas.width, y);
      this.context.stroke();
    }
  }

  public renderBird(bird: Bird): void {
    this.safeContextOperation(() => {
      if (!bird || !bird.position || !bird.bounds || !bird.velocity) {
        this.errorHandler.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Invalid bird data in renderBird',
          { bird }
        );
        return;
      }

      const { x, y } = bird.position;
      const { width, height } = bird.bounds;
      
      // Calculate rotation based on velocity (for realistic bird tilt)
      const rotation = Math.max(-0.5, Math.min(0.5, bird.velocity.y * 0.001));
      
      this.context.save();
      
      // Move to bird center for rotation
      this.context.translate(x + width / 2, y + height / 2);
      this.context.rotate(rotation);
      
      // Bird body (main circle)
      this.context.fillStyle = this.config.rendering.birdColor;
      this.context.beginPath();
      this.context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
      this.context.fill();
      
      // Bird outline
      this.context.strokeStyle = '#DAA520'; // Darker gold
      this.context.lineWidth = 2;
      this.context.stroke();
      
      // Wing (simple oval)
      this.context.fillStyle = '#FFA500'; // Orange wing
      this.context.beginPath();
      this.context.ellipse(-width * 0.1, 0, width * 0.3, height * 0.2, 0, 0, Math.PI * 2);
      this.context.fill();
      
      // Eye
      this.context.fillStyle = '#FFFFFF';
      this.context.beginPath();
      this.context.arc(width * 0.15, -height * 0.1, 4, 0, Math.PI * 2);
      this.context.fill();
      
      // Eye pupil
      this.context.fillStyle = '#000000';
      this.context.beginPath();
      this.context.arc(width * 0.18, -height * 0.1, 2, 0, Math.PI * 2);
      this.context.fill();
      
      // Beak
      this.context.fillStyle = '#FF8C00'; // Dark orange
      this.context.beginPath();
      this.context.moveTo(width * 0.4, 0);
      this.context.lineTo(width * 0.6, -2);
      this.context.lineTo(width * 0.6, 2);
      this.context.closePath();
      this.context.fill();
      
      this.context.restore();
    }, 'bird rendering');
  }

  public renderPipe(pipe: Pipe): void {
    const { x } = pipe.position;
    const { width } = pipe.bounds;
    const { gapPosition, gapSize } = pipe;
    
    // Pipe gradient
    const gradient = this.context.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#228B22'); // Forest green
    gradient.addColorStop(0.3, '#32CD32'); // Lime green
    gradient.addColorStop(0.7, '#228B22'); // Forest green
    gradient.addColorStop(1, '#006400'); // Dark green
    
    this.context.fillStyle = gradient;
    
    // Top pipe
    this.context.fillRect(x, 0, width, gapPosition);
    
    // Bottom pipe
    const bottomPipeY = gapPosition + gapSize;
    const bottomPipeHeight = this.config.canvas.height - bottomPipeY;
    this.context.fillRect(x, bottomPipeY, width, bottomPipeHeight);
    
    // Pipe caps (wider sections at the gap)
    const capHeight = 20;
    const capWidth = width + 10;
    const capX = x - 5;
    
    // Top pipe cap
    this.context.fillStyle = '#006400'; // Darker green for caps
    this.context.fillRect(capX, gapPosition - capHeight, capWidth, capHeight);
    
    // Bottom pipe cap
    this.context.fillRect(capX, bottomPipeY, capWidth, capHeight);
    
    // Pipe outlines
    this.context.strokeStyle = '#004000'; // Very dark green
    this.context.lineWidth = 2;
    
    // Top pipe outline
    this.context.strokeRect(x, 0, width, gapPosition);
    this.context.strokeRect(capX, gapPosition - capHeight, capWidth, capHeight);
    
    // Bottom pipe outline
    this.context.strokeRect(x, bottomPipeY, width, bottomPipeHeight);
    this.context.strokeRect(capX, bottomPipeY, capWidth, capHeight);
    
    // Pipe texture (vertical lines)
    this.context.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    this.context.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const lineX = x + (i * width / 3);
      // Top pipe lines
      this.context.beginPath();
      this.context.moveTo(lineX, 0);
      this.context.lineTo(lineX, gapPosition);
      this.context.stroke();
      
      // Bottom pipe lines
      this.context.beginPath();
      this.context.moveTo(lineX, bottomPipeY);
      this.context.lineTo(lineX, this.config.canvas.height);
      this.context.stroke();
    }
  }

  public renderPipes(pipes: Pipe[]): void {
    this.safeContextOperation(() => {
      if (!Array.isArray(pipes)) {
        this.errorHandler.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Pipes is not an array in renderPipes',
          { pipes }
        );
        return;
      }

      pipes.forEach((pipe, index) => {
        try {
          this.renderPipe(pipe);
        } catch (error) {
          this.errorHandler.handleError(
            ErrorType.UNKNOWN_ERROR,
            `Error rendering pipe at index ${index}`,
            { error, pipe, index }
          );
        }
      });
    }, 'pipes rendering');
  }

  public renderReadyState(): void {
    // Semi-transparent overlay
    this.context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.context.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
    
    // Ready message
    this.context.fillStyle = '#FFFFFF';
    this.context.font = 'bold 48px Arial';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    
    const centerX = this.config.canvas.width / 2;
    const centerY = this.config.canvas.height / 2;
    
    // Text shadow
    this.context.fillStyle = '#000000';
    this.context.fillText('GET READY!', centerX + 2, centerY - 48);
    
    // Main text
    this.context.fillStyle = '#FFFFFF';
    this.context.fillText('GET READY!', centerX, centerY - 50);
    
    // Instructions
    this.context.font = '24px Arial';
    this.context.fillStyle = '#000000';
    this.context.fillText('Press SPACE, click, or tap to start', centerX + 1, centerY + 21);
    
    this.context.fillStyle = '#FFFFFF';
    this.context.fillText('Press SPACE, click, or tap to start', centerX, centerY + 20);
    
    // Flashing bird indicator
    const time = Date.now();
    const alpha = (Math.sin(time * 0.005) + 1) / 2; // Oscillate between 0 and 1
    this.context.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    this.context.font = '36px Arial';
    this.context.fillText('🐦', centerX, centerY + 80);
  }

  public renderGameOverState(finalScore: number): void {
    // Semi-transparent overlay
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
    
    // Game over panel background
    const panelWidth = 400;
    const panelHeight = 300;
    const panelX = (this.config.canvas.width - panelWidth) / 2;
    const panelY = (this.config.canvas.height - panelHeight) / 2;
    
    // Panel background with gradient
    const gradient = this.context.createLinearGradient(panelX, panelY, panelX, panelY + panelHeight);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#F0F0F0');
    
    this.context.fillStyle = gradient;
    this.context.fillRect(panelX, panelY, panelWidth, panelHeight);
    
    // Panel border
    this.context.strokeStyle = '#333333';
    this.context.lineWidth = 3;
    this.context.strokeRect(panelX, panelY, panelWidth, panelHeight);
    
    // Game Over text
    this.context.fillStyle = '#FF0000';
    this.context.font = 'bold 42px Arial';
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.fillText('GAME OVER', this.config.canvas.width / 2, panelY + 80);
    
    // Final score
    this.context.fillStyle = '#333333';
    this.context.font = '28px Arial';
    this.context.fillText(`Final Score: ${finalScore}`, this.config.canvas.width / 2, panelY + 140);
    
    // Restart instruction
    this.context.font = '20px Arial';
    this.context.fillStyle = '#666666';
    this.context.fillText('Press SPACE, click, or tap to restart', this.config.canvas.width / 2, panelY + 200);
    
    // Restart button visual
    const buttonWidth = 200;
    const buttonHeight = 40;
    const buttonX = (this.config.canvas.width - buttonWidth) / 2;
    const buttonY = panelY + 220;
    
    this.context.fillStyle = '#4CAF50';
    this.context.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.context.strokeStyle = '#45a049';
    this.context.lineWidth = 2;
    this.context.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.context.fillStyle = '#FFFFFF';
    this.context.font = 'bold 18px Arial';
    this.context.fillText('RESTART', this.config.canvas.width / 2, buttonY + buttonHeight / 2);
  }

  public renderScore(score: number): void {
    // Score background
    const padding = 15;
    const fontSize = 32;
    this.context.font = `bold ${fontSize}px Arial`;
    this.context.textAlign = 'right';
    this.context.textBaseline = 'top';
    
    const scoreText = score.toString();
    const textMetrics = this.context.measureText(scoreText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;
    
    const bgX = this.config.canvas.width - textWidth - padding * 2;
    const bgY = padding;
    const bgWidth = textWidth + padding * 2;
    const bgHeight = textHeight + padding;
    
    // Score background with rounded corners effect
    this.context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.context.fillRect(bgX, bgY, bgWidth, bgHeight);
    
    // Score text shadow
    this.context.fillStyle = '#000000';
    this.context.fillText(scoreText, this.config.canvas.width - padding + 1, padding + 1);
    
    // Score text
    this.context.fillStyle = '#FFFFFF';
    this.context.fillText(scoreText, this.config.canvas.width - padding, padding);
  }

  public renderFrame(
    bird: Bird,
    pipes: Pipe[],
    score: number,
    gameState: GameState
  ): void {
    // If in error state, render error message
    if (this.isInErrorState) {
      this.renderErrorState();
      return;
    }

    try {
      // Validate inputs
      if (!bird) {
        this.errorHandler.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Bird entity is null or undefined in renderFrame'
        );
        return;
      }

      if (!Array.isArray(pipes)) {
        this.errorHandler.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Pipes is not an array in renderFrame',
          { pipes }
        );
        return;
      }

      if (typeof score !== 'number' || score < 0) {
        this.errorHandler.handleError(
          ErrorType.GAME_STATE_CORRUPTION,
          'Invalid score in renderFrame',
          { score }
        );
        return;
      }

      // Clear and render background
      this.clear();
      this.renderBackground();
      this.renderGround();
      
      // Render game entities
      this.renderPipes(pipes);
      this.renderBird(bird);
      
      // Render UI based on game state
      if (gameState === GameState.PLAYING || gameState === GameState.READY) {
        this.renderScore(score);
      }
      
      if (gameState === GameState.READY) {
        this.renderReadyState();
      } else if (gameState === GameState.GAME_OVER) {
        this.renderGameOverState(score);
      }
    } catch (error) {
      this.errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Unexpected error during frame rendering',
        { error, bird, pipes: pipes?.length, score, gameState }
      );
    }
  }

  /**
   * Renders error state when renderer is in error condition
   */
  private renderErrorState(): void {
    try {
      this.context.fillStyle = '#ff0000';
      this.context.fillRect(0, 0, this.config.canvas.width, this.config.canvas.height);
      
      this.context.fillStyle = '#ffffff';
      this.context.font = '24px Arial';
      this.context.textAlign = 'center';
      this.context.fillText(
        'Rendering Error',
        this.config.canvas.width / 2,
        this.config.canvas.height / 2 - 20
      );
      
      this.context.font = '16px Arial';
      this.context.fillText(
        'Please refresh the page',
        this.config.canvas.width / 2,
        this.config.canvas.height / 2 + 20
      );
    } catch (error) {
      console.error('Failed to render error state:', error);
    }
  }
}