import React from 'react';
import { render, screen } from '@testing-library/react';
import Game from './Game';

// Mock the GameEngine to avoid canvas issues in tests
jest.mock('@/managers/GameEngine', () => ({
  GameEngine: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    start: jest.fn(),
    destroy: jest.fn(),
    getState: jest.fn().mockReturnValue('ready'),
    getScore: jest.fn().mockReturnValue(0),
    getHighScore: jest.fn().mockReturnValue(0),
    restart: jest.fn()
  }))
}));

// Mock Canvas component to avoid canvas context issues
jest.mock('./Canvas', () => {
  return function MockCanvas({ onContextReady }: any) {
    // Simulate context ready callback
    React.useEffect(() => {
      if (onContextReady) {
        const mockContext = {} as CanvasRenderingContext2D;
        onContextReady(mockContext);
      }
    }, [onContextReady]);
    
    return <canvas data-testid="game-canvas" />;
  };
});

describe('Game Component', () => {
  test('renders game title', () => {
    render(<Game />);
    expect(screen.getByText('Flappy Bird')).toBeInTheDocument();
  });

  test('renders canvas element', () => {
    render(<Game />);
    expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
  });

  test('shows ready state instructions initially', () => {
    render(<Game />);
    expect(screen.getByText(/Navigate the bird through the pipes!/)).toBeInTheDocument();
  });
});