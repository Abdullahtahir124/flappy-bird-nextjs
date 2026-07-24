'use client';

import React from 'react';
import { GameState } from '@/types';

interface GameOverOverlayProps {
  isVisible: boolean;
  score: number;
  highScore: number;
  onRestart: () => void;
}

export default function GameOverOverlay({ 
  isVisible, 
  score, 
  highScore, 
  onRestart 
}: GameOverOverlayProps) {
  if (!isVisible) {
    return null;
  }

  const isNewHighScore = score > 0 && score === highScore;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        maxWidth: '300px',
        width: '90%'
      }}>
        <h2 style={{ 
          margin: '0 0 20px 0',
          color: '#333',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          Game Over!
        </h2>
        
        {isNewHighScore && (
          <div style={{
            backgroundColor: '#FFD700',
            color: '#333',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            🎉 New High Score! 🎉
          </div>
        )}
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}>
            Score: {score}
          </div>
          
          <div style={{
            fontSize: '1rem',
            color: '#666',
            marginBottom: '5px'
          }}>
            High Score: {highScore}
          </div>
        </div>
        
        <button
          onClick={onRestart}
          style={{
            padding: '12px 30px',
            fontSize: '18px',
            fontWeight: 'bold',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#45a049';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4CAF50';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          Play Again
        </button>
        
        <div style={{
          marginTop: '15px',
          fontSize: '12px',
          color: '#999'
        }}>
          Press SPACEBAR, click, or tap to play
        </div>
      </div>
    </div>
  );
}