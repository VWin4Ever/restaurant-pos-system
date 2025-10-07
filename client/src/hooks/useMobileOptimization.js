import { useState, useEffect, useCallback } from 'react';

// Hook for mobile-specific optimizations
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      setIsMobile(isMobileDevice);
      setIsTablet(isTabletDevice);
      setIsTouchDevice(isTouch);
    };

    // Check connection type if available
    const checkConnection = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        setConnectionType(connection.effectiveType || 'unknown');
      }
    };

    checkDevice();
    checkConnection();

    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    
    // Check connection changes
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      connection.addEventListener('change', checkConnection);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        connection.removeEventListener('change', checkConnection);
      }
    };
  }, []);

  // Optimize for slow connections
  const isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g';
  const shouldReduceAnimations = isMobile || isSlowConnection;
  const shouldLazyLoadImages = isMobile || isSlowConnection;

  return {
    isMobile,
    isTablet,
    isTouchDevice,
    connectionType,
    isSlowConnection,
    shouldReduceAnimations,
    shouldLazyLoadImages
  };
};

// Hook for optimizing API calls based on device
export const useOptimizedAPI = () => {
  const { isMobile, isSlowConnection } = useMobileOptimization();

  const getOptimizedParams = useCallback((baseParams = {}) => {
    const optimizedParams = { ...baseParams };

    // Reduce data for mobile/slow connections
    if (isMobile || isSlowConnection) {
      optimizedParams.limit = Math.min(optimizedParams.limit || 20, 10);
      optimizedParams.include = 'minimal'; // Request minimal data
    }

    return optimizedParams;
  }, [isMobile, isSlowConnection]);

  const getCacheTTL = useCallback((defaultTTL = 5 * 60 * 1000) => {
    // Longer cache for slow connections
    if (isSlowConnection) {
      return defaultTTL * 2;
    }
    return defaultTTL;
  }, [isSlowConnection]);

  return {
    getOptimizedParams,
    getCacheTTL,
    isMobile,
    isSlowConnection
  };
};

// Hook for touch-friendly interactions
export const useTouchOptimization = () => {
  const { isTouchDevice } = useMobileOptimization();

  const getTouchProps = useCallback(() => {
    if (!isTouchDevice) return {};

    return {
      // Increase touch targets
      style: { minHeight: '44px', minWidth: '44px' },
      // Add touch feedback
      className: 'touch-manipulation'
    };
  }, [isTouchDevice]);

  const getSwipeProps = useCallback((onSwipeLeft, onSwipeRight) => {
    if (!isTouchDevice) return {};

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const diffX = startX - endX;
      const diffY = startY - endY;

      // Only trigger if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (diffX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    };

    return {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd
    };
  }, [isTouchDevice]);

  return {
    getTouchProps,
    getSwipeProps,
    isTouchDevice
  };
};

export default useMobileOptimization;


