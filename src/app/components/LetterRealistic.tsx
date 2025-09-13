'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })
  const [currentPosition, setCurrentPosition] = useState({ x: originalX, y: originalY })
  const animationRef = useRef<number>(0)
  
  // Spring values for position
  const x = useSpringValue(originalX + wordOffset.x + rubberOffset.x)
  const y = useSpringValue(originalY + wordOffset.y + rubberOffset.y)
  
  // Spring for visual effects
  const [{ scale, rotate, opacity }, api] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 }
  }))

  // Physics simulation for realistic bouncing
  const startPhysicsSimulation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const simulate = () => {
      if (isDraggedIndividually) return // Stop physics if being dragged
      
      const screenWidth = window.innerWidth
      const screenHeight = window.innerHeight
      const targetX = originalX + wordOffset.x
      const targetY = originalY + wordOffset.y
      
      setCurrentPosition(prev => {
        let newX = prev.x
        let newY = prev.y
        
        setVelocity(prevVel => {
          let newVelX = prevVel.x
          let newVelY = prevVel.y
          
          // Magnetic force toward home position (gets stronger when closer)
          const distanceX = targetX - newX
          const distanceY = targetY - newY
          const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
          
          if (distance > 10) { // Still far from home
            const magnetForce = 1.2 // Increased from 0.3 to 1.2 - much stronger!
            newVelX += (distanceX / distance) * magnetForce
            newVelY += (distanceY / distance) * magnetForce
          } else {
            // Very close to home - snap back
            newVelX *= 0.9 // Less friction when close
            newVelY *= 0.9
            if (distance < 8 && Math.abs(newVelX) < 1.5 && Math.abs(newVelY) < 1.5) { // Increased thresholds
              // Close enough - return home
              x.start({ to: targetX, config: { tension: 300, friction: 20 } }) // Faster snap
              y.start({ to: targetY, config: { tension: 300, friction: 20 } })
              onReturnComplete()
              return { x: 0, y: 0 }
            }
          }
          
          // Apply velocity
          newX += newVelX
          newY += newVelY
          
          // Bounce off screen edges with angle preservation
          if (newX <= 50 || newX >= screenWidth - 50) {
            newVelX *= -0.7 // Bounce with some energy loss
            newX = Math.max(50, Math.min(screenWidth - 50, newX))
          }
          if (newY <= 50 || newY >= screenHeight - 50) {
            newVelY *= -0.7
            newY = Math.max(50, Math.min(screenHeight - 50, newY))
          }
          
          // Air resistance - less drag for faster movement
          newVelX *= 0.995 // Reduced from 0.98 to 0.995
          newVelY *= 0.995
          
          return { x: newVelX, y: newVelY }
        })
        
        // Update visual position
        x.set(newX)
        y.set(newY)
        
        return { x: newX, y: newY }
      })
      
      animationRef.current = requestAnimationFrame(simulate)
    }
    
    simulate()
  }

  // Individual letter drag (when scattered)
  const bind = useDrag(({ 
    active, 
    movement: [mx, my],
    velocity: [vx, vy]
  }) => {
    if (!isScattered) return
    
    setIsDraggedIndividually(active)
    
    if (active) {
      // Being dragged - stop physics and follow mouse
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      const newX = scatterPosition.x + mx
      const newY = scatterPosition.y + my
      setCurrentPosition({ x: newX, y: newY })
      x.set(newX)
      y.set(newY)
      api.start({ scale: 1.3 })
    } else {
      // Released - apply velocity and restart physics
      const speed = Math.sqrt(vx * vx + vy * vy)
      
      if (speed > 0.4) {
        // Thrown! Apply initial velocity
        setVelocity({ x: vx * 2, y: vy * 2 })
      } else {
        // Just dropped
        setVelocity({ x: 0, y: 0 })
      }
      
      // Restart physics simulation immediately - no delay!
      startPhysicsSimulation()
      
      api.start({ scale: 1 })
    }
  })

  // Update position when word moves or scatters
  useEffect(() => {
    if (isScattered && !isDraggedIndividually) {
      // Initial scatter - apply random velocity and start physics
      setCurrentPosition({
        x: scatterPosition.x,
        y: scatterPosition.y
      })
      
      // Random initial velocity
      const initialVelX = (Math.random() - 0.5) * 10
      const initialVelY = (Math.random() - 0.5) * 10
      setVelocity({ x: initialVelX, y: initialVelY })
      
      x.set(scatterPosition.x)
      y.set(scatterPosition.y)
      
      // Visual effects for scatter
      api.start({ 
        scale: 0.8 + Math.random() * 0.2, 
        rotate: (Math.random() - 0.5) * 180,
        opacity: 0.85
      })
      
      // Start physics simulation immediately - no delay!
      startPhysicsSimulation()
      
    } else if (!isScattered) {
      // Follow word position with rubber physics
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      
      x.start({
        to: originalX + wordOffset.x + rubberOffset.x,
        config: { tension: 250, friction: 20 }
      })
      y.start({
        to: originalY + wordOffset.y + rubberOffset.y,
        config: { tension: 250, friction: 20 }
      })
      
      // Reset physics states
      setVelocity({ x: 0, y: 0 })
      setCurrentPosition({ x: originalX, y: originalY })
    }
    
    // Cleanup animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [wordOffset, isScattered, scatterPosition, rubberOffset])

  return (
    <animated.div
      {...bind()}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${scale.get()}) rotate(${rotate.get()}deg)`,
        opacity,
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
