'use client'

import { useState, useEffect } from 'react';
import { styles, gradientOffsets } from '@/styles';

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

  return (
    <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-20'>
      <div
        className={`${width} ${height}`}
        style={{
          background: styles.gradients.line.vertical,
          transform: `translateX(${offsetX}px)`,
          transition: 'transform 0.3s ease-out', // Smooth transitions on resize
        }}
      />
    </div>
  );
};

export default GradientLine;