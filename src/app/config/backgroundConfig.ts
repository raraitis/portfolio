/**
 * Static configuration for background elements
 * This replaces random generation to ensure consistent visual experience
 * across page refreshes and navigation.
 */

// Orbital Big Dots Configuration
export const ORBITAL_BIG_DOTS_CONFIG = {
  // Number of orbital big dots (was: 5 + Math.floor(Math.random() * 3) = 5-7)
  count: 6, // Pick a nice middle value
  
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