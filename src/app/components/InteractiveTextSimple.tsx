'use client'

import { useRef } from 'react';
import { styles } from '../../styles';

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <>
      {/* Gradient Line - Left side of name */}
      <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-20'>
        <div
          className='w-1.5 h-56'
          style={{
            background: styles.gradients.line.vertical,
            transform: 'translateX(-500px)',
          }}
        />
      </div>

      {/* Main interactive area */}
      <div className='fixed inset-0 overflow-hidden'>
        <div
          ref={containerRef}
          className='absolute inset-0 flex items-center justify-center'
          style={styles.layout.offsetContainer}
        >
          {/* Simplified name display */}
          <div className='relative' style={styles.layout.nameContainer}>
            <div className="text-6xl md:text-8xl font-light text-gray-800 select-none">
              <div>RAITIS</div>
              <div style={styles.text.nameSpacing}>KRASLOVSKIS</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}