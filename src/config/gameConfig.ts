import { GameConfig } from '@/types';

export const DEFAULT_GAME_CONFIG: GameConfig = {
  canvas: {
    width: 800,
    height: 600,
  },
  physics: {
    gravity: 800, // pixels per second squared (reduced for easier control)
    flapStrength: -250, // pixels per second (reduced for gentler flap)
    birdSpeed: 60, // pixels per second (significantly reduced for better control)
    pipeSpeed: 80, // pixels per second (reduced to match bird speed)
    terminalVelocity: 300, // pixels per second (reduced for gentler falling)
  },
  gameplay: {
    pipeSpacing: 400, // pixels between pipes (increased for better visibility)
    pipeGapSize: 180, // pixels (increased for easier navigation)
    pipeWidth: 60, // pixels
    minPipeHeight: 50, // pixels
    maxPipeHeight: 400, // pixels
  },
  rendering: {
    targetFPS: 60,
    backgroundColor: '#87CEEB', // Sky blue
    birdColor: '#FFD700', // Gold
    pipeColor: '#228B22', // Forest green
  },
};