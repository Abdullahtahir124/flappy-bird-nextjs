import { Bird as IBird, Vector2, Rectangle } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

export class Bird implements IBird {
  public position: Vector2;
  public velocity: Vector2;
  public bounds: Rectangle;
  private config = DEFAULT_GAME_CONFIG;
  private birdSize = { width: 30, height: 20 };

  constructor(startX: number, startY: number) {
    this.position = { x: startX, y: startY };
    this.velocity = { x: 0, y: 0 }; // Bird doesn't move horizontally
    this.bounds = {
      x: startX,
      y: startY,
      width: this.birdSize.width,
      height: this.birdSize.height,
    };
  }

  public flap(): void {
    // Apply immediate upward velocity change
    this.velocity.y = this.config.physics.flapStrength;
  }

  public applyGravity(deltaTime: number): void {
    // Apply gravity to downward velocity
    this.velocity.y += this.config.physics.gravity * deltaTime;
    
    // Clamp to terminal velocity
    if (this.velocity.y > this.config.physics.terminalVelocity) {
      this.velocity.y = this.config.physics.terminalVelocity;
    }
  }

  public isGrounded(): boolean {
    // Check if bird has reached the ground level
    return this.position.y + this.bounds.height >= this.config.canvas.height;
  }

  public update(deltaTime: number): void {
    // Update position based on velocity (only vertical movement)
    this.position.y += this.velocity.y * deltaTime;

    // Update bounds to match position
    this.bounds.y = this.position.y;

    // Prevent bird from going above the screen
    if (this.position.y < 0) {
      this.position.y = 0;
      this.bounds.y = 0;
      this.velocity.y = 0;
    }

    // Prevent bird from going below the ground
    if (this.isGrounded()) {
      this.position.y = this.config.canvas.height - this.bounds.height;
      this.bounds.y = this.position.y;
      this.velocity.y = 0;
    }
  }

  public render(context: CanvasRenderingContext2D): void {
    const { x, y } = this.position;
    const { width, height } = this.bounds;
    
    // Calculate rotation based on velocity (for realistic bird tilt)
    const rotation = Math.max(-0.5, Math.min(0.5, this.velocity.y * 0.001));
    
    context.save();
    
    // Move to bird center for rotation
    context.translate(x + width / 2, y + height / 2);
    context.rotate(rotation);
    
    // Bird body (main circle)
    context.fillStyle = this.config.rendering.birdColor;
    context.beginPath();
    context.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fill();
    
    // Bird outline
    context.strokeStyle = '#DAA520'; // Darker gold
    context.lineWidth = 2;
    context.stroke();
    
    // Wing (simple oval)
    context.fillStyle = '#FFA500'; // Orange wing
    context.beginPath();
    context.ellipse(-width * 0.1, 0, width * 0.3, height * 0.2, 0, 0, Math.PI * 2);
    context.fill();
    
    // Eye
    context.fillStyle = '#FFFFFF';
    context.beginPath();
    context.arc(width * 0.15, -height * 0.1, 4, 0, Math.PI * 2);
    context.fill();
    
    // Eye pupil
    context.fillStyle = '#000000';
    context.beginPath();
    context.arc(width * 0.18, -height * 0.1, 2, 0, Math.PI * 2);
    context.fill();
    
    // Beak
    context.fillStyle = '#FF8C00'; // Dark orange
    context.beginPath();
    context.moveTo(width * 0.4, 0);
    context.lineTo(width * 0.6, -2);
    context.lineTo(width * 0.6, 2);
    context.closePath();
    context.fill();
    
    context.restore();
  }
}