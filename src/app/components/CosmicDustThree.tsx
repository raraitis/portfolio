'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CosmicDustThreeProps {
  centerX: number;
  centerY: number;
  radius: number;
  intensity?: number;
}

// ============= CONFIGURABLE CONSTANTS =============
const PARTICLE_COUNT = 8000;
const SWIRL_SPEED = 0.08; // Main galaxy swirl speed
const BASE_RADIUS = 200; // Size of the ball - extends beyond screen

// Chaotic particles - these do random circular movements
const CHAOTIC_RATIO = 0.2; // 10% of particles are chaotic
const CHAOTIC_SPEED_MIN = 0.05; // Min chaotic orbit speed
const CHAOTIC_SPEED_MAX = 0.3; // Max chaotic orbit speed
// ===================================================

// Custom shader for non-circular particles
const vertexShader = `
  attribute float size;
  attribute float shape;
  varying float vShape;
  varying float vAlpha;

  void main() {
    vShape = shape;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // Distance-based fade
    float dist = length(position.xy);
    vAlpha = smoothstep(3000.0, 0.0, dist) * 0.9;

    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  varying float vShape;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float alpha = 0.0;

    // Different shapes based on vShape
    if (vShape < 0.25) {
      // Diamond
      float d = abs(uv.x) + abs(uv.y);
      alpha = 1.0 - smoothstep(0.3, 0.5, d);
    } else if (vShape < 0.5) {
      // Elongated ellipse
      float d = length(vec2(uv.x * 2.5, uv.y));
      alpha = 1.0 - smoothstep(0.2, 0.45, d);
    } else if (vShape < 0.75) {
      // Triangle-ish
      float d = max(abs(uv.x) * 1.8, uv.y + 0.25);
      alpha = 1.0 - smoothstep(0.2, 0.4, d);
    } else {
      // Cross/star
      float d1 = abs(uv.x * 4.0) + abs(uv.y);
      float d2 = abs(uv.x) + abs(uv.y * 4.0);
      alpha = 1.0 - smoothstep(0.15, 0.4, min(d1, d2));
    }

    // Neon red for debug
    vec3 color = vec3(1.0, 0.1, 0.05);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

const CosmicDustThree = ({ centerX, centerY }: CosmicDustThreeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);

  // Store particle data for animation
  const dataRef = useRef<{
    angles: Float32Array;
    distances: Float32Array;
    speeds: Float32Array;
    isChaotic: Uint8Array; // 1 = chaotic, 0 = normal
    chaoticOrbitRadius: Float32Array; // Orbit radius for chaotic particles
    chaoticOrbitSpeed: Float32Array; // Orbit speed for chaotic particles
    chaoticOrbitAngle: Float32Array; // Current orbit angle for chaotic particles
    chaoticCenterX: Float32Array; // Center X of chaotic orbit
    chaoticCenterY: Float32Array; // Center Y of chaotic orbit
  } | null>(null);

  // Initialize Three.js scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera (orthographic for 2D-like view)
    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2,
      height / 2, -height / 2,
      1, 1000
    );
    camera.position.z = 500;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const shapes = new Float32Array(PARTICLE_COUNT);

    // Animation data
    const angles = new Float32Array(PARTICLE_COUNT);
    const distances = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const depths = new Float32Array(PARTICLE_COUNT);

    // Chaotic particle data
    const isChaotic = new Uint8Array(PARTICLE_COUNT);
    const chaoticOrbitRadius = new Float32Array(PARTICLE_COUNT);
    const chaoticOrbitSpeed = new Float32Array(PARTICLE_COUNT);
    const chaoticOrbitAngle = new Float32Array(PARTICLE_COUNT);
    const chaoticCenterX = new Float32Array(PARTICLE_COUNT);
    const chaoticCenterY = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Initial angle
      angles[i] = Math.random() * Math.PI * 2;

      // BALL shape - particles distributed from center outward (no empty center)
      const r = Math.random();
      // Use sqrt for more uniform 2D distribution (area increases with radius)
      const normalizedDist = Math.sqrt(r);
      distances[i] = normalizedDist * BASE_RADIUS;

      // Random depth for parallax
      depths[i] = 0.3 + Math.random() * 0.7;

      // Determine if this particle is chaotic
      isChaotic[i] = Math.random() < CHAOTIC_RATIO ? 1 : 0;

      if (isChaotic[i]) {
        // Chaotic particle - random circular orbit
        chaoticOrbitRadius[i] = 20 + Math.random() * 80; // Small orbit radius
        chaoticOrbitSpeed[i] = CHAOTIC_SPEED_MIN + Math.random() * (CHAOTIC_SPEED_MAX - CHAOTIC_SPEED_MIN);
        // Random direction (positive or negative)
        if (Math.random() < 0.5) chaoticOrbitSpeed[i] *= -1;
        chaoticOrbitAngle[i] = Math.random() * Math.PI * 2;
        // Center of chaotic orbit is the particle's base position
        chaoticCenterX[i] = Math.cos(angles[i]) * distances[i];
        chaoticCenterY[i] = Math.sin(angles[i]) * distances[i];
        // Speed for chaotic is independent
        speeds[i] = 0; // Chaotic particles don't do main swirl
      } else {
        // Normal particle - main swirl
        speeds[i] = (1.5 - depths[i]) * (0.7 + Math.random() * 0.6);
        chaoticOrbitRadius[i] = 0;
        chaoticOrbitSpeed[i] = 0;
        chaoticOrbitAngle[i] = 0;
        chaoticCenterX[i] = 0;
        chaoticCenterY[i] = 0;
      }

      // Initial position
      const x = Math.cos(angles[i]) * distances[i];
      const y = Math.sin(angles[i]) * distances[i];
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = depths[i] * 100;

      // Size varies by depth
      const depthSize = (1.5 - depths[i]) * 2;
      sizes[i] = (3 + Math.random() * 6) * depthSize;

      // Shape type
      shapes[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('shape', new THREE.BufferAttribute(shapes, 1));

    // Store animation data
    dataRef.current = {
      angles,
      distances,
      speeds,
      isChaotic,
      chaoticOrbitRadius,
      chaoticOrbitSpeed,
      chaoticOrbitAngle,
      chaoticCenterX,
      chaoticCenterY,
    };

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Create points
    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);

    // Animation loop
    let time = 0;
    const animate = () => {
      time += 0.016; // ~60fps

      if (particlesRef.current && dataRef.current) {
        const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const data = dataRef.current;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          if (data.isChaotic[i]) {
            // Chaotic particle - circular orbit around its center point
            data.chaoticOrbitAngle[i] += data.chaoticOrbitSpeed[i] * 0.016;

            const orbitX = Math.cos(data.chaoticOrbitAngle[i]) * data.chaoticOrbitRadius[i];
            const orbitY = Math.sin(data.chaoticOrbitAngle[i]) * data.chaoticOrbitRadius[i];

            posArray[i * 3] = data.chaoticCenterX[i] + orbitX;
            posArray[i * 3 + 1] = data.chaoticCenterY[i] + orbitY;
          } else {
            // Normal particle - main swirl
            const newAngle = data.angles[i] + time * SWIRL_SPEED * data.speeds[i];

            // Slight wobble
            const wobble = Math.sin(time * 0.3 + i * 0.1) * data.distances[i] * 0.03;

            const x = Math.cos(newAngle) * (data.distances[i] + wobble);
            const y = Math.sin(newAngle) * (data.distances[i] + wobble);

            posArray[i * 3] = x;
            posArray[i * 3 + 1] = y;
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      frameIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (cameraRef.current) {
        cameraRef.current.left = -w / 2;
        cameraRef.current.right = w / 2;
        cameraRef.current.top = h / 2;
        cameraRef.current.bottom = -h / 2;
        cameraRef.current.updateProjectionMatrix();
      }
      if (rendererRef.current) {
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
    };
  }, []); // Empty deps - only run once

  // Update position when center changes
  useEffect(() => {
    if (particlesRef.current) {
      particlesRef.current.position.set(
        centerX - window.innerWidth / 2,
        -(centerY - window.innerHeight / 2),
        0
      );
    }
  }, [centerX, centerY]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
};

export default CosmicDustThree;
