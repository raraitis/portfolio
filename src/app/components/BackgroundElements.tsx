'use client';

import { useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { animationStore } from '@/stores/AnimationStore';
import { styles } from '../../styles';

const BackgroundElements = observer(() => {
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

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.008; // Slow, organic movement

      // Sphere size - responsive and subtle
      const baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.15;
      const radius = baseRadius + Math.sin(time * 0.5) * 10; // Subtle pulsing

      // Organic orbital movement - like it's floating under the surface
      const centerX = canvas.width * 0.6;
      const centerY = canvas.height * 0.45;
      const orbitX = 150;
      const orbitY = 80;
      
      const sphereX = centerX + Math.cos(time * 0.4) * orbitX + Math.sin(time * 0.7) * 25;
      const sphereY = centerY + Math.sin(time * 0.3) * orbitY + Math.cos(time * 0.9) * 15;

      // Update store for interactions
      animationStore.updateSpherePosition({ x: sphereX, y: sphereY });

      // Create 3D sphere effect with gradients
      const gradient = ctx.createRadialGradient(
        sphereX - radius * 0.3, // Light source offset
        sphereY - radius * 0.3,
        0,
        sphereX,
        sphereY,
        radius
      );

      // Saturn-themed sphere colors - subtle but visible under the background
      gradient.addColorStop(0, 'rgba(220, 200, 170, 0.15)'); // Light highlight
      gradient.addColorStop(0.3, 'rgba(180, 160, 130, 0.12)'); // Mid tone
      gradient.addColorStop(0.7, 'rgba(140, 120, 90, 0.08)'); // Dark tone
      gradient.addColorStop(1, 'rgba(100, 80, 60, 0.04)'); // Edge shadow

      // Draw the sphere
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Optional: Add a subtle rim light for more 3D effect
      const rimGradient = ctx.createRadialGradient(
        sphereX,
        sphereY,
        radius * 0.85,
        sphereX,
        sphereY,
        radius
      );
      
      rimGradient.addColorStop(0, 'rgba(200, 180, 140, 0)');
      rimGradient.addColorStop(1, 'rgba(200, 180, 140, 0.06)');
      
      ctx.fillStyle = rimGradient;
      ctx.beginPath();
      ctx.arc(sphereX, sphereY, radius, 0, Math.PI * 2);
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={styles.canvas.background}
    />
  );
});

BackgroundElements.displayName = 'BackgroundElements';

export default BackgroundElements;
