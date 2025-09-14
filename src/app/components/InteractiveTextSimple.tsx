'use client'

import { useRef, useState, useEffect } from 'react';
import { animated, useSpringValue, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { animationStore } from '@/stores/AnimationStore';
import { styles, nameText } from '../../styles';
import GradientLine from './GradientLine';

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

  const wordX = useSpringValue(initialX); // Start directly at final position
  const wordY = useSpringValue(initialY);
  const wordScale = useSpringValue(1); // Start at full size
  const [isDragging, setIsDragging] = useState(false);

  // Gravitational influence effect disabled for better performance in fixed position
  // useEffect(() => {
  //   // Gravitational effects disabled when name is in fixed top-left position
  // }, []);

  const bind = useDrag(
    ({ active, movement: [mx, my], offset: [ox, oy], velocity: [vx, vy] }) => {
      setIsDragging(active);

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
          typeof window !== 'undefined' ? window.innerHeight : 700;
        const floorY = screenHeight - 300; // Almost to the very bottom
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

    // Use exact drop position for scatter center
    const scatterCenterX = centerX;
    const scatterCenterY = centerY;

    const letters = word.split('').map((letter, index) => {
      // Each letter gets completely random direction and distance
      const randomAngle = Math.random() * Math.PI * 2; // Full 360 degrees
      const randomDistance = 120 + Math.random() * 250; // Even larger scatter radius

      // Calculate scatter position using angle (this gives true directional scatter)
      const scatterX = scatterCenterX + Math.cos(randomAngle) * randomDistance;
      const scatterY = scatterCenterY + Math.sin(randomAngle) * randomDistance;

      return {
        letter,
        index,
        // No bounds at all - let letters go anywhere for maximum scatter
        x: scatterX,
        y: scatterY,
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
        config: { tension: 120, friction: 25, mass: 1 }, // Faster return
      });
      wordY.start({
        to: initialY,
        config: { tension: 120, friction: 25, mass: 1 },
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
        ...nameText,
      }}
      className='select-none'
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
  const [currentX, setCurrentX] = useState(x);
  const [currentY, setCurrentY] = useState(y);

  // Gravitational influence disabled for performance - scattered letters remain static
  // useEffect(() => {
  //   // Gravitational effects disabled to prevent infinite re-render loops
  // }, []);

  const {
    x: springX,
    y: springY,
    rotation,
    scale,
  } = useSpring({
    from: { x: currentX, y: currentY, rotation: 0, scale: 1 },
    to: async (next) => {
      // Bounce sequence with gravitational influence
      await next({
        x: currentX, // Use gravity-influenced position
        y: currentY - 25 - Math.random() * 20, // Bounce up
        rotation: (Math.random() - 0.5) * 180, // Random rotation
        scale: 1.15,
      });
      await next({
        x: currentX, // Gravity keeps influencing
        y: currentY + 5, // Quick drop
        scale: 0.9,
        rotation: (Math.random() - 0.5) * 90,
      });
      await next({
        x: currentX, // Final gravity-influenced position
        y: currentY, // Final position
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
        ...nameText,
        opacity: 0.9,
      }}
      className='select-none'
    >
      {letter}
    </animated.div>
  );
};

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Interactive word area positioned in top-left */}
      <div className='fixed inset-0 overflow-hidden'>
        <div
          ref={containerRef}
          className='absolute top-0 left-0 flex items-start justify-start pt-12 pl-12'
        >
          {/* RAITIS - First name */}
          <DraggableWord
            word='RAITIS'
            initialX={0}
            initialY={0}
            wordIndex={0}
          />

          {/* KRASLOVSKIS - Last name */}
          <DraggableWord
            word='KRASLOVSKIS'
            initialX={120}
            initialY={30}
            wordIndex={1}
          />
        </div>
      </div>
    </>
  );
}