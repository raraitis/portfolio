'use client';

import { useEffect, useRef } from 'react';

export default function BackgroundElements() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let time = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Sphere properties
    const sphereRadius = Math.min(window.innerWidth, window.innerHeight) * 0.3; // 60% screen size

    // Dot grid properties
    const gridSpacing = 25; // Reduced from 40 to make more dots
    const dots: {
      x: number;
      y: number;
      originalX: number;
      originalY: number;
    }[] = [];

    // Create dot grid
    for (let x = 0; x < canvas.width; x += gridSpacing) {
      for (let y = 0; y < canvas.height; y += gridSpacing) {
        dots.push({ x, y, originalX: x, originalY: y });
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time += 0.01;

      // Moving sphere center (slow orbital motion)
      const sphereX = canvas.width * 0.5 + Math.cos(time * 0.5) * 200;
      const sphereY = canvas.height * 0.5 + Math.sin(time * 0.3) * 150;

      // Draw background gradient
      const gradient = ctx.createRadialGradient(
        sphereX,
        sphereY,
        0,
        sphereX,
        sphereY,
        sphereRadius * 2
      );
      gradient.addColorStop(0, 'rgba(245, 238, 231, 0.1)');
      gradient.addColorStop(0.5, 'rgba(240, 235, 226, 0.05)');
      gradient.addColorStop(1, 'rgba(245, 240, 232, 0.02)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw dots affected by sphere gravity
      dots.forEach((dot) => {
        const dx = dot.originalX - sphereX;
        const dy = dot.originalY - sphereY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Gravity effect - stronger closer to sphere
        const gravity = Math.max(0, 1 - distance / sphereRadius);
        const force = gravity * gravity * 20;

        // Calculate displaced position
        if (distance > 0) {
          dot.x = dot.originalX - (dx / distance) * force;
          dot.y = dot.originalY - (dy / distance) * force;
        }

        // Color intensity based on gravity
        const alpha = 0.15 + gravity * 0.35; // Slightly reduced opacity
        const size = 0.5 + gravity * 1.5; // Smaller base size and max size

        ctx.fillStyle = `rgba(139, 125, 107, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw the sphere with subtle glow
      const sphereGradient = ctx.createRadialGradient(
        sphereX,
        sphereY,
        0,
        sphereX,
        sphereY,
        sphereRadius
      );
      sphereGradient.addColorStop(0, 'rgba(139, 125, 107, 0.03)');
      sphereGradient.addColorStop(0.7, 'rgba(139, 125, 107, 0.01)');
      sphereGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = sphereGradient;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, sphereRadius, 0, Math.PI * 2);
      ctx.fill();

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <>
      {/* Static gradient background */}
      <div className='fixed inset-0 overflow-hidden'>
        <div
          className='absolute inset-0'
          style={{
            background: `linear-gradient(135deg, #f5f0e8 0%, #f0ebe2 25%, #ede8dc 50%, #e8e3d6 75%, #e3ded0 100%)`,
          }}
        />
      </div>

      {/* Animated canvas */}
      <canvas
        ref={canvasRef}
        className='fixed inset-0 pointer-events-none z-0'
        style={{ opacity: 0.8 }}
      />

      {/* Visual frame border */}
      <div className='fixed inset-0 pointer-events-none z-30'>
        <div
          className='absolute inset-5 rounded-lg'
          style={{
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#a09280',
            opacity: 0.4,
          }}
        />
      </div>
    </>
  );
}
