'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface CosmicDustThreeProps {
  centerX: number;
  centerY: number;
  section: 'home' | 'me' | 'portfolio';
}

// ============= BALL CONFIGURATION TYPE =============
interface BallConfig {
  id: string;
  color: { r: number; g: number; b: number };
  particleCount: number;
  radius: number;
  orbitRadius: number;
  orbitEccentricity: number;
  orbitTilt: number;
  orbitPhaseOffset: number; // Starting orbit angle so balls appear on screen immediately
  orbitSpeed: number;
  spinSpeed: number;
  swirlSpeed: number;
  chaoticRatio: number;
  chaoticSpeedMin: number;
  chaoticSpeedMax: number;
  parentId: string | null;
}

// ============= BALL CONFIGURATIONS =============
const BALLS: BallConfig[] = [
  {
    id: 'main-ball',
    color: { r: 0.25, g: 0.27, b: 0.24 },
    particleCount: 8000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4,
    orbitTilt: 0.6, // Diagonal orbit visible on screen (was 1.4 = nearly all depth)
    orbitPhaseOffset: Math.PI * 0.65, // Start upper-left area, already on screen
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null,
  },
  {
    id: 'child-ball',
    color: { r: 0.6, g: 0.45, b: 0.3 },
    particleCount: 4000,
    radius: 120,
    orbitRadius: 400,
    orbitEccentricity: 0.3,
    orbitTilt: 0.4,
    orbitPhaseOffset: Math.PI * 0.3,
    orbitSpeed: 0.4,
    spinSpeed: 0.25,
    swirlSpeed: 0.12,
    chaoticRatio: 0.25,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.4,
    parentId: 'main-ball',
  },
];

// ============= STRIPED PLANET SHADERS =============
const planetVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const planetFragmentShader = `
  varying vec3 vNormal;
  varying vec2 vUv;

  uniform float uOpacity;
  uniform vec3 uColor;

  void main() {
    float stripeCount = 14.0;
    float y = vUv.y * stripeCount;
    float stripe = smoothstep(0.28, 0.32, fract(y)) - smoothstep(0.58, 0.62, fract(y));

    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    float fresnel = 1.0 - abs(dot(vNormal, viewDir));
    float edgeFade = 1.0 - smoothstep(0.5, 1.0, fresnel);

    float light = 0.7 + 0.3 * dot(vNormal, normalize(vec3(0.3, 0.5, 1.0)));

    vec3 color = uColor * light;
    float alpha = stripe * edgeFade * uOpacity;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============= PARTICLE SHADERS (WARP-ENABLED) =============
// Vertex shader: pushes particles radially outward during warp,
// passes radial angle to fragment shader for streak direction
const particleVertexShader = `
  attribute float size;
  attribute float shape;
  attribute vec3 ballColor;

  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  varying float vShape;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vShape = shape;
    vColor = ballColor;

    vec3 pos = position;
    float warp = uWarpProgress;

    // Warp: zoom into planet — multiplicative scale preserves density (no hole)
    vec2 toParticle = pos.xy - uWarpCenter;
    float dist = length(toParticle);

    if (warp > 0.0) {
      float intensity = warp * 0.35 + warp * warp * 0.65;

      // Scale outward from planet center — like camera zoom, no clearing
      float zoomScale = 1.0 + intensity * 8.0;
      pos.xy = uWarpCenter + toParticle * zoomScale;

      // Z push toward camera for depth perspective
      float distFactor = smoothstep(0.0, 400.0, dist);
      float zRush = intensity * 200.0 * distFactor;
      pos.z = min(pos.z + zRush, 450.0);

      // Streak direction for fragment shader
      vRadialAngle = dist > 0.1 ? atan(toParticle.y, toParticle.x) : 0.0;
    } else {
      vRadialAngle = 0.0;
    }

    vWarp = warp;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // Distance-based fade (wider range during warp as particles spread out)
    float fadeRange = mix(3000.0, 8000.0, warp);
    vAlpha = smoothstep(fadeRange, 0.0, length(pos.xy)) * 0.9;

    // Enlarge points during warp for visible streaks
    float warpSize = 1.0 + warp * warp * 14.0;
    gl_PointSize = size * (200.0 / -mvPosition.z) * warpSize;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader: rotates and stretches UVs to create radial streaks,
// brightens particles toward warm white during warp
const particleFragmentShader = `
  varying float vShape;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);

    // During warp: rotate UVs to align with radial direction, then squeeze
    // perpendicular axis to create streak shapes
    if (vWarp > 0.01) {
      float c = cos(vRadialAngle);
      float s = sin(vRadialAngle);
      // Rotate so radial direction aligns with X axis
      vec2 rotUv = vec2(
        uv.x * c - uv.y * s,
        uv.x * s + uv.y * c
      );
      // Compress perpendicular (Y) → thin streak along radial (X)
      float squeeze = mix(1.0, 8.0, vWarp * vWarp);
      rotUv.y *= squeeze;
      uv = rotUv;
    }

    // Soft gaussian blob — no distinct shape, just a gentle glow
    float d = length(uv);
    float alpha = exp(-d * d * 8.0);

    // Warm brightening during warp (hot star trails)
    vec3 color = mix(vColor, vec3(0.95, 0.9, 0.85), vWarp * 0.7);

    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ============= RUNTIME DATA TYPES =============
interface BallData {
  config: BallConfig;
  theta: Float32Array;
  phi: Float32Array;
  distances: Float32Array;
  speeds: Float32Array;
  isChaotic: Uint8Array;
  chaoticOrbitRadius: Float32Array;
  chaoticOrbitSpeed: Float32Array;
  chaoticOrbitAngle: Float32Array;
  chaoticCenterX: Float32Array;
  chaoticCenterY: Float32Array;
  startIndex: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  baseSizes: Float32Array;
}

const CosmicDustThree = ({ centerX, centerY, section }: CosmicDustThreeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const planetMeshRef = useRef<THREE.Mesh | null>(null);
  const planetMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const frameIdRef = useRef<number>(0);
  const ballDataRef = useRef<Map<string, BallData>>(new Map());

  // Fly-through refs
  const clickTargetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const flyingRef = useRef(false);
  const animTimeRef = useRef(0); // Shared animation time (accessible from click handler)
  const frozenOrbitTimeRef = useRef(0); // Frozen orbit time at warp start
  const warpTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const planetScreenPosRef = useRef({ x: 0, y: 0, size: 0, depthFactor: 0 });
  const portfolioBlendRef = useRef(0); // 0 = home layout, 1 = portfolio layout (big ball on left)

  // Planet click → triggers GSAP warp timeline
  const handlePlanetClick = () => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    frozenOrbitTimeRef.current = animTimeRef.current; // Freeze orbital positions

    if (clickTargetRef.current) {
      clickTargetRef.current.style.pointerEvents = 'none';
    }

    const material = particlesRef.current?.material as THREE.ShaderMaterial;
    if (!material?.uniforms) {
      flyingRef.current = false;
      return;
    }

    const tl = gsap.timeline();
    warpTimelineRef.current = tl;

    tl
      // Warp accelerates — particles zoom past like hyperspace
      .to(material.uniforms.uWarpProgress, {
        value: 1.0,
        duration: 4.0,
        ease: 'power2.in',
      })
      // Overlay fades in (semi-transparent cream + backdrop blur)
      .to(overlayRef.current, {
        opacity: 1,
        duration: 1.0,
        ease: 'power2.in',
      }, 3.0)
      // Navigate to portfolio behind the overlay
      .call(() => {
        (window as any).navigateToSection?.('portfolio');
      }, [], 3.8)
      // Simultaneously: warp back to 0 + blend to portfolio layout (big ball on left)
      .to(material.uniforms.uWarpProgress, {
        value: 0,
        duration: 2.0,
        ease: 'power2.out',
      }, 4.2)
      .to(portfolioBlendRef, {
        current: 1,
        duration: 2.0,
        ease: 'power2.out',
      }, 4.2)
      // Overlay fades out — blurry portfolio slowly sharpens into view
      .to(overlayRef.current, {
        opacity: 0,
        duration: 2.0,
        ease: 'power2.out',
      }, 4.2)
      // Done — flying is over
      .call(() => {
        flyingRef.current = false;
      }, [], 6.2);
  };

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

      const ballData: BallData = {
        config,
        theta: new Float32Array(count),
        phi: new Float32Array(count),
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
        centerZ: 0,
        baseSizes: new Float32Array(count),
      };

      for (let i = 0; i < count; i++) {
        const globalIndex = startIndex + i;

        ballData.theta[i] = Math.random() * Math.PI * 2;
        ballData.phi[i] = Math.acos(1 - 2 * Math.random());

        const r = Math.random();
        const normalizedDist = Math.cbrt(r);
        ballData.distances[i] = normalizedDist * config.radius;

        ballData.isChaotic[i] = Math.random() < config.chaoticRatio ? 1 : 0;

        if (ballData.isChaotic[i]) {
          ballData.chaoticOrbitRadius[i] = 20 + Math.random() * 80;
          ballData.chaoticOrbitSpeed[i] =
            config.chaoticSpeedMin + Math.random() * (config.chaoticSpeedMax - config.chaoticSpeedMin);
          if (Math.random() < 0.5) ballData.chaoticOrbitSpeed[i] *= -1;
          ballData.chaoticOrbitAngle[i] = Math.random() * Math.PI * 2;
          const sinPhi = Math.sin(ballData.phi[i]);
          const cosPhi = Math.cos(ballData.phi[i]);
          ballData.chaoticCenterX[i] = Math.cos(ballData.theta[i]) * sinPhi * ballData.distances[i];
          ballData.chaoticCenterY[i] = cosPhi * ballData.distances[i];
          ballData.speeds[i] = 0;
        } else {
          ballData.speeds[i] = 0.7 + Math.random() * 0.6;
        }

        const sinPhi = Math.sin(ballData.phi[i]);
        const cosPhi = Math.cos(ballData.phi[i]);
        const x = Math.cos(ballData.theta[i]) * sinPhi * ballData.distances[i];
        const y = cosPhi * ballData.distances[i];
        const z = Math.sin(ballData.theta[i]) * sinPhi * ballData.distances[i];

        positions[globalIndex * 3] = x;
        positions[globalIndex * 3 + 1] = y;
        positions[globalIndex * 3 + 2] = z;

        const distanceFactor = normalizedDist;
        const baseSize = (6 + Math.random() * 10) * (0.8 + distanceFactor * 0.4);
        sizes[globalIndex] = baseSize;
        ballData.baseSizes[i] = baseSize;

        shapes[globalIndex] = Math.random();

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

    // Material with warp uniforms — GSAP animates uWarpProgress directly
    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uWarpProgress: { value: 0 },
        uWarpCenter: { value: new THREE.Vector2(0, 0) },
      },
    });

    // Create points
    const particles = new THREE.Points(geometry, material);
    particlesRef.current = particles;
    scene.add(particles);

    // Create striped planet sphere — behaves like a particle inside the main ball
    const mainBallConfig = BALLS.find(b => b.id === 'main-ball');
    const planetRadius = mainBallConfig ? mainBallConfig.radius * 0.12 : 36;
    const planetGeometry = new THREE.SphereGeometry(planetRadius, 48, 32);
    const planetMaterial = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uOpacity: { value: 0.3 },
        uColor: { value: new THREE.Vector3(0.22, 0.24, 0.21) },
      },
    });
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    // Give the planet its own spherical coords so it orbits within the ball
    planetMesh.userData.planetTheta = 2.1;
    planetMesh.userData.planetPhi = 1.15;
    planetMesh.userData.planetDist = (mainBallConfig?.radius || 300) * 0.55;
    planetMeshRef.current = planetMesh;
    planetMaterialRef.current = planetMaterial;
    scene.add(planetMesh);

    // ============= ANIMATION LOOP =============
    let time = 0;
    const animate = () => {
      time += 0.016;
      animTimeRef.current = time;
      const isFlying = flyingRef.current;
      // Use frozen time for orbital positions during warp so the ball doesn't drift
      const orbitTime = isFlying ? frozenOrbitTimeRef.current : time;

      if (particlesRef.current && ballDataRef.current.size > 0) {
        const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

        const blend = portfolioBlendRef.current;
        const screenW = window.innerWidth;

        // First pass: calculate ball centers for ROOT balls (no parent)
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          if (config.parentId === null) {
            const orbitAngle = orbitTime * config.orbitSpeed + config.orbitPhaseOffset;
            const a = config.orbitRadius;
            const b = a * Math.sqrt(1 - config.orbitEccentricity * config.orbitEccentricity);

            const flatX = Math.cos(orbitAngle) * a;
            const flatY = Math.sin(orbitAngle) * b;

            const tiltCos = Math.cos(config.orbitTilt);
            const tiltSin = Math.sin(config.orbitTilt);
            const homeX = flatX;
            const homeY = flatY * tiltCos;
            const homeZ = flatY * tiltSin;

            if (blend > 0.001) {
              // Portfolio: big ball hovering on the left with very gentle orbit
              const portfolioX = -screenW * 0.25 + Math.cos(time * 0.05) * 30;
              const portfolioY = Math.sin(time * 0.08) * 20;
              ballData.centerX = homeX + (portfolioX - homeX) * blend;
              ballData.centerY = homeY + (portfolioY - homeY) * blend;
              ballData.centerZ = homeZ * (1 - blend);
            } else {
              ballData.centerX = homeX;
              ballData.centerY = homeY;
              ballData.centerZ = homeZ;
            }
          }
        }

        // Second pass: calculate ball centers for CHILD balls (have parent)
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          if (config.parentId !== null) {
            const parentData = ballDataRef.current.get(config.parentId);
            if (parentData) {
              const orbitAngle = orbitTime * config.orbitSpeed + config.orbitPhaseOffset;
              const a = config.orbitRadius;
              const b = a * Math.sqrt(1 - config.orbitEccentricity * config.orbitEccentricity);

              const orbitX = Math.cos(orbitAngle) * a;
              const orbitZ = Math.sin(orbitAngle) * b;

              const tiltCos = Math.cos(config.orbitTilt);
              const tiltSin = Math.sin(config.orbitTilt);
              const localX = orbitX;
              const localY = orbitZ * tiltSin;
              const localZ = orbitZ * tiltCos;

              ballData.centerX = parentData.centerX + localX;
              ballData.centerY = parentData.centerY + localY;
              ballData.centerZ = parentData.centerZ + localZ;

              // During portfolio: fade child ball off-screen
              if (blend > 0.001) {
                ballData.centerX = ballData.centerX * (1 - blend) + (-5000) * blend;
                ballData.centerY = ballData.centerY * (1 - blend) + (-5000) * blend;
              }
            }
          }
        }

        // Warp center = planet position so streaks radiate from the planet
        const mainBallData = ballDataRef.current.get('main-ball');
        if (mainBallData) {
          const pTheta = planetMeshRef.current?.userData.planetTheta ?? 2.1;
          const pPhi = planetMeshRef.current?.userData.planetPhi ?? 1.15;
          const pDist = planetMeshRef.current?.userData.planetDist ?? 165;
          const spinTime = isFlying ? frozenOrbitTimeRef.current : time;
          const planetSpinAngle = spinTime * mainBallData.config.spinSpeed;
          const pCurrentTheta = pTheta + planetSpinAngle;
          const planetLocalX = Math.cos(pCurrentTheta) * Math.sin(pPhi) * pDist;
          const planetLocalY = Math.cos(pPhi) * pDist;

          material.uniforms.uWarpCenter.value.set(
            mainBallData.centerX + planetLocalX,
            mainBallData.centerY + planetLocalY
          );
        }

        // Get size array for depth-based scaling
        const sizeArray = particlesRef.current.geometry.attributes.size.array as Float32Array;

        // Portfolio scale: particles spread out for a bigger ball
        const sectionScale = 1 + blend * 1.0; // 2x radius at full portfolio blend

        // Third pass: update all particles with depth effects
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          const spinAngle = time * config.spinSpeed;

          const parentZ = config.parentId
            ? (ballDataRef.current.get(config.parentId)?.config.orbitRadius || 0)
            : 0;
          const maxZ = config.orbitRadius + parentZ + 100;
          const rawDepthFactor = (ballData.centerZ + maxZ) / (maxZ * 2);
          const depthFactor = Math.max(0, Math.min(1, rawDepthFactor));
          const sizeScale = 0.15 + depthFactor * 1.05;

          // Only scale main ball particles (child ball is off-screen in portfolio mode)
          const isMainBall = config.parentId === null;
          const distScale = isMainBall ? sectionScale : 1;

          for (let i = 0; i < config.particleCount; i++) {
            const globalIndex = ballData.startIndex + i;
            let localX: number, localY: number;

            if (ballData.isChaotic[i]) {
              ballData.chaoticOrbitAngle[i] += ballData.chaoticOrbitSpeed[i] * 0.016;
              const orbitX = Math.cos(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i];
              const orbitY = Math.sin(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i];
              localX = (ballData.chaoticCenterX[i] + orbitX) * distScale;
              localY = (ballData.chaoticCenterY[i] + orbitY) * distScale;
            } else {
              const currentTheta = ballData.theta[i] + spinAngle + time * config.swirlSpeed * ballData.speeds[i];
              const phi = ballData.phi[i];
              const dist = ballData.distances[i] * distScale;

              const sinPhi = Math.sin(phi);
              const cosPhi = Math.cos(phi);
              localX = Math.cos(currentTheta) * sinPhi * dist;
              localY = cosPhi * dist;
            }

            posArray[globalIndex * 3] = localX + ballData.centerX;
            posArray[globalIndex * 3 + 1] = localY + ballData.centerY;

            sizeArray[globalIndex] = ballData.baseSizes[i] * sizeScale;
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.size.needsUpdate = true;
      }

      // Update striped planet — orbits within the main ball like a particle
      const mainBallData = ballDataRef.current.get('main-ball');
      if (planetMeshRef.current && mainBallData) {
        const baseX = planetMeshRef.current.userData.baseOffsetX || 0;
        const baseY = planetMeshRef.current.userData.baseOffsetY || 0;

        // Planet orbits within the ball using its own spherical coordinates
        const pTheta = planetMeshRef.current.userData.planetTheta || 0;
        const pPhi = planetMeshRef.current.userData.planetPhi || 1.0;
        const pDist = planetMeshRef.current.userData.planetDist || 165;

        // Rotate with the ball's spin — freeze during warp so planet stays aligned
        const spinTime = isFlying ? frozenOrbitTimeRef.current : time;
        const spinAngle = spinTime * mainBallData.config.spinSpeed;
        const currentTheta = pTheta + spinAngle;

        const sinPhi = Math.sin(pPhi);
        const cosPhi = Math.cos(pPhi);
        const localX = Math.cos(currentTheta) * sinPhi * pDist;
        const localY = cosPhi * pDist;
        const localZ = Math.sin(currentTheta) * sinPhi * pDist;

        planetMeshRef.current.position.set(
          mainBallData.centerX + baseX + localX,
          mainBallData.centerY + baseY + localY,
          localZ
        );

        // Spin on its own axis
        planetMeshRef.current.rotation.y = time * mainBallData.config.spinSpeed * 1.5;
        planetMeshRef.current.rotation.x = 0.15;

        // Depth: combine ball's orbital depth + planet's position within the ball
        const config = mainBallData.config;
        const maxZ = config.orbitRadius + config.radius + 100;
        const combinedZ = mainBallData.centerZ + localZ;
        const rawDepthFactor = (combinedZ + maxZ) / (maxZ * 2);
        const depthFactor = Math.max(0, Math.min(1, rawDepthFactor));
        const depthOpacity = 0.05 + depthFactor * 0.3;

        // Depth-based scale + pulse
        const depthScale = 0.2 + depthFactor * 0.8;
        const pulse = isFlying ? 1 : (1 + Math.sin(time * 1.5) * 0.03);

        // Planet fades during warp and stays hidden in portfolio mode
        if (planetMaterialRef.current) {
          const warpProgress = material.uniforms.uWarpProgress.value;
          const warpFade = Math.max(0, 1 - warpProgress * 1.2); // Gone by warp ~0.83
          const portfolioFade = Math.max(0, 1 - portfolioBlendRef.current * 2); // Also gone in portfolio mode
          planetMaterialRef.current.uniforms.uOpacity.value = depthOpacity * warpFade * portfolioFade;
          planetMeshRef.current.scale.setScalar(depthScale * pulse);
        }

        // Track planet screen position for click target
        const w = window.innerWidth;
        const h = window.innerHeight;
        const screenX = (mainBallData.centerX + baseX + localX) + w / 2;
        const screenY = -(mainBallData.centerY + baseY + localY) + h / 2;
        const screenSize = planetRadius * 2 * depthScale * pulse;

        planetScreenPosRef.current = { x: screenX, y: screenY, size: screenSize, depthFactor };

        // Update click target position (direct DOM — no React re-render)
        if (clickTargetRef.current && !isFlying) {
          const hitSize = Math.max(screenSize, 44);
          clickTargetRef.current.style.left = `${screenX - hitSize / 2}px`;
          clickTargetRef.current.style.top = `${screenY - hitSize / 2}px`;
          clickTargetRef.current.style.width = `${hitSize}px`;
          clickTargetRef.current.style.height = `${hitSize}px`;
          // Clickable when planet is in front half of its orbit within the ball
          const isVisible = depthFactor > 0.4;
          clickTargetRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
          clickTargetRef.current.style.cursor = isVisible ? 'pointer' : 'default';
        }
      }

      // Render
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
      warpTimelineRef.current?.kill();
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      geometry.dispose();
      material.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
    };
  }, []);

  // Expose warp trigger globally so ME page / nav can trigger it
  useEffect(() => {
    (window as any).triggerPortfolioWarp = handlePlanetClick;
    return () => { delete (window as any).triggerPortfolioWarp; };
  }, []);

  // Handle section transitions (portfolio → home: blend back)
  useEffect(() => {
    if (section !== 'portfolio' && portfolioBlendRef.current > 0) {
      gsap.to(portfolioBlendRef, {
        current: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    }
  }, [section]);

  // Update position when center changes
  useEffect(() => {
    const offsetX = centerX - window.innerWidth / 2;
    const offsetY = -(centerY - window.innerHeight / 2);
    if (particlesRef.current) {
      particlesRef.current.position.set(offsetX, offsetY, 0);
    }
    if (planetMeshRef.current) {
      planetMeshRef.current.userData.baseOffsetX = offsetX;
      planetMeshRef.current.userData.baseOffsetY = offsetY;
    }
  }, [centerX, centerY]);

  return (
    <>
      {/* Three.js canvas container */}
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

      {/* Invisible click target that follows the planet */}
      <div
        ref={clickTargetRef}
        onClick={handlePlanetClick}
        style={{
          position: 'fixed',
          borderRadius: '50%',
          pointerEvents: 'none',
          cursor: 'pointer',
          zIndex: 2,
        }}
      />

      {/* Fly-through overlay — blurs and reveals portfolio content */}
      <div
        ref={overlayRef}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(245, 241, 232, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          opacity: 0,
          pointerEvents: 'none',
          zIndex: 100,
        }}
      />
    </>
  );
};

export default CosmicDustThree;
