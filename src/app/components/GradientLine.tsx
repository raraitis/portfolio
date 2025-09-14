'use client'

import { styles } from '@/styles';

interface GradientLineProps {
  position?: 'left' | 'right';
  offsetX?: number;
  height?: string;
  width?: string;
}

const GradientLine = ({ 
  position = 'left',
  offsetX = -500,
  height = 'h-56',
  width = 'w-1.5'
}: GradientLineProps) => {
  const translateX = position === 'left' ? offsetX : -offsetX;

  return (
    <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-20'>
      <div
        className={`${width} ${height}`}
        style={{
          background: styles.gradients.line.vertical,
          transform: `translateX(${translateX}px)`,
        }}
      />
    </div>
  );
};

export default GradientLine;