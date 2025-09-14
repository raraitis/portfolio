'use client'

import { observer } from 'mobx-react-lite';
import { animated, useSpringValue } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { animationStore } from '@/stores/AnimationStore';
import { styles } from '../../styles';

interface NavWordProps {
  word: string;
  href: string;
  index: number;
}

const NavWord = observer(({ word, href, index }: NavWordProps) => {
  const pathname = usePathname();
  const navItem = animationStore.getNavItem(word);

  if (!navItem) return null;

  const springX = useSpringValue(navItem.position.x);
  const springY = useSpringValue(navItem.position.y);

  // Reset position when page changes
  useEffect(() => {
    animationStore.resetNavPositions();
  }, [pathname]);

  // Update spring values when store position changes
  useEffect(() => {
    springX.start({
      to: navItem.position.x,
      config: { tension: 150, friction: 20 },
    });
    springY.start({
      to: navItem.position.y,
      config: { tension: 150, friction: 20 },
    });
  }, [navItem.position.x, navItem.position.y, springX, springY]);

  const bind = useDrag(({ active, movement: [mx, my], velocity: [vx, vy] }) => {
    if (active) {
      // Update drag state
      animationStore.setNavDragging(word, true);

      // Update position during drag
      const newX = navItem.originalPosition.x + mx;
      const newY = navItem.originalPosition.y + my;

      springX.set(newX);
      springY.set(newY);
    } else {
      // End drag
      animationStore.setNavDragging(word, false);

      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0.3) {
        // Thrown! Update store position
        const newX = navItem.originalPosition.x + mx;
        const newY = navItem.originalPosition.y + my;
        animationStore.updateNavPosition(word, { x: newX, y: newY });
      } else {
        // Return to current position
        springX.start({
          to: navItem.position.x,
          config: { tension: 200, friction: 25 },
        });
        springY.start({
          to: navItem.position.y,
          config: { tension: 200, friction: 25 },
        });
      }

      // Update background intensity
      animationStore.updateBackgroundIntensity();
    }
  });

  const handleClick = (e: React.MouseEvent) => {
    // Only navigate if not being dragged
    if (!navItem.isDragging) {
      e.preventDefault();
      window.location.href = href;
    }
  };

  return (
    <animated.div
      {...bind()}
      onClick={handleClick}
      style={{
        ...styles.interactive.navWord,
        x: springX,
        y: springY,
        cursor: navItem.isDragging ? 'grabbing' : 'grab',
      }}
      className='text-sm tracking-wide text-gray-600 hover:text-gray-800 transition-colors select-none'
    >
      {word}
    </animated.div>
  );
});

const ThrowableNavigation = observer(() => {
  return (
    <div className='fixed top-16 right-20 z-50'>
      <div className='relative' style={styles.interactive.navContainer}>
        {animationStore.navigation.items.map((item, index) => (
          <NavWord
            key={item.word}
            word={item.word}
            href={item.href}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

export default ThrowableNavigation;
