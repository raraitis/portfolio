'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CosmicDustThreeProps {
  centerX: number;
  centerY: number;
}

// ============= BALL CONFIGURATION TYPE =============
interface BallConfig {
  id: string;
  color: { r: number; g: number; b: number }; // RGB 0-1
  particleCount: number;
  radius: number; // Size of the ball
  orbitRadius: number; // Semi-major axis (average distance from parent/center)
  orbitEccentricity: number; // 0 = circle, 0.5 = ellipse, closer to 1 = very elongated
  orbitTilt: number; // Orbital plane tilt in radians (0 = flat, PI/2 = vertical)
  orbitSpeed: number; // How fast it orbits
  spinSpeed: number; // How fast it spins on its axis
  swirlSpeed: number; // Internal particle swirl
  chaoticRatio: number; // % of chaotic particles
  chaoticSpeedMin: number;
  chaoticSpeedMax: number;
  parentId: string | null; // ID of parent ball (null = orbits center/user)
}

// ============= BALL CONFIGURATIONS =============
const BALLS: BallConfig[] = [
  {
    id: 'main-ball',
    color: { r: 0.25, g: 0.27, b: 0.24 }, // Dark charcoal/olive - clearly visible
    particleCount: 8000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4, // Elliptical orbit (like planets)
    orbitTilt: 1.4, // Nearly vertical - ball goes in front and behind the user
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null, // Orbits the user/center
  },
  {
    id: 'child-ball',
    color: { r: 0.6, g: 0.45, b: 0.3 }, // Warm caramel/tan - distinct from main ball
    particleCount: 4000,
    radius: 120, // Smaller
    orbitRadius: 400, // Distance from main ball
    orbitEccentricity: 0.3, // Less elliptical for clearer orbit
    orbitTilt: 0.4, // Low tilt = mostly horizontal orbit, goes IN FRONT and BEHIND parent
    orbitSpeed: 0.4, // Orbit speed
    spinSpeed: 0.25,
    swirlSpeed: 0.12,
    chaoticRatio: 0.25,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.4,
    parentId: 'main-ball', // Orbits the main ball
  },
];
// ===================================================

// Generate vertex shader with dynamic color
const createVertexShader = () => `
  attribute float size;
  attribute float shape;
  attribute vec3 ballColor;
  varying float vShape;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vShape = shape;
    vColor = ballColor;
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
  varying vec3 vColor;

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

    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

// Ball data structure for animation
interface BallData {
  config: BallConfig;
  // Spherical coordinates for each particle (for Earth-like rotation)
  theta: Float32Array; // Longitude angle (0 to 2PI) - rotated by spin
  phi: Float32Array; // Latitude angle (0 to PI) - stays fixed
  distances: Float32Array; // Distance from ball center
  speeds: Float32Array;
  isChaotic: Uint8Array;
  chaoticOrbitRadius: Float32Array;
  chaoticOrbitSpeed: Float32Array;
  chaoticOrbitAngle: Float32Array;
  chaoticCenterX: Float32Array;
  chaoticCenterY: Float32Array;
  startIndex: number; // Start index in the combined position array
  // Current ball center position (updated each frame)
  centerX: number;
  centerY: number;
  centerZ: number; // Depth - positive = in front, negative = behind
  // Base sizes for depth scaling
  baseSizes: Float32Array;
}

const CosmicDustThree = ({ centerX, centerY }: CosmicDustThreeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number>(0);
  const ballDataRef = useRef<Map<string, BallData>>(new Map());

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
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

    // Calculate total particle count
    const totalParticles = BALLS.reduce((sum, ball) => sum + ball.particleCount, 0);

    // Create combined geometry for all balls
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
    const shapes = new Float32Array(totalParticles);
    const colors = new Float32Array(totalParticles * 3);

    // Initialize ball data and particles
    let currentIndex = 0;
    const ballDataMap = new Map<string, BallData>();

    for (const config of BALLS) {
      const count = config.particleCount;
      const startIndex = currentIndex;

      // Create ball data
      const ballData: BallData = {
        config,
        theta: new Float32Array(count), // Longitude (0 to 2PI) - rotated by spin
        phi: new Float32Array(count), // Latitude (0 to PI) - fixed
        distances: new Float32Array(count),
        speeds: new Float32Array(count),
        isChaotic: new Uint8Array(count),
        chaoticOrbitRadius: new Float32Array(count),
        chaoticOrbitSpeed: new Float32Array(count),
        chaoticOrbitAngle: new Float32Array(count),
        chaoticCenterX: new Float32Array(count),
        chaoticCenterY: new Float32Array(count),
        startIndex,
        centerX: 0,
        centerY: 0,
        centerZ: 0, // Depth position
        baseSizes: new Float32Array(count), // Store base sizes for depth scaling
      };

      // Initialize particles for this ball using spherical coordinates
      for (let i = 0; i < count; i++) {
        const globalIndex = startIndex + i;

        // Spherical coordinates for Earth-like rotation
        ballData.theta[i] = Math.random() * Math.PI * 2; // Longitude (0 to 2PI)
        ballData.phi[i] = Math.acos(1 - 2 * Math.random()); // Latitude (0 to PI) - uniform sphere distribution

        // Distance from center (ball shape distribution - filled sphere)
        const r = Math.random();
        const normalizedDist = Math.cbrt(r); // Cube root for uniform volume distribution
        ballData.distances[i] = normalizedDist * config.radius;

        // Chaotic particles
        ballData.isChaotic[i] = Math.random() < config.chaoticRatio ? 1 : 0;

        if (ballData.isChaotic[i]) {
          ballData.chaoticOrbitRadius[i] = 20 + Math.random() * 80;
          ballData.chaoticOrbitSpeed[i] =
            config.chaoticSpeedMin + Math.random() * (config.chaoticSpeedMax - config.chaoticSpeedMin);
          if (Math.random() < 0.5) ballData.chaoticOrbitSpeed[i] *= -1;
          ballData.chaoticOrbitAngle[i] = Math.random() * Math.PI * 2;
          // Calculate initial position for chaotic center
          const sinPhi = Math.sin(ballData.phi[i]);
          const cosPhi = Math.cos(ballData.phi[i]);
          ballData.chaoticCenterX[i] = Math.cos(ballData.theta[i]) * sinPhi * ballData.distances[i];
          ballData.chaoticCenterY[i] = cosPhi * ballData.distances[i];
          ballData.speeds[i] = 0;
        } else {
          ballData.speeds[i] = 0.7 + Math.random() * 0.6;
        }

        // Calculate initial 3D position from spherical coordinates
        const sinPhi = Math.sin(ballData.phi[i]);
        const cosPhi = Math.cos(ballData.phi[i]);
        const x = Math.cos(ballData.theta[i]) * sinPhi * ballData.distances[i];
        const y = cosPhi * ballData.distances[i]; // Y is the vertical axis (poles)
        const z = Math.sin(ballData.theta[i]) * sinPhi * ballData.distances[i];

        positions[globalIndex * 3] = x;
        positions[globalIndex * 3 + 1] = y;
        positions[globalIndex * 3 + 2] = z;

        // Size - vary by distance from center (inner particles slightly smaller)
        const distanceFactor = normalizedDist; // 0 to 1
        const baseSize = (6 + Math.random() * 10) * (0.8 + distanceFactor * 0.4);
        sizes[globalIndex] = baseSize;
        ballData.baseSizes[i] = baseSize;

        // Shape
        shapes[globalIndex] = Math.random();

        // Color
        colors[globalIndex * 3] = config.color.r;
        colors[globalIndex * 3 + 1] = config.color.g;
        colors[globalIndex * 3 + 2] = config.color.b;
      }

      ballDataMap.set(config.id, ballData);
      currentIndex += count;
    }

    ballDataRef.current = ballDataMap;

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('shape', new THREE.BufferAttribute(shapes, 1));
    geometry.setAttribute('ballColor', new THREE.BufferAttribute(colors, 3));

    // Material
    const material = new THREE.ShaderMaterial({
      vertexShader: createVertexShader(),
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
      time += 0.016;

      if (particlesRef.current && ballDataRef.current.size > 0) {
        const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

        // First pass: calculate ball centers for ROOT balls (no parent)
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          if (config.parentId === null) {
            // Root ball - orbits around center (0, 0) in 3D ellipse
            const orbitAngle = time * config.orbitSpeed;
            // Elliptical orbit: semi-major axis (a) and semi-minor axis (b)
            const a = config.orbitRadius;
            const b = a * Math.sqrt(1 - config.orbitEccentricity * config.orbitEccentricity);

            // Calculate flat orbit position first
            const flatX = Math.cos(orbitAngle) * a;
            const flatY = Math.sin(orbitAngle) * b;

            // Apply orbital tilt - rotate around X axis
            // This makes the orbit go "in front" and "behind"
            const tiltCos = Math.cos(config.orbitTilt);
            const tiltSin = Math.sin(config.orbitTilt);
            ballData.centerX = flatX;
            ballData.centerY = flatY * tiltCos;
            ballData.centerZ = flatY * tiltSin; // Z = depth (positive = front)
          }
        }

        // Second pass: calculate ball centers for CHILD balls (have parent)
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          if (config.parentId !== null) {
            const parentData = ballDataRef.current.get(config.parentId);
            if (parentData) {
              const orbitAngle = time * config.orbitSpeed;
              // Elliptical orbit around parent in 3D
              const a = config.orbitRadius;
              const b = a * Math.sqrt(1 - config.orbitEccentricity * config.orbitEccentricity);

              // Calculate orbit in XZ plane (horizontal) - this makes the child go AROUND the parent
              // X = left/right, Z = front/back (depth)
              const orbitX = Math.cos(orbitAngle) * a;
              const orbitZ = Math.sin(orbitAngle) * b;

              // Apply orbital tilt - tilts the horizontal orbit to add some vertical movement
              const tiltCos = Math.cos(config.orbitTilt);
              const tiltSin = Math.sin(config.orbitTilt);
              const localX = orbitX;
              const localY = orbitZ * tiltSin;  // Vertical offset from tilted orbit
              const localZ = orbitZ * tiltCos;  // Depth (front/back)

              // Add parent position
              ballData.centerX = parentData.centerX + localX;
              ballData.centerY = parentData.centerY + localY;
              ballData.centerZ = parentData.centerZ + localZ;
            }
          }
        }

        // Get size array for depth-based scaling
        const sizeArray = particlesRef.current.geometry.attributes.size.array as Float32Array;

        // Third pass: update all particles with depth effects
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          const spinAngle = time * config.spinSpeed; // Used for Earth-like rotation

          // Calculate depth scale factor for this ball
          // For child balls, Z can be parent's Z + local Z, so use a larger range
          const parentZ = config.parentId
            ? (ballDataRef.current.get(config.parentId)?.config.orbitRadius || 0)
            : 0;
          const maxZ = config.orbitRadius + parentZ + 100; // Account for combined depth
          const rawDepthFactor = (ballData.centerZ + maxZ) / (maxZ * 2);
          const depthFactor = Math.max(0, Math.min(1, rawDepthFactor)); // Clamp to 0-1
          // Dramatic scaling: almost invisible when behind (0.15x), normal when in front (1.2x)
          const sizeScale = 0.15 + depthFactor * 1.05;

          for (let i = 0; i < config.particleCount; i++) {
            const globalIndex = ballData.startIndex + i;
            let localX: number, localY: number;

            if (ballData.isChaotic[i]) {
              // Chaotic particle - orbits around its center point
              ballData.chaoticOrbitAngle[i] += ballData.chaoticOrbitSpeed[i] * 0.016;
              const orbitX = Math.cos(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i];
              const orbitY = Math.sin(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i];
              localX = ballData.chaoticCenterX[i] + orbitX;
              localY = ballData.chaoticCenterY[i] + orbitY;
            } else {
              // Normal particle - Earth-like rotation around Y axis
              // Add spin to theta (longitude) - this rotates around the Y axis like Earth
              const currentTheta = ballData.theta[i] + spinAngle + time * config.swirlSpeed * ballData.speeds[i];
              const phi = ballData.phi[i];
              const dist = ballData.distances[i];

              // Convert spherical to Cartesian (Y is up/down axis)
              const sinPhi = Math.sin(phi);
              const cosPhi = Math.cos(phi);
              localX = Math.cos(currentTheta) * sinPhi * dist;
              localY = cosPhi * dist; // Y stays same (poles don't move much)
            }

            // Add ball center offset
            posArray[globalIndex * 3] = localX + ballData.centerX;
            posArray[globalIndex * 3 + 1] = localY + ballData.centerY;

            // Apply depth-based size scaling
            sizeArray[globalIndex] = ballData.baseSizes[i] * sizeScale;
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.size.needsUpdate = true;
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
  }, []);

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
