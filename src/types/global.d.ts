// Global type definitions for secure window extensions

export interface NavigationAPI {
  navigateToSection: (section: 'home' | 'me') => void;
  setBackgroundSection: (section: 'home' | 'me') => void;
  updateNavSection: (section: 'home' | 'me') => void;
}

declare global {
  interface Window {
    // Secure navigation API
    portfolioNavigation?: NavigationAPI;
  }
}

export {};