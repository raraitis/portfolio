'use client'

import { useState, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import Letter from './Letter'

interface WordGroupProps {
  letters: string;
  startIndex: number;
  letterPositions: Array<{ x: number; y: number }>;
  baseY: number;
  onScatter: (
    startIndex: number,
    letterCount: number,
    isGravityTriggered?: boolean
  ) => void;
  isScattered: boolean;
  scatterPositions: Array<{ x: number; y: number }>;
  onReturnComplete: () => void;
  returnedLetters: number;
}

export default function WordGroup({
  letters,
  startIndex,
  letterPositions,
  baseY,
  onScatter,
  isScattered,
  scatterPositions,
  onReturnComplete,
  returnedLetters,
}: WordGroupProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rubberOffsets, setRubberOffsets] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [isFlying, setIsFlying] = useState(false);

  // Initialize rubber offsets
  useEffect(() => {
    setRubberOffsets(letters.split('').map(() => ({ x: 0, y: 0 })));
  }, [letters]);

  // Reset rubber offsets when word returns from scattered state
  useEffect(() => {
    if (!isScattered && !isFlying) {
      // Word has returned to normal state - reset everything
      setOffset({ x: 0, y: 0 });
      setRubberOffsets(letters.split('').map(() => ({ x: 0, y: 0 })));
    }
  }, [isScattered, isFlying, letters]);

  // Gravity fall animation function
  const startGravityFall = () => {
    setIsFlying(true);
    let currentY = offset.y;
    let velocityY = 0;
    const gravity = 0.8;
    const startX = offset.x; // Capture starting X position
    let animationId: number;

    const fallAnimation = () => {
      velocityY += gravity; // Accelerate downward
      currentY += velocityY;

      const screenHeight = window.innerHeight;

      // Check if hit bottom of screen
      if (currentY > screenHeight - 150) {
        // Hit bottom - SCATTER!
        console.log('Word hit bottom - scattering!');
        setIsFlying(false);
        setOffset({ x: 0, y: 0 }); // Reset position immediately
        onScatter(startIndex, letters.length, true); // gravity triggered
        return;
      }

      // Update position and continue falling
      setOffset({ x: startX, y: currentY });
      animationId = requestAnimationFrame(fallAnimation);
    };

    animationId = requestAnimationFrame(fallAnimation);
  };

  // Flying animation function
  const startWordFlying = (vx: number, vy: number) => {
    setIsFlying(true);
    let currentVelX = vx * 15; // Scale up velocity
    let currentVelY = vy * 15;
    let currentX = offset.x;
    let currentY = offset.y;
    let animationId: number;

    const flyAnimation = () => {
      currentX += currentVelX;
      currentY += currentVelY;

      // Check screen boundaries
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const hitEdge =
        currentX < -200 ||
        currentX > screenWidth - 200 ||
        currentY < -100 ||
        currentY > screenHeight - 100;

      if (hitEdge) {
        // Hit edge - SCATTER!
        console.log('Word hit edge - scattering!');
        setIsFlying(false);
        setOffset({ x: 0, y: 0 }); // Reset position immediately
        onScatter(startIndex, letters.length, false);
        return;
      }

      // Update position and continue flying
      setOffset({ x: currentX, y: currentY });
      animationId = requestAnimationFrame(flyAnimation);
    };

    animationId = requestAnimationFrame(flyAnimation);
  };

  // Drag gesture for word group with rubber physics
  const bind = useDrag(({ active, movement: [mx, my], velocity: [vx, vy] }) => {
    if (isScattered || isFlying) return; // Can't drag while scattered or flying

    if (active) {
      // While dragging word - create rubber/chain effect
      setOffset({ x: mx, y: my });

      // Calculate rubber offsets for each letter (chain physics)
      const newRubberOffsets = letters.split('').map((_, letterIndex) => {
        const factor = letterIndex / (letters.length - 1); // 0 to 1
        const lag = 0.3 + factor * 0.4; // More lag for letters further away
        const rubberX = mx * (1 - lag) * factor;
        const rubberY = my * (1 - lag) * factor + factor * Math.abs(mx) * 0.1; // Slight sag
        return { x: rubberX, y: rubberY };
      });

      setRubberOffsets(newRubberOffsets);
    } else {
      // On release - check velocity for different behaviors
      const speed = Math.sqrt(vx * vx + vy * vy);

      console.log(
        `Release: speed=${speed.toFixed(2)}, vx=${vx.toFixed(
          2
        )}, vy=${vy.toFixed(2)}`
      );

      if (speed > 0.6) {
        // FAST THROW - Word flies in throw direction and scatters when hits edge!
        console.log('Fast throw detected - word will fly!');
        startWordFlying(vx, vy);
        return; // Don't reset position - flying animation will handle it
      } else if (Math.abs(mx) > 100 || Math.abs(my) > 100) {
        // SLOW DRAG TO DISTANCE - Fall straight down and scatter
        console.log('Slow drag detected - gravity fall!');
        startGravityFall();
        return; // Don't reset position - falling animation will handle it
      } else {
        // Just small movement - return to normal position
        console.log('Small movement - returning to position');
      }

      // Reset positions
      setOffset({ x: 0, y: 0 });
      setRubberOffsets(letters.split('').map(() => ({ x: 0, y: 0 })));
    }
  });

  return (
    <div
      {...bind()}
      style={{
        position: 'absolute',
        cursor: isScattered ? 'default' : 'grab',
        touchAction: 'none',
        left: 0,
        top: baseY,
        width: '100vw',
        height: '100px',
        zIndex: 5,
      }}
    >
      {/* Render letters in this word group */}
      {letters.split('').map((letter, letterIndex) => {
        const globalIndex = startIndex + letterIndex;
        const position = letterPositions[globalIndex];

        if (!position) return null;

        return (
          <Letter
            key={globalIndex}
            letter={letter}
            index={globalIndex}
            originalX={position.x}
            originalY={0}
            wordOffset={offset}
            isScattered={isScattered}
            scatterPosition={scatterPositions[globalIndex] || { x: 0, y: 0 }}
            onReturnComplete={onReturnComplete}
            rubberOffset={rubberOffsets[letterIndex] || { x: 0, y: 0 }}
          />
        );
      })}
    </div>
  );
}
