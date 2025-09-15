// Simple background rendering helper - extracted from BackgroundElements.tsx
// This handles just the gradient background and dot pattern

import { SphereInfo } from '../types/backgroundTypes';

export const renderBackgroundPattern = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number
) => {
  // Add futuristic gradient background
  const bgGradient = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.3,
    0, // Start: upper center
    canvas.width * 0.5,
    canvas.height * 0.7,
    canvas.width * 0.8 // End: slightly down, wide spread
  );
  bgGradient.addColorStop(0, 'rgba(245, 250, 255, 0.03)'); // Very subtle blue-white center
  bgGradient.addColorStop(0.3, 'rgba(230, 240, 250, 0.02)'); // Light blue-grey
  bgGradient.addColorStop(0.6, 'rgba(220, 225, 235, 0.015)'); // Subtle grey-blue
  bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.005)'); // Almost transparent white edges

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add subtle dot pattern overlay
  const dotSpacing = 60; // Space between dots
  const dotSize = 0.8; // Small dots
  const rows = Math.ceil(canvas.height / dotSpacing);
  const cols = Math.ceil(canvas.width / dotSpacing);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Offset every other row for hexagonal-like pattern
      const offsetX = (row % 2) * (dotSpacing * 0.5);
      const x = col * dotSpacing + offsetX;
      const y = row * dotSpacing;

      // Skip if outside canvas
      if (x > canvas.width || y > canvas.height) continue;

      // Add subtle animation to dots
      const dotPhase = time * 0.5 + row * 0.1 + col * 0.15;
      const dotAlpha = 0.08 + Math.sin(dotPhase) * 0.03; // Gentle pulsing (0.05-0.11)

      // Distance-based fading (dots fade toward edges)
      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;
      const distanceFromCenter = Math.sqrt(
        (x - centerX) ** 2 + (y - centerY) ** 2
      );
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const fadeFactor = 1 - (distanceFromCenter / maxDistance) * 0.7; // Fade 70% toward edges

      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 220, ${dotAlpha * fadeFactor})`; // Very subtle blue-grey dots
      ctx.fill();
    }
  }
};

// Sphere calculation and rendering helper
export const calculateSpherePositionAndSize = (
  canvas: HTMLCanvasElement,
  time: number,
  currentSection: 'home' | 'me'
): SphereInfo => {
  // Sphere size - responsive and bigger
  // Base radius - bigger on ME section
  let baseRadius;
  if (currentSection === 'me') {
    // ME section: Much bigger sphere (about 50% of screen width)
    baseRadius = Math.min(window.innerWidth, window.innerHeight) * 1.2; // Much bigger than 0.62
  } else {
    // HOME section: Normal size
    baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.62;
  }

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
    // ME section: Static sphere position on LEFT side (about 25% from left edge)
    sphereX = canvas.width * 0.25; // Left side positioning
    sphereZ = 0; // No depth movement
    sphereY = centerY; // Vertically centered
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

  return { x: sphereX, y: sphereY, z: sphereZ, radius };
};

export const renderSphereGlow = (
  ctx: CanvasRenderingContext2D,
  sphereX: number,
  sphereY: number,
  radius: number
) => {
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
};