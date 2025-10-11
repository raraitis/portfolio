'use client';

import { createContext, useContext, useCallback, useRef, useEffect } from 'react';

type NavigationSection = 'home' | 'me';

interface NavigationContextValue {
  navigateToSection: (section: NavigationSection) => void;
  registerBackgroundHandler: (handler: (section: NavigationSection) => void) => () => void;
  registerNavHandler: (handler: (section: NavigationSection) => void) => () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const backgroundHandlerRef = useRef<((section: NavigationSection) => void) | null>(null);
  const navHandlerRef = useRef<((section: NavigationSection) => void) | null>(null);

  const navigateToSection = useCallback((section: NavigationSection) => {
    // Input validation
    if (section !== 'home' && section !== 'me') {
      console.warn('Invalid navigation section:', section);
      return;
    }

    try {
      // Safely call registered handlers
      backgroundHandlerRef.current?.(section);
      navHandlerRef.current?.(section);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, []);

  const registerBackgroundHandler = useCallback((handler: (section: NavigationSection) => void) => {
    backgroundHandlerRef.current = handler;
    // Return cleanup function
    return () => {
      backgroundHandlerRef.current = null;
    };
  }, []);

  const registerNavHandler = useCallback((handler: (section: NavigationSection) => void) => {
    navHandlerRef.current = handler;
    // Return cleanup function
    return () => {
      navHandlerRef.current = null;
    };
  }, []);

  // Secure window API setup (only if absolutely necessary for external access)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use a namespaced approach instead of polluting global window
      window.portfolioNavigation = {
        navigateToSection,
        setBackgroundSection: (section: NavigationSection) => {
          backgroundHandlerRef.current?.(section);
        },
        updateNavSection: (section: NavigationSection) => {
          navHandlerRef.current?.(section);
        },
      };

      // Cleanup on unmount
      return () => {
        if (window.portfolioNavigation) {
          delete window.portfolioNavigation;
        }
      };
    }
  }, [navigateToSection]);

  const value: NavigationContextValue = {
    navigateToSection,
    registerBackgroundHandler,
    registerNavHandler,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}