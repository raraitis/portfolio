'use client'

import { useState, useEffect } from 'react'
import { useDrag } from '@use-gesture/react'
import Letter from './Letter'

interface WordGroupProps {
  letters: string
  startIndex: number
  letterPositions: Array<{x: number, y: number}>
  baseY: number
  onScatter: (startIndex: number, letterCount: number) => void
  isScattered: boolean
  scatterPositions: Array<{x: number, y: number}>
  onReturnComplete: () => void
  returnedLetters: number
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
  returnedLetters
}: WordGroupProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [rubberOffsets, setRubberOffsets] = useState<Array<{x: number, y: number}>>([])

  // Initialize rubber offsets
  useEffect(() => {
    setRubberOffsets(letters.split('').map(() => ({ x: 0, y: 0 })))
  }, [letters])

  // Drag gesture for word group with rubber physics
  const bind = useDrag(({ 
    active, 
    movement: [mx, my], 
    velocity: [vx, vy]
  }) => {
    if (isScattered) return // Can't drag while scattered
    
    if (active) {
      // While dragging word - create rubber/chain effect
      setOffset({ x: mx, y: my })
      
      // Calculate rubber offsets for each letter (chain physics)
      const newRubberOffsets = letters.split('').map((_, letterIndex) => {
        const factor = letterIndex / (letters.length - 1) // 0 to 1
        const lag = 0.3 + (factor * 0.4) // More lag for letters further away
        const rubberX = mx * (1 - lag) * factor
        const rubberY = my * (1 - lag) * factor + (factor * Math.abs(mx) * 0.1) // Slight sag
        return { x: rubberX, y: rubberY }
      })
      
      setRubberOffsets(newRubberOffsets)
    } else {
      // On release - check velocity
      const speed = Math.sqrt(vx * vx + vy * vy)
      
      if (speed > 0.3) {
        // SCATTER EXPLOSION!
        onScatter(startIndex, letters.length)
      }
      
      // Reset positions
      setOffset({ x: 0, y: 0 })
      setRubberOffsets(letters.split('').map(() => ({ x: 0, y: 0 })))
    }
  })

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
        zIndex: 5
      }}
    >
      {/* Render letters in this word group */}
      {letters.split('').map((letter, letterIndex) => {
        const globalIndex = startIndex + letterIndex
        const position = letterPositions[globalIndex]
        
        if (!position) return null
        
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
        )
      })}
    </div>
  )
}
