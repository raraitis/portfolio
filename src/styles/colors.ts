// Color system
export const colors = {
  // Primary colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Brand colors
  brand: {
    primary: '#8B7D6B',     // Warm brown tone
    secondary: '#A09280',    // Light brown
    accent: '#B4A694',       // Beige
    light: '#C8BEA8',        // Light beige
  },
  
  // Semantic colors
  text: {
    primary: '#171717',
    secondary: '#757575',
    tertiary: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

export type Colors = typeof colors;