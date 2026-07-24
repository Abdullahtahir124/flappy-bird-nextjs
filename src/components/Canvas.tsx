'use client';

import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { ErrorHandler, ErrorType } from '@/utils/ErrorHandler';

export interface CanvasRef {
  getContext(): CanvasRenderingContext2D | null;
  getCanvas(): HTMLCanvasElement | null;
  getScale(): number;
  getErrorState(): boolean;
  retryInitialization(): void;
}

interface CanvasProps {
  width: number;
  height: number;
  scale?: number;
  className?: string;
  onContextReady?: (context: CanvasRenderingContext2D) => void;
  onError?: (error: string) => void;
}

const Canvas = forwardRef<CanvasRef, CanvasProps>(
  ({ width, height, scale = 1, className, onContextReady, onError }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const scaleRef = useRef<number>(scale);
    const errorHandlerRef = useRef<ErrorHandler | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');

    // Initialize error handler
    useEffect(() => {
      errorHandlerRef.current = new ErrorHandler((error, recovery) => {
        console.error('Canvas error:', error);
        setHasError(true);
        setErrorMessage(recovery.userMessage || 'Canvas error occurred');
        
        if (onError) {
          onError(recovery.userMessage || error.message);
        }

        // Attempt recovery if possible
        if (recovery.canRecover && recovery.recoveryAction) {
          try {
            recovery.recoveryAction();
          } catch (recoveryError) {
            console.error('Canvas recovery failed:', recoveryError);
          }
        }
      });

      return () => {
        errorHandlerRef.current = null;
      };
    }, [onError]);

    const initializeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const errorHandler = errorHandlerRef.current;
      
      if (!canvas || !errorHandler) return;

      try {
        // Reset error state
        setHasError(false);
        setErrorMessage('');

        // Validate canvas context with error handling
        const context = errorHandler.validateCanvasContext(canvas);
        if (!context) {
          return; // Error already handled by ErrorHandler
        }

        contextRef.current = context;

        // Handle high-DPI displays for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1;
        const displayWidth = width;
        const displayHeight = height;
        
        // Set canvas internal size (for drawing) - account for device pixel ratio
        canvas.width = displayWidth * devicePixelRatio;
        canvas.height = displayHeight * devicePixelRatio;
        
        // Scale the drawing context so everything draws at the correct size
        context.scale(devicePixelRatio, devicePixelRatio);

        // Configure canvas for crisp pixel rendering
        context.imageSmoothingEnabled = false;

        // Apply additional scaling for responsive design
        if (scale !== 1) {
          context.scale(scale, scale);
        }

        // Test basic canvas operations
        try {
          context.save();
          context.fillStyle = 'transparent';
          context.fillRect(0, 0, 1, 1);
          context.restore();
        } catch (testError) {
          errorHandler.handleError(
            ErrorType.CANVAS_CONTEXT_ERROR,
            'Canvas context failed post-initialization test',
            { testError, width, height, scale }
          );
          return;
        }

        // Notify parent component that context is ready
        if (onContextReady) {
          try {
            onContextReady(context);
          } catch (callbackError) {
            errorHandler.handleError(
              ErrorType.UNKNOWN_ERROR,
              'Error in onContextReady callback',
              { callbackError }
            );
          }
        }

      } catch (error) {
        if (errorHandler) {
          errorHandler.handleError(
            ErrorType.CANVAS_CONTEXT_ERROR,
            'Unexpected error during canvas initialization',
            { error, width, height, scale }
          );
        } else {
          console.error('Canvas initialization failed:', error);
          setHasError(true);
          setErrorMessage('Failed to initialize canvas');
        }
      }
    }, [width, height, scale, onContextReady]);

    useImperativeHandle(ref, () => ({
      getContext: () => contextRef.current,
      getCanvas: () => canvasRef.current,
      getScale: () => scaleRef.current,
      getErrorState: () => hasError,
      retryInitialization: () => {
        initializeCanvas();
      }
    }));

    useEffect(() => {
      scaleRef.current = scale;
    }, [scale]);

    useEffect(() => {
      initializeCanvas();
    }, [initializeCanvas]);

    // Render error state if canvas failed to initialize
    if (hasError) {
      return (
        <div
          className={className}
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: '100%',
            maxHeight: '100%',
            border: '1px solid #ff0000',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffe6e6',
            color: '#cc0000',
            textAlign: 'center',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Canvas Error
          </div>
          <div style={{ fontSize: '14px', marginBottom: '15px' }}>
            {errorMessage}
          </div>
          <button
            onClick={initializeCanvas}
            style={{
              padding: '8px 16px',
              backgroundColor: '#cc0000',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#aa0000';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#cc0000';
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
        style={{
          border: '1px solid #ccc',
          display: 'block',
          imageRendering: 'pixelated',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          touchAction: 'none', // Prevent default touch behaviors
        }}
      />
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;