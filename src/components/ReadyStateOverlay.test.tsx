import React from 'react';
import { render, screen } from '@testing-library/react';
import ReadyStateOverlay from './ReadyStateOverlay';

describe('ReadyStateOverlay Component', () => {
  test('renders when visible', () => {
    render(<ReadyStateOverlay isVisible={true} />);

    expect(screen.getByText('Get Ready!')).toBeInTheDocument();
    expect(screen.getByText('Tap, click, or press SPACEBAR to start')).toBeInTheDocument();
    expect(screen.getByText('🐦')).toBeInTheDocument();
  });

  test('does not render when not visible', () => {
    render(<ReadyStateOverlay isVisible={false} />);

    expect(screen.queryByText('Get Ready!')).not.toBeInTheDocument();
  });

  test('has pointer-events: none to allow clicks to pass through', () => {
    render(<ReadyStateOverlay isVisible={true} />);
    
    const overlay = screen.getByText('Get Ready!').closest('div');
    expect(overlay).toHaveStyle('pointer-events: none');
  });
});