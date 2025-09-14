# Portfolio Animation System Documentation

## Overview
This portfolio features a sophisticated multi-layered animation system that creates an immersive, interactive experience with three main components:

1. **Sphere-Under-Fabric Background Effect**
2. **Draggable Letter Scattering System** 
3. **Throwable Navigation Interface**

---

## 1. Sphere-Under-Fabric Background Effect

### Concept
An invisible sphere moves organically beneath a fabric-like layer of TV static particles. The sphere pushes the fabric particles upward and outward, creating a dynamic displacement effect that suggests depth and physicality.

### Technical Implementation
- **File**: `src/app/components/BackgroundElements.tsx`
- **Technology**: HTML5 Canvas with React + MobX
- **Pattern**: Observer pattern for reactive updates

### Key Features
- **Organic Motion**: Sphere follows elliptical orbit with layered sine wave variations
- **Fabric Displacement**: Particles get pushed away from sphere center with falloff
- **TV Static Effect**: Flickering particles with random intensity and phase variations
- **Responsive Density**: Particle count scales with screen size

### Animation Parameters
```typescript
// Sphere movement
const centerX = canvas.width * 0.7;
const centerY = canvas.height * 0.4;
const orbitRadius = 120;
const sphereX = centerX + Math.cos(time * 0.3) * orbitRadius + Math.sin(time * 0.7) * 30;
const sphereY = centerY + Math.sin(time * 0.2) * orbitRadius * 0.6 + Math.cos(time * 0.9) * 20;

// Fabric displacement
const sphereInfluenceRadius = sphereRadius * 2.0;
const pushStrength = 40 * Math.pow(influence, 1.2);
```

### Visual Effect
- Creates illusion of physical object moving beneath textured surface
- Particle displacement radius extends beyond visible sphere boundary
- Strength decreases exponentially from sphere center
- Subtle organic movement prevents static appearance

---

## 2. Draggable Name with Rubber Ball Physics

### Concept
The entire name "RAITIS KRASLOVSKIS" can be dragged as a single unit across the screen. When released, it drops with gravity-like physics to the bottom of the page. Upon hitting an invisible floor (10px from bottom), the name explodes into individual letters that scatter like rubber balls bouncing off the ground. Without pause, the letters gradually lose bounce power and rearrange themselves back into the original typography position.

### Technical Implementation
- **File**: `src/app/components/InteractiveTextSimple.tsx`
- **Technology**: React Spring + use-gesture for physics-based interactions
- **State Management**: Local component state with coordinated animation phases

### Animation Phases
1. **Normal State**: Name displays in original typography position
2. **Dragging State**: Entire name follows cursor with slight scale increase
3. **Dropping State**: Gravity-like drop animation with momentum
4. **Floor Impact**: Invisible collision detection triggers scattering
5. **Rubber Ball Scatter**: Letters explode outward with bounce physics
6. **Reassembly**: Gradual return to original positions with spring physics

### Physics Implementation
```typescript
// Drop with gravity
nameY.start({ 
  to: floorY, // window.innerHeight - 60 (invisible floor)
  config: { tension: 80, friction: 12, mass: 1.5 },
  onRest: () => scatterIntoLetters(dropX, floorY)
});

// Rubber ball scatter
const scatterRadius = 200 + Math.random() * 150;
const angle = (index / allLetters.length) * Math.PI * 2;
const letterPos = {
  x: centerX + Math.cos(angle) * scatterRadius,
  y: floorY - Math.random() * 300 - 50 // Bounce up from floor
};

// Spring-based reassembly
const { x, y, rotation } = useSpring({
  to: { x: finalX, y: finalY, rotation: 0 },
  config: { tension: 120, friction: 25, mass: 1.2 }
});
```

### Key Features
- **Single Unit Dragging**: Entire name moves as cohesive element
- **Gravity Physics**: Realistic drop animation with momentum
- **Floor Collision**: Invisible boundary triggers scatter effect
- **Rubber Ball Simulation**: Letters bounce and scatter naturally
- **Automatic Reassembly**: Seamless return to typography without user input
- **State Coordination**: Smooth transitions between animation phases

---

## 3. Throwable Navigation Interface

### Concept
Navigation words (HOME, ABOUT) can be grabbed, dragged, and thrown around the screen. They maintain their clickable functionality while providing kinetic interaction.

### Technical Implementation
- **File**: `src/app/components/ThrowableNavigation.tsx`
- **Technology**: React Spring + use-gesture with MobX state management
- **Integration**: Connected to animation store for global state updates

### Key Features
- **Persistent State**: Thrown positions are remembered during navigation
- **Click Protection**: Distinguishes between dragging and clicking for navigation
- **Velocity-Based Physics**: Smooth throwing mechanics with momentum
- **Background Response**: Dragging affects global background animation intensity

### Interaction Flow
1. **Hover**: Cursor changes to indicate draggability
2. **Drag**: Words follow mouse/touch with physics constraints
3. **Release**: 
   - Low velocity: Returns to current position
   - High velocity: Throws to new position and stays there
4. **Click**: Navigates only if not being dragged

---

## Animation Store Integration

### Global State Management
All animations are coordinated through `AnimationStore` (MobX):

```typescript
class AnimationStore {
  background = {
    spherePosition: { x: 0, y: 0 },
    intensity: 1.0,
    particleCount: 50
  }
  
  navigation = {
    items: [...], // Navigation item states
  }
  
  updateBackgroundIntensity() {
    // Increases intensity during interactions
    this.background.intensity = hasActiveDrag ? 1.5 : hasThrowItems ? 1.2 : 1.0
  }
}
```

### Cross-Component Communication
- **Letter dragging** → Increases background particle intensity
- **Navigation throwing** → Updates background responsiveness  
- **Sphere movement** → Influences fabric particle displacement
- **Global interactions** → Coordinated visual feedback

---

## Performance Considerations

### Optimization Strategies
1. **Canvas Rendering**: 60fps animation loop with requestAnimationFrame
2. **Particle Management**: Density scales with screen size
3. **Spring Physics**: Optimized React Spring configurations for smoothness
4. **Memory Management**: Proper cleanup of animation frames and event listeners

### Browser Compatibility
- **Modern browsers**: Full feature support with hardware acceleration
- **Touch devices**: Complete gesture support for mobile interactions
- **Fallbacks**: Graceful degradation for older browsers

---

## Styling System Integration

### CSS-in-JS Architecture
All animations use the centralized styling system:

```typescript
// From src/styles/index.ts
styles = {
  canvas: { background: { /* Canvas styles */ } },
  layout: { offsetContainer: { transform: 'translateX(-190px)' } },
  interactive: { 
    navWord: { position: 'absolute', touchAction: 'none' },
    draggable: { cursor: 'grab', transition: 'all 0.2s ease' }
  },
  gradients: { 
    line: { vertical: /* Gradient definition */ }
  }
}
```

### Design Philosophy
- **Minimal aesthetics** with sophisticated interactions
- **Physics-based movement** for natural feel
- **Consistent spacing** and typography through style system
- **Responsive design** adapting to all screen sizes

---

## Future Enhancements

### Potential Extensions
1. **Letter magnetism**: Letters could attract to each other when nearby
2. **Word reformation**: Automatic return to readable state after timeout
3. **Particle interactions**: Background particles could respond to letter positions
4. **Sound integration**: Audio feedback for interactions and throws
5. **Animation persistence**: Save scattered states between sessions

### Technical Improvements
1. **WebGL rendering**: Enhanced performance for complex particle systems
2. **Physics engine**: More sophisticated collision and momentum calculations
3. **Gesture recognition**: Advanced touch patterns for mobile interactions
4. **Accessibility options**: Reduced motion preferences and keyboard navigation

---

This animation system creates a cohesive, interactive experience that transforms a static portfolio into an engaging digital playground while maintaining professional aesthetics and performance.