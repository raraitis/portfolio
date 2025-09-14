import { makeAutoObservable } from 'mobx'

interface Position {
  x: number
  y: number
}

interface NavItem {
  word: string
  position: Position
  originalPosition: Position
  href: string
  isDragging: boolean
  isThrown: boolean
}

class AnimationStore {
  // Navigation state - HOME, ABOUT, CONTACT only (no WORK)
  navigation = {
    items: [
      {
        word: 'HOME',
        position: { x: 0, y: 0 },
        originalPosition: { x: 0, y: 0 },
        href: '/',
        isDragging: false,
        isThrown: false
      },
      {
        word: 'ABOUT',
        position: { x: 100, y: 0 },
        originalPosition: { x: 100, y: 0 },
        href: '/about',
        isDragging: false,
        isThrown: false
      },
      {
        word: 'CONTACT',
        position: { x: 200, y: 0 },
        originalPosition: { x: 200, y: 0 },
        href: '/contact',
        isDragging: false,
        isThrown: false
      }
    ],
    activeWord: null as string | null
  }

  // Background animation state
  background = {
    spherePosition: { x: 0, y: 0 },
    intensity: 1.0,
    particleCount: 50
  }

  // Letter animation state (for future use)
  letters = {
    scatterMode: false,
    activeAnimations: 0
  }

  constructor() {
    makeAutoObservable(this)
  }

  // Navigation actions
  updateNavPosition(word: string, position: Position) {
    const item = this.navigation.items.find(item => item.word === word)
    if (item) {
      item.position = { ...position }
      item.isThrown = true
    }
  }

  setNavDragging(word: string, isDragging: boolean) {
    const item = this.navigation.items.find(item => item.word === word)
    if (item) {
      item.isDragging = isDragging
    }
    this.navigation.activeWord = isDragging ? word : null
  }

  resetNavPositions() {
    this.navigation.items.forEach(item => {
      item.position = { ...item.originalPosition }
      item.isDragging = false
      item.isThrown = false
    })
    this.navigation.activeWord = null
  }

  getNavItem(word: string) {
    return this.navigation.items.find(item => item.word === word)
  }

  // Background actions
  updateBackgroundIntensity() {
    const hasActiveDrag = this.navigation.items.some(item => item.isDragging)
    const hasThrowItems = this.navigation.items.some(item => item.isThrown)
    
    this.background.intensity = hasActiveDrag ? 1.5 : hasThrowItems ? 1.2 : 1.0
  }

  updateSpherePosition(position: Position) {
    this.background.spherePosition = { ...position }
  }

  // Letter actions (for future complex animations)
  setScatterMode(active: boolean) {
    this.letters.scatterMode = active
  }

  incrementActiveAnimations() {
    this.letters.activeAnimations++
  }

  decrementActiveAnimations() {
    this.letters.activeAnimations = Math.max(0, this.letters.activeAnimations - 1)
  }

  // Computed values
  get hasActiveAnimations() {
    return this.navigation.items.some(item => item.isDragging) || 
           this.letters.activeAnimations > 0
  }

  get navigationActivity() {
    const dragCount = this.navigation.items.filter(item => item.isDragging).length
    const thrownCount = this.navigation.items.filter(item => item.isThrown).length
    return { dragCount, thrownCount, total: dragCount + thrownCount }
  }
}

// Create singleton instance
export const animationStore = new AnimationStore()
export default AnimationStore