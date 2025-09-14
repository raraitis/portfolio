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

      // Sphere size - responsive and bigger
      const baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.24; // Doubled from 0.12
      const radius = baseRadius + Math.sin(time * 0.5) * 16; // Doubled pulsing too

      // Full screen orbital movement - wide sweeping patterns
      const centerX = canvas.width * 0.5; // Center of screen
      const centerY = canvas.height * 0.5;
      
      // Large orbital patterns that cover the entire viewport
      const orbitX = canvas.width * 0.35; // 35% of screen width
      const orbitY = canvas.height * 0.25; // 25% of screen height
      
      // Complex orbital pattern - figure-8 across entire screen
      const sphereX = centerX + 
        Math.cos(time * 0.3) * orbitX + 
        Math.sin(time * 0.7) * (canvas.width * 0.15) +
        Math.cos(time * 1.1) * 40; // Small variations
        
      const sphereY = centerY + 
        Math.sin(time * 0.25) * orbitY + 
        Math.cos(time * 0.85) * (canvas.height * 0.1) +
        Math.sin(time * 1.3) * 30; // Small variations

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
        return radius * (1 + baseVariation + detailVariation + timeVariation);
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
      
      // Generate atmospheric dots/particles within sphere
      const dotCount = Math.floor(radius * 0.8); // Density based on size
      
      for (let i = 0; i < dotCount; i++) {
        // Random position within sphere
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        const dotX = sphereX + Math.cos(angle) * distance;
        const dotY = sphereY + Math.sin(angle) * distance;
        
        // Distance from center for depth effect
        const centerDist = Math.sqrt((dotX - sphereX) ** 2 + (dotY - sphereY) ** 2);
        const depthFactor = 1 - (centerDist / radius);
        
        // Saturn atmospheric colors with depth-based intensity - increased visibility
        const colors = [
          `rgba(255, 220, 150, ${0.8 * depthFactor})`, // Golden yellow - more visible
          `rgba(245, 200, 130, ${0.7 * depthFactor})`, // Warm orange
          `rgba(230, 210, 160, ${0.6 * depthFactor})`, // Creamy white
          `rgba(200, 170, 110, ${0.5 * depthFactor})`, // Warm brown
          `rgba(240, 190, 120, ${0.8 * depthFactor})`, // Saturn gold
        ];
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const dotSize = (Math.random() * 6 + 2) * depthFactor; // Bigger dots: 2-8px range
        
        // Add slight animation to dots - ensure always positive
        const animatedSize = Math.max(0.1, dotSize + Math.sin(time * 3 + i * 0.1) * 0.2);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, animatedSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
      
      // Add outer atmospheric glow - increased visibility
      const glowGradient = ctx.createRadialGradient(
        sphereX, sphereY, radius * 0.8,
        sphereX, sphereY, radius * 1.3
      );
      glowGradient.addColorStop(0, 'rgba(255, 220, 150, 0.2)'); // More visible glow
      glowGradient.addColorStop(1, 'rgba(255, 220, 150, 0)');
      
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
