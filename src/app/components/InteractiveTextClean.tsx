'use client'

import { useRef, useState, useEffect } from 'react'
import ThrowableNavigation from './ThrowableNavigation'
import BackgroundElements from './BackgroundElements'
import WordGroup from './WordGroup'

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [letterPositions, setLetterPositions] = useState<Array<{x: number, y: number}>>([])
  
  const firstName = "RAITIS"
  const lastName = "KRASLOVSKIS"
  
  // Scatter states
  const [scatterPositions, setScatterPositions] = useState<Array<{x: number, y: number}>>([])
  const [isFirstNameScattered, setIsFirstNameScattered] = useState(false)
  const [isLastNameScattered, setIsLastNameScattered] = useState(false)
  const [firstNameReturned, setFirstNameReturned] = useState(0)
  const [lastNameReturned, setLastNameReturned] = useState(0)

  // Calculate letter positions when component mounts
  useEffect(() => {
    if (containerRef.current) {
      const positions: Array<{x: number, y: number}> = []
      
      // First name positions - tighter spacing
      firstName.split('').forEach((letter, index) => {
        positions.push({
          x: index * 42, // Reduced from 48 to 42
          y: 0
        })
      })
      
      // Space - smaller gap
      positions.push({ x: firstName.length * 42 + 20, y: 0 })
      
      // Last name positions - continuing from first name
      lastName.split('').forEach((letter, index) => {
        positions.push({
          x: (firstName.length * 42 + 20 + 20) + (index * 42), // Continue from first name end
          y: 0
        })
      })
      
      setLetterPositions(positions)
      
      // Initialize scatter positions
      setScatterPositions(positions.map(() => ({ x: 0, y: 0 })))
    }
  }, [])

  const handleScatter = (startIndex: number, letterCount: number) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Generate random scatter positions for this word's letters
    const newScatterPositions = [...scatterPositions]
    
    for (let i = 0; i < letterCount; i++) {
      const letterIndex = startIndex + i
      newScatterPositions[letterIndex] = {
        x: (Math.random() - 0.5) * (screenWidth - 200),
        y: (Math.random() - 0.5) * (screenHeight - 200)
      }
    }
    
    setScatterPositions(newScatterPositions)
    
    // Set appropriate word as scattered
    if (startIndex === 0) {
      setIsFirstNameScattered(true)
      setFirstNameReturned(0)
    } else {
      setIsLastNameScattered(true)
      setLastNameReturned(0)
    }
  }

  const handleFirstNameReturn = () => {
    setFirstNameReturned(prev => {
      const newCount = prev + 1
      if (newCount >= firstName.length) {
        setIsFirstNameScattered(false)
        return 0
      }
      return newCount
    })
  }

  const handleLastNameReturn = () => {
    setLastNameReturned(prev => {
      const newCount = prev + 1
      if (newCount >= lastName.length) {
        setIsLastNameScattered(false)
        return 0
      }
      return newCount
    })
  }

  return (
    <>
      <BackgroundElements />
      <ThrowableNavigation />

      {/* Gradient Line - Left side of name */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        <div 
          className="w-1.5 h-40 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, #8b7d6b 0%, #a09280 20%, #b4a694 40%, #c8bea8 60%, rgba(200, 190, 168, 0.6) 80%, rgba(200, 190, 168, 0.2) 90%, transparent 100%)',
            transform: 'translateX(-350px)'
          }}
        />
      </div>

      {/* Main interactive area */}
      <div className="fixed inset-0 overflow-hidden">
        <div 
          ref={containerRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'translateX(-40px)' }}
        >
          {/* Main container for names */}
          <div className="relative" style={{ width: '600px', height: '200px' }}>
            {/* First Name Group */}
            <WordGroup
              letters={firstName}
              startIndex={0}
              letterPositions={letterPositions}
              baseY={0}
              onScatter={handleScatter}
              isScattered={isFirstNameScattered}
              scatterPositions={scatterPositions}
              onReturnComplete={handleFirstNameReturn}
              returnedLetters={firstNameReturned}
            />
            
            {/* Last Name Group */}
            <WordGroup
              letters={lastName}
              startIndex={firstName.length + 1} // +1 for space
              letterPositions={letterPositions}
              baseY={100}
              onScatter={handleScatter}
              isScattered={isLastNameScattered}
              scatterPositions={scatterPositions}
              onReturnComplete={handleLastNameReturn}
              returnedLetters={lastNameReturned}
            />
          </div>
        </div>
      </div>
    </>
  )
}
