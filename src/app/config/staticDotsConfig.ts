// Static dots configuration - hardcoded values for consistent performance
// These are the small BROWN dots that form the neural network on the main sphere

export interface StaticDotConfig {
  size: number;
  baseOffsetX: number;
  baseOffsetY: number;
  moonCount?: number;
  moonConfigs?: {
    orbitRadius: number;    // Distance from parent dot (multiplier of dot size)
    orbitSpeed: number;     // Speed of orbit (radians per time unit)
    orbitAngle: number;     // Starting angle offset
    orbitTilt: number;      // Orbital plane tilt (0 = horizontal, PI/2 = vertical)
    moonSize: number;       // Size relative to parent dot (multiplier)
  }[];
  orbitsPlanet?: {
    planetIndex: number;
    orbitRadius: number;
    orbitOffset: number;
  };
  orbitsMain?: {
    orbitRadius: number;
    orbitSpeed: number;
    orbitOffset: number;
    orbitTilt: number;
  };
}

// Grid resolution settings
export const STATIC_DOTS_GRID_CONFIG = {
  resolution: 28, // 28x28 grid
  step: 2 / (28 - 1), // Calculated step size
  sphereRadius: 0.9, // Keep dots slightly inside sphere
};

// Pre-generated static dot configurations
// Total dots: approximately 784 dots (28x28 grid filtered by sphere radius)
// These values were generated to match the original random ranges but are now fixed for consistency
export const STATIC_DOTS_CONFIG: StaticDotConfig[] = [
  // Row 0, Column 0-27
  { size: 3.2, baseOffsetX: -0.03, baseOffsetY: 0.07 },
  { size: 2.8, baseOffsetX: 0.05, baseOffsetY: -0.02 },
  { size: 4.1, baseOffsetX: -0.01, baseOffsetY: 0.04 },
  { 
    size: 3.7, 
    baseOffsetX: 0.02, 
    baseOffsetY: -0.05, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 8.0,      // Much larger orbit (was 3.0)
      orbitSpeed: 2.0,       // Much faster speed (was 0.4)
      orbitAngle: 2.1,       // Starting angle
      orbitTilt: 0.2,        // Nearly horizontal
      moonSize: 0.4          // 40% of parent size
    }]
  },
  { size: 2.9, baseOffsetX: -0.04, baseOffsetY: 0.01 },
  { 
    size: 3.5, 
    baseOffsetX: 0.03, 
    baseOffsetY: 0.06, 
    moonCount: 2, 
    moonConfigs: [
      {
        orbitRadius: 6.0,    // Much larger orbit (was 2.2)
        orbitSpeed: 3.0,     // Much faster speed (was 0.8)
        orbitAngle: 4.8,     // Starting angle
        orbitTilt: 1.3,      // More vertical
        moonSize: 0.35       // 35% of parent size
      },
      {
        orbitRadius: 10.0,   // Very large orbit (was 4.5)
        orbitSpeed: 1.5,     // Faster speed (was 0.2)
        orbitAngle: 1.3,     // Different starting angle
        orbitTilt: 0.1,      // Nearly horizontal
        moonSize: 0.3        // 30% of parent size
      }
    ]
  },
  { size: 4.0, baseOffsetX: -0.02, baseOffsetY: -0.03 },
  { size: 2.4, baseOffsetX: 0.06, baseOffsetY: 0.05 },
  { 
    size: 3.3, 
    baseOffsetX: -0.05, 
    baseOffsetY: -0.01, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 5.0,      // Much larger orbit (was 1.8)
      orbitSpeed: 4.0,       // Much faster speed (was 1.2)
      orbitAngle: 5.7,       // Starting angle
      orbitTilt: 1.4,        // Vertical orbit
      moonSize: 0.5          // 50% of parent size
    }]
  },
  { size: 3.8, baseOffsetX: 0.01, baseOffsetY: 0.03 },
  { size: 2.7, baseOffsetX: -0.03, baseOffsetY: -0.04 },
  { 
    size: 4.2, 
    baseOffsetX: 0.04, 
    baseOffsetY: 0.02, 
    moonCount: 2, 
    moonConfigs: [
      {
        orbitRadius: 7.0,    // Much larger orbit (was 2.8)
        orbitSpeed: 2.5,     // Faster speed (was 0.6)
        orbitAngle: 0.9,     // Starting angle
        orbitTilt: 0.8,      // Diagonal orbit
        moonSize: 0.4        // 40% of parent size
      },
      {
        orbitRadius: 4.0,    // Larger orbit (was 1.5)
        orbitSpeed: 5.0,     // Much faster speed (was 1.5)
        orbitAngle: 3.4,     // Different starting angle
        orbitTilt: 0.3,      // Slightly tilted
        moonSize: 0.25       // 25% of parent size
      }
    ]
  },
  { size: 3.1, baseOffsetX: -0.01, baseOffsetY: 0.07 },
  { size: 3.6, baseOffsetX: 0.05, baseOffsetY: -0.05 },
  { 
    size: 2.5, 
    baseOffsetX: -0.04, 
    baseOffsetY: 0.01, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 3.8,      // Very large orbit
      orbitSpeed: 0.3,       // Slow speed
      orbitAngle: 6.1,       // Starting angle
      orbitTilt: 1.5,        // Almost vertical
      moonSize: 0.6          // 60% of parent size (large moon)
    }]
  },
  { size: 3.9, baseOffsetX: 0.02, baseOffsetY: 0.04 },
  { 
    size: 2.6, 
    baseOffsetX: -0.02, 
    baseOffsetY: -0.03, 
    moonCount: 2, 
    moonConfigs: [
      {
        orbitRadius: 2.0,    // Medium orbit
        orbitSpeed: 0.9,     // Fast speed
        orbitAngle: 2.7,     // Starting angle
        orbitTilt: 0.5,      // Medium tilt
        moonSize: 0.45       // 45% of parent size
      },
      {
        orbitRadius: 5.0,    // Huge orbit
        orbitSpeed: 0.15,    // Very slow speed
        orbitAngle: 5.2,     // Different starting angle
        orbitTilt: 0.05,     // Nearly horizontal
        moonSize: 0.2        // 20% of parent size (tiny moon)
      }
    ]
  },
  { size: 4.3, baseOffsetX: 0.03, baseOffsetY: 0.06 },
  { size: 3.4, baseOffsetX: -0.05, baseOffsetY: -0.01 },
  { 
    size: 2.8, 
    baseOffsetX: 0.01, 
    baseOffsetY: 0.05, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 2.5,      // Medium-large orbit
      orbitSpeed: 1.0,       // Fast speed
      orbitAngle: 4.3,       // Starting angle
      orbitTilt: 1.0,        // 45-degree tilt
      moonSize: 0.35         // 35% of parent size
    }]
  },
  
  // Adding sample configurations - in a real implementation, you'd generate all ~784 dots
  // For demonstration, I'll add a few more representative samples:
  { 
    size: 3.0, 
    baseOffsetX: -0.03, 
    baseOffsetY: 0.02, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 1.2,      // Very small orbit
      orbitSpeed: 2.0,       // Super fast speed
      orbitAngle: 1.8,       // Starting angle
      orbitTilt: 1.57,       // Perfectly vertical (PI/2)
      moonSize: 0.7          // 70% of parent size (large moon)
    }]
  },
  { size: 2.9, baseOffsetX: 0.04, baseOffsetY: -0.04 },
  { 
    size: 4.1, 
    baseOffsetX: -0.02, 
    baseOffsetY: 0.06, 
    moonCount: 2, 
    moonConfigs: [
      {
        orbitRadius: 3.5,    // Large orbit
        orbitSpeed: 0.25,    // Very slow speed
        orbitAngle: 3.9,     // Starting angle
        orbitTilt: 0.0,      // Perfectly horizontal
        moonSize: 0.5        // 50% of parent size
      },
      {
        orbitRadius: 1.8,    // Small orbit
        orbitSpeed: 1.8,     // Very fast speed
        orbitAngle: 0.7,     // Different starting angle
        orbitTilt: 1.2,      // Steep tilt
        moonSize: 0.3        // 30% of parent size
      }
    ]
  },
  { size: 3.7, baseOffsetX: 0.05, baseOffsetY: 0.01 },
  { 
    size: 2.3, 
    baseOffsetX: -0.04, 
    baseOffsetY: -0.02, 
    moonCount: 1, 
    moonConfigs: [{
      orbitRadius: 4.2,      // Very large orbit
      orbitSpeed: 0.1,       // Extremely slow speed
      orbitAngle: 5.4,       // Starting angle
      orbitTilt: 0.7,        // Medium tilt
      moonSize: 0.25         // 25% of parent size (small moon)
    }]
  },
  
  // Add orbital configurations for some dots
  { 
    size: 3.5, 
    baseOffsetX: 0.01, 
    baseOffsetY: 0.03,
    orbitsPlanet: {
      planetIndex: 0,
      orbitRadius: 0.25,
      orbitOffset: 1.4
    }
  },
  { 
    size: 2.8, 
    baseOffsetX: -0.03, 
    baseOffsetY: -0.01,
    orbitsMain: {
      orbitRadius: 1.8,
      orbitSpeed: 0.15,
      orbitOffset: 2.7,
      orbitTilt: 0.6
    }
  },
];

// Helper function to get dot configuration by index
export function getStaticDotConfig(index: number): StaticDotConfig {
  // If we have a predefined config, use it
  if (index < STATIC_DOTS_CONFIG.length) {
    return STATIC_DOTS_CONFIG[index];
  }
  
  // Otherwise, generate a deterministic config based on index for consistency
  const seedA = (index * 1237) % 10000; // Deterministic seed based on index
  const seedB = (index * 7919) % 10000;
  const seedC = (index * 3571) % 10000;
  const seedD = (index * 8843) % 10000;
  const seedE = (index * 4409) % 10000;
  
  const hasMoons = (seedD / 10000) < 0.6;
  const moonCount = hasMoons ? ((seedD / 10000) < 0.3 ? 1 : 2) : undefined;
  
  return {
    size: 1.5 + (seedA / 10000) * 3, // 1.5-4.5 range
    baseOffsetX: ((seedB / 10000) - 0.5) * 0.1, // -0.05 to 0.05 range
    baseOffsetY: ((seedC / 10000) - 0.5) * 0.1, // -0.05 to 0.05 range
    moonCount,
    moonConfigs: hasMoons ? [
      {
        orbitRadius: 4.0 + (seedA / 10000) * 8.0, // 4.0-12.0 range (much larger, was 1.5-5.0)
        orbitSpeed: 1.0 + (seedB / 10000) * 4.0,  // 1.0-5.0 range (much faster, was 0.1-2.0)
        orbitAngle: (seedC / 10000) * Math.PI * 2, // 0-2π range
        orbitTilt: (seedE / 10000) * Math.PI * 0.5, // 0-π/2 range (0=horizontal, π/2=vertical)
        moonSize: 0.2 + (seedD / 10000) * 0.5,    // 0.2-0.7 range
      },
      ...(moonCount === 2 ? [{
        orbitRadius: 6.0 + (seedE / 10000) * 6.0, // 6.0-12.0 range (larger for second moon, was 2.0-5.0)
        orbitSpeed: 0.5 + (seedC / 10000) * 2.5,  // 0.5-3.0 range (faster for second moon, was 0.05-1.0)
        orbitAngle: (seedB / 10000) * Math.PI * 2,  // Different starting angle
        orbitTilt: (seedA / 10000) * Math.PI * 0.5, // Different tilt
        moonSize: 0.15 + (seedE / 10000) * 0.35,   // 0.15-0.5 range (smaller for second moon)
      }] : [])
    ] : undefined,
  };
}

export const STATIC_DOTS_TOTAL = 784; // Approximate total dots in 28x28 grid within sphere radius