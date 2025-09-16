/**
 * Orbital Big Dots Configuration
 * Hardcoded parameters for BLUE orbital big dots to eliminate Math.random() calls
 * and ensure consistent performance and visual experience.
 */

export const ORBITAL_BIG_DOTS_CONFIG = {
  // Number of orbital big dots (was: 5 + Math.floor(Math.random() * 3) = 5-7)
  count: 6, // Pick a nice middle value
  
  // Orbital parameters for each big dot (replaces Math.random() calls)
  orbitalParams: [
    // Dot 0 - Normal horizontal orbital big dot
    {
      size: 4.2, // was: 3 + Math.random() * 3 (3-6)
      orbitRadius: 1.8, // was: 1.4 + Math.random() * 0.6 (1.4-2.0)
      orbitSpeed: 0.24, // was: 0.16 + Math.random() * 0.24 (0.16-0.4)
      orbitAngle: 2.1, // was: Math.random() * Math.PI * 2
      orbitTilt: 0.12, // was: 0.05 + Math.random() * 0.15 (0.05-0.2)
      orbitRotation: 4.5, // was: Math.random() * Math.PI * 2
      orbitInclination: 0.15, // was: Math.random() * 0.3 (0-0.3)
      orbitDirection: 1, // was: Math.random() < 0.5 ? 1 : -1
      spinSpeed: 0.42, // was: 0.15 + Math.random() * 0.5 (0.15-0.65)
      spinDirection: 1, // was: Math.random() < 0.5 ? 1 : -1
    },
    // Dot 1 - Fast horizontal orbital big dot
    {
      size: 5.1,
      orbitRadius: 1.6,
      orbitSpeed: 0.35,
      orbitAngle: 0.8,
      orbitTilt: 0.08,
      orbitRotation: 1.3,
      orbitInclination: 0.22,
      orbitDirection: -1,
      spinSpeed: 0.31,
      spinDirection: -1,
    },
    // Dot 2 - Medium orbital big dot
    {
      size: 3.8,
      orbitRadius: 2.1,
      orbitSpeed: 0.19,
      orbitAngle: 3.7,
      orbitTilt: 0.18,
      orbitRotation: 5.9,
      orbitInclination: 0.08,
      orbitDirection: 1,
      spinSpeed: 0.55,
      spinDirection: 1,
    },
    // Dot 3 - Slow wide orbit big dot
    {
      size: 4.7,
      orbitRadius: 2.3,
      orbitSpeed: 0.28,
      orbitAngle: 5.2,
      orbitTilt: 0.14,
      orbitRotation: 2.8,
      orbitInclination: 0.25,
      orbitDirection: -1,
      spinSpeed: 0.38,
      spinDirection: 1,
    },
    // Dot 4 - Fast close orbit big dot
    {
      size: 3.4,
      orbitRadius: 1.7,
      orbitSpeed: 0.32,
      orbitAngle: 1.4,
      orbitTilt: 0.11,
      orbitRotation: 0.7,
      orbitInclination: 0.18,
      orbitDirection: 1,
      spinSpeed: 0.49,
      spinDirection: -1,
    },
    // Dot 5 - EXTRA BIG VERTICAL orbital big dot (special)
    {
      size: 10.5, // was: 8 + Math.random() * 4 (8-12) - EXTRA BIG
      orbitRadius: 2.7, // was: 2.2 + Math.random() * 0.8 (2.2-3.0) - FAR OUT
      orbitSpeed: 0.18, // was: 0.1 + Math.random() * 0.16 (0.10-0.26) - SLOW
      orbitAngle: 0.0, // Starting at 0
      orbitTilt: 1.57, // VERTICAL (π/2)
      orbitRotation: 3.14, // Half rotation
      orbitInclination: 1.57, // VERTICAL (π/2)
      orbitDirection: 1,
      spinSpeed: 0.26,
      spinDirection: 1,
    },
  ],
  
  // Moon configurations for each orbital big dot
  // Each dot gets specific moon properties instead of random generation
  moons: [
    // Dot 0 moons
    {
      count: 3, // was: 2 + Math.floor(Math.random() * 3) = 2-4
      angles: [0, 2.1, 4.2], // was: Math.random() * Math.PI * 2 for each
      distances: [1.4, 1.8, 1.6], // was: 1.2 + Math.random() * 0.8 = 1.2-2.0
      speeds: [1.0, 0.8, 1.3], // was: 0.6 + Math.random() * 1.0 = 0.6-1.6
      tilts: [1.2, 2.5, 0.8], // was: Math.random() * Math.PI = 0-π
    },
    // Dot 1 moons
    {
      count: 2,
      angles: [1.5, 4.7],
      distances: [1.3, 1.9],
      speeds: [0.9, 1.1],
      tilts: [0.6, 2.8],
    },
    // Dot 2 moons
    {
      count: 4,
      angles: [0.8, 2.3, 3.9, 5.2],
      distances: [1.5, 1.2, 1.7, 1.4],
      speeds: [1.2, 0.7, 1.4, 0.9],
      tilts: [1.8, 0.3, 2.2, 1.0],
    },
    // Dot 3 moons
    {
      count: 3,
      angles: [2.1, 0.5, 3.8],
      distances: [1.6, 1.3, 1.8],
      speeds: [0.8, 1.5, 1.0],
      tilts: [2.1, 1.4, 0.7],
    },
    // Dot 4 moons
    {
      count: 2,
      angles: [3.2, 1.1],
      distances: [1.4, 1.7],
      speeds: [1.3, 0.6],
      tilts: [0.9, 2.6],
    },
    // Dot 5 moons (this is the biggest blue dot with special configuration)
    {
      count: 2,
      angles: [0, 3.14159], // 0 and Math.PI - start opposite each other
      distances: [1.5, 2.2], // Different distances for visual variety
      speeds: [0.4, 0.25], // Different speeds - first faster, second slower
      tilts: [1.5708, 0], // Math.PI/2 (vertical) and 0 (horizontal) for different orbital planes
    },
  ],
};