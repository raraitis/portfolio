'use client';

import { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { animationStore } from '@/stores/AnimationStore';
import { styles } from '../../styles';
import { leftColumn } from '@/styles/typography';

const BackgroundElements = observer(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');

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
      moons?: { count: number; offsets: number[] };
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

    // Generate grid pattern that covers sphere better
    const gridResolution = 28;
    const step = 2 / (gridResolution - 1);

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
    // Create a few big planet dots with random displacement and orbital parameters
    const planetCount = Math.max(2, Math.floor(totalDots / 40));
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
    }[] = [];
    for (let p = 0; p < planetCount; p++) {
      const angle = Math.random() * Math.PI * 2;
      const baseRadius = 0.4 + Math.random() * 0.8; // Larger orbit radius for more visible movement (0.4 - 1.2)
      planetDots.push({
        x: Math.cos(angle) * baseRadius,
        y: Math.sin(angle) * baseRadius,
        size: 2.5 + Math.random() * 2.5,
        angle,
        baseRadius,
        orbitSpeed: 0.04 + Math.random() * 0.08, // Very slow orbital speeds for subtle movement (0.04 - 0.12)
        orbitTilt: Math.random() * Math.PI * 0.8, // Random tilt from horizontal to near-vertical
        orbitEccentricity: 0.7 + Math.random() * 0.3, // Slight elliptical orbits
        spinSpeed: 0.1 + Math.random() * 0.4, // Varied spin speeds (0.1 - 0.5)
        spinDirection: Math.random() < 0.5 ? 1 : -1, // Random spin direction
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
    const orbitalBigDotCount = 4 + Math.floor(Math.random() * 3); // 4-6 orbital BIG dots (reverted)
    for (let o = 0; o < orbitalBigDotCount; o++) {
      // Add moons to ALL orbital BIG dots (100% chance)
      const hasMoons = true; // All orbital BIG dots will have moons
      const moons = hasMoons
        ? {
            count: 2 + Math.floor(Math.random() * 3), // 2-4 moons per BIG dot (reverted)
            angles: [] as number[],
            distances: [] as number[],
            speeds: [] as number[],
            tilts: [] as number[],
          }
        : undefined;

      if (moons) {
        for (let m = 0; m < moons.count; m++) {
          moons.angles.push(Math.random() * Math.PI * 2);
          moons.distances.push(1.2 + Math.random() * 0.8); // Increased moon distance from BIG dot (1.2-2.0)
          moons.speeds.push(0.6 + Math.random() * 1.0); // Reverted moon orbital speed (0.6-1.6)
          moons.tilts.push(Math.random() * Math.PI); // Different orbital planes for moons
        }
      }

      orbitalBigDots.push({
        x: 0,
        y: 0,
        z: 0, // Initialize Z coordinate
        size: 3 + Math.random() * 3, // Slightly larger than regular BIG dots
        orbitRadius: 1.4 + Math.random() * 0.6, // Moon orbit distance (1.4-2.0 times sphere radius)
        orbitSpeed: 0.08 + Math.random() * 0.12, // Reduced orbital BIG dots speed (0.08-0.2)
        orbitAngle: Math.random() * Math.PI * 2, // Random starting angle
        orbitTilt: Math.random() * Math.PI, // Orbital plane tilt (0 = horizontal, π/2 = vertical)
        orbitRotation: Math.random() * Math.PI * 2, // Rotation of orbital plane around Y-axis
        orbitInclination: Math.random() * Math.PI, // Inclination of orbital plane for full 3D
        orbitDirection: Math.random() < 0.5 ? 1 : -1, // Random direction
        spinSpeed: 0.15 + Math.random() * 0.5, // Varied spin speeds (0.15 - 0.65)
        spinDirection: Math.random() < 0.5 ? 1 : -1, // Random spin direction
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
        if (distance <= 0.9) {
          // Keep dots slightly inside sphere
          const size = 1.5 + Math.random() * 3; // Size between 1.5-4.5

          // Add small random offset for organic feel
          const baseOffsetX = (Math.random() - 0.5) * 0.1; // Small random offset
          const baseOffsetY = (Math.random() - 0.5) * 0.1;

          const moons = moonDotIndices.includes(dotIndex)
            ? {
                count: Math.random() < 0.5 ? 1 : 2,
                offsets: [
                  Math.random() * Math.PI * 2,
                  Math.random() * Math.PI * 2,
                ],
              }
            : undefined;
          const orbitsPlanet = planetDotIndices.includes(dotIndex)
            ? {
                planetIndex: dotIndex % planetCount,
                orbitRadius: 0.18 + Math.random() * 0.12,
                orbitOffset: Math.random() * Math.PI * 2,
              }
            : undefined;
          const orbitsMain = orbitingMoonDotIndices.includes(dotIndex)
            ? {
                orbitRadius: 0.3 + Math.random() * 0.4, // Orbit radius around main sphere center
                orbitSpeed: 0.05 + Math.random() * 0.1, // Slow orbital speed
                orbitOffset: Math.random() * Math.PI * 2, // Random starting position
                orbitTilt: Math.random() * Math.PI * 0.6, // Random orbital tilt
              }
            : undefined;
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.008; // Slow, organic movement

      // Sphere size - responsive and bigger
      const baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.62; // Increased from 0.44 to make sphere bigger overall

      // 3D orbital motion - elliptical orbit with depth
      const centerX = canvas.width * 0.5; // Center of screen
      const centerY = canvas.height * 0.5;

      // Orbital parameters for 3D effect
      const orbitRadiusX = canvas.width * 0.4; // Horizontal radius
      const orbitRadiusZ = canvas.width * 0.25; // Depth radius (smaller for elliptical orbit)
      const orbitAngle = time * 0.3; // Reduced main sphere orbit speed (was 0.5)

      // Calculate 3D orbital position - static on ME section
      let sphereX, sphereZ, sphereY;

      if (currentSection === 'me') {
        // ME section: Static sphere position (center of screen, spinning only)
        sphereX = centerX;
        sphereZ = 0; // No depth movement
        sphereY = centerY;
      } else {
        // Other sections: Normal orbital motion
        sphereX = centerX + Math.cos(orbitAngle) * orbitRadiusX;
        sphereZ = Math.sin(orbitAngle) * orbitRadiusZ; // Z-depth (forward/backward)
        // Add vertical oscillation for cylindrical effect
        const verticalOscillation = Math.sin(time * 0.5) * 32; // 32px up/down, slow oscillation
        // Y position varies with orbit and oscillation
        sphereY =
          centerY + Math.sin(orbitAngle * 0.5) * 20 + verticalOscillation; // Slight vertical wobble
      }

      // Perspective effect based on Z-depth
      // When sphereZ > 0, sphere is coming toward us; when < 0, going away
      const maxZ = orbitRadiusZ;
      const perspectiveFactor = (sphereZ + maxZ) / (2 * maxZ); // 0 to 1 range
      const perspectiveScale = 0.4 + perspectiveFactor * 1.2; // Scale between 0.4x and 1.6x - much more dramatic

      // Apply perspective to sphere size
      const perspectiveRadius =
        (baseRadius + Math.sin(time * 0.5) * 16) * perspectiveScale;
      const radius = perspectiveRadius;

      // Update store for interactions
      animationStore.updateSpherePosition({ x: sphereX, y: sphereY });

      // Draw Saturn-like sphere with dotted atmospheric texture
      ctx.save();

      // Create slightly irregular sphere shape using multiple arcs
      ctx.beginPath();

      // Draw irregular circular path for more organic feel
      const irregularRadius = (angle: number) => {
        const baseVariation = Math.sin(angle * 6) * 0.05; // 6 subtle bumps
        const detailVariation = Math.sin(angle * 18) * 0.02; // Fine details
        const timeVariation = Math.sin(time * 2 + angle * 3) * 0.03; // Gentle breathing
        // Extended boundary for softer clipping (1.15x larger than visible sphere)
        return (
          radius * 1.15 * (1 + baseVariation + detailVariation + timeVariation)
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
        // Fluid pulse if firing
        let pulse = 0;
        if (dot._staticDot && dot._staticDot._firing) {
          pulse = Math.sin(time * 12) * 2;
        }
        const intensity = 0.5 * dot.depth + 0.3;
        // All dots use the same color
        ctx.fillStyle = `rgba(120, 110, 80, ${intensity})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size + pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Neurolink-style shooting lines between dots
      const firingChance = 0.03; // 3% chance per frame for each connection
      const maxConnections = 3; // Fewer connections per frame for minimal effect
      let connectionCount = 0;
      for (
        let i = 0;
        i < dots.length && connectionCount < maxConnections;
        i++
      ) {
        const dot1 = dots[i];
        // Find the two closest neighbors
        let closest = [],
          minDist = [],
          idx = [];
        for (let j = 0; j < dots.length; j++) {
          if (i === j) continue;
          const dot2 = dots[j];
          const dx = dot2.x - dot1.x;
          const dy = dot2.y - dot1.y;
          const dist = dx * dx + dy * dy;
          if (closest.length < 2) {
            closest.push(dot2);
            minDist.push(dist);
            idx.push(j);
          } else {
            const maxIdx: number = minDist[0] > minDist[1] ? 0 : 1;
            if (dist < minDist[maxIdx]) {
              closest[maxIdx] = dot2;
              minDist[maxIdx] = dist;
              idx[maxIdx] = j;
            }
          }
        }
        for (
          let k = 0;
          k < closest.length && connectionCount < maxConnections;
          k++
        ) {
          if (Math.random() < firingChance) {
            connectionCount++;
            const dot2 = closest[k];
            const avgDepth = (dot1.depth + dot2.depth) / 2;
            const electricIntensity = 1.0;
            ctx.strokeStyle = `rgba(80, 200, 255, ${
              electricIntensity * avgDepth
            })`;
            ctx.lineWidth = 2.5 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(dot1.x, dot1.y);
            const midX = (dot1.x + dot2.x) / 2 + (Math.random() - 0.5) * 18;
            const midY = (dot1.y + dot2.y) / 2 + (Math.random() - 0.5) * 18;
            ctx.quadraticCurveTo(midX, midY, dot2.x, dot2.y);
            ctx.stroke();
          }
        }
      }

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

        // Create elliptical orbit with tilt
        const ellipseX = Math.cos(planetAngle) * planet.baseRadius;
        const ellipseY =
          Math.sin(planetAngle) * planet.baseRadius * planet.orbitEccentricity;

        // Apply orbital tilt (rotation around Z-axis)
        const tiltCos = Math.cos(planet.orbitTilt);
        const tiltSin = Math.sin(planet.orbitTilt);
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
          const depth = (rotatedZ + 1) / 2; // Normalize to 0-1
          const alpha = 0.3 + depth * 0.7; // Front dots more opaque

          ctx.beginPath();
          ctx.arc(dotX, dotY, randSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(80, 70, 50, ${alpha})`; // Darker version of main sphere color
          ctx.fill();
        }
        // No connections or moons for BIG dots—just render the small dot pattern
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
        // Draw moons
        if (dot._staticDot && dot._staticDot.moons) {
          // Oscillation factor for vertical shift
          const oscillation = Math.sin(time * 0.5 + i * 0.2) * 8;
          for (let m = 0; m < dot._staticDot.moons.count; m++) {
            const moonAngle =
              time * (0.8 + m * 0.5) + dot._staticDot.moons.offsets[m];
            const moonRadius = dot.size * 2.5 + m * 6;
            const moonX = dot.x + Math.cos(moonAngle) * moonRadius;
            const moonY =
              dot.y + Math.sin(moonAngle) * moonRadius + oscillation;
            ctx.beginPath();
            ctx.arc(moonX, moonY, dot.size * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(120, 110, 80, 0.7)`;
            ctx.fill();
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
          const alpha = (0.3 + depth * 0.7) * perspectiveAlpha; // Apply 3D perspective alpha

          ctx.beginPath();
          ctx.arc(dotX, dotY, randSize * perspectiveScale, 0, Math.PI * 2); // Apply perspective scaling
          ctx.fillStyle = `rgba(80, 70, 50, ${alpha})`;
          ctx.fill();
        }

        // Render moons for this orbital BIG dot
        if (orbitalDot.moons) {
          for (let m = 0; m < orbitalDot.moons.count; m++) {
            const moonAngle =
              time * orbitalDot.moons.speeds[m] + orbitalDot.moons.angles[m];
            const moonDistance = orbitalDot.moons.distances[m] * miniRadius;
            const moonTilt = orbitalDot.moons.tilts[m];

            // Create moon orbit with different tilt
            const moonX =
              orbitalX +
              Math.cos(moonAngle) * moonDistance * Math.cos(moonTilt);
            const moonY =
              orbitalY +
              Math.sin(moonAngle) * moonDistance * Math.sin(moonTilt);

            ctx.beginPath();
            ctx.arc(
              moonX,
              moonY,
              miniRadius * 0.08 * perspectiveScale,
              0,
              Math.PI * 2
            ); // Smaller moons for orbital BIG dots
            ctx.fillStyle = `rgba(120, 110, 90, ${0.9 * perspectiveAlpha})`; // Apply perspective alpha to moons
            ctx.fill();
          }
        }

        orbitalDot.x = orbitalX;
        orbitalDot.y = orbitalY;
      });

      // Remove visible border around sphere
      // (delete or comment out the border drawing code)

      // Add outer atmospheric glow - increased visibility
      const glowGradient = ctx.createRadialGradient(
        sphereX,
        sphereY,
        radius * 0.8,
        sphereX,
        sphereY,
        radius * 1.3
      );
      glowGradient.addColorStop(0, 'rgba(160, 160, 160, 0.2)'); // Grey glow
      glowGradient.addColorStop(1, 'rgba(160, 160, 160, 0)');

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, radius * 1.3, 0, Math.PI * 2);
      ctx.fill();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [currentSection]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className='fixed inset-0 w-full h-full pointer-events-none z-0'
        style={styles.canvas.background}
      />
    </>
  );
});

BackgroundElements.displayName = 'BackgroundElements';

export default BackgroundElements;
