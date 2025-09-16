/**
 * Configuration for the main sphere (central neural network sphere)
 * This replaces random generation to ensure consistent visual experience
 * across page refreshes and navigation.
 */

export const MAIN_SPHERE_CONFIG = {
  // Grid resolution for static dots on sphere surface (was: const gridResolution = 28)
  gridResolution: 28,
  
  // Percentage of dots that get moons (was: Math.floor(totalDots * 0.6))
  moonDotsRatio: 0.6, // 60% of dots get moons
  
  // Planet dots configuration
  planetDots: {
    // Ratio to determine planet count (was: Math.max(2, Math.floor(totalDots / 40)))
    countRatio: 40, // totalDots / 40 planets (minimum 2)
    minCount: 2, // Minimum number of planet dots
  },
  
  // Sphere visual properties
  visual: {
    // Sphere boundary for dot placement (was: distance <= 0.9)
    dotPlacementRadius: 0.9, // Keep dots slightly inside sphere
    
    // Irregular sphere shape parameters (for organic feel)
    irregularShape: {
      subtleBumps: 6, // Number of subtle bumps around sphere (was: angle * 6)
      fineDetails: 18, // Fine detail variations (was: angle * 18)
      breathingSpeed: 2, // Time-based breathing effect speed (was: time * 2)
      breathingIntensity: 3, // How much the sphere "breathes" (was: angle * 3)
    },
    
    // Sphere clipping boundary (extended boundary for softer clipping)
    clippingMultiplier: 3.45, // 3.45x larger than visible sphere
  },
};