import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import GameOverOverlay from './GameOverOverlay';

describe('GameOverOverlay Component', () => {
  const mockOnRestart = vi.fn();

  beforeEach(() => {
    mockOnRestart.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders when visible', () => {
    render(
      <GameOverOverlay
        isVisible={true}
        score={10}
        highScore={15}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByText('Game Over!')).toBeDefined();
    expect(screen.getByText('Score: 10')).toBeDefined();
    expect(screen.getByText('High Score: 15')).toBeDefined();
  });

  it('does not render when not visible', () => {
    const { container } = render(
      <GameOverOverlay
        isVisible={false}
        score={10}
        highScore={15}
        onRestart={mockOnRestart}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows new high score message when score equals high score', () => {
    render(
      <GameOverOverlay
        isVisible={true}
        score={20}
        highScore={20}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByText('🎉 New High Score! 🎉')).toBeDefined();
  });

  it('calls onRestart when play again button is clicked', () => {
    render(
      <GameOverOverlay
        isVisible={true}
        score={10}
        highScore={15}
        onRestart={mockOnRestart}
      />
    );

    const playAgainButton = screen.getByRole('button', { name: 'Play Again' });
    fireEvent.click(playAgainButton);

    expect(mockOnRestart).toHaveBeenCalledTimes(1);
  });
});