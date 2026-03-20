'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { on, emit, type SectionName } from '@/lib/events';

interface CosmicDustThreeProps {
  section: SectionName;
}

// ============= BALL CONFIGURATION =============
interface BallConfig {
  id: string;
  color: { r: number; g: number; b: number };
  particleCount: number;
  radius: number;
  orbitRadius: number;
  orbitEccentricity: number;
  orbitTilt: number;
  orbitPhaseOffset: number;
  orbitSpeed: number;
  spinSpeed: number;
  swirlSpeed: number;
  chaoticRatio: number;
  chaoticSpeedMin: number;
  chaoticSpeedMax: number;
  parentId: string | null;
}

const BALLS: BallConfig[] = [
  {
    id: 'main-ball',
    color: { r: 0.25, g: 0.27, b: 0.24 },
    particleCount: 18000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4,
    orbitTilt: 0.6,
    orbitPhaseOffset: Math.PI * 0.65,
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null,
  },
  {
    id: 'main-ball-2',
    color: { r: 0.38, g: 0.32, b: 0.18 }, // muted gold/bronze, same palette
    particleCount: 18000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4,
    orbitTilt: 2.1, // totally different angle
    orbitPhaseOffset: Math.PI * 1.7, // totally different phase
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null,
  },
  {
    id: 'main-ball-3',
    color: { r: 0.18, g: 0.32, b: 0.28 }, // teal/greenish, same palette
    particleCount: 18000,
    radius: 300,
    orbitRadius: 300,
    orbitEccentricity: 0.4,
    orbitTilt: 1.3, // another unique angle
    orbitPhaseOffset: Math.PI * 0.2, // another unique phase
    orbitSpeed: 0.3,
    spinSpeed: 0.15,
    swirlSpeed: 0.08,
    chaoticRatio: 0.3,
    chaoticSpeedMin: 0.05,
    chaoticSpeedMax: 0.3,
    parentId: null,
  },
  // {
  //   id: 'child-ball',
  //   color: { r: 0.6, g: 0.45, b: 0.3 },
  //   particleCount: 4000,
  //   radius: 120,
  //   orbitRadius: 400,
  //   orbitEccentricity: 0.3,
  //   orbitTilt: 0.4,
  //   orbitPhaseOffset: Math.PI * 0.3,
  //   orbitSpeed: 0.4,
  //   spinSpeed: 0.25,
  //   swirlSpeed: 0.12,
  //   chaoticRatio: 0.25,
  //   chaoticSpeedMin: 0.05,
  //   chaoticSpeedMax: 0.4,
  //   parentId: 'main-ball',
  // },
];

const BALL_ORBIT = new Map(BALLS.map(c => [c.id, {
  orbitB: c.orbitRadius * Math.sqrt(1 - c.orbitEccentricity * c.orbitEccentricity),
  tiltCos: Math.cos(c.orbitTilt),
  tiltSin: Math.sin(c.orbitTilt),
}]));

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
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============= GPU PARTICLE VERTEX SHADER =============
// All per-particle position/size/color computed on GPU from static attributes + per-frame uniforms
const particleVertexShader = `
  attribute vec4 aOrbitParams;    // theta, phi, distance, speed
  attribute vec4 aChaoticParams;  // orbitRadius, orbitSpeed, initialAngle, isChaotic
  attribute vec4 aChaoticCenter;  // centerX, centerY, ballIndex, baseSize
  attribute vec4 aFormation;      // surfaceOffset, targetPhi, assemblyDelay, isStripe
  attribute vec3 aBaseColor;

  uniform float uTime;
  uniform vec3 uBall0Center;
  uniform vec3 uBall1Center;
  uniform vec3 uBall2Center;
  uniform vec2 uBall0Spin;
  uniform vec2 uBall1Spin;
  uniform vec2 uBall2Spin;
  uniform float uSectionScale;
  uniform float uPlanetForm;
  uniform vec2 uPlanetSpin;
  uniform vec3 uBallDepth;
  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  const float TILT_COS = ${PLANET_TILT_COS.toFixed(6)};
  const float TILT_SIN = ${PLANET_TILT_SIN.toFixed(6)};

  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    float theta = aOrbitParams.x;
    float phi = aOrbitParams.y;
    float dist = aOrbitParams.z;
    float speed = aOrbitParams.w;
    float isChaotic = aChaoticParams.w;
    float ballIdx = aChaoticCenter.z;
    float baseSize = aChaoticCenter.w;

    vec3 center;
    vec2 spin;
    float depth;
    float ballR;
    float dScale = 1.0;
    float surfR;
    float pfRaw = 0.0;
    if (ballIdx < 0.5) {
      center = uBall0Center;
      spin = uBall0Spin;
      depth = uBallDepth.x;
      ballR = ${BALLS[0].radius.toFixed(1)};
      dScale = uSectionScale;
      surfR = ballR * uSectionScale;
      pfRaw = uPlanetForm;
    } else if (ballIdx < 1.5) {
      center = uBall1Center;
      spin = uBall1Spin;
      depth = uBallDepth.y;
      ballR = ${BALLS[1].radius.toFixed(1)};
      surfR = ballR;
    } else {
      center = uBall2Center;
      spin = uBall2Spin;
      depth = uBallDepth.z;
      ballR = ${BALLS[2].radius.toFixed(1)};
      surfR = ballR;
    }

    float pfc = 0.0;
    if (pfRaw > 0.0) {
      float del = aFormation.z;
      float pf = clamp((pfRaw - del) / (1.0 - del), 0.0, 1.0);
      pfc = pf * pf * pf;
    }
    float fuzzy = surfR + aFormation.x;

    vec3 lp = vec3(0.0);

    if (isChaotic > 0.5) {
      float cAngle = aChaoticParams.z + aChaoticParams.y * uTime;
      float cScale = (ballIdx < 0.5 && pfc > 0.001) ? (1.0 - pfc * 0.8) : 1.0;
      float ox = cos(cAngle) * aChaoticParams.x * cScale;
      float oy = sin(cAngle) * aChaoticParams.x * cScale;

      if (ballIdx < 0.5 && pfc > 0.001) {
        float cx = aChaoticCenter.x + ox;
        float cy = aChaoticCenter.y + oy;
        float cd = max(length(vec2(cx, cy)), 1.0);
        float ed = mix(cd, fuzzy, pfc);
        float ca = atan(cx, cy);
        float ta = aFormation.y - 1.5708;
        float ba = mix(ca, ta, pfc);
        lp = vec3(sin(ba) * ed, cos(ba) * ed, sin(theta) * sin(phi) * ed * pfc);
      } else {
        lp = vec3((aChaoticCenter.x + ox) * dScale, (aChaoticCenter.y + oy) * dScale, 0.0);
      }
    } else {
      float ct = theta + uTime * spin.x + uTime * spin.y * speed;
      float ep = phi;
      float ed = dist * dScale;
      if (ballIdx < 0.5 && pfc > 0.001) {
        ed = mix(ed, fuzzy, pfc);
        ep = mix(phi, aFormation.y, pfc);
      }
      float sp = sin(ep);
      float cp = cos(ep);
      lp = vec3(cos(ct) * sp * ed, cp * ed, sin(ct) * sp * ed * pfc);
    }

    // 3D tilt + spin rotation during planet formation (only for main ball)
    if (ballIdx < 0.5 && pfc > 0.01) {
      float ty = lp.y * TILT_COS - lp.z * TILT_SIN;
      float tz = lp.y * TILT_SIN + lp.z * TILT_COS;
      float sx = lp.x * uPlanetSpin.x - tz * uPlanetSpin.y;
      float sz = lp.x * uPlanetSpin.y + tz * uPlanetSpin.x;
      lp.x = mix(lp.x, sx, pfc);
      lp.y = mix(lp.y, ty, pfc);
      lp.z = sz * pfc;
    }

    // Settling jitter — peaks mid-transition, fades to zero when fully formed (main ball only)
    if (ballIdx < 0.5 && pfc > 0.7) {
      float jRaw = (pfc - 0.7) * 2.0;
      float jFade = 1.0 - smoothstep(0.85, 1.0, pfc);
      float j = jRaw * jFade;
      lp.x += sin(uTime * 3.0 + theta * 100.0) * j;
      lp.y += cos(uTime * 2.5 + phi * 100.0) * j;
    }

    vec3 wp = lp + center;

    // Size: depth + formation effects
    float ss = 0.15 + depth * 1.05;
    float fs = baseSize * ss;
    if (ballIdx < 0.5 && pfc > 0.001) {
      fs *= 1.0 + pfc * 0.2;
      float dn = clamp((lp.z / surfR + 1.0) * 0.5, 0.0, 1.0);
      fs *= mix(1.0, 0.35 + dn * 0.65, pfc);
    }

    // Color: base → stripe/fill during formation (main ball only)
    vec3 col = aBaseColor;
    if (ballIdx < 0.5 && pfc > 0.001) {
      float dn = clamp((lp.z / surfR + 1.0) * 0.5, 0.0, 1.0);
      float ds = 0.65 + dn * 0.35;
      vec3 tc = aFormation.w > 0.5 ? vec3(0.13, 0.15, 0.12) * ds : vec3(0.38, 0.40, 0.36) * ds;
      col = mix(aBaseColor, tc, pfc);
    }

    // Warp
    float warp = uWarpProgress;
    vec2 tp = wp.xy - uWarpCenter;
    float wd = length(tp);
    if (warp > 0.0) {
      float intens = warp * 0.35 + warp * warp * 0.65;
      wp.xy = uWarpCenter + tp * (1.0 + intens * 8.0);
      wp.z = min(wp.z + intens * 200.0 * smoothstep(0.0, 400.0, wd), 450.0);
      vRadialAngle = wd > 0.1 ? atan(tp.y, tp.x) : 0.0;
    } else {
      vRadialAngle = 0.0;
    }

    vWarp = warp;
    vColor = col;
    vec4 mv = modelViewMatrix * vec4(wp, 1.0);
    float fr = mix(3000.0, 8000.0, warp);
    float baseAlpha = smoothstep(fr, 0.0, length(wp.xy)) * 0.45;
    float ballAlpha = ballIdx < 0.5 ? mix(1.0, 0.2, pfc) : 0.2;
    vAlpha = baseAlpha * ballAlpha;
    gl_PointSize = fs * (200.0 / -mv.z) * (1.0 + warp * warp * 14.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragmentShader = `
  precision mediump float;
  varying float vAlpha;
  varying vec3 vColor;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    if (vWarp > 0.01) {
      float c = cos(vRadialAngle);
      float s = sin(vRadialAngle);
      vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
      rotUv.y *= mix(1.0, 8.0, vWarp * vWarp);
      uv = rotUv;
    }
    float d = length(uv);
    float alpha = exp(-d * d * 18.0);
    vec3 color = mix(vColor, vec3(0.95, 0.9, 0.85), vWarp * 0.7);
    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ============= BACKGROUND STAR FIELD (hyperspeed warp effect) =============
const STAR_COUNT = 1500;

const starVertexShader = `
  attribute float aStarSize;
  attribute float aStarSpeed;  // per-star velocity multiplier

  uniform float uTime;
  uniform float uWarpProgress;
  uniform vec2 uWarpCenter;

  varying float vAlpha;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vec3 pos = position;
    float warp = uWarpProgress;

    // Subtle drift — stars slowly cycle along Y (parallax feel)
    pos.y = mod(pos.y - uTime * 8.0 * aStarSpeed + 600.0, 1200.0) - 600.0;

    // Warp: radial burst from warp center
    if (warp > 0.0) {
      vec2 toStar = pos.xy - uWarpCenter;
      float dist = length(toStar);
      float intens = warp * 0.35 + warp * warp * 0.65;

      // Accelerate outward — farther stars move faster (depth illusion)
      float accel = intens * (3.0 + aStarSpeed * 5.0);
      pos.xy = uWarpCenter + toStar * (1.0 + accel);

      vRadialAngle = dist > 0.1 ? atan(toStar.y, toStar.x) : 0.0;
    } else {
      vRadialAngle = 0.0;
    }

    vWarp = warp;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);

    // Stars visible across whole screen, fade at edges
    vAlpha = mix(0.12, 0.7, warp) * smoothstep(1500.0, 200.0, length(pos.xy));

    float warpSize = 1.0 + warp * warp * 10.0;
    gl_PointSize = aStarSize * (200.0 / -mv.z) * warpSize;
    gl_Position = projectionMatrix * mv;
  }
`;

const starFragmentShader = `
  precision mediump float;
  varying float vAlpha;
  varying float vWarp;
  varying float vRadialAngle;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);

    // Streak during warp
    if (vWarp > 0.01) {
      float c = cos(vRadialAngle);
      float s = sin(vRadialAngle);
      vec2 rotUv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
      rotUv.y *= mix(1.0, 12.0, vWarp * vWarp);
      uv = rotUv;
    }

    float d = length(uv);
    float alpha = exp(-d * d * 22.0);

    // Cool white → warm during warp
    vec3 color = mix(vec3(0.6, 0.6, 0.55), vec3(0.95, 0.9, 0.8), vWarp * 0.8);

    gl_FragColor = vec4(color, alpha * vAlpha);
  }
`;

// ============= RUNTIME DATA =============
interface BallRuntime {
  config: BallConfig;
  startIndex: number;
  centerX: number;
  centerY: number;
  centerZ: number;
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

  const clickTargetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const flyingRef = useRef(false);
  const animTimeRef = useRef(0);
  const frozenOrbitTimeRef = useRef(0);
  const warpTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const portfolioBlendRef = useRef(0);
  const planetFormRef = useRef(0);
  const sectionRef = useRef(section);

  const handlePlanetClick = () => {
    if (flyingRef.current) return;
    flyingRef.current = true;
    frozenOrbitTimeRef.current = animTimeRef.current;

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
      .to(material.uniforms.uWarpProgress, {
        value: 1.0, duration: 4.0, ease: 'power2.in',
      })
      .to(overlayRef.current, {
        opacity: 1, duration: 1.0, ease: 'power2.in',
      }, 3.0)
      .call(() => { emit('navigate', 'portfolio'); }, [], 3.8)
      .to(material.uniforms.uWarpProgress, {
        value: 0, duration: 2.0, ease: 'power2.out',
      }, 4.2)
      .to(portfolioBlendRef, {
        current: 1, duration: 2.0, ease: 'power2.out',
      }, 4.2)
      .to(overlayRef.current, {
        opacity: 0, duration: 2.0, ease: 'power2.out',
      }, 4.2)
      .to(planetFormRef, {
        current: 1, duration: 5.0, ease: 'power1.inOut',
      }, 5.5)
      .call(() => { flyingRef.current = false; }, [], 10.5);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(
      -width / 2, width / 2, height / 2, -height / 2, 1, 1000
    );
    camera.position.z = 500;
    cameraRef.current = camera;

    const isMobile = width < 768;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !isMobile });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ============= PARTICLE INIT — static attributes (set once, never updated) =============
    const mobileFactor = isMobile ? 0.5 : 1;
    const totalParticles = BALLS.reduce((sum, b) => sum + Math.floor(b.particleCount * mobileFactor), 0);

    const geometry = new THREE.BufferGeometry();
    const dummyPos = new Float32Array(totalParticles * 3);
    const orbitParams = new Float32Array(totalParticles * 4);
    const chaoticParams = new Float32Array(totalParticles * 4);
    const chaoticCenter = new Float32Array(totalParticles * 4);
    const formation = new Float32Array(totalParticles * 4);
    const baseColors = new Float32Array(totalParticles * 3);

    let currentIndex = 0;
    const ballRuntimes: BallRuntime[] = [];

    for (const config of BALLS) {
      const count = Math.floor(config.particleCount * mobileFactor);
      const startIndex = currentIndex;
      const stripeCount = 14.0;
      const ballIndex = config.parentId === null ? 0 : 1;

      for (let i = 0; i < count; i++) {
        const gi = startIndex + i;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(1 - 2 * Math.random());
        const r = Math.random();
        const dist = Math.cbrt(r) * config.radius;
        const spd = 0.7 + Math.random() * 0.6;
        const chaotic = Math.random() < config.chaoticRatio ? 1 : 0;

        orbitParams[gi * 4] = theta;
        orbitParams[gi * 4 + 1] = phi;
        orbitParams[gi * 4 + 2] = dist;
        orbitParams[gi * 4 + 3] = chaotic ? 0 : spd;

        if (chaotic) {
          const cr = 20 + Math.random() * 80;
          let cs = config.chaoticSpeedMin + Math.random() * (config.chaoticSpeedMax - config.chaoticSpeedMin);
          if (Math.random() < 0.5) cs *= -1;
          chaoticParams[gi * 4] = cr;
          chaoticParams[gi * 4 + 1] = cs;
          chaoticParams[gi * 4 + 2] = Math.random() * Math.PI * 2;
          chaoticParams[gi * 4 + 3] = 1;
          const sinP = Math.sin(phi), cosP = Math.cos(phi);
          chaoticCenter[gi * 4] = Math.cos(theta) * sinP * dist;
          chaoticCenter[gi * 4 + 1] = cosP * dist;
        }

        chaoticCenter[gi * 4 + 2] = ballIndex;
        chaoticCenter[gi * 4 + 3] = (6 + Math.random() * 10) * (0.8 + Math.cbrt(r) * 0.4);

        // Formation: stripe targeting + surface scatter
        const uvY = phi / Math.PI;
        const y = uvY * stripeCount;
        const bandIdx = Math.floor(y);
        const fractY = y - bandIdx;
        let nearestBand = fractY > 0.55 ? bandIdx + 1.45 : bandIdx + 0.45;
        nearestBand = Math.max(0.45, Math.min(stripeCount - 0.55, nearestBand));
        const spread = (Math.random() - 0.5) * 0.25;
        const isStripe = Math.random() < 0.4 ? 1 : 0;
        const targetPhi = isStripe ? ((nearestBand + spread) / stripeCount) * Math.PI : phi;

        formation[gi * 4] = (Math.random() - 0.4) * 0.3 * config.radius;
        formation[gi * 4 + 1] = targetPhi;
        formation[gi * 4 + 2] = Math.random() * 0.55;
        formation[gi * 4 + 3] = isStripe;

        baseColors[gi * 3] = config.color.r;
        baseColors[gi * 3 + 1] = config.color.g;
        baseColors[gi * 3 + 2] = config.color.b;
      }

      ballRuntimes.push({ config, startIndex, centerX: 0, centerY: 0, centerZ: 0 });
      currentIndex += count;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(dummyPos, 3));
    geometry.setAttribute('aOrbitParams', new THREE.BufferAttribute(orbitParams, 4));
    geometry.setAttribute('aChaoticParams', new THREE.BufferAttribute(chaoticParams, 4));
    geometry.setAttribute('aChaoticCenter', new THREE.BufferAttribute(chaoticCenter, 4));
    geometry.setAttribute('aFormation', new THREE.BufferAttribute(formation, 4));
    geometry.setAttribute('aBaseColor', new THREE.BufferAttribute(baseColors, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBall0Center: { value: new THREE.Vector3() },
        uBall1Center: { value: new THREE.Vector3() },
        uBall2Center: { value: new THREE.Vector3() },
        uBall0Spin: { value: new THREE.Vector2(BALLS[0].spinSpeed, BALLS[0].swirlSpeed) },
        uBall1Spin: { value: new THREE.Vector2(BALLS[1].spinSpeed, BALLS[1].swirlSpeed) },
        uBall2Spin: { value: new THREE.Vector2(BALLS[2].spinSpeed, BALLS[2].swirlSpeed) },
        uSectionScale: { value: 1 },
        uPlanetForm: { value: 0 },
        uPlanetSpin: { value: new THREE.Vector2(1, 0) },
        uBallDepth: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
        uWarpProgress: { value: 0 },
        uWarpCenter: { value: new THREE.Vector2() },
      },
    });

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    particlesRef.current = particles;
    scene.add(particles);

    // Striped planet spheres
    // Main ball planet
    const mainBallConfig = BALLS[0];
    const planetRadius = mainBallConfig.radius * 0.12;
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
    planetMesh.userData.planetTheta = 2.1;
    planetMesh.userData.planetPhi = 1.15;
    planetMesh.userData.planetDist = mainBallConfig.radius * 0.55;
    planetMeshRef.current = planetMesh;
    planetMaterialRef.current = planetMaterial;
    scene.add(planetMesh);

    // Third ball planet
    const thirdBallConfig = BALLS[2];
    const planet3Radius = thirdBallConfig.radius * 0.12;
    const planet3Geometry = new THREE.SphereGeometry(planet3Radius, 48, 32);
    const planet3Material = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uOpacity: { value: 0.3 },
        uColor: { value: new THREE.Vector3(0.13, 0.28, 0.22) }, // match third ball color palette
      },
    });
    const planet3Mesh = new THREE.Mesh(planet3Geometry, planet3Material);
    planet3Mesh.userData.planetTheta = 1.7;
    planet3Mesh.userData.planetPhi = 1.25;
    planet3Mesh.userData.planetDist = thirdBallConfig.radius * 0.55;
    scene.add(planet3Mesh);

    // ============= BACKGROUND STAR FIELD =============
    const starCount = isMobile ? Math.floor(STAR_COUNT * 0.5) : STAR_COUNT;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starSpeeds = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      // Spread stars across a wide area (wider than particle balls)
      starPositions[i * 3] = (Math.random() - 0.5) * 2400;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1200;
      starPositions[i * 3 + 2] = -50 + Math.random() * -200; // behind particles
      starSizes[i] = 1.5 + Math.random() * 3.5;
      starSpeeds[i] = 0.3 + Math.random() * 0.7;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('aStarSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('aStarSpeed', new THREE.BufferAttribute(starSpeeds, 1));

    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uWarpProgress: { value: 0 },
        uWarpCenter: { value: new THREE.Vector2() },
      },
    });

    const starField = new THREE.Points(starGeo, starMaterial);
    starField.frustumCulled = false;
    starField.renderOrder = -1; // render behind particle balls
    scene.add(starField);

    // Adaptive quality
    let drawRange = totalParticles;
    const minDrawRange = Math.floor(totalParticles * 0.5);
    let fpsAccum = 0;
    let fpsFrames = 0;

    let cachedW = width;
    let cachedH = height;

    // ============= ANIMATION LOOP — only uniforms + ball centers (no per-particle work) =============
    let time = 0;
    let lastTimestamp = 0;
    const mainBall = ballRuntimes[0];
    const secondBall = ballRuntimes[1];
    const thirdBall = ballRuntimes[2];
    const mainOC = BALL_ORBIT.get(mainBall.config.id)!;
    const secondOC = BALL_ORBIT.get(secondBall.config.id)!;
    const thirdOC = BALL_ORBIT.get(thirdBall.config.id)!;
    const u = material.uniforms;

    const animate = (timestamp: number) => {
      if (lastTimestamp === 0) lastTimestamp = timestamp;
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      fpsAccum += dt;
      fpsFrames++;
      if (fpsFrames >= 30) {
        const avgFps = fpsFrames / fpsAccum;
        if (avgFps < 45 && drawRange > minDrawRange) {
          drawRange = Math.max(minDrawRange, Math.floor(drawRange * 0.85));
          geometry.setDrawRange(0, drawRange);
        } else if (avgFps > 55 && drawRange < totalParticles) {
          drawRange = Math.min(totalParticles, Math.floor(drawRange * 1.1));
          geometry.setDrawRange(0, drawRange);
        }
        fpsAccum = 0;
        fpsFrames = 0;
      }

      time += dt;
      animTimeRef.current = time;
      const isFlying = flyingRef.current;
      const orbitTime = isFlying ? frozenOrbitTimeRef.current : time;

      // Sphere screen position
      const sec = sectionRef.current;
      const st = time * 0.5;
      let sx: number, sy: number;
      if (sec === 'me') {
        sx = cachedW * 0.25; sy = cachedH * 0.5;
      } else {
        const oa = st * 0.3;
        sx = cachedW * 0.5 + Math.cos(oa) * cachedW * 0.4;
        sy = cachedH * 0.5 + Math.sin(oa * 0.5) * 20 + Math.sin(st * 0.5) * 32;
      }
      const offsetX = sx - cachedW / 2;
      const offsetY = -(sy - cachedH / 2);
      particles.position.set(offsetX, offsetY, 0);

      // Ball centers
      const blend = portfolioBlendRef.current;
      // Main ball
      const mainOrbit = orbitTime * mainBall.config.orbitSpeed + mainBall.config.orbitPhaseOffset;
      const flatX = Math.cos(mainOrbit) * mainBall.config.orbitRadius;
      const flatY = Math.sin(mainOrbit) * mainOC.orbitB;
      const homeX = flatX, homeY = flatY * mainOC.tiltCos, homeZ = flatY * mainOC.tiltSin;
      if (blend > 0.001) {
        const px = -cachedW * 0.25 + Math.cos(time * 0.05) * 30;
        const py = Math.sin(time * 0.08) * 20;
        mainBall.centerX = homeX + (px - homeX) * blend;
        mainBall.centerY = homeY + (py - homeY) * blend;
        mainBall.centerZ = homeZ * (1 - blend);
      } else {
        mainBall.centerX = homeX; mainBall.centerY = homeY; mainBall.centerZ = homeZ;
      }

      // Second ball
      const secondOrbit = orbitTime * secondBall.config.orbitSpeed + secondBall.config.orbitPhaseOffset;
      const sFlatX = Math.cos(secondOrbit) * secondBall.config.orbitRadius;
      const sFlatY = Math.sin(secondOrbit) * secondOC.orbitB;
      secondBall.centerX = sFlatX;
      secondBall.centerY = sFlatY * secondOC.tiltCos;
      secondBall.centerZ = sFlatY * secondOC.tiltSin;

      // Third ball
      const thirdOrbit = orbitTime * thirdBall.config.orbitSpeed + thirdBall.config.orbitPhaseOffset;
      const tFlatX = Math.cos(thirdOrbit) * thirdBall.config.orbitRadius;
      const tFlatY = Math.sin(thirdOrbit) * thirdOC.orbitB;
      thirdBall.centerX = tFlatX;
      thirdBall.centerY = tFlatY * thirdOC.tiltCos;
      thirdBall.centerZ = tFlatY * thirdOC.tiltSin;

      // Depth factors
      const mainMaxZ = mainBall.config.orbitRadius + 100;
      const mainDepth = Math.max(0, Math.min(1, (mainBall.centerZ + mainMaxZ) / (mainMaxZ * 2)));
      const secondMaxZ = secondBall.config.orbitRadius + 100;
      const secondDepth = Math.max(0, Math.min(1, (secondBall.centerZ + secondMaxZ) / (secondMaxZ * 2)));
      const thirdMaxZ = thirdBall.config.orbitRadius + 100;
      const thirdDepth = Math.max(0, Math.min(1, (thirdBall.centerZ + thirdMaxZ) / (thirdMaxZ * 2)));

      // Update uniforms
      u.uTime.value = time;
      u.uBall0Center.value.set(mainBall.centerX, mainBall.centerY, mainBall.centerZ);
      u.uBall1Center.value.set(secondBall.centerX, secondBall.centerY, secondBall.centerZ);
      u.uBall2Center.value.set(thirdBall.centerX, thirdBall.centerY, thirdBall.centerZ);
      u.uSectionScale.value = 1 + blend;
      u.uPlanetForm.value = planetFormRef.current;
      const planetSpin = time * 0.12;
      u.uPlanetSpin.value.set(Math.cos(planetSpin), Math.sin(planetSpin));
      u.uBallDepth.value.set(mainDepth, secondDepth, thirdDepth);

      // Sync star field uniforms
      starMaterial.uniforms.uTime.value = time;
      starMaterial.uniforms.uWarpProgress.value = u.uWarpProgress.value;

      // Warp center = planet position
      const pTheta = planetMesh.userData.planetTheta;
      const pPhi = planetMesh.userData.planetPhi;
      const pDist = planetMesh.userData.planetDist;
      const spinTime = isFlying ? frozenOrbitTimeRef.current : time;
      const pSpinAngle = spinTime * mainBall.config.spinSpeed;
      const pCurTheta = pTheta + pSpinAngle;
      u.uWarpCenter.value.set(
        mainBall.centerX + Math.cos(pCurTheta) * Math.sin(pPhi) * pDist,
        mainBall.centerY + Math.cos(pPhi) * pDist
      );

      // Star warp center matches particle warp center (planet position + screen offset)
      starMaterial.uniforms.uWarpCenter.value.copy(u.uWarpCenter.value);


      // Update planet mesh (main ball)
      const sinPPhi = Math.sin(pPhi), cosPPhi = Math.cos(pPhi);
      const pLocalX = Math.cos(pCurTheta) * sinPPhi * pDist;
      const pLocalY = cosPPhi * pDist;
      const pLocalZ = Math.sin(pCurTheta) * sinPPhi * pDist;

      planetMesh.position.set(
        mainBall.centerX + offsetX + pLocalX,
        mainBall.centerY + offsetY + pLocalY,
        pLocalZ
      );
      planetMesh.rotation.y = time * mainBall.config.spinSpeed * 1.5;
      planetMesh.rotation.x = 0.15;

      const pConfig = mainBall.config;
      const pMaxZ = pConfig.orbitRadius + pConfig.radius + 100;
      const combinedZ = mainBall.centerZ + pLocalZ;
      const pDepthFactor = Math.max(0, Math.min(1, (combinedZ + pMaxZ) / (pMaxZ * 2)));
      const depthOpacity = 0.05 + pDepthFactor * 0.3;
      const depthScale = 0.2 + pDepthFactor * 0.8;
      const pulse = isFlying ? 1 : (1 + Math.sin(time * 1.5) * 0.03);

      if (planetMaterialRef.current) {
        const warpProgress = u.uWarpProgress.value;
        const warpGrow = 1.0 + warpProgress * warpProgress * 1.8;
        const warpFade = Math.max(0, 1 - warpProgress * 1.05);
        const portfolioFade = Math.max(0, 1 - portfolioBlendRef.current * 2);
        planetMaterialRef.current.uniforms.uOpacity.value = depthOpacity * warpFade * portfolioFade;
        planetMesh.scale.setScalar(depthScale * pulse * warpGrow);
      }

      // Update planet mesh (third ball)
      const p3Theta = planet3Mesh.userData.planetTheta;
      const p3Phi = planet3Mesh.userData.planetPhi;
      const p3Dist = planet3Mesh.userData.planetDist;
      const p3SpinTime = isFlying ? frozenOrbitTimeRef.current : time;
      const p3CurTheta = p3Theta + p3SpinTime * thirdBall.config.spinSpeed;
      const sinP3Phi = Math.sin(p3Phi), cosP3Phi = Math.cos(p3Phi);
      const p3LocalX = Math.cos(p3CurTheta) * sinP3Phi * p3Dist;
      const p3LocalY = cosP3Phi * p3Dist;
      const p3LocalZ = Math.sin(p3CurTheta) * sinP3Phi * p3Dist;

      planet3Mesh.position.set(
        thirdBall.centerX + offsetX + p3LocalX,
        thirdBall.centerY + offsetY + p3LocalY,
        p3LocalZ
      );
      planet3Mesh.rotation.y = time * thirdBall.config.spinSpeed * 1.5;
      planet3Mesh.rotation.x = 0.15;

      const p3Config = thirdBall.config;
      const p3MaxZ = p3Config.orbitRadius + p3Config.radius + 100;
      const p3CombinedZ = thirdBall.centerZ + p3LocalZ;
      const p3DepthFactor = Math.max(0, Math.min(1, (p3CombinedZ + p3MaxZ) / (p3MaxZ * 2)));
      const p3DepthOpacity = 0.05 + p3DepthFactor * 0.3;
      const p3DepthScale = 0.2 + p3DepthFactor * 0.8;
      const p3Pulse = isFlying ? 1 : (1 + Math.sin(time * 1.5 + 1.5) * 0.03);

      planet3Material.uniforms.uOpacity.value = p3DepthOpacity;
      planet3Mesh.scale.setScalar(p3DepthScale * p3Pulse);

      // Click target tracking
      const screenX = (mainBall.centerX + offsetX + pLocalX) + cachedW / 2;
      const screenY = -(mainBall.centerY + offsetY + pLocalY) + cachedH / 2;
      const screenSize = planetRadius * 2 * depthScale * pulse;

      if (clickTargetRef.current && !isFlying) {
        const hitSize = Math.max(screenSize * 3, 80);
        clickTargetRef.current.style.left = `${screenX - hitSize / 2}px`;
        clickTargetRef.current.style.top = `${screenY - hitSize / 2}px`;
        clickTargetRef.current.style.width = `${hitSize}px`;
        clickTargetRef.current.style.height = `${hitSize}px`;
        const isVisible = pDepthFactor > 0.15;
        clickTargetRef.current.style.pointerEvents = isVisible ? 'auto' : 'none';
        clickTargetRef.current.style.cursor = isVisible ? 'pointer' : 'default';
      }

      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    // Resize handler — debounced
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cachedW = window.innerWidth;
        cachedH = window.innerHeight;
        if (cameraRef.current) {
          cameraRef.current.left = -cachedW / 2;
          cameraRef.current.right = cachedW / 2;
          cameraRef.current.top = cachedH / 2;
          cameraRef.current.bottom = -cachedH / 2;
          cameraRef.current.updateProjectionMatrix();
        }
        if (rendererRef.current) {
          rendererRef.current.setSize(cachedW, cachedH);
        }
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      warpTimelineRef.current?.kill();
      cancelAnimationFrame(frameIdRef.current);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      starGeo.dispose();
      starMaterial.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      scene.clear();
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
        rendererRef.current.forceContextLoss();
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => on('warp-trigger', handlePlanetClick), []);

  useEffect(() => {
    if (section !== 'portfolio' && portfolioBlendRef.current > 0) {
      gsap.to(planetFormRef, { current: 0, duration: 1.0, ease: 'power2.in' });
      gsap.to(portfolioBlendRef, { current: 0, duration: 1.5, ease: 'power2.inOut' });
    }
  }, [section]);

  useEffect(() => { sectionRef.current = section; }, [section]);

  return (
    <>
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
