'use client'

import { useState, useEffect } from 'react';
import { styles, gradientOffsets } from '@/styles';
import { animationStore } from '@/stores/AnimationStore';

interface GradientLineProps {
  position?: 'left' | 'right';
  height?: string;
  width?: string;
}

const GradientLine = ({ 
  position = 'left',
  height = 'h-32 md:h-40 lg:h-56', // Responsive height: smaller on mobile
  width = 'w-1 md:w-1.5' // Responsive width: thinner on mobile
}: GradientLineProps) => {
  const [offsetX, setOffsetX] = useState<number>(gradientOffsets[position].mobile);
  const [gravitationalBend, setGravitationalBend] = useState(0);

  useEffect(() => {
    const updateOffset = () => {
      const width = window.innerWidth;
      const offsets = gradientOffsets[position];
      
      if (width >= 1024) { // lg breakpoint
        setOffsetX(offsets.desktop);
      } else if (width >= 768) { // md breakpoint  
        setOffsetX(offsets.tablet);
      } else {
        setOffsetX(offsets.mobile);
      }
    };

    // Set initial offset
    updateOffset();
    
    // Listen for resize events
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [position]);

  // Gravitational distortion effect
  useEffect(() => {
    let animationFrame: number;
    
    const applyGravitationalBend = () => {
      if (typeof window !== 'undefined') {
        // Calculate gradient line center position
        const centerX = window.innerWidth / 2 + offsetX;
        const centerY = window.innerHeight / 2;
        
        // Get gravitational influence from sphere
        const gravity = animationStore.calculateGravitationalPull(
          { x: centerX, y: centerY },
          100 // Gradient line influence radius
        );
        
        if (gravity.isInGravityField) {
          // Bend the line toward the sphere
          const bendStrength = gravity.influence * 15; // Max bend amount
          const bendDirection = position === 'left' ? gravity.pullX : -gravity.pullX;
          setGravitationalBend(bendDirection * 0.5); // Subtle bend
        } else {
          setGravitationalBend(0); // No bend when outside gravity field
        }
      }
      
      animationFrame = requestAnimationFrame(applyGravitationalBend);
    };
    
    applyGravitationalBend();
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [offsetX, position]);

  return (
    <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-20'>
      <div
        className={`${width} ${height}`}
        style={{
          background: styles.gradients.line.vertical,
          transform: `translateX(${offsetX + gravitationalBend}px) ${gravitationalBend !== 0 ? `skewX(${gravitationalBend * 0.1}deg)` : ''}`,
          transition: 'transform 0.1s ease-out', // Smooth gravitational response
        }}
      />
    </div>
  );
};

export default GradientLine;