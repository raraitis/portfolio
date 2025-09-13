'use client'

import { useRef, useState, useEffect } from 'react'
import { useSpring, animated, useSpringValue } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

// Enhanced Navigation with throwable words
function ThrowableNavigation() {
  const [positions, setPositions] = useState([
    { word: 'WORK', x: 0, y: 0, originalX: 0, originalY: 0, href: '/work' },
    { word: 'ABOUT', x: 0, y: 0, originalX: 100, originalY: 0, href: '/about' },
    { word: 'CONTACT', x: 0, y: 0, originalX: 200, originalY: 0, href: '/contact' }
  ])

  const NavWord = ({ word, x, y, href, index }: any) => {
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

const Letter = ({ 
  letter, 
  index, 
  originalX, 
  originalY, 
  wordOffset, 
  isScattered, 
  scatterPosition,
  onReturnComplete,
  rubberOffset = { x: 0, y: 0 }
}: LetterProps) => {
  const [isDraggedIndividually, setIsDraggedIndividually] = useState(false)
  const [individualOffset, setIndividualOffset] = useState({ x: 0, y: 0 })
  const [shouldReturn, setShouldReturn] = useState(false)
  
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

  // Individual letter drag (when scattered)
  const bind = useDrag(({ 
    active, 
    movement: [mx, my],
    velocity: [vx, vy]
  }) => {
    if (!isScattered) return
    
    setIsDraggedIndividually(active)
    
    if (active) {
      // Being dragged individually - stop any return movement
      setShouldReturn(false)
      setIndividualOffset({ x: mx, y: my })
      x.set(scatterPosition.x + mx)
      y.set(scatterPosition.y + my)
      api.start({ scale: 1.3 })
    } else {
      // Released - check if thrown
      const speed = Math.sqrt(vx * vx + vy * vy)
      
      if (speed > 0.4) {
        // Thrown! Generate new scatter position
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight
        const newScatterX = (Math.random() - 0.5) * (screenWidth - 200)
        const newScatterY = (Math.random() - 0.5) * (screenHeight - 200)
        
        // Update individual position
        setIndividualOffset({ x: newScatterX, y: newScatterY })
        
        // Animate to new position
        x.start({
          to: newScatterX,
          config: { tension: 150, friction: 20 }
        })
        y.start({
          to: newScatterY,
          config: { tension: 150, friction: 20 }
        })
        
        // Start return process after short delay
        setTimeout(() => {
          setShouldReturn(true)
        }, 200)
      } else {
        // Just dropped - stay here and start returning
        setIndividualOffset({ x: mx, y: my })
        setTimeout(() => {
          setShouldReturn(true)
        }, 100)
      }
      
      api.start({ scale: 1 })
    }
  })

  // Update position when word moves or scatters
  useEffect(() => {
    if (isScattered && !isDraggedIndividually) {
      if (shouldReturn) {
        // Start continuous bouncy return movement
        returnHome()
      } else {
        // Initial scatter with immediate bouncy movement
        const targetX = scatterPosition.x + individualOffset.x
        const targetY = scatterPosition.y + individualOffset.y
        
        x.start({
          to: targetX,
          config: { tension: 120, friction: 15, mass: 0.8 }
        })
        y.start({
          to: targetY,
          config: { tension: 120, friction: 15, mass: 0.8 }
        })
        
        // Visual effects for scatter
        api.start({ 
          scale: 0.8 + Math.random() * 0.2, 
          rotate: (Math.random() - 0.5) * 360,
          opacity: 0.85
        })
        
        // Start return immediately with short delay (no pause!)
        setTimeout(() => {
          setShouldReturn(true)
        }, 100 + Math.random() * 200)
      }
    } else if (!isScattered) {
      // Follow word position with rubber physics
      x.start({
        to: originalX + wordOffset.x + rubberOffset.x,
        config: { tension: 250, friction: 20 }
      })
      y.start({
        to: originalY + wordOffset.y + rubberOffset.y,
        config: { tension: 250, friction: 20 }
      })
      
      // Reset individual states when not scattered
      setIndividualOffset({ x: 0, y: 0 })
      setShouldReturn(false)
    }
  }, [wordOffset, isScattered, scatterPosition, rubberOffset, shouldReturn])

  const returnHome = () => {
    if (isDraggedIndividually) return // Don't return if being held
    
    // Animate back to original position with bouncy physics (no pause!)
    x.start({
      to: originalX,
      config: { tension: 100, friction: 15, mass: 1.2 }
    })
    y.start({
      to: originalY,
      config: { tension: 100, friction: 15, mass: 1.2 }
    })
    
    // Reset states
    setIndividualOffset({ x: 0, y: 0 })
    setShouldReturn(false)
    
    // Reset visual effects with bounce
    api.start({ 
      scale: 1, 
      rotate: 0,
      opacity: 1,
      config: { tension: 200, friction: 20 }
    })
    
    // Notify parent when return animation completes
    setTimeout(() => {
      if (!isDraggedIndividually) {
        onReturnComplete()
      }
    }, 1200 + Math.random() * 300)
  }

  return (
    <animated.span
      {...bind()}
      style={{
        position: 'absolute',
        x,
        y,
        scale,
        rotate,
        opacity,
        transformOrigin: 'center center',
        cursor: isScattered ? 'grab' : 'pointer',
        touchAction: 'none',
        zIndex: isDraggedIndividually ? 20 : (isScattered ? 15 : 10)
      }}
      className={`text-6xl md:text-8xl font-light select-none ${
        letter === ' ' ? 'pointer-events-none' : ''
      } ${
        isScattered ? 'text-gray-600' : 'text-gray-800'
      }`}
    >
      {letter === ' ' ? '\u00A0' : letter}
    </animated.span>
  )
}

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

const WordGroup = ({ 
  letters, 
  startIndex, 
  letterPositions, 
  baseY, 
  onScatter, 
  isScattered,
  scatterPositions,
  onReturnComplete,
  returnedLetters
}: WordGroupProps) => {
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

export default function InteractiveText() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [letterPositions, setLetterPositions] = useState<Array<{x: number, y: number}>>([])
  const [isFirstNameScattered, setIsFirstNameScattered] = useState(false)
  const [isLastNameScattered, setIsLastNameScattered] = useState(false)
  const [scatterPositions, setScatterPositions] = useState<Array<{x: number, y: number}>>([])
  const [firstNameReturned, setFirstNameReturned] = useState(0)
  const [lastNameReturned, setLastNameReturned] = useState(0)
  
  const firstName = "RAITIS"
  const lastName = "KRASLOVSKIS"

  // Calculate letter positions when component mounts
  useEffect(() => {
    // Create temporary elements to measure text
    const measureElement = document.createElement('span')
    measureElement.style.fontSize = window.innerWidth >= 768 ? '6rem' : '4rem'
    measureElement.style.fontWeight = '300'
    measureElement.style.visibility = 'hidden'
    measureElement.style.position = 'absolute'
    document.body.appendChild(measureElement)
    
    const positions: Array<{x: number, y: number}> = []
    let currentX = 0
    
    // Measure first name
    for (let i = 0; i < firstName.length; i++) {
      measureElement.textContent = firstName[i]
      const letterRect = measureElement.getBoundingClientRect()
      positions.push({ x: currentX, y: 0 })
      currentX += letterRect.width
    }
    
    // Add space
    measureElement.textContent = '\u00A0'
    const spaceWidth = measureElement.getBoundingClientRect().width
    positions.push({ x: currentX, y: 0 })
    currentX += spaceWidth
    
    // Measure last name (new line)
    let lastNameX = 0
    for (let i = 0; i < lastName.length; i++) {
      measureElement.textContent = lastName[i]
      const letterRect = measureElement.getBoundingClientRect()
      positions.push({ x: lastNameX, y: letterRect.height * 0.9 })
      lastNameX += letterRect.width
    }
    
    document.body.removeChild(measureElement)
    setLetterPositions(positions)
  }, [firstName, lastName])

  const handleScatter = (startIndex: number, letterCount: number) => {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight
    
    // Generate random positions for scattered letters (avoiding borders)
    const newScatterPositions = [...scatterPositions]
    for (let i = 0; i < letterCount; i++) {
      const globalIndex = startIndex + i
      newScatterPositions[globalIndex] = {
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
      {/* Background with gradient, sphere, and dot pattern */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(245, 238, 231, 0.8) 0%, transparent 50%),
              linear-gradient(135deg, #f5f0e8 0%, #f0ebe2 25%, #ede8dc 50%, #e8e3d6 75%, #e3ded0 100%)
            `
          }}
        />
        
        {/* Dot pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139, 125, 107, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Gravity sphere */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(139, 125, 107, 0.4) 0%, transparent 70%)',
            right: '10%',
            top: '20%',
            filter: 'blur(40px)'
          }}
        />
      </div>

      {/* Visual frame border */}
      <div className="fixed inset-0 pointer-events-none z-30">
        <div 
          className="absolute inset-5 rounded-lg"
          style={{ 
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: '#a09280',
            opacity: 0.4 
          }}
        />
      </div>

      {/* Throwable Navigation */}
      <ThrowableNavigation />

      {/* Gradient Line - Left side of name */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-20">
        <div 
          className="w-1.5 h-24 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, #8b7d6b 0%, #a09280 30%, #b4a694 60%, #c8bea8 100%)',
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
