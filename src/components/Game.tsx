'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import Canvas, { CanvasRef } from './Canvas';
import GameOverOverlay from './GameOverOverlay';
import ReadyStateOverlay from './ReadyStateOverlay';
import { GameState } from '@/types';
import { DEFAULT_GAME_CONFIG } from '@/config/gameConfig';
import { GameEngine } from '@/managers/GameEngine';
import { useResponsiveCanvas } from '@/hooks/useResponsiveCanvas';

export default function Game() {
  const canvasRef = useRef<CanvasRef>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.READY);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use responsive canvas sizing with error handling for fullscreen
  const responsiveSize = useResponsiveCanvas({
    baseWidth: DEFAULT_GAME_CONFIG.canvas.width,
    baseHeight: DEFAULT_GAME_CONFIG.canvas.height,
    maxWidth: DEFAULT_GAME_CONFIG.canvas.width * 2,
    maxHeight: DEFAULT_GAME_CONFIG.canvas.height * 2,
    padding: 20, // Reduced padding for more screen usage
    onError: (error) => {
      console.error('Responsive canvas error:', error);
      // Could show user notification here
    }
  });

  const handleContextReady = useCallback((context: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) {
      console.error('Canvas not available for GameEngine initialization');
      return;
    }

    try {
      // Initialize GameEngine with canvas
      gameEngineRef.current = new GameEngine(canvas);
      gameEngineRef.current.initialize();
      
      // Update canvas size for responsive design
      gameEngineRef.current.updateCanvasSize(
        responsiveSize.width,
        responsiveSize.height,
        responsiveSize.scale
      );
      
      gameEngineRef.current.start();
      
      setIsInitialized(true);
      console.log('Game engine initialized and started');
    } catch (error) {
      console.error('Failed to initialize GameEngine:', error);
      // Could show user notification here
    }
  }, [responsiveSize]);

  const handleCanvasError = useCallback((error: string) => {
    console.error('Canvas error in Game component:', error);
    setIsInitialized(false);
    // Could show user notification or retry mechanism here
  }, []);

  // Update canvas size when responsive size changes
  useEffect(() => {
    if (gameEngineRef.current && isInitialized) {
      gameEngineRef.current.updateCanvasSize(
        responsiveSize.width,
        responsiveSize.height,
        responsiveSize.scale
      );
    }
  }, [responsiveSize, isInitialized]);

  // Monitor game state and score changes
  useEffect(() => {
    if (!gameEngineRef.current || !isInitialized) {
      return;
    }

    const gameEngine = gameEngineRef.current;
    
    // Poll game state and score periodically
    const pollInterval = setInterval(() => {
      const currentState = gameEngine.getState();
      const currentScore = gameEngine.getScore();
      const currentHighScore = gameEngine.getHighScore();
      
      setGameState(currentState);
      setScore(currentScore);
      setHighScore(currentHighScore);
    }, 100); // Poll every 100ms

    return () => {
      clearInterval(pollInterval);
    };
  }, [isInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
        gameEngineRef.current = null;
      }
    };
  }, []);

  // Handle restart functionality
  const handleRestart = useCallback(() => {
    if (gameEngineRef.current && gameState === GameState.GAME_OVER) {
      gameEngineRef.current.restart();
    }
  }, [gameState]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100dvh', // Use dynamic viewport height for better mobile support
      width: '100vw',
      backgroundColor: '#87CEEB', // Sky blue background
      fontFamily: 'Arial, sans-serif',
      padding: '10px',
      boxSizing: 'border-box',
      overflow: 'hidden', // Prevent scrolling on mobile
      position: 'fixed', // Make it truly fullscreen
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <div style={{ 
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'fit-content',
        height: 'fit-content',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '10px', // Reduced margin
          color: '#333',
          fontSize: 'clamp(1.2rem, 3vw, 2rem)', // Smaller responsive font size
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
          margin: '0 0 10px 0'
        }}>
          Flappy Bird
        </h1>
        
        {/* Score Display - Always visible during gameplay */}
        {gameState === GameState.PLAYING && (
          <div style={{
            textAlign: 'center',
            marginBottom: '5px', // Reduced margin
            fontSize: 'clamp(1rem, 3vw, 1.5rem)', // Responsive font size
            fontWeight: 'bold',
            color: '#333',
            textShadow: '1px 1px 2px rgba(255,255,255,0.8)'
          }}>
            Score: {score}
          </div>
        )}
        
        <div style={{ position: 'relative' }}>
          <Canvas
            ref={canvasRef}
            width={responsiveSize.width}
            height={responsiveSize.height}
            scale={responsiveSize.scale}
            onContextReady={handleContextReady}
            onError={handleCanvasError}
            className="game-canvas"
          />
          
          {/* Ready State Overlay */}
          <ReadyStateOverlay isVisible={gameState === GameState.READY} />
          
          {/* Game Over Overlay */}
          <GameOverOverlay
            isVisible={gameState === GameState.GAME_OVER}
            score={score}
            highScore={highScore}
            onRestart={handleRestart}
          />
        </div>
        
        {/* Game Instructions */}
        <div style={{ 
          marginTop: '10px', // Reduced margin
          textAlign: 'center',
          maxWidth: '90vw', // Use viewport width
          color: '#333',
          fontSize: 'clamp(0.75rem, 2vw, 0.9rem)', // Smaller responsive font size
          lineHeight: '1.3',
          padding: '0 5px'
        }}>
          {gameState === GameState.READY && (
            <p style={{ margin: '0' }}>
              Navigate the bird through the pipes!<br />
              <strong>Controls:</strong> SPACEBAR, Click, or Tap
            </p>
          )}
          {gameState === GameState.PLAYING && (
            <p style={{ margin: '0' }}>
              Keep flying! Avoid the pipes and ground.
            </p>
          )}
          {gameState === GameState.GAME_OVER && (
            <p style={{ margin: '0' }}>
              Game Over! Click "Play Again" to restart.
            </p>
          )}
        </div>
        
        {/* High Score Display */}
        {highScore > 0 && gameState !== GameState.GAME_OVER && (
          <div style={{ 
            marginTop: '5px', // Reduced margin
            textAlign: 'center',
            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', // Smaller responsive font size
            color: '#666',
            fontStyle: 'italic'
          }}>
            High Score: {highScore}
          </div>
        )}
        
        {/* Debug Info (can be removed in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            marginTop: '5px', // Reduced margin
            textAlign: 'center',
            fontSize: '10px', // Smaller font
            color: '#999',
            fontFamily: 'monospace'
          }}>
            Debug: {gameState} | Initialized: {isInitialized ? 'Yes' : 'No'}
          </div>
        )}
      </div>
    </div>
  );
}