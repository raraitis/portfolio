'use client'

import { useState, useEffect } from 'react'
import { useSpring, animated, useSpringValue } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

interface LetterProps {
  letter: string
  index: number
  originalX: number
  originalY: number
  wordOffset: { x: number; y: number }
  isScattered: boolean
  scatterPosition: { x: number; y: number }
  onReturnComplete: () => void
  rubberOffset?: { x: number; y: number }
}

export default function Letter({ 
  letter, 
  index, 
  originalX, 
  originalY, 
  wordOffset, 
  isScattered, 
  scatterPosition,
  onReturnComplete,
  rubberOffset = { x: 0, y: 0 }
}: LetterProps) {
  const [isDraggedIndividually, setIsDraggedIndividually] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  
  // Simple spring-based position
  const [springs, api] = useSpring(() => ({
    x: originalX + wordOffset.x + rubberOffset.x,
    y: originalY + wordOffset.y + rubberOffset.y,
    scale: 1,
    rotate: 0,
    opacity: 1,
    config: { tension: 200, friction: 25 }
  }))

  // Individual letter drag (when scattered)
  const bind = useDrag(({ 
    active, 
    movement: [mx, my],
    velocity: [vx, vy]
  }) => {
    if (!isScattered) return
    
    setIsDraggedIndividually(active)
    
    if (active) {
      // Being dragged - follow mouse immediately
      api.start({ 
        x: scatterPosition.x + mx,
        y: scatterPosition.y + my,
        scale: 1.2,
        immediate: true
      })
    } else {
      // Released - check if thrown or just return home
      const speed = Math.sqrt(vx * vx + vy * vy)
      
      if (speed > 0.5) {
        // Thrown! Go to new position then return
        const newX = scatterPosition.x + mx + (vx * 100)
        const newY = scatterPosition.y + my + (vy * 100)
        
        // Throw to new position
        api.start({ 
          x: newX,
          y: newY,
          scale: 0.9,
          rotate: (Math.random() - 0.5) * 180,
          config: { tension: 150, friction: 20 }
        })
        
        // Then return home after short time
        setTimeout(() => {
          returnHome()
        }, 300)
      } else {
        // Just dropped - return immediately
        returnHome()
      }
    }
  })

  const returnHome = () => {
    if (isDraggedIndividually) return // Don't return if being held
    
    setIsReturning(true)
    
    // Fast return to original position
    api.start({ 
      x: originalX + wordOffset.x,
      y: originalY + wordOffset.y,
      scale: 1,
      rotate: 0,
      opacity: 1,
      config: { tension: 300, friction: 20 },
      onRest: () => {
        setIsReturning(false)
        onReturnComplete()
      }
    })
  }

  // Update position when word moves or scatters
  useEffect(() => {
    if (isScattered && !isDraggedIndividually && !isReturning) {
      // Initial scatter
      api.start({
        x: scatterPosition.x,
        y: scatterPosition.y,
        scale: 0.8 + Math.random() * 0.2,
        rotate: (Math.random() - 0.5) * 360,
        opacity: 0.85,
        config: { tension: 120, friction: 15 }
      })
      
      // Start returning after very short delay
      setTimeout(() => {
        returnHome()
      }, 200)
      
    } else if (!isScattered) {
      // Follow word position
      api.start({
        x: originalX + wordOffset.x + rubberOffset.x,
        y: originalY + wordOffset.y + rubberOffset.y,
        scale: 1,
        rotate: 0,
        opacity: 1,
        config: { tension: 250, friction: 20 }
      })
      setIsReturning(false)
    }
  }, [wordOffset, isScattered, scatterPosition, rubberOffset, isDraggedIndividually])

  return (
    <animated.div
      {...bind()}
      style={{
        position: 'absolute',
        left: springs.x,
        top: springs.y,
        transform: springs.scale.to(s => `scale(${s})`),
        rotate: springs.rotate,
        opacity: springs.opacity,
        cursor: isScattered ? 'grab' : 'default',
        touchAction: 'none',
        zIndex: isScattered ? 50 : 10,
        userSelect: 'none'
      }}
      className="text-6xl font-light text-gray-800 tracking-wider"
    >
      {letter}
    </animated.div>
  )
}
