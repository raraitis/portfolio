/**
 * Configuration for planet d    // Planet 1 - Nearly vertical orbit
    {
      angle: 4.9,
      baseRadius: 2.2, // Much larger orbit (was 0.9)
      size: 3.8,
      orbitSpeed: 1.8, // Much faster orbit (was 0.32)
      orbitTilt: 1.45, // Nearly vertical (π/2 ≈ 1.57) - steep tilt for vertical orbit
      orbitEccentricity: 0.7,
      spinSpeed: 0.22,
      spinDirection: -1,ots)
 * These are the larger dots that orbit around the main sphere
 * and have their own mini-sphere structure with small dots and moons.
 */

export const PLANET_DOTS_CONFIG = {
  // Control planet count from config instead of dynamic calculation
  count: 3, // Override the dynamic Math.max(2, Math.floor(totalDots / 40))
  
  // Individual planet configurations
  // Each planet gets specific properties instead of random generation
  planets: [
    // Planet 0 - Nearly horizontal orbit - FAT BEIGE SLOW
    {
      angle: 1.2, // was: Math.random() * Math.PI * 2
      baseRadius: 2.5, // Much larger orbit (was 1.1)
      size: 8.4, // 2x bigger (was 4.2) - FAT
      orbitSpeed: 0.3, // 0.2x slower (was 1.5) - SLOW
      orbitTilt: 0.1, // Nearly horizontal (was 2.1) - minimal tilt for horizontal orbit
      orbitEccentricity: 0.8, // was: 0.5 + Math.random() * 0.5 (0.5-1.0)
      spinSpeed: 0.35, // was: 0.1 + Math.random() * 0.4 (0.1-0.5)
      spinDirection: -1, // OPPOSITE DIRECTION (was 1)
      // Special properties for fat planets
      isFat: true,
      color: { r: 210, g: 180, b: 140, alpha: 0.8 }, // Beige color closer to brown sphere
      hasHalo: true,
      moons: {
        count: 2, // Always 2 moons for each RED dot
        distances: [4.2, 7.1], // was: [3.0+rand*2.0, 5.5+rand*2.5] = [3.0-5.0, 5.5-8.0]
        speeds: [0.6, 0.35], // was: [0.3+rand*0.4, 0.2+rand*0.3] = [0.3-0.7, 0.2-0.5]
        angles: [0.8, 4.9], // was: [rand*2π, rand*2π]
        sizes: [0.55, 0.72], // was: [0.3+rand*0.4, 0.4+rand*0.5] = [0.3-0.7, 0.4-0.9]
        tilts: [1.8, 2.7], // was: [rand*π, rand*π]
        inclinations: [3.9, 1.2], // was: [rand*2π, rand*2π]
      },
    },
    // Planet 1 - FAT BEIGE SLOW
    {
      angle: 4.5,
      baseRadius: 2.2, // Much larger orbit (was 0.9)
      size: 7.6, // 2x bigger (was 3.8) - FAT
      orbitSpeed: 0.36, // 0.2x slower (was 1.8) - SLOW
      orbitTilt: 1.4,
      orbitEccentricity: 0.7,
      spinSpeed: 0.22,
      spinDirection: 1, // Keep normal direction
      // Special properties for fat planets
      isFat: true,
      color: { r: 210, g: 180, b: 140, alpha: 0.8 }, // Beige color closer to brown sphere
      hasHalo: true,
      moons: {
        count: 2,
        distances: [3.7, 6.8],
        speeds: [0.52, 0.28],
        angles: [2.1, 0.3],
        sizes: [0.48, 0.65],
        tilts: [0.9, 2.2],
        inclinations: [5.1, 2.8],
      },
    },
    // Planet 2 - Diagonal orbit - FAT BEIGE SLOW
    {
      angle: 0.7,
      baseRadius: 2.8, // Much larger orbit (was 1.4)
      size: 9.2, // 2x bigger (was 4.6) - FAT
      orbitSpeed: 0.24, // 0.2x slower (was 1.2) - SLOW
      orbitTilt: 0.8, // Diagonal angle (45° ≈ 0.785) - moderate tilt
      orbitEccentricity: 0.95,
      spinSpeed: 0.41,
      spinDirection: -1, // OPPOSITE DIRECTION (was 1)
      // Special properties for fat planets
      isFat: true,
      color: { r: 210, g: 180, b: 140, alpha: 0.8 }, // Beige color closer to brown sphere
      hasHalo: true,
      moons: {
        count: 2,
        distances: [4.8, 7.7],
        speeds: [0.38, 0.42],
        angles: [1.6, 5.8],
        sizes: [0.61, 0.83],
        tilts: [2.5, 0.4],
        inclinations: [0.7, 4.6],
      },
    },
    // Planet 3 (if needed - dynamic based on totalDots) - Steep diagonal orbit - NORMAL
    {
      angle: 3.8,
      baseRadius: 2.4, // Much larger orbit (was 1.2)
      size: 3.1,
      orbitSpeed: 1.3, // Much faster orbit (was 0.25)
      orbitTilt: 1.1, // Steep diagonal (63° ≈ 1.1) - steep angle orbit
      orbitEccentricity: 0.63,
      spinSpeed: 0.29,
      spinDirection: -1,
      // Normal planet properties
      isFat: false,
      hasHalo: false,
      moons: {
        count: 2,
        distances: [3.4, 6.2],
        speeds: [0.44, 0.31],
        angles: [4.2, 1.9],
        sizes: [0.39, 0.57],
        tilts: [1.3, 2.9],
        inclinations: [2.4, 0.9],
      },
    },
    // Planet 4 (if needed) - Nearly horizontal orbit (opposite direction) - NORMAL
    {
      angle: 2.3,
      baseRadius: 2.0, // Much larger orbit (was 0.8)
      size: 4.9,
      orbitSpeed: 1.8, // Much faster orbit (was 0.36)
      orbitTilt: 0.2, // Nearly horizontal but slight tilt - another horizontal orbit
      orbitEccentricity: 0.74,
      spinSpeed: 0.18,
      spinDirection: 1,
      // Normal planet properties
      isFat: false,
      hasHalo: false,
      moons: {
        count: 2,
        distances: [4.5, 7.9],
        speeds: [0.49, 0.26],
        angles: [3.7, 0.5],
        sizes: [0.52, 0.78],
        tilts: [0.6, 3.0],
        inclinations: [1.8, 5.3],
      },
    },
  ],
};