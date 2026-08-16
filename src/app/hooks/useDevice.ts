import { useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from '@/styles/sizing';

export interface DeviceInfo {
  isMobile: boolean;
}

const RESIZE_DEBOUNCE_MS = 150;

const detectDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined') {
    // Server-side defaults
    return { isMobile: false };
  }

  const width = window.innerWidth;

  // Additional mobile detection (beyond just screen size)
  const isMobileAgent = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return {
    isMobile: width < MOBILE_BREAKPOINT || (isMobileAgent && width < 1024),
  };
};

export const useDevice = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => detectDeviceInfo());

  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const next = detectDeviceInfo();
        setDeviceInfo((prev) => (prev.isMobile === next.isMobile ? prev : next));
      }, RESIZE_DEBOUNCE_MS);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
};
