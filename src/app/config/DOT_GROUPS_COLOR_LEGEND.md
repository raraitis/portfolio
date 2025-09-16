# 🎨 D🟤 **BROWN** - Main sphere static dots (small dots on central sphere surface)
🔴 **RED** - Normal planet dots (the regular RED dots with ~100 small red dots each)  
🟫 **BEIGE** - Fat planet dots (2x bigger, 0.2x slower, beige color closer to brown with halos) - **3 out of 5 planets**
🔵 **BLUE** - Orbital big dots (the big BLUE dots with ~80 small blue dots each)
🟣 **PURPLE** - Static dot moons (small purple dots orbiting static dots) - **CURRENTLY NEON GREEN FOR DEBUGGING**
🟢 **GREEN** - Planet dot moons (green dots orbiting around RED/BEIGE planet dots)
🟡 **YELLOW** - Orbital big dot moons (yellow dots orbiting around BLUE orbital big dots)ps Color Legend for Development/Testing

This document defines the color scheme used during development to easily identify and reference different dot groups in the background animation system.

## Color Assignments

🟤 **BROWN** - Main sphere static dots (small dots on central sphere surface)
🔴 **RED** - Normal planet dots (the regular RED dots with ~100 small red dots each)  
� **AMBER** - Fat planet dots (2x bigger, 0.2x slower, dimmed amber color with halos) - **3 out of 5 planets**
�🔵 **BLUE** - Orbital big dots (the big BLUE dots with ~80 small blue dots each)
🟣 **PURPLE** - Static dot moons (small purple dots orbiting static dots) - **CURRENTLY NEON GREEN FOR DEBUGGING**
🟢 **GREEN** - Planet dot moons (green dots orbiting around RED/AMBER planet dots)
🟡 **YELLOW** - Orbital big dot moons (yellow dots orbiting around BLUE orbital big dots)

## Usage in Communication

When discussing changes or issues, refer to dot groups by their assigned colors:

- "The RED dots are too big" → Planet dots need size adjustment
- "The BLUE dot has too many small dots" → Orbital big dots mini-sphere density
- "The YELLOW moons are moving too fast" → Orbital big dot moon speeds
- "The BROWN dots on the main sphere look good" → Static dots are fine
- "The GREEN moons need different orbits" → Planet dot moon orbital properties
- "The PURPLE dots are barely visible" → Static dot moon visibility/alpha
- "The NEON GREEN dots are moving perfectly" → Static dot moon orbital mechanics (debugging)

## Technical Implementation

Each color group corresponds to specific code sections in `BackgroundElements.tsx`:

1. **BROWN (Main sphere static dots)**: Line ~505 - `ctx.fillStyle = rgba(139, 69, 19, ${baseAlpha})`
2. **RED (Planet dots)**: Line ~715 - Planet dot rendering with ~100 small dots each
3. **BLUE (Orbital big dots)**: Line ~945 - Orbital big dot rendering with ~80 small dots each  
4. **PURPLE (Static dot moons)**: Line ~831 - Static dot moon rendering
5. **GREEN (Planet dot moons)**: Line ~770 - Planet dot moon rendering
6. **YELLOW (Orbital big dot moons)**: Line ~975 - Orbital big dot moon rendering

## Current Configuration Parameters

### 🟤 BROWN - Main Sphere Static Dots
**Visual Properties:**
- **Shape**: Perfectly round circles with subtle halo effect
- **Color**: `rgba(139, 69, 19, ${baseAlpha})` (Saddle brown)
- **Halo**: Same brown color at 15% opacity, 60% larger radius
- **Size Range**: 1.5px - 4.5px (hardcoded, no randomization)
- **Position**: Grid pattern (28×28) on sphere surface with small random offsets
- **Total Count**: ~784 dots (filtered by sphere radius 0.9)

**Technical Details:**
- **Grid Resolution**: 28×28 
- **Sphere Radius**: 0.9 (keeps dots slightly inside sphere)
- **Base Offset Range**: -0.05 to +0.05 (small organic positioning variation)
- **Halo Size**: 1.6× main dot size
- **Halo Alpha**: 0.15× main dot alpha (very subtle)

### 🟣 PURPLE - Static Dot Moons (Currently NEON GREEN for debugging)
**Visual Properties:**
- **Shape**: Perfect circles
- **Color**: `rgba(0, 255, 0, 1.0)` (Bright neon green - debugging color)
- **Original Color**: Purple `rgba(128, 0, 128, 0.8)` 
- **Parent**: Orbit around BROWN static dots
- **Moon Size**: 20%-70% of parent dot size

**Orbital Configuration:**
- **Orbit Radius Range**: 4.0px - 12.0px (relative to parent dot size)
- **Orbit Speed Range**: 1.0 - 5.0 radians per time unit
- **Orbit Tilt Range**: 0° - 90° (0 = horizontal, 90° = vertical)
- **Moon Count**: 1-2 moons per eligible static dot
- **Animation**: Varied orbital mechanics with different speeds, sizes, and angles

**Example Configurations:**
- **Fast Large Orbit**: `orbitRadius: 8.0, orbitSpeed: 2.0, orbitTilt: 0.2` (nearly horizontal)
- **Fast Vertical Orbit**: `orbitRadius: 5.0, orbitSpeed: 4.0, orbitTilt: 1.4` (nearly vertical)
- **Slow Wide Orbit**: `orbitRadius: 10.0, orbitSpeed: 1.5, orbitTilt: 0.1` (wide horizontal sweep)
- **Dual Moon System**: Two moons with different speeds, sizes, and orbital planes

**Performance Notes:**
- All parameters are hardcoded (no Math.random() during runtime)
- Deterministic pseudo-random generation for dots beyond predefined configs
- Consistent orbital patterns across page refreshes

## Notes

- These colors are temporary for development/testing purposes
- Original subtle color scheme should be restored before production
- This color scheme makes it easy to identify performance issues, visual bugs, and configuration problems
- Each group has different animation properties, sizes, and behaviors that can be independently configured