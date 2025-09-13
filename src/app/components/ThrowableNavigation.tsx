'use client'

import { useState } from 'react'
import { animated, useSpringValue } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

interface NavWordProps {
  word: string
  x: number
  y: number
  href: string
  index: number
}

function NavWord({ word, x, y, href, index }: NavWordProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isThrown, setIsThrown] = useState(false)
  
  const springX = useSpringValue(x + offset.x)
  const springY = useSpringValue(y + offset.y)
  
  const bind = useDrag(({ active, movement: [mx, my], velocity: [vx, vy] }) => {
    if (active) {
      setOffset({ x: mx, y: my })
      springX.set(x + mx)
      springY.set(y + my)
    } else {
      const speed = Math.sqrt(vx * vx + vy * vy)
      if (speed > 0.3) {
        // Thrown! Stay where dropped
        setIsThrown(true)
        setOffset({ x: mx, y: my })
        springX.start({ to: x + mx, config: { tension: 150, friction: 20 } })
        springY.start({ to: y + my, config: { tension: 150, friction: 20 } })
      } else {
        // Return to original
        setOffset({ x: 0, y: 0 })
        springX.start({ to: x, config: { tension: 200, friction: 25 } })
        springY.start({ to: y, config: { tension: 200, friction: 25 } })
      }
    }
  })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = href
  }

  return (
    <animated.div
      {...bind()}
      onClick={handleClick}
      style={{
        position: 'absolute',
        x: springX,
        y: springY,
        cursor: 'grab',
        touchAction: 'none',
        zIndex: 100
      }}
      className="text-sm tracking-wide text-gray-600 hover:text-gray-800 transition-colors select-none"
    >
      {word}
    </animated.div>
  )
}

export default function ThrowableNavigation() {
  const [positions] = useState([
    { word: 'WORK', x: 0, y: 0, originalX: 0, originalY: 0, href: '/work' },
    { word: 'ABOUT', x: 0, y: 0, originalX: 100, originalY: 0, href: '/about' },
    { word: 'CONTACT', x: 0, y: 0, originalX: 200, originalY: 0, href: '/contact' }
  ])

  return (
    <div className="fixed top-16 right-20 z-50">
      <div className="relative" style={{ width: '300px', height: '50px' }}>
        {positions.map((item, index) => (
          <NavWord
            key={item.word}
            word={item.word}
            x={item.originalX}
            y={item.originalY}
            href={item.href}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}
