'use client'

import { useState, useEffect } from 'react'

interface TypewriterProps {
  text: string
  delay?: number
  className?: string
}

export default function Typewriter({ text, delay = 100, className = '' }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, delay)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, delay])

  return (
    <div className={className}>
      <span className="font-mono text-gray-700">
        {displayText}
        {currentIndex < text.length && (
          <span className="animate-pulse text-gray-500">|</span>
        )}
      </span>
    </div>
  )
}