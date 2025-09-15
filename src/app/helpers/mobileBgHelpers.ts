// Mobile-optimized background rendering helpers
// Improves dot quality and performance on iPhone/mobile devices

import { SphereInfo } from '../types/backgroundTypes';

// Mobile detection
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
};

// High-quality mobile background pattern renderer
export const renderMobileBackgroundPattern = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  time: number
) => {
  // Save context for quality improvements
  ctx.save();
  
  // Enable better rendering on mobile
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) {
    (ctx as any).imageSmoothingQuality = 'high';
  }
  
  // Add futuristic gradient background - same as desktop
  const bgGradient = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.3,
    0,
    canvas.width * 0.5,
    canvas.height * 0.7,
    canvas.width * 0.8
  );
  bgGradient.addColorStop(0, 'rgba(245, 250, 255, 0.03)');
  bgGradient.addColorStop(0.3, 'rgba(230, 240, 250, 0.02)');
  bgGradient.addColorStop(0.6, 'rgba(220, 225, 235, 0.015)');
  bgGradient.addColorStop(1, 'rgba(255, 255, 255, 0.005)');

  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // High-quality dot pattern for mobile
  const dotSpacing = 60;
  const dotSize = 1.2; // Slightly larger dots for better visibility on mobile
  const rows = Math.ceil(canvas.height / dotSpacing);
  const cols = Math.ceil(canvas.width / dotSpacing);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const offsetX = (row % 2) * (dotSpacing * 0.5);
      const x = col * dotSpacing + offsetX;
      const y = row * dotSpacing;

      if (x > canvas.width || y > canvas.height) continue;

      const dotPhase = time * 0.5 + row * 0.1 + col * 0.15;
      const dotAlpha = 0.12 + Math.sin(dotPhase) * 0.04; // Slightly more visible on mobile

      const centerX = canvas.width * 0.5;
      const centerY = canvas.height * 0.5;
      const distanceFromCenter = Math.sqrt(
        (x - centerX) ** 2 + (y - centerY) ** 2
      );
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const fadeFactor = 1 - (distanceFromCenter / maxDistance) * 0.7;

      // High-quality dot rendering for mobile
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 210, 220, ${dotAlpha * fadeFactor})`;
      
      // Add subtle shadow for better definition on mobile
      ctx.shadowColor = 'rgba(200, 210, 220, 0.1)';
      ctx.shadowBlur = 0.5;
      ctx.fill();
      
      // Clear shadow for next dot
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }
  
  ctx.restore();
};

// Mobile-optimized sphere calculation (same logic, better precision)
export const calculateMobileSpherePositionAndSize = (
  canvas: HTMLCanvasElement,
  time: number,
  currentSection: 'home' | 'me'
): SphereInfo => {
  // Use higher precision for mobile calculations
  const precisionTime = time;
  
  let baseRadius;
  if (currentSection === 'me') {
    baseRadius = Math.min(window.innerWidth, window.innerHeight) * 1.2;
  } else {
    baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.62;
  }

  const centerX = canvas.width * 0.5;
  const centerY = canvas.height * 0.5;

  const orbitRadiusX = canvas.width * 0.4;
  const orbitRadiusZ = canvas.width * 0.25;
  const orbitAngle = precisionTime * 0.3;

  let sphereX, sphereZ, sphereY;

  if (currentSection === 'me') {
    sphereX = canvas.width * 0.25;
    sphereZ = 0;
    sphereY = centerY;
  } else {
    sphereX = centerX + Math.cos(orbitAngle) * orbitRadiusX;
    sphereZ = Math.sin(orbitAngle) * orbitRadiusZ;
    const verticalOscillation = Math.sin(precisionTime * 0.5) * 32;
    sphereY = centerY + Math.sin(orbitAngle * 0.5) * 20 + verticalOscillation;
  }

  const maxZ = orbitRadiusZ;
  const perspectiveFactor = (sphereZ + maxZ) / (2 * maxZ);
  const perspectiveScale = 0.4 + perspectiveFactor * 1.2;

  const perspectiveRadius = (baseRadius + Math.sin(precisionTime * 0.5) * 16) * perspectiveScale;
  const radius = perspectiveRadius;

  return { x: sphereX, y: sphereY, z: sphereZ, radius };
};

// High-quality mobile sphere glow
export const renderMobileSphereGlow = (
  ctx: CanvasRenderingContext2D,
  sphereX: number,
  sphereY: number,
  radius: number
) => {
  ctx.save();
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) {
    (ctx as any).imageSmoothingQuality = 'high';
  }
  
  // Create higher-quality glow gradient for mobile
  const glowGradient = ctx.createRadialGradient(
    sphereX,
    sphereY,
    radius * 0.75, // Slightly tighter inner radius
    sphereX,
    sphereY,
    radius * 1.4   // Slightly larger outer radius for smoother falloff
  );
  glowGradient.addColorStop(0, 'rgba(160, 160, 160, 0.25)'); // Slightly more opaque center
  glowGradient.addColorStop(0.5, 'rgba(160, 160, 160, 0.12)'); // Add middle stop for smoother gradient
  glowGradient.addColorStop(1, 'rgba(160, 160, 160, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(sphereX, sphereY, radius * 1.4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
};

// Mobile canvas setup with proper pixel ratio handling
export const setupMobileCanvas = (
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
) => {
  const devicePixelRatio = window.devicePixelRatio || 1;
  const backingStoreRatio = 1; // Modern browsers
  const ratio = devicePixelRatio / backingStoreRatio;

  // Handle high-DPI displays properly
  if (devicePixelRatio !== backingStoreRatio) {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    canvas.width = oldWidth * ratio;
    canvas.height = oldHeight * ratio;

    canvas.style.width = oldWidth + 'px';
    canvas.style.height = oldHeight + 'px';

    ctx.scale(ratio, ratio);
  }

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) {
    (ctx as any).imageSmoothingQuality = 'high';
  }

  // Set better composite operation for smoother blending
  ctx.globalCompositeOperation = 'source-over';
};

// Frame rate optimization for mobile
export const getMobileFrameRate = (): number => {
  // Use 30fps for better battery life and smoother experience on mobile
  return 1000 / 30;
};