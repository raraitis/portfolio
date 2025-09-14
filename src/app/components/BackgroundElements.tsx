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

    const staticDots: Array<{
      x: number;
      y: number;
      originalX: number;
      originalY: number;
      size: number;
      intensity: number;
      flickerPhase: number;
    }> = [];

    const createStaticPattern = () => {
      staticDots.length = 0;
      const density = 1.2; // Increase density for better visibility

      for (let i = 0; i < (canvas.width * canvas.height * density) / 10000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        staticDots.push({
          x,
          y,
          originalX: x,
          originalY: y,
          size: Math.random() * 2 + 0.5,
          intensity: Math.random() * 0.7 + 0.3,
          flickerPhase: Math.random() * Math.PI * 2,
        });
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      createStaticPattern();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const getSphereRadius = () => {
      return Math.min(window.innerWidth, window.innerHeight) * 0.3 * animationStore.background.intensity;
    };

    createStaticPattern();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.01;

      const sphereRadius = getSphereRadius();
      const baseIntensity = animationStore.background.intensity;

      const centerX = canvas.width * 0.7;
      const centerY = canvas.height * 0.4;
      const orbitRadius = 120;
      const sphereX = centerX + Math.cos(time * 0.3) * orbitRadius + Math.sin(time * 0.7) * 30;
      const sphereY = centerY + Math.sin(time * 0.2) * orbitRadius * 0.6 + Math.cos(time * 0.9) * 20;

      animationStore.updateSpherePosition({ x: sphereX, y: sphereY });

      staticDots.forEach((dot) => {
        const dx = dot.originalX - sphereX;
        const dy = dot.originalY - sphereY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // SPHERE UNDER FABRIC EFFECT - fabric particles get pushed UP by invisible sphere
        const sphereInfluenceRadius = sphereRadius * 2.0;
        let displacementX = 0;
        let displacementY = 0;

        if (distance < sphereInfluenceRadius && distance > 0) {
          // Calculate how much the sphere pushes the fabric up
          const influence = 1 - (distance / sphereInfluenceRadius);
          const pushStrength = 40 * Math.pow(influence, 1.2); // Stronger near center
          
          // Push particles AWAY from sphere center (fabric being pushed up)
          const angle = Math.atan2(dy, dx);
          displacementX = Math.cos(angle) * pushStrength;
          displacementY = Math.sin(angle) * pushStrength;
        }

        // Apply fabric displacement with subtle organic movement
        dot.x = dot.originalX + displacementX + Math.sin(time * 1.8 + dot.flickerPhase) * 0.8;
        dot.y = dot.originalY + displacementY + Math.cos(time * 1.3 + dot.flickerPhase) * 0.8;

        // TV static flicker effect
        const flicker = Math.sin(time * 7 + dot.flickerPhase) * 0.25 + 0.75;
        const alpha = dot.intensity * baseIntensity * flicker * 0.7;

        ctx.fillStyle = `rgba(139, 125, 107, ${alpha})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
        ctx.fill();
      });

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
