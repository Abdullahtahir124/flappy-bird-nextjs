'use client';

import React from 'react';

interface ReadyStateOverlayProps {
  isVisible: boolean;
}

export default function ReadyStateOverlay({ isVisible }: ReadyStateOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 5,
      pointerEvents: 'none' // Allow clicks to pass through to canvas
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '20px 30px',
        borderRadius: '15px',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)',
        animation: 'pulse 2s infinite'
      }}>
        <div style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '10px'
        }}>
          Get Ready!
        </div>
        
        <div style={{
          fontSize: '1rem',
          color: '#666',
          marginBottom: '15px'
        }}>
          Tap, click, or press SPACEBAR to start
        </div>
        
        <div style={{
          fontSize: '2rem',
          animation: 'bounce 1s infinite'
        }}>
          🐦
        </div>
      </div>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}