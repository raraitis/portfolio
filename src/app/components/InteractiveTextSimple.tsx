'use client'

import { useRef, useState } from 'react';
import { animated, useSpringValue, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { animationStore } from '@/stores/AnimationStore';
import { styles } from '../../styles';

interface WordProps {
  word: string;
  initialX: number;
  initialY: number;
  wordIndex: number;
}

const DraggableWord = ({ word, initialX, initialY, wordIndex }: WordProps) => {
  const [isScattered, setIsScattered] = useState(false);
  const [scatteredLetters, setScatteredLetters] = useState<
    Array<{
      letter: string;
      x: number;
      y: number;
      index: number;
    }>
  >([]);

  const wordX = useSpringValue(initialX);
  const wordY = useSpringValue(initialY);
  const wordScale = useSpringValue(1);

  const bind = useDrag(
    ({ active, movement: [mx, my], offset: [ox, oy], velocity: [vx, vy] }) => {
      if (active) {
        // Dragging the word - use movement from initial position
        wordX.set(initialX + mx);
        wordY.set(initialY + my);
        wordScale.start({ to: 1.1, config: { tension: 400, friction: 20 } }); // More responsive
        animationStore.updateBackgroundIntensity();
      } else {
        // Not actively dragging - apply gravity with visible drop
        const oy = wordY.get();
        const ox = wordX.get(); // Keep current X position - drop straight down

        // Floor collision - drop almost to bottom of page (only 50px from bottom)
        const screenHeight =
          typeof window !== 'undefined' ? window.innerHeight : 800;
        const floorY = screenHeight - 150; // Almost to the very bottom
        const dropDistance = floorY - oy;

        // Animate the drop with visible gravity
        wordY.start({
          to: floorY,
          config: { tension: 60, friction: 12, mass: 2 }, // Visible drop with gravity feel
        });

        // Scatter when word has dropped about 60% of the way - so you see the drop AND the scatter
        const scatterDelay = Math.max(100, Math.min(400, dropDistance * 2)); // Proportional to drop distance
        setTimeout(() => {
          scatterWord(ox, oy + dropDistance * 0.6); // Scatter from 60% down position
        }, scatterDelay);

        animationStore.updateBackgroundIntensity();
      }
    },
    {
      from: () => [wordX.get(), wordY.get()],
      // Remove bounds to allow free movement
    }
  );

  const scatterWord = (centerX: number, centerY: number) => {
    setIsScattered(true);

    // Scatter exactly from where the word was dropped - no bounds adjustment
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    
    // Use exact drop position, no bounding to center
    const scatterCenterX = centerX;
    const scatterCenterY = centerY;

    const letters = word.split('').map((letter, index) => {
      // Each letter gets completely random direction and distance
      const randomAngle = Math.random() * Math.PI * 2; // Full 360 degrees  
      const randomDistance = 80 + Math.random() * 200; // Larger scatter radius
      
      // Calculate scatter position using angle (this gives true directional scatter)
      const scatterX = scatterCenterX + Math.cos(randomAngle) * randomDistance;
      const scatterY = scatterCenterY + Math.sin(randomAngle) * randomDistance;

      return {
        letter,
        index,
        // Allow much wider scatter - only prevent going completely off screen
        x: Math.max(-100, Math.min(screenWidth + 100, scatterX)), // Allow letters to go partially off-screen
        y: Math.max(-100, Math.min(screenHeight + 200, scatterY)), // Allow much wider vertical range
      };
    });

    setScatteredLetters(letters);

    // Reduced delay - magnet reassembly starts faster
    setTimeout(() => {
      setIsScattered(false);
      setScatteredLetters([]);
      
      // Faster, more fluid magnet pull
      wordX.start({ 
        to: initialX, 
        config: { tension: 120, friction: 25, mass: 1 } // Faster return
      });
      wordY.start({ 
        to: initialY, 
        config: { tension: 120, friction: 25, mass: 1 } 
      });
      wordScale.start({ to: 1, config: { tension: 150, friction: 20 } });
    }, 1500); // Shorter display time
  };

  if (isScattered) {
    // Show scattered letters
    return (
      <>
        {scatteredLetters.map((letterData, index) => (
          <ScatteredLetter
            key={`${word}-${letterData.index}-${index}`}
            letter={letterData.letter}
            x={letterData.x}
            y={letterData.y}
          />
        ))}
      </>
    );
  }

  // Show normal draggable word
  return (
    <animated.div
      {...bind()}
      style={{
        position: 'absolute',
        x: wordX,
        y: wordY,
        scale: wordScale,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        zIndex: 50,
        transformOrigin: 'center',
      }}
      className='text-6xl md:text-8xl font-light text-gray-800 select-none'
    >
      {word}
    </animated.div>
  );
};

interface ScatteredLetterProps {
  letter: string;
  x: number;
  y: number;
}

const ScatteredLetter = ({ letter, x, y }: ScatteredLetterProps) => {
  const {
    x: springX,
    y: springY,
    rotation,
    scale,
  } = useSpring({
    from: { x, y, rotation: 0, scale: 1 },
    to: async (next) => {
      // Bounce in place at the scattered position - don't move horizontally
      await next({
        x, // Stay at scattered X position
        y: y - 25 - Math.random() * 20, // Bounce up from scattered position
        rotation: (Math.random() - 0.5) * 180, // Random rotation
        scale: 1.15,
      });
      await next({
        x, // Stay at scattered X position
        y: y + 5, // Quick drop from scattered position
        scale: 0.9,
        rotation: (Math.random() - 0.5) * 90,
      });
      await next({
        x, // Final position is the scattered X
        y, // Final position is the scattered Y
        scale: 1,
        rotation: (Math.random() - 0.5) * 45, // Small final rotation
      });
    },
    config: { tension: 250, friction: 20 }, // More responsive bounce
  });

  return (
    <animated.div
      style={{
        position: 'absolute',
        x: springX,
        y: springY,
        rotate: rotation,
        scale,
        transformOrigin: 'center',
        zIndex: 60,
        pointerEvents: 'none',
      }}
      className='text-6xl md:text-8xl font-light text-gray-800 select-none opacity-90'
    >
      {letter}
    </animated.div>
  );
};

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null);

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

      {/* Interactive word area */}
      <div className='fixed inset-0 overflow-hidden'>
        <div
          ref={containerRef}
          className='absolute inset-0 flex items-center justify-center'
        >
          {/* RAITIS - First word */}
          <DraggableWord
            word='RAITIS'
            initialX={-190}
            initialY={-40}
            wordIndex={0}
          />

          {/* KRASLOVSKIS - Second word */}
          <DraggableWord
            word='KRASLOVSKIS'
            initialX={-190}
            initialY={40}
            wordIndex={1}
          />
        </div>
      </div>
    </>
  );
}