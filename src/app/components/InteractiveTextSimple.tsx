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
        // Dragging the word
        wordX.set(ox);
        wordY.set(oy);
        wordScale.start({ to: 1.1, config: { tension: 300, friction: 30 } });
        animationStore.updateBackgroundIntensity();
      } else {
        // Not actively dragging - apply gravity
        const oy = wordY.get();
        const ox = wordX.get();

        // Floor collision - allow dropping 200px lower (350px total from edge)
        const floorY = Math.min(window.innerHeight + 50, oy + 200);
        const finalX = Math.max(100, Math.min(window.innerWidth - 100, ox + vx * 20)); // Keep in bounds

        // Animate the fall with gravity-like physics
        wordX.start({
          to: finalX,
          config: { tension: 100, friction: 15 },
        });

        wordY.start({
          to: floorY,
          config: { tension: 60, friction: 10, mass: 2 }, // Heavy gravity fall
          onRest: () => {
            // HIT THE FLOOR! Scatter into letters immediately
            scatterWord(finalX, floorY);
          },
        });

        animationStore.updateBackgroundIntensity();
      }
    },
    {
      from: () => [wordX.get(), wordY.get()],
      bounds: {
        left: -200, // Don't let words go too far left
        right: window.innerWidth - 200, // Keep visible on right
        top: -50, // Allow dragging to top of page
        bottom: window.innerHeight + 100, // Allow dropping 200px lower
      },
    }
  );

  const scatterWord = (centerX: number, centerY: number) => {
    setIsScattered(true);

    // Keep scatter within screen bounds - allow scatter even when word is below screen
    const boundedCenterX = Math.max(150, Math.min(window.innerWidth - 150, centerX));
    const boundedCenterY = Math.max(100, Math.min(window.innerHeight + 50, centerY)); // Allow lower scatter

    const letters = word.split('').map((letter, index) => {
      // Scatter letters like rubber balls but keep them visible
      const angle = (index / word.length) * Math.PI * 2 + (Math.random() - 0.5) * 1.0;
      const distance = 60 + Math.random() * 80; // Smaller scatter to stay visible
      
      const scatterX = boundedCenterX + Math.cos(angle) * distance;
      const scatterY = boundedCenterY + Math.sin(angle) * distance - Math.random() * 30;

      return {
        letter,
        index,
        // Keep letters within reasonable bounds but allow lower position
        x: Math.max(50, Math.min(window.innerWidth - 50, scatterX)),
        y: Math.max(50, Math.min(window.innerHeight + 50, scatterY)),
      };
    });

    setScatteredLetters(letters);

    // Start magnet-like reassembly after 1 second - letters come back one by one
    setTimeout(() => {
      setIsScattered(false);
      setScatteredLetters([]);
      
      // Magnet pull - slow return to original position
      wordX.start({ 
        to: initialX, 
        config: { tension: 80, friction: 30, mass: 1.5 } // Slower, more magnetic
      });
      wordY.start({ 
        to: initialY, 
        config: { tension: 80, friction: 30, mass: 1.5 } 
      });
      wordScale.start({ to: 1, config: { tension: 100, friction: 25 } });
    }, 2000); // Longer display time
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
      // Multiple bounce sequence for rubber ball effect
      await next({
        x,
        y: y - 30, // Bounce up first
        rotation: (Math.random() - 0.5) * 360,
        scale: 1.1,
      });
      await next({
        y: y + 10, // Come down
        scale: 0.95,
      });
      await next({
        y: y - 15, // Smaller bounce
        scale: 1.05,
      });
      await next({
        y, // Settle
        scale: 1,
        rotation: (Math.random() - 0.5) * 90,
      });
    },
    config: { tension: 200, friction: 25 },
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