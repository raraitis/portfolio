'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

interface CosmicDustThreeProps {
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
    particleCount: 18000,
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

// Precomputed per-ball orbit constants (avoids sqrt + trig every frame)
const BALL_ORBIT = new Map(BALLS.map(c => [c.id, {
  orbitB: c.orbitRadius * Math.sqrt(1 - c.orbitEccentricity * c.orbitEccentricity),
  tiltCos: Math.cos(c.orbitTilt),
  tiltSin: Math.sin(c.orbitTilt),
}]));

// Planet tilt is constant (0.35 rad) — precompute cos/sin once
const PLANET_TILT_COS = Math.cos(0.35);
const PLANET_TILT_SIN = Math.sin(0.35);

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
  attribute vec3 ballColor;

  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
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
  precision mediump float; // 2x faster on mobile GPUs

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

    // Sharp gaussian — tighter falloff for HD crisp particles
    float d = length(uv);
    float alpha = exp(-d * d * 18.0);

    // Warm brightening during warp (hot star trails)
    vec3 color = mix(vColor, vec3(0.95, 0.9, 0.85), vWarp * 0.7);

    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ============= MATH HELPERS =============
function fract(x: number) { return x - Math.floor(x); }

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
  surfaceOffset: Float32Array; // per-particle random offset for fuzzy sphere edges
  targetPhi: Float32Array; // nearest stripe band center phi — particles migrate here
  assemblyDelay: Float32Array; // per-particle random delay for staggered assembly
  isStripeParticle: Uint8Array; // 1 = dark stripe particle, 0 = lighter fill particle
}

const CosmicDustThree = ({ section }: CosmicDustThreeProps) => {
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
  const planetFormRef = useRef(0); // 0 = loose ball, 1 = striped planet form
  const sectionRef = useRef(section); // Track section for sphere position calc

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
      // Ball gradually assembles into striped planet form (longer, gentler)
      .to(planetFormRef, {
        current: 1,
        duration: 5.0,
        ease: 'power1.inOut',
      }, 5.5)
      // Done — flying is over after planet form completes
      .call(() => {
        flyingRef.current = false;
      }, [], 10.5);
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
    const isMobile = width < 768;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Calculate total particle count
    const totalParticles = BALLS.reduce((sum, ball) => sum + ball.particleCount, 0);

    // Create combined geometry for all balls
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(totalParticles * 3);
    const sizes = new Float32Array(totalParticles);
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
        surfaceOffset: new Float32Array(count),
        targetPhi: new Float32Array(count),
        assemblyDelay: new Float32Array(count),
        isStripeParticle: new Uint8Array(count),
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

        colors[globalIndex * 3] = config.color.r;
        colors[globalIndex * 3 + 1] = config.color.g;
        colors[globalIndex * 3 + 2] = config.color.b;
      }

      // Pre-compute stripe data + surface scatter for each particle
      const stripeCount = 14.0;
      for (let i = 0; i < count; i++) {
        const uvY = ballData.phi[i] / Math.PI;
        const y = uvY * stripeCount;

        // Find nearest stripe band center: centers are at (n + 0.45) / stripeCount in UV space
        const bandIndex = Math.floor(y);
        const fractY = fract(y);
        // Stripe band center is at fract = 0.45
        let nearestBand: number;
        if (fractY < 0.45) {
          nearestBand = bandIndex + 0.45;
        } else if (fractY > 0.55) {
          // Closer to next band
          nearestBand = bandIndex + 1 + 0.45;
        } else {
          // Already in stripe center zone
          nearestBand = bandIndex + 0.45;
        }
        // Clamp to valid UV range [0, stripeCount]
        nearestBand = Math.max(0.45, Math.min(stripeCount - 0.55, nearestBand));
        // Convert back to phi: targetPhi = (nearestBand / stripeCount) * PI
        // Add small random spread so particles don't all land on exact same line
        const spread = (Math.random() - 0.5) * 0.25; // spread within the stripe band
        ballData.targetPhi[i] = ((nearestBand + spread) / stripeCount) * Math.PI;

        // Designate ~40% as stripe particles (darker), ~60% as fill (lighter)
        ballData.isStripeParticle[i] = Math.random() < 0.4 ? 1 : 0;
        // Fill particles stay at their natural latitude — no stripe band migration
        if (!ballData.isStripeParticle[i]) {
          ballData.targetPhi[i] = ballData.phi[i];
        }

        // Random offset so the sphere edge is fuzzy, not a perfect circle
        ballData.surfaceOffset[i] = (Math.random() - 0.4) * 0.3 * config.radius;
        // Random delay so particles assemble at different times (organic, not radial)
        ballData.assemblyDelay[i] = Math.random() * 0.55; // 0 to 0.55 — some start immediately, some wait
      }

      ballDataMap.set(config.id, ballData);
      currentIndex += count;
    }

    ballDataRef.current = ballDataMap;

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
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

    // ============= ADAPTIVE QUALITY =============
    let drawRange = totalParticles;
    const minDrawRange = Math.floor(totalParticles * 0.5); // never drop below 50%
    let fpsAccum = 0;
    let fpsFrames = 0;
    let lastFrameMs = performance.now();

    // ============= ANIMATION LOOP =============
    let time = 0;
    const animate = () => {
      // FPS tracking — adjust draw range every 30 frames
      const nowMs = performance.now();
      fpsAccum += nowMs - lastFrameMs;
      lastFrameMs = nowMs;
      fpsFrames++;
      if (fpsFrames >= 30) {
        const avgFps = 1000 / (fpsAccum / fpsFrames);
        if (avgFps < 30 && drawRange > minDrawRange) {
          drawRange = Math.max(minDrawRange, Math.floor(drawRange * 0.85));
          geometry.setDrawRange(0, drawRange);
        } else if (avgFps > 50 && drawRange < totalParticles) {
          drawRange = Math.min(totalParticles, Math.floor(drawRange * 1.1));
          geometry.setDrawRange(0, drawRange);
        }
        fpsAccum = 0;
        fpsFrames = 0;
      }

      time += 0.016;
      animTimeRef.current = time;
      const isFlying = flyingRef.current;
      // Use frozen time for orbital positions during warp so the ball doesn't drift
      const orbitTime = isFlying ? frozenOrbitTimeRef.current : time;

      // Sphere position — calculated directly (eliminates BackgroundElements' rAF loop)
      if (particlesRef.current) {
        const sec = sectionRef.current;
        const w = window.innerWidth;
        const h = window.innerHeight;
        // Match legacy BackgroundElements time scale (0.008/frame vs 0.016/frame)
        const st = time * 0.5;

        let sx: number, sy: number;
        if (sec === 'me') {
          sx = w * 0.25;
          sy = h * 0.5;
        } else {
          const orbitAngle = st * 0.3;
          sx = w * 0.5 + Math.cos(orbitAngle) * w * 0.4;
          sy = h * 0.5 + Math.sin(orbitAngle * 0.5) * 20 + Math.sin(st * 0.5) * 32;
        }

        const offsetX = sx - w / 2;
        const offsetY = -(sy - h / 2);
        particlesRef.current.position.set(offsetX, offsetY, 0);
        if (planetMeshRef.current) {
          planetMeshRef.current.userData.baseOffsetX = offsetX;
          planetMeshRef.current.userData.baseOffsetY = offsetY;
        }
      }

      if (particlesRef.current && ballDataRef.current.size > 0) {
        const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;

        const blend = portfolioBlendRef.current;
        const screenW = window.innerWidth;

        // First pass: calculate ball centers for ROOT balls (no parent)
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          if (config.parentId === null) {
            const orbitAngle = orbitTime * config.orbitSpeed + config.orbitPhaseOffset;
            const oc = BALL_ORBIT.get(config.id)!;

            const flatX = Math.cos(orbitAngle) * config.orbitRadius;
            const flatY = Math.sin(orbitAngle) * oc.orbitB;

            const homeX = flatX;
            const homeY = flatY * oc.tiltCos;
            const homeZ = flatY * oc.tiltSin;

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
              const oc = BALL_ORBIT.get(config.id)!;

              const orbitX = Math.cos(orbitAngle) * config.orbitRadius;
              const orbitZ = Math.sin(orbitAngle) * oc.orbitB;

              const localX = orbitX;
              const localY = orbitZ * oc.tiltSin;
              const localZ = orbitZ * oc.tiltCos;

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
        const colorArray = particlesRef.current.geometry.attributes.ballColor.array as Float32Array;

        // Portfolio scale: particles spread out for a bigger ball
        const sectionScale = 1 + blend * 1.0; // 2x radius at full portfolio blend
        const pfRaw = planetFormRef.current; // 0 = loose ball, 1 = striped planet

        // 3D planet rotation — tilt + slow spin so stripes look 3D
        const planetSpin = time * 0.12; // slow Y-axis rotation
        const cosT = PLANET_TILT_COS, sinT = PLANET_TILT_SIN;
        const cosS = Math.cos(planetSpin), sinS = Math.sin(planetSpin);

        // Third pass: update all particles with depth effects
        let colorsDirty = false;
        for (const [, ballData] of ballDataRef.current) {
          const config = ballData.config;
          const isMainBall = config.parentId === null;

          // Skip child-ball particles entirely when off-screen in portfolio mode
          if (!isMainBall && blend > 0.5) continue;

          const spinAngle = time * config.spinSpeed;

          const parentZ = config.parentId
            ? (ballDataRef.current.get(config.parentId)?.config.orbitRadius || 0)
            : 0;
          const maxZ = config.orbitRadius + parentZ + 100;
          const rawDepthFactor = (ballData.centerZ + maxZ) / (maxZ * 2);
          const depthFactor = Math.max(0, Math.min(1, rawDepthFactor));
          const sizeScale = 0.15 + depthFactor * 1.05;

          const distScale = isMainBall ? sectionScale : 1;
          const surfaceRadius = config.radius * sectionScale;
          const formationActive = isMainBall && pfRaw > 0;

          // Limit to drawRange — particles beyond it aren't rendered, skip CPU work too
          const loopEnd = Math.min(config.particleCount, drawRange - ballData.startIndex);
          for (let i = 0; i < loopEnd; i++) {
            const globalIndex = ballData.startIndex + i;
            let localX: number, localY: number, localZ = 0;

            // Per-particle staggered assembly (skip entirely when no formation)
            let pfCubic = 0;
            if (formationActive) {
              const delay = ballData.assemblyDelay[i];
              const pf = Math.max(0, Math.min(1, (pfRaw - delay) / (1 - delay)));
              pfCubic = pf * pf * pf;
            }

            // Fuzzy target: each particle aims for a slightly different radius
            const fuzzyTarget = surfaceRadius + ballData.surfaceOffset[i];

            if (ballData.isChaotic[i]) {
              ballData.chaoticOrbitAngle[i] += ballData.chaoticOrbitSpeed[i] * 0.016;
              // Shrink chaotic orbits during planet formation
              const chaoticScale = isMainBall && pfCubic > 0.001 ? 1 - pfCubic * 0.8 : 1;
              const orbitX = Math.cos(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i] * chaoticScale;
              const orbitY = Math.sin(ballData.chaoticOrbitAngle[i]) * ballData.chaoticOrbitRadius[i] * chaoticScale;

              if (isMainBall && pfCubic > 0.001) {
                // During planet form: chaotic particles also migrate to stripes
                const cx = ballData.chaoticCenterX[i] + orbitX;
                const cy = ballData.chaoticCenterY[i] + orbitY;
                const cDist = Math.sqrt(cx * cx + cy * cy) || 1;
                const effectiveDist = cDist + (fuzzyTarget - cDist) * pfCubic;
                // Migrate angle toward target stripe phi
                const currentAngle = Math.atan2(cx, cy);
                const targetAngle = ballData.targetPhi[i] - Math.PI / 2;
                const blendedAngle = currentAngle + (targetAngle - currentAngle) * pfCubic;
                // Compute 3D position for rotation
                localX = Math.sin(blendedAngle) * effectiveDist;
                localY = Math.cos(blendedAngle) * effectiveDist;
                localZ = Math.sin(ballData.theta[i]) * Math.sin(ballData.phi[i]) * effectiveDist * pfCubic;
              } else {
                localX = (ballData.chaoticCenterX[i] + orbitX) * distScale;
                localY = (ballData.chaoticCenterY[i] + orbitY) * distScale;
              }
            } else {
              const currentTheta = ballData.theta[i] + spinAngle + time * config.swirlSpeed * ballData.speeds[i];
              const phi = ballData.phi[i];
              let dist = ballData.distances[i] * distScale;

              // Planet formation: push to surface + migrate phi toward nearest stripe
              let effectivePhi = phi;
              if (isMainBall && pfCubic > 0.001) {
                dist = dist + (fuzzyTarget - dist) * pfCubic;
                effectivePhi = phi + (ballData.targetPhi[i] - phi) * pfCubic;
              }

              const sinPhi = Math.sin(effectivePhi);
              const cosPhi = Math.cos(effectivePhi);
              localX = Math.cos(currentTheta) * sinPhi * dist;
              localY = cosPhi * dist;
              // Z component for 3D rotation (blends in with planet formation)
              localZ = Math.sin(currentTheta) * sinPhi * dist * pfCubic;
            }

            // Apply 3D rotation during planet formation for tilted, spinning look
            if (isMainBall && pfCubic > 0.01) {
              // Tilt around X axis
              const ty = localY * cosT - localZ * sinT;
              const tz = localY * sinT + localZ * cosT;
              // Spin around Y axis
              const sx = localX * cosS - tz * sinS;
              const sz = localX * sinS + tz * cosS;
              // Blend rotated position with original based on formation progress
              localX = localX + (sx - localX) * pfCubic;
              localY = localY + (ty - localY) * pfCubic;
              localZ = sz * pfCubic; // Z used for depth fade below
            }

            // Planet formation: subtle vibration jitter for settling particles
            if (isMainBall && pfCubic > 0.7) {
              const jitterAmt = (pfCubic - 0.7) * 2.0;
              localX += Math.sin(time * 3.0 + i * 0.7) * jitterAmt;
              localY += Math.cos(time * 2.5 + i * 1.1) * jitterAmt;
            }

            posArray[globalIndex * 3] = localX + ballData.centerX;
            posArray[globalIndex * 3 + 1] = localY + ballData.centerY;

            // Size: base depth scaling + enlarge during planet formation
            let finalSize = ballData.baseSizes[i] * sizeScale;
            if (formationActive && pfCubic > 0.001) {
              finalSize *= 1.0 + pfCubic * 0.5;
              // 3D depth fade: back-side particles shrink for depth illusion
              const depthNorm = Math.max(0, Math.min(1, (localZ / surfaceRadius + 1) * 0.5));
              const depthMul = 0.35 + depthNorm * 0.65; // back = 35% size, front = 100%
              finalSize *= 1 - pfCubic + pfCubic * depthMul;
            }
            sizeArray[globalIndex] = finalSize;

            // Color: blend from base to stripe/fill colors with depth shading
            // Only update when formation is active (pfCubic > 0) to avoid unnecessary writes
            if (isMainBall && pfCubic > 0.001) {
              const dn = Math.max(0, Math.min(1, (localZ / surfaceRadius + 1) * 0.5));
              const depthShade = 0.65 + dn * 0.35; // back = 65% brightness, front = 100%

              let tR: number, tG: number, tB: number;
              if (ballData.isStripeParticle[i]) {
                // Dark stripe color
                tR = 0.13 * depthShade;
                tG = 0.15 * depthShade;
                tB = 0.12 * depthShade;
              } else {
                // Lighter fill color
                tR = 0.38 * depthShade;
                tG = 0.40 * depthShade;
                tB = 0.36 * depthShade;
              }

              colorArray[globalIndex * 3] = config.color.r + (tR - config.color.r) * pfCubic;
              colorArray[globalIndex * 3 + 1] = config.color.g + (tG - config.color.g) * pfCubic;
              colorArray[globalIndex * 3 + 2] = config.color.b + (tB - config.color.b) * pfCubic;
              colorsDirty = true;
            }
          }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.geometry.attributes.size.needsUpdate = true;
        if (colorsDirty) {
          particlesRef.current.geometry.attributes.ballColor.needsUpdate = true;
        }
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
          // Planet grows as we "zoom in" — quadratic acceleration for natural feel
          const warpGrow = 1.0 + warpProgress * warpProgress * 1.8;
          const warpFade = Math.max(0, 1 - warpProgress * 1.05); // Fade later so growth is visible
          const portfolioFade = Math.max(0, 1 - portfolioBlendRef.current * 2); // Also gone in portfolio mode
          planetMaterialRef.current.uniforms.uOpacity.value = depthOpacity * warpFade * portfolioFade;
          planetMeshRef.current.scale.setScalar(depthScale * pulse * warpGrow);
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
          // Generous hit area — 3x visual size, minimum 80px (mobile-friendly)
          const hitSize = Math.max(screenSize * 3, 80);
          clickTargetRef.current.style.left = `${screenX - hitSize / 2}px`;
          clickTargetRef.current.style.top = `${screenY - hitSize / 2}px`;
          clickTargetRef.current.style.width = `${hitSize}px`;
          clickTargetRef.current.style.height = `${hitSize}px`;
          // Clickable for most of the orbit (only hide when deeply behind)
          const isVisible = depthFactor > 0.15;
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
      // Reverse planet form first, then blend back to home layout
      gsap.to(planetFormRef, {
        current: 0,
        duration: 1.0,
        ease: 'power2.in',
      });
      gsap.to(portfolioBlendRef, {
        current: 0,
        duration: 1.5,
        ease: 'power2.inOut',
      });
    }
  }, [section]);

  // Keep sectionRef in sync for sphere position calculation in animation loop
  useEffect(() => { sectionRef.current = section; }, [section]);

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
