import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Renderer } from './Renderer';
import { Bird } from '@/entities/Bird';
import { Pipe } from '@/entities/Pipe';
import { GameState } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';

// Mock canvas context
const createMockContext = (): CanvasRenderingContext2D => {
  const mockContext = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    measureText: vi.fn(() => ({ width: 50 })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left' as CanvasTextAlign,
    textBaseline: 'alphabetic' as CanvasTextBaseline,
    fillText: vi.fn(),
    strokeText: vi.fn()
  } as unknown as CanvasRenderingContext2D;
  
  return mockContext;
};

describe('Renderer', () => {
  let renderer: Renderer;
  let mockContext: CanvasRenderingContext2D;
  let bird: Bird;
  let pipes: Pipe[];

  beforeEach(() => {
    mockContext = createMockContext();
    renderer = new Renderer(mockContext, DEFAULT_GAME_CONFIG);
    bird = new Bird(100, 250);
    pipes = [new Pipe(400), new Pipe(700)];
  });

  describe('renderFrame', () => {
    it('should render complete frame with all elements', () => {
      const score = 5;
      const gameState = GameState.PLAYING;

      renderer.renderFrame(bird, pipes, score, gameState);

      // Verify background rendering
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();

      // Verify bird rendering with rotation
      expect(mockContext.save).toHaveBeenCalled();
      expect(mockContext.translate).toHaveBeenCalled();
      expect(mockContext.rotate).toHaveBeenCalled();
      expect(mockContext.restore).toHaveBeenCalled();

      // Verify score rendering
      expect(mockContext.fillText).toHaveBeenCalled();
    });

    it('should render ready state overlay', () => {
      renderer.renderFrame(bird, pipes, 0, GameState.READY);

      // Verify ready state text is rendered
      expect(mockContext.fillText).toHaveBeenCalledWith(
        expect.stringContaining('GET READY'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should render game over state overlay', () => {
      const finalScore = 10;
      renderer.renderFrame(bird, pipes, finalScore, GameState.GAME_OVER);

      // Verify game over text and final score are rendered
      expect(mockContext.fillText).toHaveBeenCalledWith(
        'GAME OVER',
        expect.any(Number),
        expect.any(Number)
      );
      expect(mockContext.fillText).toHaveBeenCalledWith(
        `Final Score: ${finalScore}`,
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('renderBird', () => {
    it('should render bird with rotation based on velocity', () => {
      bird.velocity.y = 200; // Downward velocity
      
      renderer.renderBird(bird);

      // Verify rotation is applied based on velocity
      expect(mockContext.rotate).toHaveBeenCalledWith(expect.any(Number));
      
      // Verify bird body is rendered
      expect(mockContext.ellipse).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });

    it('should render bird details (eye, beak, wing)', () => {
      renderer.renderBird(bird);

      // Verify multiple drawing operations for bird details
      expect(mockContext.arc).toHaveBeenCalled(); // Eye
      expect(mockContext.ellipse).toHaveBeenCalled(); // Body and wing
      expect(mockContext.moveTo).toHaveBeenCalled(); // Beak
    });
  });

  describe('renderPipe', () => {
    it('should render pipe with gap visualization', () => {
      const pipe = pipes[0];
      
      renderer.renderPipe(pipe);

      // Verify pipe sections are rendered (top and bottom)
      expect(mockContext.fillRect).toHaveBeenCalledWith(
        pipe.position.x,
        0,
        pipe.bounds.width,
        pipe.gapPosition
      );
      
      // Verify pipe caps are rendered
      expect(mockContext.fillRect).toHaveBeenCalledWith(
        expect.any(Number), // capX
        expect.any(Number), // cap position
        expect.any(Number), // capWidth
        expect.any(Number)  // capHeight
      );
    });

    it('should render pipe outlines and texture', () => {
      renderer.renderPipe(pipes[0]);

      // Verify outlines are drawn
      expect(mockContext.strokeRect).toHaveBeenCalled();
      
      // Verify texture lines are drawn
      expect(mockContext.beginPath).toHaveBeenCalled();
      expect(mockContext.moveTo).toHaveBeenCalled();
      expect(mockContext.lineTo).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('renderBackground', () => {
    it('should render sky gradient background', () => {
      renderer.renderBackground();

      // Verify gradient creation and application
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalledWith(
        0, 0, 
        DEFAULT_GAME_CONFIG.canvas.width, 
        DEFAULT_GAME_CONFIG.canvas.height
      );
    });

    it('should render cloud effects', () => {
      renderer.renderBackground();

      // Verify cloud rendering (multiple arc calls for cloud shapes)
      expect(mockContext.arc).toHaveBeenCalled();
      expect(mockContext.fill).toHaveBeenCalled();
    });
  });

  describe('renderGround', () => {
    it('should render ground with gradient and texture', () => {
      renderer.renderGround();

      // Verify ground gradient and texture lines
      expect(mockContext.createLinearGradient).toHaveBeenCalled();
      expect(mockContext.fillRect).toHaveBeenCalled();
      expect(mockContext.stroke).toHaveBeenCalled();
    });
  });

  describe('renderScore', () => {
    it('should render score with background and shadow', () => {
      const score = 42;
      
      renderer.renderScore(score);

      // Verify score background and text rendering
      expect(mockContext.fillRect).toHaveBeenCalled(); // Background
      expect(mockContext.fillText).toHaveBeenCalledWith(
        score.toString(),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});