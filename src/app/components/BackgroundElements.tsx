'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimationActions } from '@/contexts/AnimationContext';
import { useDevice } from '../hooks/useDevice';
import { styles } from '../../styles';
import { ORBITAL_BIG_DOTS_CONFIG } from '../config/backgroundConfig';
import { ORBITAL_BIG_DOTS_CONFIG as ORBITAL_PARAMS_CONFIG } from '../config/orbitalBigDotsConfig';
import { PLANET_DOTS_CONFIG } from '../config/planetDotsConfig';
import {
  STATIC_DOTS_GRID_CONFIG,
  getStaticDotConfig,
} from '../config/staticDotsConfig';
import {
  renderBackgroundPattern,
  calculateSpherePositionAndSize,
  renderSphereGlow,
} from '../helpers/backgroundHelpers';
import {
  setupMobileCanvas,
  renderMobileBackgroundPattern,
  calculateMobileSpherePositionAndSize,
  renderMobileSphereGlow,
  getMobileFrameRate,
} from '../helpers/mobileBgHelpers';
import { SphereInfo } from '../types/backgroundTypes';

const BackgroundElements = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');
  const animationActions = useAnimationActions();
  const device = useDevice();

  // Listen for global section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setBackgroundSection = (section: 'home' | 'me') => {
        setCurrentSection(section);
      };
    }
  }, []);

  useEffect(() => {
    // Store static random sizes and positions for BIG dot small dots
    const bigDotStaticSizes: number[][] = [];
    const bigDotStaticPositions: {
      baseX: number;
      baseZ: number;
      y: number;
    }[][] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Detect mobile device and setup optimizations based on device capabilities
    const isMobile = device.isMobile;
    const isLowPowerDevice = device.hardwareConcurrency <= 4 || device.isMobile;
    const targetFrameRate = isLowPowerDevice ? 30 : 60;
    let lastFrameTime = 0;
    const frameInterval = 1000 / targetFrameRate; // Convert to milliseconds

    // Setup mobile canvas if needed
    if (isMobile) {
      setupMobileCanvas(canvas, ctx);
    }

    let animationFrame: number;
    let time = 0;

    // Static neural network dots - generate in grid pattern
    const staticDots: {
      x: number;
      y: number;
      size: number;
      relativeX: number;
      relativeY: number;
      baseOffsetX: number;
      baseOffsetY: number;
      _firing?: boolean;
      _seed?: number;
      moons?: {
        count: number;
        offsets?: number[];
        configs?: {
          orbitRadius: number;
          orbitSpeed: number;
          orbitAngle: number;
          orbitTilt: number;
          moonSize: number;
        }[];
      };
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
    }[] = [];

    // Generate grid pattern that covers sphere better - using hardcoded config
    const gridResolution = STATIC_DOTS_GRID_CONFIG.resolution;
    const step = STATIC_DOTS_GRID_CONFIG.step;

    // Select 3/5 of dots for moons
    let moonDotIndices: number[] = [];
    const totalDots = gridResolution * gridResolution;
    for (let i = 0; i < totalDots; i++) {
      if (moonDotIndices.length < Math.floor(totalDots * 0.6)) {
        if (i % Math.floor(totalDots / Math.floor(totalDots * 0.6)) === 0)
          moonDotIndices.push(i);
      }
    }
    // Of those, select 1/3 to orbit a planet
    let planetDotIndices: number[] = [];
    for (let i = 0; i < moonDotIndices.length; i++) {
      if (planetDotIndices.length < Math.floor(moonDotIndices.length / 3)) {
        if (
          i %
            Math.floor(
              moonDotIndices.length / Math.floor(moonDotIndices.length / 3)
            ) ===
          0
        )
          planetDotIndices.push(moonDotIndices[i]);
      }
    }
    // Create a few big planet dots with predefined configurations
    const planetCount = PLANET_DOTS_CONFIG.count; // Use hardcoded count for consistency
    const planetDots: {
      x: number;
      y: number;
      size: number;
      angle: number;
      baseRadius: number;
      orbitSpeed: number;
      orbitTilt: number;
      orbitEccentricity: number;
      spinSpeed: number;
      spinDirection: number;
      moons: {
        count: number;
        distances: number[];
        speeds: number[];
        angles: number[];
        sizes: number[];
        tilts: number[];
        inclinations: number[];
      };
    }[] = [];
    for (let p = 0; p < planetCount; p++) {
      // Use predefined planet configuration instead of random generation
      const planetConfig = PLANET_DOTS_CONFIG.planets[p];
      const angle = planetConfig.angle;
      const baseRadius = planetConfig.baseRadius;

      planetDots.push({
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
        size: planetConfig.size,
        angle,
        baseRadius,
        orbitSpeed: planetConfig.orbitSpeed,
        orbitTilt: planetConfig.orbitTilt,
        orbitEccentricity: planetConfig.orbitEccentricity,
        spinSpeed: planetConfig.spinSpeed,
        spinDirection: planetConfig.spinDirection,
        moons: {
          count: planetConfig.moons.count,
          distances: [...planetConfig.moons.distances], // Copy arrays to avoid reference issues
          speeds: [...planetConfig.moons.speeds],
          angles: [...planetConfig.moons.angles],
          sizes: [...planetConfig.moons.sizes],
          tilts: [...planetConfig.moons.tilts],
          inclinations: [...planetConfig.moons.inclinations],
        },
      });
    }

    // Create additional BIG dots that orbit around the main sphere
    const orbitalBigDots: {
      x: number;
      y: number;
      z: number; // Add Z coordinate for true 3D positioning
      size: number;
      orbitRadius: number;
      orbitSpeed: number;
      orbitAngle: number;
      orbitTilt: number; // Tilt of orbital plane (0 = horizontal, π/2 = vertical)
      orbitRotation: number; // Rotation of the orbital plane around Y-axis
      orbitInclination: number; // Inclination of the orbital plane
      orbitDirection: number; // 1 for clockwise, -1 for counter-clockwise
      spinSpeed: number;
      spinDirection: number;
      moons?: {
        count: number;
        angles: number[];
        distances: number[];
        speeds: number[];
        tilts: number[];
      };
    }[] = [];
    const orbitalBigDotCount = ORBITAL_PARAMS_CONFIG.count; // Use hardcoded value for consistency
    for (let o = 0; o < orbitalBigDotCount; o++) {
      // Add moons to ALL orbital BIG dots (100% chance)
      const hasMoons = true; // All orbital BIG dots will have moons
      const moonConfig = ORBITAL_BIG_DOTS_CONFIG.moons[o]; // Get predefined config for this dot
      const moons = hasMoons
        ? {
            count: moonConfig.count, // Use hardcoded count
            angles: [...moonConfig.angles], // Use hardcoded angles
            distances: [...moonConfig.distances], // Use hardcoded distances
            speeds: [...moonConfig.speeds], // Use hardcoded speeds
            tilts: [...moonConfig.tilts], // Use hardcoded tilts
          }
        : undefined;

      // Check if this is the last (extra) orbital dot to make it bigger
      const isExtraBigDot = o === orbitalBigDotCount - 1;

      // No more moon overrides needed - values are already set correctly in config!

      // Get hardcoded orbital parameters for this dot
      const orbitalParams = ORBITAL_PARAMS_CONFIG.orbitalParams[o];

      orbitalBigDots.push({
        x: 0,
        y: 0,
        z: 0, // Initialize Z coordinate
        size: orbitalParams.size, // Hardcoded size
        orbitRadius: orbitalParams.orbitRadius, // Hardcoded orbit radius
        orbitSpeed: orbitalParams.orbitSpeed, // Hardcoded orbit speed
        orbitAngle: orbitalParams.orbitAngle, // Hardcoded starting angle
        orbitTilt: orbitalParams.orbitTilt, // Hardcoded tilt
        orbitRotation: orbitalParams.orbitRotation, // Hardcoded rotation
        orbitInclination: orbitalParams.orbitInclination, // Hardcoded inclination
        orbitDirection: orbitalParams.orbitDirection, // Hardcoded direction
        spinSpeed: orbitalParams.spinSpeed, // Hardcoded spin speed
        spinDirection: orbitalParams.spinDirection, // Hardcoded spin direction
        moons,
      });
    }

    // Select some dots with moons to also orbit (about 1/4 of moon dots)
    let orbitingMoonDotIndices: number[] = [];
    for (let i = 0; i < moonDotIndices.length; i++) {
      if (
        orbitingMoonDotIndices.length < Math.floor(moonDotIndices.length / 4)
      ) {
        if (i % 4 === 0) {
          orbitingMoonDotIndices.push(moonDotIndices[i]);
        }
      }
    }

    let dotIndex = 0;
    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const relativeX = -1 + i * step;
        const relativeY = -1 + j * step;

        // Only include points within circle
        const distance = Math.sqrt(
          relativeX * relativeX + relativeY * relativeY
        );
        if (distance <= STATIC_DOTS_GRID_CONFIG.sphereRadius) {
          // Keep dots slightly inside sphere

          // Get hardcoded dot configuration instead of random generation
          const dotConfig = getStaticDotConfig(dotIndex);
          const size = dotConfig.size;

          // Use hardcoded offsets instead of random generation
          const baseOffsetX = dotConfig.baseOffsetX;
          const baseOffsetY = dotConfig.baseOffsetY;

          const moons =
            dotConfig.moonConfigs &&
            !dotConfig.orbitsPlanet && // Don't give moons to dots that orbit planets
            !planetDotIndices.includes(dotIndex) // Don't give moons to dots that orbit planets via old system
              ? {
                  count: dotConfig.moonCount || 0,
                  configs: dotConfig.moonConfigs,
                }
              : moonDotIndices.includes(dotIndex) &&
                !planetDotIndices.includes(dotIndex) // Don't give moons to planet-orbiting dots
              ? {
                  count: Math.random() < 0.5 ? 1 : 2,
                  offsets: [
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                  ],
                }
              : undefined;
          const orbitsPlanet =
            dotConfig.orbitsPlanet ||
            (planetDotIndices.includes(dotIndex)
              ? {
                  planetIndex: dotIndex % planetCount,
                  orbitRadius: 0.18 + Math.random() * 0.12,
                  orbitOffset: Math.random() * Math.PI * 2,
                }
              : undefined);
          const orbitsMain =
            dotConfig.orbitsMain ||
            (orbitingMoonDotIndices.includes(dotIndex)
              ? {
                  orbitRadius: 0.3 + Math.random() * 0.4, // Orbit radius around main sphere center
                  orbitSpeed: 0.05 + Math.random() * 0.1, // Slow orbital speed
                  orbitOffset: Math.random() * Math.PI * 2, // Random starting position
                  orbitTilt: Math.random() * Math.PI * 0.6, // Random orbital tilt
                }
              : undefined);
          staticDots.push({
            x: 0, // Will be calculated in animation
            y: 0, // Will be calculated in animation
            size,
            relativeX: relativeX + baseOffsetX,
            relativeY: relativeY + baseOffsetY,
            baseOffsetX,
            baseOffsetY,
            moons,
            orbitsPlanet,
            orbitsMain,
          });
          dotIndex++;
        }
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = (currentTime: number = 0) => {
      // Frame rate limiting for mobile performance
      if (currentTime - lastFrameTime < frameInterval) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Use mobile-optimized rendering if on mobile device
      if (isMobile) {
        renderMobileBackgroundPattern(ctx, canvas, time);
      } else {
        renderBackgroundPattern(ctx, canvas, time);
      }

      time += 0.008; // Slow, organic movement

      // Calculate sphere position and size using appropriate helper function
      const sphereInfo: SphereInfo = isMobile
        ? calculateMobileSpherePositionAndSize(canvas, time, currentSection)
        : calculateSpherePositionAndSize(canvas, time, currentSection);
      const { x: sphereX, y: sphereY, z: sphereZ, radius } = sphereInfo;

      // Update store for interactions
      animationActions.updateSpherePosition({ x: sphereX, y: sphereY });

      // Draw Saturn-like sphere with dotted atmospheric texture
      ctx.save();

      // Create slightly irregular sphere shape using multiple arcs
      ctx.beginPath();

      // Draw irregular circular path for more organic feel
      const irregularRadius = (angle: number) => {
        const baseVariation = Math.sin(angle * 6) * 0.05; // 6 subtle bumps
        const detailVariation = Math.sin(angle * 18) * 0.02; // Fine details
        const timeVariation = Math.sin(time * 2 + angle * 3) * 0.03; // Gentle breathing
        // Extended boundary for softer clipping (3.45x larger than visible sphere - 3x increase)
        return (
          radius * 3.45 * (1 + baseVariation + detailVariation + timeVariation)
        );
      };

      // Draw custom path with slight irregularities
      const points = 36; // Smooth but irregular
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const currentRadius = irregularRadius(angle);
        const x = sphereX + Math.cos(angle) * currentRadius;
        const y = sphereY + Math.sin(angle) * currentRadius;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.clip();

      // Update static dots positions based on current sphere position
      const dots: {
        x: number;
        y: number;
        size: number;
        depth: number;
        _staticDot?: any;
      }[] = [];
      staticDots.forEach((staticDot) => {
        let dotX, dotY;

        // Check if this dot orbits the main sphere
        if (staticDot.orbitsMain) {
          // Calculate orbital position around main sphere center
          const orbitAngle =
            time * staticDot.orbitsMain.orbitSpeed +
            staticDot.orbitsMain.orbitOffset;

          // Create elliptical orbit with tilt
          const ellipseX =
            Math.cos(orbitAngle) * staticDot.orbitsMain.orbitRadius;
          const ellipseY =
            Math.sin(orbitAngle) * staticDot.orbitsMain.orbitRadius * 0.8; // Slightly elliptical

          // Apply orbital tilt
          const tiltCos = Math.cos(staticDot.orbitsMain.orbitTilt);
          const tiltSin = Math.sin(staticDot.orbitsMain.orbitTilt);
          const tiltedX = ellipseX * tiltCos - ellipseY * tiltSin;
          const tiltedY = ellipseX * tiltSin + ellipseY * tiltCos;

          dotX = sphereX + tiltedX * radius;
          dotY = sphereY + tiltedY * radius;
        } else {
          // Apply rotation to grid position (original behavior)
          const rotationSpeed = 0.25;
          const rotationAngle = time * rotationSpeed;
          const cosA = Math.cos(rotationAngle);
          const sinA = Math.sin(rotationAngle);
          const rotatedX =
            staticDot.relativeX * cosA - staticDot.relativeY * sinA;
          const rotatedY =
            staticDot.relativeX * sinA + staticDot.relativeY * cosA;
          // More random movement instead of wave pattern
          if (!staticDot._seed) staticDot._seed = Math.random() * 1000;
          const randomX =
            Math.sin(time * 1.5 + staticDot._seed * 2.1) * 2 +
            Math.cos(time * 2.3 + staticDot._seed * 1.7) * 2;
          const randomY =
            Math.cos(time * 1.7 + staticDot._seed * 2.5) * 2 +
            Math.sin(time * 2.1 + staticDot._seed * 1.3) * 2;
          // Final dot position
          dotX = sphereX + rotatedX * radius + randomX;
          dotY = sphereY + rotatedY * radius + randomY;
        }

        // Calculate depth factor for this dot
        const dotDistance = Math.sqrt(
          staticDot.relativeX * staticDot.relativeX +
            staticDot.relativeY * staticDot.relativeY
        );
        const depthFactor = 1 - dotDistance;

        // Fluid movement: dots gently react to orbit and neural firing
        // Orbit influence: dots sway based on sphereZ (depth)
        const orbitInfluence =
          Math.sin(
            time * 1.2 + staticDot.relativeX * 6 + staticDot.relativeY * 6
          ) *
          sphereZ *
          0.025;

        // Mark firing state for pulse
        staticDot._firing = false;
        dots.push({
          x: dotX + Math.sin(time * 0.7 + dotX * 0.01) * 3 + orbitInfluence,
          y: dotY + Math.cos(time * 0.7 + dotY * 0.01) * 3 + orbitInfluence,
          size: staticDot.size * (0.5 + depthFactor * 0.5),
          depth: depthFactor,
          _staticDot: staticDot,
        });
      });

      // Draw dots
      dots.forEach((dot) => {
        // Enhanced firing effects: size pop and shine
        let pulse = 0;
        let sizePop = 0;
        let shine = 0;

        if (dot._staticDot && dot._staticDot._firing) {
          // Fast pulse for smooth firing effect
          pulse = Math.sin(time * 12) * 2;

          // Very small size pop - quick up and down
          const popSpeed = time * 15; // Fast animation
          sizePop = Math.sin(popSpeed) * 1.2; // VERY small size increase (max 1.2px)

          // Brief shine effect - quick bright flash
          const shineSpeed = time * 18; // Even faster for brief shine
          shine = Math.max(0, Math.sin(shineSpeed)) * 0.4; // Positive values only, max 0.4 alpha boost
        }

        const intensity = 0.5 * dot.depth + 0.3;

        // Calculate distance from sphere center for edge fade
        const dotDistanceFromCenter = Math.sqrt(
          dot._staticDot.relativeX * dot._staticDot.relativeX +
            dot._staticDot.relativeY * dot._staticDot.relativeY
        );

        // Minimalistic fade: dots fade out as they approach the sphere edge
        const fadeRadius = 0.85; // Start fading at 85% of sphere radius
        const edgeFade =
          dotDistanceFromCenter > fadeRadius
            ? Math.max(
                0.1,
                1 -
                  ((dotDistanceFromCenter - fadeRadius) / (0.9 - fadeRadius)) *
                    0.8
              )
            : 1.0; // No fade for inner dots, gentle fade for outer dots

        // Apply shine effect to color with edge fade
        const baseAlpha = (intensity + shine) * edgeFade;

        // 🟤 BROWN - Main sphere static dots (small dots on central sphere surface)
        // TESTING: Main sphere static dots = BROWN
        const brownColor = `rgba(139, 69, 19, ${baseAlpha})`; // Saddle brown

        // Create perfectly round dots with subtle halo
        const baseSize = dot.size + pulse + sizePop;

        // Draw subtle halo first (larger, very light version of same color)
        const haloSize = baseSize * 1.6; // 60% larger than main dot
        const haloAlpha = baseAlpha * 0.15; // Very light - 15% of main dot opacity
        ctx.fillStyle = `rgba(139, 69, 19, ${haloAlpha})`; // Same brown but very light
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, haloSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw main perfectly round dot
        ctx.fillStyle = brownColor;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, baseSize, 0, Math.PI * 2);
        ctx.fill();

        // Add subtle glow when firing (only to main dot, not halo)
        if (shine > 0) {
          ctx.shadowColor = `rgba(200, 180, 120, ${shine * 0.6 * edgeFade})`;
          ctx.shadowBlur = 3 + shine * 4;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, baseSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Reset shadow for next dot
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      });

      // Draw big planet dots as mini web/grid
      // --- Dot Hierarchy Comments ---
      // 1. All dots: staticDots/gridDots
      // 2. 3/5 of all dots are chosen to have moons: parentDotsWithMoons (moonDotIndices)
      // 3. Of those parent dots, 1/3 are selected to orbit a BIG dot (planet dot): planetDots (planetDotIndices)
      // 4. BIG dots are rendered as mini-spheres, and for testing are colored RED
      // --- End Comments ---

      planetDots.forEach((planet, pIdx) => {
        // Animate planet position with varied orbital patterns
        const planetAngle = time * planet.orbitSpeed + planet.angle;

        // Add dynamic orbital radius variation for more visible movement
        const radiusVariation = Math.sin(time * 0.8 + pIdx * 2) * 0.15; // ±15% radius variation
        const dynamicRadius = planet.baseRadius * (1 + radiusVariation);

        // Create elliptical orbit with tilt and dynamic radius
        const ellipseX = Math.cos(planetAngle) * dynamicRadius;
        const ellipseY =
          Math.sin(planetAngle) * dynamicRadius * planet.orbitEccentricity;

        // Apply orbital tilt (rotation around Z-axis) with slight wobble
        const dynamicTilt =
          planet.orbitTilt + Math.sin(time * 0.3 + pIdx) * 0.1;
        const tiltCos = Math.cos(dynamicTilt);
        const tiltSin = Math.sin(dynamicTilt);
        const tiltedX = ellipseX * tiltCos - ellipseY * tiltSin;
        const tiltedY = ellipseX * tiltSin + ellipseY * tiltCos;

        const planetX = sphereX + tiltedX * radius;
        const planetY = sphereY + tiltedY * radius;
        // Render BIG dot as a sphere made of small random dots with cylindrical spin
        const miniGridRes = 20; // Better resolution for sphere appearance
        const miniRadius = planet.size * 4.5;
        const spinAngle = time * planet.spinSpeed * planet.spinDirection; // Use varied spin parameters

        // Precompute static random sizes and base positions for small dots inside each BIG dot
        if (!bigDotStaticSizes[pIdx]) {
          bigDotStaticSizes[pIdx] = [];
          bigDotStaticPositions[pIdx] = [];

          // Generate random dots distributed on sphere surface with better distribution
          const numDots = 100; // Reduced number of dots to avoid overcrowding
          for (let i = 0; i < numDots; i++) {
            // Generate random spherical coordinates with better distribution
            const theta = Math.acos(1 - 2 * Math.random()); // Better latitude distribution
            const phi = Math.random() * 2 * Math.PI; // longitude (0 to 2π)
            const y = Math.cos(theta); // vertical position
            const r = Math.sin(theta); // radius at this latitude

            // Skip dots too close to the poles/edges to avoid clustering
            if (Math.abs(y) > 0.85 || r < 0.15) {
              i--; // Retry this iteration
              continue;
            }

            const baseX = r * Math.cos(phi);
            const baseZ = r * Math.sin(phi);

            bigDotStaticSizes[pIdx][i] =
              miniRadius * (0.015 + Math.random() * 0.055);
            bigDotStaticPositions[pIdx][i] = { baseX, baseZ, y };
          }
        }

        // Render dots with cylindrical rotation
        for (let i = 0; i < bigDotStaticPositions[pIdx].length; i++) {
          const { baseX, baseZ, y } = bigDotStaticPositions[pIdx][i];

          // Apply cylindrical rotation around Y-axis
          const rotatedX =
            baseX * Math.cos(spinAngle) - baseZ * Math.sin(spinAngle);
          const rotatedZ =
            baseX * Math.sin(spinAngle) + baseZ * Math.cos(spinAngle);

          // Project to screen coordinates
          const dotX = planetX + rotatedX * miniRadius;
          const dotY = planetY + y * miniRadius;
          const randSize = bigDotStaticSizes[pIdx][i];

          // Depth-based alpha for 3D effect (front dots brighter, back dots dimmer)
          const localDepth = (rotatedZ + 1) / 2; // Normalize to 0-1 for local dot depth
          const localAlpha = 0.3 + localDepth * 0.7; // Front dots more opaque

          ctx.beginPath();
          ctx.arc(dotX, dotY, randSize, 0, Math.PI * 2);
          // Get planet configuration for color and special properties
          const planetConfig = PLANET_DOTS_CONFIG.planets[pIdx];

          if (planetConfig && planetConfig.isFat && planetConfig.color) {
            // � BEIGE - Fat planet dots (beige color closer to brown sphere)
            const beigeColor = planetConfig.color;
            ctx.fillStyle = `rgba(${beigeColor.r}, ${beigeColor.g}, ${
              beigeColor.b
            }, ${localAlpha * beigeColor.alpha})`;
            ctx.fill();

            // Add halo effect for fat planets
            if (planetConfig.hasHalo) {
              ctx.beginPath();
              ctx.arc(dotX, dotY, randSize * 1.8, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${beigeColor.r}, ${beigeColor.g}, ${
                beigeColor.b
              }, ${localAlpha * beigeColor.alpha * 0.3})`;
              ctx.fill();
            }
          } else {
            // 🔴 RED - Normal planet dots (bright red)
            // TESTING: Make planet dots BRIGHT RED to identify them
            const redShade = 255; // Bright red for identification
            const greenShade = 0; // No green
            const blueShade = 0; // No blue
            ctx.fillStyle = `rgba(${redShade}, ${greenShade}, ${blueShade}, ${localAlpha})`;
            ctx.fill();
          }
        }

        // 🟢 GREEN - Planet moons (small dots orbiting around red planet dots)
        // Render moons for this RED dot (planet)
        if (planet.moons) {
          for (let m = 0; m < planet.moons.count; m++) {
            const moonAngle =
              time * planet.moons.speeds[m] + planet.moons.angles[m];
            const moonDistance = planet.moons.distances[m] * (planet.size * 2); // Scale with planet size

            // Create 3D orbital mechanics for varied moon orbits
            // Start with basic circular orbit in XZ plane
            const basicX = Math.cos(moonAngle) * moonDistance;
            const basicY = 0; // Start at equatorial plane
            const basicZ = Math.sin(moonAngle) * moonDistance;

            // Apply orbital tilt (inclination from horizontal to vertical)
            const tilt = planet.moons.tilts[m];
            const tiltCos = Math.cos(tilt);
            const tiltSin = Math.sin(tilt);
            const tiltedX = basicX;
            const tiltedY = basicY * tiltCos - basicZ * tiltSin;
            const tiltedZ = basicY * tiltSin + basicZ * tiltCos;

            // Apply orbital inclination (rotation around Y-axis for varied orbital planes)
            const inclination = planet.moons.inclinations[m];
            const incCos = Math.cos(inclination);
            const incSin = Math.sin(inclination);
            const finalX = tiltedX * incCos - tiltedZ * incSin;
            const finalY = tiltedY;
            const finalZ = tiltedX * incSin + tiltedZ * incCos;

            // Project to screen coordinates around the planet
            const moonX = planetX + finalX;
            const moonY = planetY + finalY;
            const moonSize = planet.moons.sizes[m] * planet.size; // Scale moon with planet

            // Apply depth-based effects (moons behind the planet are dimmer)
            const localDepth = (finalZ + moonDistance) / (moonDistance * 2); // 0 to 1 range
            const localAlpha = 0.5 + localDepth * 0.5; // Front moons brighter

            // Draw moon with darker colors than parent RED dot
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
            // Make moons darker than their parent RED dot (using similar brownish tones but darker)
            const redShade = 80 + (pIdx % 3) * 5; // Same variation as parent
            const greenShade = 70 + (pIdx % 3) * 3;
            const blueShade = 50 + (pIdx % 3) * 4;
            // Make moon colors darker but not too dark (reduce by ~20-25 instead of 30-40)
            const moonRed = Math.max(45, redShade - 20);
            const moonGreen = Math.max(40, greenShade - 18);
            const moonBlue = Math.max(25, blueShade - 15);

            if (m === 0) {
              ctx.fillStyle = `rgba(0, 255, 0, ${localAlpha * 0.8})`; // TESTING: Green for planet dot moons (first)
            } else {
              ctx.fillStyle = `rgba(0, 200, 0, ${localAlpha * 0.8})`; // TESTING: Dark green for planet dot moons (second)
            }
            ctx.fill();

            // Add a subtle glow effect with depth (also darker)
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonSize * 1.5, 0, Math.PI * 2);
            if (m === 0) {
              ctx.fillStyle = `rgba(0, 255, 0, ${localAlpha * 0.2})`; // TESTING: Green glow for planet dot moons
            } else {
              ctx.fillStyle = `rgba(0, 200, 0, ${localAlpha * 0.2})`; // TESTING: Dark green glow for planet dot moons
            }
            ctx.fill();
          }
        }

        planet.x = planetX;
        planet.y = planetY;
      });

      // Orbiting moons for fixed subset of dots, and parent dots orbiting planets
      dots.forEach((dot, i) => {
        // If this dot orbits a planet, update its position
        if (dot._staticDot && dot._staticDot.orbitsPlanet) {
          const planet = planetDots[dot._staticDot.orbitsPlanet.planetIndex];
          const orbitAngle =
            time * 0.5 + dot._staticDot.orbitsPlanet.orbitOffset;
          dot.x =
            planet.x +
            Math.cos(orbitAngle) *
              radius *
              dot._staticDot.orbitsPlanet.orbitRadius;
          dot.y =
            planet.y +
            Math.sin(orbitAngle) *
              radius *
              dot._staticDot.orbitsPlanet.orbitRadius;
        }
        // 🟣 PURPLE - Static dot moons (small dots orbiting around BROWN static dots with varied orbital configurations)
        // Draw moons with varied orbital configurations
        if (dot._staticDot && dot._staticDot.moons) {
          // Debug: Log moon data for the first few dots
          if (i < 5 && dot._staticDot.moons.configs) {
            console.log(
              `Dot ${i} has ${dot._staticDot.moons.count} moons with configs:`,
              dot._staticDot.moons.configs
            );
          }

          for (let m = 0; m < dot._staticDot.moons.count; m++) {
            // Check if we have new detailed moon configs or old simple offsets
            if (
              dot._staticDot.moons.configs &&
              dot._staticDot.moons.configs[m]
            ) {
              // Use new detailed moon configuration
              const moonConfig = dot._staticDot.moons.configs[m];

              // Calculate moon angle with custom speed
              const moonAngle =
                time * moonConfig.orbitSpeed + moonConfig.orbitAngle;

              // Debug: Log animation values for first moon of first dot
              if (i === 0 && m === 0) {
                console.log(
                  `Moon animation - time: ${time.toFixed(3)}, speed: ${
                    moonConfig.orbitSpeed
                  }, angle: ${moonAngle.toFixed(3)}`
                );
              }

              // Calculate orbit radius (relative to parent dot size)
              const orbitRadius = dot.size * moonConfig.orbitRadius;

              // Apply orbital tilt for 3D-like orbits
              // orbitTilt: 0 = horizontal, PI/2 = vertical
              const tiltFactor = Math.sin(moonConfig.orbitTilt);
              const horizontalRadius =
                orbitRadius * Math.cos(moonConfig.orbitTilt);
              const verticalRadius = orbitRadius * tiltFactor;

              // Calculate moon position with tilt
              const moonX = dot.x + Math.cos(moonAngle) * horizontalRadius;
              const moonY = dot.y + Math.sin(moonAngle) * verticalRadius;

              // Calculate moon size relative to parent dot
              const moonSize = dot.size * moonConfig.moonSize;

              // Draw the moon
              ctx.beginPath();
              ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 255, 0, 1.0)`; // DEBUGGING: Bright neon green for static dot moons
              ctx.fill();
            } else if (dot._staticDot.moons.offsets) {
              // Fallback to old simple offset system for compatibility
              const oscillation = Math.sin(time * 0.5 + i * 0.2) * 8;
              const moonAngle =
                time * (0.8 + m * 0.5) + dot._staticDot.moons.offsets[m];
              const moonRadius = dot.size * 2.5 + m * 6;
              const moonX = dot.x + Math.cos(moonAngle) * moonRadius;
              const moonY =
                dot.y + Math.sin(moonAngle) * moonRadius + oscillation;
              ctx.beginPath();
              ctx.arc(moonX, moonY, dot.size * 0.45, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(0, 255, 0, 1.0)`; // DEBUGGING: Bright neon green for static dot moons (fallback)
              ctx.fill();
            }
          }
        }
      });

      ctx.restore();

      // Render orbital BIG dots that orbit around the main sphere in full 3D
      orbitalBigDots.forEach((orbitalDot, oDx) => {
        // Calculate current orbital angle
        const currentOrbitAngle =
          time * orbitalDot.orbitSpeed * orbitalDot.orbitDirection +
          orbitalDot.orbitAngle;

        // True 3D orbital calculation - moon-like orbit around main sphere
        // Start with basic circular orbit in XZ plane
        const basicX = Math.cos(currentOrbitAngle) * orbitalDot.orbitRadius;
        const basicY = 0; // Start at equatorial plane
        const basicZ = Math.sin(currentOrbitAngle) * orbitalDot.orbitRadius;

        // Apply orbital inclination (tilt the orbit plane up/down)
        const inclinationCos = Math.cos(orbitalDot.orbitInclination);
        const inclinationSin = Math.sin(orbitalDot.orbitInclination);
        const inclinedX = basicX;
        const inclinedY = basicY * inclinationCos - basicZ * inclinationSin;
        const inclinedZ = basicY * inclinationSin + basicZ * inclinationCos;

        // Apply orbital rotation (rotate the orbit plane around Y-axis)
        const rotationCos = Math.cos(orbitalDot.orbitRotation);
        const rotationSin = Math.sin(orbitalDot.orbitRotation);
        const rotatedX = inclinedX * rotationCos - inclinedZ * rotationSin;
        const rotatedY = inclinedY;
        const rotatedZ = inclinedX * rotationSin + inclinedZ * rotationCos;

        // Apply orbital tilt (final orientation of the orbit)
        const tiltCos = Math.cos(orbitalDot.orbitTilt);
        const tiltSin = Math.sin(orbitalDot.orbitTilt);
        const finalX = rotatedX * tiltCos - rotatedY * tiltSin;
        const finalY = rotatedX * tiltSin + rotatedY * tiltCos;
        const finalZ = rotatedZ;

        // Convert to screen coordinates relative to main sphere
        const orbitalX = sphereX + finalX * radius;
        const orbitalY = sphereY + finalY * radius;
        const orbitalZ = finalZ * radius; // Z-depth for perspective

        // Apply perspective scaling based on Z-depth
        const perspectiveFactor = (orbitalZ + radius * 2) / (radius * 4); // 0 to 1 range
        const perspectiveScale = 0.5 + perspectiveFactor * 1.0; // Scale between 0.5x and 1.5x
        const perspectiveAlpha = 0.3 + perspectiveFactor * 0.7; // Fade when behind sphere

        // Update orbital dot position
        orbitalDot.x = orbitalX;
        orbitalDot.y = orbitalY;
        orbitalDot.z = orbitalZ;

        // Render orbital BIG dot as sphere made of small random dots
        const miniRadius = orbitalDot.size * 4.5 * perspectiveScale;
        const spinAngle =
          time * orbitalDot.spinSpeed * orbitalDot.spinDirection; // Use varied spin parameters

        // Use existing bigDotStaticSizes/Positions arrays, offset by planetDots length
        const staticIndex = planetDots.length + oDx;
        if (!bigDotStaticSizes[staticIndex]) {
          bigDotStaticSizes[staticIndex] = [];
          bigDotStaticPositions[staticIndex] = [];

          const numDots = 80; // Reverted dots for orbital BIG dots
          for (let i = 0; i < numDots; i++) {
            const theta = Math.acos(1 - 2 * Math.random());
            const phi = Math.random() * 2 * Math.PI;
            const y = Math.cos(theta);
            const r = Math.sin(theta);

            if (Math.abs(y) > 0.85 || r < 0.15) {
              i--;
              continue;
            }

            const baseX = r * Math.cos(phi);
            const baseZ = r * Math.sin(phi);

            bigDotStaticSizes[staticIndex][i] =
              miniRadius * (0.015 + Math.random() * 0.055);
            bigDotStaticPositions[staticIndex][i] = { baseX, baseZ, y };
          }
        }

        // Render dots with cylindrical rotation
        for (let i = 0; i < bigDotStaticPositions[staticIndex].length; i++) {
          const { baseX, baseZ, y } = bigDotStaticPositions[staticIndex][i];

          const rotatedX =
            baseX * Math.cos(spinAngle) - baseZ * Math.sin(spinAngle);
          const rotatedZ =
            baseX * Math.sin(spinAngle) + baseZ * Math.cos(spinAngle);

          const dotX = orbitalX + rotatedX * miniRadius;
          const dotY = orbitalY + y * miniRadius;
          const randSize = bigDotStaticSizes[staticIndex][i];

          const depth = (rotatedZ + 1) / 2;
          const alpha = (0.5 + depth * 0.5) * perspectiveAlpha; // Brighter base alpha (was 0.3 + 0.7)

          ctx.beginPath();
          ctx.arc(dotX, dotY, randSize * perspectiveScale, 0, Math.PI * 2); // Apply perspective scaling
          // ctx.fillStyle = `rgba(80, 70, 50, ${alpha})`; // Original: Darker version of main sphere color
          // 🔵 BLUE - Orbital big dots (large dots with moons orbiting around them)
          // TESTING: Make orbital big dots BRIGHT BLUE to identify them
          const redShade = 0; // No red
          const greenShade = 0; // No green
          const blueShade = 255; // Bright blue
          ctx.fillStyle = `rgba(${redShade}, ${greenShade}, ${blueShade}, ${alpha})`;
          ctx.fill();
        }

        // 🟢 GREEN - Orbital big dot moons (small dots orbiting around blue dots)
        // Render moons for this orbital BIG dot
        if (orbitalDot.moons) {
          // Check if this is the biggest BLUE dot (last in array)
          const isBiggestBlueDot = oDx === orbitalBigDots.length - 1;

          for (let m = 0; m < orbitalDot.moons.count; m++) {
            const moonAngle =
              time * orbitalDot.moons.speeds[m] + orbitalDot.moons.angles[m];
            const moonDistance = orbitalDot.moons.distances[m] * miniRadius;
            const moonTilt = orbitalDot.moons.tilts[m];

            // For biggest blue dot: make horizontal moon (second moon) orbit counter to spin direction
            let adjustedMoonAngle = moonAngle;
            if (isBiggestBlueDot && m === 1) {
              // Second moon is horizontal (tilt = 0)
              // Counter-rotate: if dot spins clockwise (+1), moon orbits counter-clockwise
              adjustedMoonAngle = moonAngle * -orbitalDot.spinDirection;
            }

            // Create moon orbit with different tilt
            const moonX =
              orbitalX +
              Math.cos(adjustedMoonAngle) * moonDistance * Math.cos(moonTilt);
            const moonY =
              orbitalY +
              Math.sin(adjustedMoonAngle) * moonDistance * Math.sin(moonTilt);

            ctx.beginPath();
            const moonSize = isBiggestBlueDot
              ? miniRadius * 0.12 * perspectiveScale
              : miniRadius * 0.08 * perspectiveScale; // Bigger moons for biggest blue dot
            ctx.arc(moonX, moonY, moonSize, 0, Math.PI * 2);

            // 🟡 YELLOW - Orbital big dot moons (small dots orbiting around blue orbital big dots)
            // Make moon colors same as their parent BIG dots with fade-out - BRIGHTER!
            if (isBiggestBlueDot) {
              ctx.fillStyle = `rgba(255, 255, 0, ${
                0.95 * perspectiveAlpha * 0.9
              })`; // TESTING: Yellow for biggest orbital big dot moons
            } else {
              ctx.fillStyle = `rgba(255, 255, 0, ${
                0.95 * perspectiveAlpha * 0.9
              })`; // TESTING: Yellow for orbital big dot moons
            }
            ctx.fill();
          }
        }

        orbitalDot.x = orbitalX;
        orbitalDot.y = orbitalY;
      });

      // Remove visible border around sphere
      // (delete or comment out the border drawing code)

      // 🟣 PURPLE - Name moons (dots orbiting around the name text "RAITIS" and "KRASLOVSKIS")
      // Add 2 moons orbiting around each name separately - "RAITIS" and "KRASLOVSKIS"

      // RAITIS moon (first name) - positioned around first line
      const raitisX = 80; // Approximate center of "RAITIS" text
      const raitisY = 60; // Y position of first line
      const raitisOrbitAngle = time * 0.8; // Faster orbit for RAITIS

      // More vertical orbit that goes front/back and moves along the name length
      const raitisOrbitRadiusX = 25; // Horizontal orbit radius (smaller for more vertical feel)
      const raitisOrbitRadiusY = 40; // Vertical orbit radius (larger for vertical movement)
      const raitisNameMovement = Math.sin(time * 0.3) * 30; // Moves 30px along name length

      const raitisMoonX =
        raitisX +
        raitisNameMovement +
        Math.cos(raitisOrbitAngle) * raitisOrbitRadiusX;
      const raitisMoonY =
        raitisY + Math.sin(raitisOrbitAngle) * raitisOrbitRadiusY;

      // Depth calculation for front/back effect
      const raitisDepth = (Math.sin(raitisOrbitAngle) + 1) / 2; // 0 to 1
      const raitisAlpha = 0.4 + raitisDepth * 0.6; // Brighter when in front
      const raitisSize = 2.5 + raitisDepth * 1.5; // Bigger when in front (2.5-4px)

      ctx.beginPath();
      ctx.arc(raitisMoonX, raitisMoonY, raitisSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 150, 200, ${raitisAlpha})`; // Blue for RAITIS
      ctx.fill();

      // Glow for RAITIS moon
      ctx.beginPath();
      ctx.arc(raitisMoonX, raitisMoonY, raitisSize * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100, 150, 200, ${raitisAlpha * 0.3})`;
      ctx.fill();

      // KRASLOVSKIS moon (last name) - positioned around second line
      const kraslovskisX = 120; // Approximate center of "KRASLOVSKIS" text (longer name)
      const kraslovskisY = 110; // Y position of second line
      const kraslovskisOrbitAngle = time * 0.5; // Slower orbit for KRASLOVSKIS

      // Different orbit characteristics for last name
      const kraslovskisOrbitRadiusX = 35; // Larger horizontal radius for longer name
      const kraslovskisOrbitRadiusY = 50; // Larger vertical radius
      const kraslovskisNameMovement = Math.cos(time * 0.2) * 50; // Moves 50px along longer name

      const kraslovskisMoonX =
        kraslovskisX +
        kraslovskisNameMovement +
        Math.cos(kraslovskisOrbitAngle) * kraslovskisOrbitRadiusX;
      const kraslovskisMoonY =
        kraslovskisY +
        Math.sin(kraslovskisOrbitAngle) * kraslovskisOrbitRadiusY;

      // Depth calculation for front/back effect
      const kraslovskisDepth = (Math.sin(kraslovskisOrbitAngle) + 1) / 2; // 0 to 1
      const kraslovskisAlpha = 0.3 + kraslovskisDepth * 0.7; // Different alpha range
      const kraslovskisSize = 3 + kraslovskisDepth * 2; // Bigger moon (3-5px)

      ctx.beginPath();
      ctx.arc(
        kraslovskisMoonX,
        kraslovskisMoonY,
        kraslovskisSize,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(160, 120, 180, ${kraslovskisAlpha})`; // Purple for KRASLOVSKIS
      ctx.fill();

      // Glow for KRASLOVSKIS moon
      ctx.beginPath();
      ctx.arc(
        kraslovskisMoonX,
        kraslovskisMoonY,
        kraslovskisSize * 2.2,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(160, 120, 180, ${kraslovskisAlpha * 0.25})`;
      ctx.fill();

      // Render sphere glow using appropriate helper function
      if (isMobile) {
        renderMobileSphereGlow(ctx, sphereX, sphereY, radius);
      } else {
        renderSphereGlow(ctx, sphereX, sphereY, radius);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentSection, device.isMobile, device.hardwareConcurrency]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className='fixed inset-0 w-full h-full pointer-events-none z-0'
        style={styles.canvas.background}
      />
    </>
  );
};

BackgroundElements.displayName = 'BackgroundElements';

export default BackgroundElements;
