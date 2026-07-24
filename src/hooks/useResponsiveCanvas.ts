import { useState, useEffect, useCallback } from 'react';
import { ErrorHandler, ErrorType } from '@/utils/ErrorHandler';

export interface ResponsiveCanvasSize {
  width: number;
  height: number;
  scale: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface ResponsiveCanvasConfig {
  baseWidth: number;
  baseHeight: number;
  maxWidth?: number;
  maxHeight?: number;
  aspectRatio?: number;
  padding?: number;
  onError?: (error: string) => void;
}

/**
 * Hook for managing responsive canvas sizing
 * Calculates optimal canvas dimensions based on viewport size while maintaining aspect ratio
 */
export function useResponsiveCanvas(config: ResponsiveCanvasConfig): ResponsiveCanvasSize {
  const {
    baseWidth,
    baseHeight,
    maxWidth = baseWidth,
    maxHeight = baseHeight,
    aspectRatio = baseWidth / baseHeight,
    padding = 40, // Default padding around canvas
    onError
  } = config;

  const [canvasSize, setCanvasSize] = useState<ResponsiveCanvasSize>({
    width: baseWidth,
    height: baseHeight,
    scale: 1,
    hasError: false
  });

  const [errorHandler] = useState(() => new ErrorHandler((error, recovery) => {
    console.error('Responsive canvas error:', error);
    
    setCanvasSize(prev => ({
      ...prev,
      hasError: true,
      errorMessage: recovery.userMessage || error.message
    }));

    if (onError) {
      onError(recovery.userMessage || error.message);
    }

    // Attempt recovery if possible
    if (recovery.canRecover && recovery.recoveryAction) {
      try {
        recovery.recoveryAction();
        // Reset error state after successful recovery
        setTimeout(() => {
          setCanvasSize(prev => ({
            ...prev,
            hasError: false,
            errorMessage: undefined
          }));
        }, 100);
      } catch (recoveryError) {
        console.error('Responsive canvas recovery failed:', recoveryError);
      }
    }
  }));

  const calculateSize = useCallback(() => {
    try {
      // Validate configuration
      if (baseWidth <= 0 || baseHeight <= 0) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid base canvas dimensions',
          { baseWidth, baseHeight }
        );
        return;
      }

      if (aspectRatio <= 0) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid aspect ratio',
          { aspectRatio }
        );
        return;
      }

      // Get viewport dimensions with error handling
      let viewportWidth: number;
      let viewportHeight: number;

      try {
        viewportWidth = window.innerWidth - padding;
        viewportHeight = window.innerHeight - padding;
      } catch (error) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Failed to get viewport dimensions',
          { error }
        );
        return;
      }

      // Validate viewport dimensions
      if (viewportWidth <= 0 || viewportHeight <= 0) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid viewport dimensions',
          { viewportWidth, viewportHeight }
        );
        return;
      }

      // For mobile devices, consider orientation and safe areas
      let isMobile = false;
      let isLandscape = false;

      try {
        isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        isLandscape = window.innerWidth > window.innerHeight;
      } catch (error) {
        // Fallback if navigator is not available
        console.warn('Could not detect mobile device, using desktop defaults');
      }
      
      // Adjust padding for mobile devices and fullscreen experience
      const mobilePadding = isMobile ? (isLandscape ? 10 : 20) : padding;
      const adjustedViewportWidth = Math.max(0, window.innerWidth - mobilePadding);
      const adjustedViewportHeight = Math.max(0, window.innerHeight - mobilePadding);

      // Calculate maximum possible dimensions while maintaining aspect ratio
      let width = Math.min(adjustedViewportWidth, maxWidth);
      let height = width / aspectRatio;

      // If height exceeds viewport, scale down based on height
      if (height > Math.min(adjustedViewportHeight, maxHeight)) {
        height = Math.min(adjustedViewportHeight, maxHeight);
        width = height * aspectRatio;
      }

      // For fullscreen experience, try to use more of the available space
      const screenUsageTarget = isMobile ? 0.9 : 0.8; // Use 90% on mobile, 80% on desktop
      const maxPossibleWidth = adjustedViewportWidth * screenUsageTarget;
      const maxPossibleHeight = adjustedViewportHeight * screenUsageTarget;
      
      // Recalculate with screen usage target
      if (width < maxPossibleWidth && height < maxPossibleHeight) {
        const scaleByWidth = maxPossibleWidth / width;
        const scaleByHeight = maxPossibleHeight / height;
        const scaleToUse = Math.min(scaleByWidth, scaleByHeight);
        
        width = Math.min(width * scaleToUse, maxWidth);
        height = Math.min(height * scaleToUse, maxHeight);
      }

      // Ensure minimum size (at least 30% of base size for better mobile experience)
      const minWidth = baseWidth * 0.3;
      const minHeight = baseHeight * 0.3;

      width = Math.max(width, minWidth);
      height = Math.max(height, minHeight);

      // Validate calculated dimensions
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid calculated canvas dimensions',
          { width, height, viewportWidth, viewportHeight }
        );
        return;
      }

      // Calculate scale factor for game logic
      const scale = Math.min(width / baseWidth, height / baseHeight);

      if (scale <= 0 || !isFinite(scale)) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Invalid calculated scale factor',
          { scale, width, height, baseWidth, baseHeight }
        );
        return;
      }

      setCanvasSize({
        width: Math.round(width),
        height: Math.round(height),
        scale,
        hasError: false
      });

    } catch (error) {
      errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Unexpected error during canvas size calculation',
        { error, config }
      );
    }
  }, [baseWidth, baseHeight, maxWidth, maxHeight, aspectRatio, padding, errorHandler]);

  useEffect(() => {
    // Calculate initial size — runs only on the client
    calculateSize();

    // Add resize listener with error handling
    const handleResize = () => {
      try {
        // Debounce resize events
        setTimeout(calculateSize, 100);
      } catch (error) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Error during resize handling',
          { error }
        );
      }
    };

    const handleOrientationChange = () => {
      try {
        // Add extra delay for orientation changes to ensure viewport is updated
        setTimeout(calculateSize, 200);
      } catch (error) {
        errorHandler.handleError(
          ErrorType.UNKNOWN_ERROR,
          'Error during orientation change handling',
          { error }
        );
      }
    };

    try {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
    } catch (error) {
      errorHandler.handleError(
        ErrorType.UNKNOWN_ERROR,
        'Failed to add event listeners',
        { error }
      );
    }

    return () => {
      try {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
      } catch (error) {
        console.error('Error removing event listeners:', error);
      }
    };
  }, [calculateSize, errorHandler]);

  return canvasSize;
}