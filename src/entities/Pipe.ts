import { Pipe as IPipe, Bird, Vector2, Rectangle } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

export class Pipe implements IPipe {
  public position: Vector2;
  public velocity: Vector2;
  public bounds: Rectangle;
  public gapPosition: number;
  public gapSize: number;
  public hasBeenPassed: boolean = false;
  private config = DEFAULT_GAME_CONFIG;

  constructor(x: number) {
    this.position = { x, y: 0 };
    this.velocity = { x: -this.config.physics.pipeSpeed, y: 0 };
    this.gapSize = this.config.gameplay.pipeGapSize;
    
    // Generate random gap position within valid bounds
    this.gapPosition = this.generateRandomGapPosition();
    
    // Pipe bounds represent the full pipe (we'll handle gap in collision detection)
    this.bounds = {
      x: this.position.x,
      y: this.position.y,
      width: this.config.gameplay.pipeWidth,
      height: this.config.canvas.height,
    };
  }

  private generateRandomGapPosition(): number {
    // Ensure gap is within valid bounds that make it navigable
    const minGapTop = this.config.gameplay.minPipeHeight;
    const maxGapTop = this.config.canvas.height - this.config.gameplay.minPipeHeight - this.gapSize;
    
    // Generate random position for the top of the gap
    return Math.random() * (maxGapTop - minGapTop) + minGapTop;
  }

  public checkCollision(bird: Bird): boolean {
    // Check if bird is horizontally within pipe bounds
    const birdRight = bird.bounds.x + bird.bounds.width;
    const birdLeft = bird.bounds.x;
    const pipeRight = this.bounds.x + this.bounds.width;
    const pipeLeft = this.bounds.x;

    if (birdRight < pipeLeft || birdLeft > pipeRight) {
      return false; // No horizontal overlap
    }

    // Check if bird is vertically within the gap
    const birdTop = bird.bounds.y;
    const birdBottom = bird.bounds.y + bird.bounds.height;
    const gapTop = this.gapPosition;
    const gapBottom = this.gapPosition + this.gapSize;

    // Collision occurs if bird is not entirely within the gap
    return birdTop < gapTop || birdBottom > gapBottom;
  }

  public update(deltaTime: number): void {
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    
    // Update bounds to match position
    this.bounds.x = this.position.x;
  }

  public render(context: CanvasRenderingContext2D): void {
    const { x } = this.position;
    const { width } = this.bounds;
    const { gapPosition, gapSize } = this;
    
    // Pipe gradient
    const gradient = context.createLinearGradient(x, 0, x + width, 0);
    gradient.addColorStop(0, '#228B22'); // Forest green
    gradient.addColorStop(0.3, '#32CD32'); // Lime green
    gradient.addColorStop(0.7, '#228B22'); // Forest green
    gradient.addColorStop(1, '#006400'); // Dark green
    
    context.fillStyle = gradient;
    
    // Top pipe
    context.fillRect(x, 0, width, gapPosition);
    
    // Bottom pipe
    const bottomPipeY = gapPosition + gapSize;
    const bottomPipeHeight = this.config.canvas.height - bottomPipeY;
    context.fillRect(x, bottomPipeY, width, bottomPipeHeight);
    
    // Pipe caps (wider sections at the gap)
    const capHeight = 20;
    const capWidth = width + 10;
    const capX = x - 5;
    
    // Top pipe cap
    context.fillStyle = '#006400'; // Darker green for caps
    context.fillRect(capX, gapPosition - capHeight, capWidth, capHeight);
    
    // Bottom pipe cap
    context.fillRect(capX, bottomPipeY, capWidth, capHeight);
    
    // Pipe outlines
    context.strokeStyle = '#004000'; // Very dark green
    context.lineWidth = 2;
    
    // Top pipe outline
    context.strokeRect(x, 0, width, gapPosition);
    context.strokeRect(capX, gapPosition - capHeight, capWidth, capHeight);
    
    // Bottom pipe outline
    context.strokeRect(x, bottomPipeY, width, bottomPipeHeight);
    context.strokeRect(capX, bottomPipeY, capWidth, capHeight);
    
    // Pipe texture (vertical lines)
    context.strokeStyle = 'rgba(0, 100, 0, 0.3)';
    context.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const lineX = x + (i * width / 3);
      // Top pipe lines
      context.beginPath();
      context.moveTo(lineX, 0);
      context.lineTo(lineX, gapPosition);
      context.stroke();
      
      // Bottom pipe lines
      context.beginPath();
      context.moveTo(lineX, bottomPipeY);
      context.lineTo(lineX, this.config.canvas.height);
      context.stroke();
    }
  }

  public isOffScreen(): boolean {
    // Check if pipe has moved completely off the left side of the screen
    return this.position.x + this.bounds.width < 0;
  }

  public hasPassedBird(bird: Bird): boolean {
    // Check if bird has passed this pipe (for scoring)
    return !this.hasBeenPassed && bird.position.x > this.position.x + this.bounds.width;
  }

  public markAsPassed(): void {
    this.hasBeenPassed = true;
  }

  /**
   * Reset pipe to initial state for object pooling
   * @param x New x position for the pipe
   */
  public reset(x: number): void {
    this.position.x = x;
    this.position.y = 0;
    this.velocity.x = -this.config.physics.pipeSpeed;
    this.velocity.y = 0;
    this.hasBeenPassed = false;
    
    // Generate new random gap position
    this.gapPosition = this.generateRandomGapPosition();
    
    // Update bounds
    this.bounds.x = this.position.x;
    this.bounds.y = this.position.y;
  }
}