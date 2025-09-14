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
  // Navigation state - HOME and ME only
  navigation = {
    items: [
      {
        word: 'HOME',
        position: { x: 0, y: 0 },
        originalPosition: { x: 0, y: 0 },
        href: '/',
        isDragging: false,
        isThrown: false,
      },
      {
        word: 'ME',
        position: { x: 100, y: 0 },
        originalPosition: { x: 100, y: 0 },
        href: '/contact',
        isDragging: false,
        isThrown: false,
      },
    ],
    activeWord: null as string | null,
  };

  // Background animation state
  background = {
    spherePosition: { x: 0, y: 0 },
    intensity: 1.0,
    particleCount: 50,
  };

  // Letter animation state (for future use)
  letters = {
    scatterMode: false,
    activeAnimations: 0,
  };

  constructor() {
    makeAutoObservable(this);
  }

  // Navigation actions
  updateNavPosition(word: string, position: Position) {
    const item = this.navigation.items.find((item) => item.word === word);
    if (item) {
      item.position = { ...position };
      item.isThrown = true;
    }
  }

  setNavDragging(word: string, isDragging: boolean) {
    const item = this.navigation.items.find((item) => item.word === word);
    if (item) {
      item.isDragging = isDragging;
    }
    this.navigation.activeWord = isDragging ? word : null;
  }

  resetNavPositions() {
    this.navigation.items.forEach((item) => {
      item.position = { ...item.originalPosition };
      item.isDragging = false;
      item.isThrown = false;
    });
    this.navigation.activeWord = null;
  }

  getNavItem(word: string) {
    return this.navigation.items.find((item) => item.word === word);
  }

  // Background actions
  updateBackgroundIntensity() {
    const hasActiveDrag = this.navigation.items.some((item) => item.isDragging);
    const hasThrowItems = this.navigation.items.some((item) => item.isThrown);

    this.background.intensity = hasActiveDrag ? 1.5 : hasThrowItems ? 1.2 : 1.0;
  }

  updateSpherePosition(position: Position) {
    this.background.spherePosition = { ...position };
  }

  // Gravitational influence methods
  calculateGravitationalPull(
    elementPosition: Position,
    elementRadius: number = 50
  ) {
    const dx = this.background.spherePosition.x - elementPosition.x;
    const dy = this.background.spherePosition.y - elementPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Sphere has influence radius
    const sphereRadius = 150; // Base influence radius
    const maxInfluence = sphereRadius + elementRadius;

    if (distance < maxInfluence && distance > 0) {
      // Calculate gravitational strength (stronger closer to sphere)
      const influence = 1 - distance / maxInfluence;
      const pullStrength = influence * 25; // Max pull strength

      // Calculate pull direction (toward sphere center)
      const pullX = (dx / distance) * pullStrength;
      const pullY = (dy / distance) * pullStrength;

      return {
        pullX,
        pullY,
        influence,
        distance,
        isInGravityField: true,
      };
    }

    return {
      pullX: 0,
      pullY: 0,
      influence: 0,
      distance,
      isInGravityField: false,
    };
  }

  // Check if element is in gravity field (for visual feedback)
  isInGravityField(elementPosition: Position, elementRadius: number = 50) {
    const gravity = this.calculateGravitationalPull(
      elementPosition,
      elementRadius
    );
    return gravity.isInGravityField;
  }

  // Letter actions (for future complex animations)
  setScatterMode(active: boolean) {
    this.letters.scatterMode = active;
  }

  incrementActiveAnimations() {
    this.letters.activeAnimations++;
  }

  decrementActiveAnimations() {
    this.letters.activeAnimations = Math.max(
      0,
      this.letters.activeAnimations - 1
    );
  }

  // Computed values
  get hasActiveAnimations() {
    return (
      this.navigation.items.some((item) => item.isDragging) ||
      this.letters.activeAnimations > 0
    );
  }

  get navigationActivity() {
    const dragCount = this.navigation.items.filter(
      (item) => item.isDragging
    ).length;
    const thrownCount = this.navigation.items.filter(
      (item) => item.isThrown
    ).length;
    return { dragCount, thrownCount, total: dragCount + thrownCount };
  }
}

// Create singleton instance
export const animationStore = new AnimationStore()
export default AnimationStore