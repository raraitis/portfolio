'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animated, useSpringValue, useSpring } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useDevice } from '../hooks/useDevice';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { nameText, nameTextMobile } from '../../styles';
import { zIndex } from '../../styles/sizing';

interface WordProps {
  word: string;
  initialX: number;
  initialY: number;
}

// Scatter clamp (MUX-10): keep every scattered letter inside the viewport.
// Spring coords are offset from viewport coords by the hero container's
// padding (pt-5 pl-5 / sm:pt-12 sm:pl-12 below), so the max edges reserve the
// largest padding value on top of the visual edge margin.
const SCATTER_EDGE_PADDING = 12;
const SCATTER_CONTAINER_OFFSET = 48;
const ROOT_FONT_PX = 16; // rem→px for the letter glyph-box estimate

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  const prefersReducedMotion = useReducedMotion();

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

  // Monotonic id of the current drop→scatter→reassembly chain. Every timer
  // callback captures the generation it was scheduled under and no-ops if a
  // newer drag has started since — stale chains can never fight a live one.
  const generationRef = useRef(0);

  const clearPendingTimeouts = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => clearPendingTimeouts, [clearPendingTimeouts]);

  const bind = useDrag(
    ({ active, first, offset: [ox, oy] }) => {
      setIsDragging(active);

      if (active) {
        if (first) {
          // Interrupt any in-flight drop/scatter/reassembly: invalidate its
          // timers, freeze the springs where they are, and restore the whole
          // word so it's grabbable in place (the user can catch it mid-drop).
          generationRef.current += 1;
          clearPendingTimeouts();
          wordX.stop();
          wordY.stop();
          wordScale.stop();
          setIsScattered(false);
          setScatteredLetters((prev) => (prev.length === 0 ? prev : []));
        }
        wordX.set(ox);
        wordY.set(oy);
        if (prefersReducedMotion) {
          wordScale.set(1.1);
        } else {
          wordScale.start({ to: 1.1, config: springConfig.scale });
        }
      } else {
        if (prefersReducedMotion) {
          // Reduced motion: no drop/scatter choreography — the word snaps
          // straight back to its resting position on release
          wordX.set(initialX);
          wordY.set(initialY);
          wordScale.set(1);
          return;
        }

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
        const generation = generationRef.current;
        const scatterDelay = Math.max(100, Math.min(400, dropDistance * 2)); // Proportional to drop distance
        timeoutsRef.current.push(
          setTimeout(() => {
            if (generation !== generationRef.current) return;
            scatterWord(generation, ox, oy + dropDistance * 0.6);
          }, scatterDelay)
        );
      }
    },
    {
      from: () => [wordX.get(), wordY.get()],
      // No bounds — free movement
    }
  );

  const scatterWord = (generation: number, centerX: number, centerY: number) => {
    if (generation !== generationRef.current) return;
    setIsScattered(true);

    const scatterCenterX = centerX;
    const scatterCenterY = centerY;

    // Bound scatter targets to the viewport (random spread stays untouched,
    // only the landing point is clamped) so letters never vanish off-screen
    // on small viewports (375×667)
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 375;
    const viewportHeight =
      typeof window !== 'undefined' ? window.innerHeight : 700;
    const letterSize = parseFloat(currentTextStyles.fontSize) * ROOT_FONT_PX;
    const maxScatterX =
      viewportWidth - SCATTER_CONTAINER_OFFSET - SCATTER_EDGE_PADDING - letterSize;
    const maxScatterY =
      viewportHeight - SCATTER_CONTAINER_OFFSET - SCATTER_EDGE_PADDING - letterSize;

    const letters = word.split('').map((letter, index) => {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = 120 + Math.random() * 250;

      const scatterX = scatterCenterX + Math.cos(randomAngle) * randomDistance;
      const scatterY = scatterCenterY + Math.sin(randomAngle) * randomDistance;

      return {
        letter,
        index,
        x: clampValue(scatterX, 0, maxScatterX),
        y: clampValue(scatterY, 0, maxScatterY),
      };
    });

    setScatteredLetters(letters);

    // After 1.5s, reassemble: spring letters back and restore scale
    timeoutsRef.current.push(
      setTimeout(() => {
        if (generation !== generationRef.current) return;
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
            reducedMotion={prefersReducedMotion}
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
        zIndex: isDragging ? zIndex.heroWordDragging : zIndex.heroWordResting,
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
  reducedMotion: boolean;
}

const ScatteredLetter = React.memo(({
  letter,
  x,
  y,
  textStyles,
  reducedMotion,
}: ScatteredLetterProps) => {
  const {
    x: springX,
    y: springY,
    rotation,
    scale,
  } = useSpring({
    from: { x, y, rotation: 0, scale: 1 },
    to: async (next) => {
      // Reduced motion: hold the from-values — no bounce choreography
      if (reducedMotion) return;

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
        zIndex: zIndex.heroLetterScattered,
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
