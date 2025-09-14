'use client'

import { useRef } from 'react';

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null)
  
  return (
    <>
      {/* Gradient Line - Left side of name */}
      <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-20'>
        <div
          className='w-1.5 h-56'
          style={{
            background:
              'linear-gradient(to bottom, #8b7d6b 0%, #a09280 20%, #b4a694 40%, #c8bea8 60%, rgba(200, 190, 168, 0.6) 80%, rgba(200, 190, 168, 0.2) 90%, transparent 100%)',
            transform: 'translateX(-500px)',
          }}
        />
      </div>

      {/* Main interactive area */}
      <div className='fixed inset-0 overflow-hidden'>
        <div
          ref={containerRef}
          className='absolute inset-0 flex items-center justify-center'
          style={{ transform: 'translateX(-190px)' }}
        >
          {/* Simplified name display */}
          <div className='relative' style={{ width: '600px', height: '200px' }}>
            <div className="text-6xl md:text-8xl font-light text-gray-800 select-none">
              <div>RAITIS</div>
              <div style={{ marginTop: '80px' }}>KRASLOVSKIS</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}