import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isTouch: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  hardwareConcurrency: number;
}

const getDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  if (width < 1440) return 'laptop';
  return 'desktop';
};

const detectDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    // Server-side defaults
    return {
      type: 'desktop',
      isMobile: false,
      isTablet: false,
      isLaptop: false,
      isDesktop: true,
      screenWidth: 1920,
      screenHeight: 1080,
      pixelRatio: 1,
      isTouch: false,
      isIOS: false,
      isAndroid: false,
      hardwareConcurrency: 4,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const userAgent = navigator.userAgent;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;

  // Device type detection
  const type = getDeviceType(width);
  
  // Touch detection
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // OS detection
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  
  // Additional mobile detection (beyond just screen size)
  const isMobileAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const actuallyMobile = type === 'mobile' || (isMobileAgent && width < 1024);

  return {
    type: actuallyMobile ? 'mobile' : type,
    isMobile: actuallyMobile,
    isTablet: type === 'tablet' && !actuallyMobile,
    isLaptop: type === 'laptop',
    isDesktop: type === 'desktop',
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
    isTouch,
    isIOS,
    isAndroid,
    hardwareConcurrency,
  };
};

export const useDevice = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDeviceInfo());
    };

    // Initial detection
    setDeviceInfo(detectDeviceInfo());

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    
    // Listen for orientation changes on mobile
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};

// Convenience hooks for specific device types
export const useIsMobile = (): boolean => {
  const { isMobile } = useDevice();
  return isMobile;
};

export const useIsTablet = (): boolean => {
  const { isTablet } = useDevice();
  return isTablet;
};

export const useIsDesktop = (): boolean => {
  const { isDesktop, isLaptop } = useDevice();
  return isDesktop || isLaptop;
};