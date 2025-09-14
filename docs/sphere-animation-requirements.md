# Sphere Animation Requirements

## Visual Concept
The sphere animation should create the effect of a **sphere object moving under a silky fabric**, combined with a **dotted pattern reminiscent of old TV static** when there was no channel.

## Key Design Elements

### 1. Sphere Under Fabric Effect
- **Visibility**: The sphere should be more visible than current implementation
- **Fabric simulation**: The sphere should appear to push up against a flexible surface
- **Smooth deformation**: The "fabric" should smoothly deform around the moving sphere
- **Depth perception**: Clear sense that the sphere is underneath a surface layer

### 2. Dotted Pattern (TV Static Style)
- **Dot distribution**: Random, scattered dots like old TV snow/static
- **Density**: Dense enough to create texture but not overwhelming
- **Size variation**: Mixed dot sizes for authentic static feel
- **Intensity**: Dots should flicker/vary in intensity like TV interference

### 3. Animation Behavior
- **Sphere movement**: Slow, organic orbital motion
- **Fabric response**: Dots should be displaced/attracted by sphere's position
- **Dynamic intensity**: Pattern intensity should respond to user interactions
- **Smooth transitions**: All animations should be fluid and natural

### 4. Interactive Elements
- **Navigation response**: Sphere and pattern react to navigation dragging
- **Letter scatter response**: Pattern intensifies during letter animations
- **Subtle feedback**: Visual feedback for user interactions without being distracting

## Technical Notes
- Use canvas-based rendering for performance
- Implement proper layering (sphere below dots)
- Ensure responsive behavior across screen sizes
- Maintain 60fps performance target

## Visual References
- Old TV static/snow pattern
- Sphere pushing through silk fabric
- Organic, fluid motion
- Subtle but noticeable visual presence

---
*Last updated: September 14, 2025*