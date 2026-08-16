'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpringValue, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useDevice } from '../hooks/useDevice';
import { nameText, nameTextMobile } from '../../styles';

interface WordProps {
  word: string;
  initialX: number;
  initialY: number;
}

const DraggableWord = ({ word, initialX, initialY }: WordProps) => {
  const [isScattered, setIsScattered] = useState(false);
  const [scatteredLetters, setScatteredLetters] = useState<
    Array<{
      letter: string;
      x: number;
      y: number;
      index: number;
    }>
  >([]);
  const device = useDevice();

  // Mobile-optimized spring configurations
  const springConfig = useMemo(
    () => ({
      scale: device.isMobile
        ? { tension: 300, friction: 25 }
        : { tension: 400, friction: 20 },

      drop: device.isMobile
        ? { tension: 50, friction: 15, mass: 1.5 }
        : { tension: 60, friction: 12, mass: 2 },

      return: device.isMobile
        ? { tension: 100, friction: 30, mass: 0.8 }
        : { tension: 120, friction: 25, mass: 1 },

      resetScale: device.isMobile
        ? { tension: 120, friction: 25 }
        : { tension: 150, friction: 20 },
    }),
    [device.isMobile]
  );

  const wordX = useSpringValue(initialX);
  const wordY = useSpringValue(initialY);
  const wordScale = useSpringValue(1);
  const [isDragging, setIsDragging] = useState(false);

  const currentTextStyles = device.isMobile ? nameTextMobile : nameText;

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearPendingTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearPendingTimeouts, [clearPendingTimeouts]);

  const bind = useDrag(
    ({ active, first, movement: [mx, my] }) => {
      setIsDragging(active);

      if (active) {
        if (first) clearPendingTimeouts();
        wordX.set(initialX + mx);
        wordY.set(initialY + my);
        wordScale.start({ to: 1.1, config: springConfig.scale });
      } else {
        const oy = wordY.get();
        const ox = wordX.get();

        // Drop floor: 300px above the viewport bottom, clamped so a short
        // viewport can't put the floor above the word's start position
        const screenHeight =
          typeof window !== 'undefined' ? window.innerHeight : 700;
        const floorY = Math.max(initialY + 60, screenHeight - 300);
        const dropDistance = floorY - oy;

        wordY.start({
          to: floorY,
          config: springConfig.drop,
        });

        // Scatter at ~60% of the drop so both the fall and the burst are visible
        const scatterDelay = Math.max(100, Math.min(400, dropDistance * 2)); // Proportional to drop distance
        timeoutsRef.current.push(
          setTimeout(() => {
            scatterWord(ox, oy + dropDistance * 0.6);
          }, scatterDelay)
        );
      }
    },
    {
      from: () => [wordX.get(), wordY.get()],
      // No bounds — free movement
    }
  );

  const scatterWord = (centerX: number, centerY: number) => {
    setIsScattered(true);

    const scatterCenterX = centerX;
    const scatterCenterY = centerY;

    const letters = word.split('').map((letter, index) => {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = 120 + Math.random() * 250;

      const scatterX = scatterCenterX + Math.cos(randomAngle) * randomDistance;
      const scatterY = scatterCenterY + Math.sin(randomAngle) * randomDistance;

      return {
        letter,
        index,
        x: scatterX,
        y: scatterY,
      };
    });

    setScatteredLetters(letters);

    // After 1.5s, reassemble: spring letters back and restore scale
    timeoutsRef.current.push(
      setTimeout(() => {
        setIsScattered(false);
        setScatteredLetters([]);

        wordX.start({
          to: initialX,
          config: springConfig.return,
        });
        wordY.start({
          to: initialY,
          config: springConfig.return,
        });
        wordScale.start({ to: 1, config: springConfig.resetScale });
      }, 1500)
    );
  };

  if (isScattered) {
    return (
      <>
        {scatteredLetters.map((letterData, index) => (
          <ScatteredLetter
            key={`${word}-${letterData.index}-${index}`}
            letter={letterData.letter}
            x={letterData.x}
            y={letterData.y}
            textStyles={currentTextStyles}
          />
        ))}
      </>
    );
  }

  return (
    <animated.div
      {...bind()}
      style={{
        position: 'absolute',
        x: wordX,
        y: wordY,
        scale: wordScale,
        transformOrigin: 'center',
        zIndex: isDragging ? 100 : 50,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as const,
        pointerEvents: 'all' as const,
        ...currentTextStyles,
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
  textStyles: typeof nameText;
}

const ScatteredLetter = React.memo(({
  letter,
  x,
  y,
  textStyles,
}: ScatteredLetterProps) => {
  const {
    x: springX,
    y: springY,
    rotation,
    scale,
  } = useSpring({
    from: { x, y, rotation: 0, scale: 1 },
    to: async (next) => {
      // Bounce sequence: up, quick drop, settle
      await next({
        x,
        y: y - 25 - Math.random() * 20,
        rotation: (Math.random() - 0.5) * 180, // Random rotation
        scale: 1.15,
      });
      await next({
        x,
        y: y + 5,
        scale: 0.9,
        rotation: (Math.random() - 0.5) * 90,
      });
      await next({
        x,
        y,
        scale: 1,
        rotation: (Math.random() - 0.5) * 45, // Small final rotation
      });
    },
    config: { tension: 250, friction: 20 },
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
        ...textStyles,
        opacity: 0.9,
      }}
      className='select-none'
    >
      {letter}
    </animated.div>
  );
});
ScatteredLetter.displayName = 'ScatteredLetter';

export default function InteractiveText() {
  return (
    <>
      <div className='fixed inset-0 overflow-hidden'>
        <div className='absolute top-0 left-0 flex items-start justify-start pt-5 pl-5 sm:pt-12 sm:pl-12'>
          <DraggableWord word='RAITIS' initialX={0} initialY={0} />

          <DraggableWord word='KRASLOVSKIS' initialX={0} initialY={50} />
        </div>
      </div>
    </>
  );
}
