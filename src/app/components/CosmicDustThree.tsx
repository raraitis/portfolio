'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { on, emit, type SectionName } from '@/lib/events';
import { MOBILE_BREAKPOINT } from '@/styles/sizing';
import { BALLS, BALL_ORBIT, STRIPE_COUNT, STAR_COUNT, type BallConfig } from './cosmicDust.config';
import {
  planetVertexShader,
  planetFragmentShader,
  particleVertexShader,
  particleFragmentShader,
  starVertexShader,
  starFragmentShader,
} from './cosmicDust.shaders';

interface CosmicDustThreeProps {
  section: SectionName;
}

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

    const isMobile = width < MOBILE_BREAKPOINT;
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
      const stripeCount = STRIPE_COUNT;
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

    // Shared uniform objects — particle and star materials reference the SAME
    // objects, so one write per frame updates both layers (SSOT-7)
    const sharedUniforms = {
      uTime: { value: 0 },
      uWarpProgress: { value: 0 },
      uWarpCenter: { value: new THREE.Vector2() },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: sharedUniforms.uTime,
        uBall0Center: { value: new THREE.Vector3() },
        uBall1Center: { value: new THREE.Vector3() },
        uBall0Spin: { value: new THREE.Vector2(BALLS[0].spinSpeed, BALLS[0].swirlSpeed) },
        uBall1Spin: { value: new THREE.Vector2(BALLS[1].spinSpeed, BALLS[1].swirlSpeed) },
        uSectionScale: { value: 1 },
        uPlanetForm: { value: 0 },
        uPlanetSpin: { value: new THREE.Vector2(1, 0) },
        uBallDepth: { value: new THREE.Vector2(0.5, 0.5) },
        uWarpProgress: sharedUniforms.uWarpProgress,
        uWarpCenter: sharedUniforms.uWarpCenter,
      },
    });

    const particles = new THREE.Points(geometry, material);
    particles.frustumCulled = false;
    particlesRef.current = particles;
    scene.add(particles);

    // Striped planet sphere
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
        uTime: sharedUniforms.uTime,
        uWarpProgress: sharedUniforms.uWarpProgress,
        uWarpCenter: sharedUniforms.uWarpCenter,
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
    const childBall = ballRuntimes[1];
    const mainOC = BALL_ORBIT.get(mainBall.config.id)!;
    const childOC = BALL_ORBIT.get(childBall.config.id)!;
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

      const childOrbit = orbitTime * childBall.config.orbitSpeed + childBall.config.orbitPhaseOffset;
      const cOrbitX = Math.cos(childOrbit) * childBall.config.orbitRadius;
      const cOrbitZ = Math.sin(childOrbit) * childOC.orbitB;
      childBall.centerX = mainBall.centerX + cOrbitX;
      childBall.centerY = mainBall.centerY + cOrbitZ * childOC.tiltSin;
      childBall.centerZ = mainBall.centerZ + cOrbitZ * childOC.tiltCos;
      if (blend > 0.001) {
        childBall.centerX = childBall.centerX * (1 - blend) + (-5000) * blend;
        childBall.centerY = childBall.centerY * (1 - blend) + (-5000) * blend;
      }

      // Depth factors
      const mainMaxZ = mainBall.config.orbitRadius + 100;
      const mainDepth = Math.max(0, Math.min(1, (mainBall.centerZ + mainMaxZ) / (mainMaxZ * 2)));
      const childMaxZ = childBall.config.orbitRadius + mainBall.config.orbitRadius + 100;
      const childDepth = Math.max(0, Math.min(1, (childBall.centerZ + childMaxZ) / (childMaxZ * 2)));

      // Update uniforms (replaces 352KB buffer uploads with ~20 floats)
      u.uTime.value = time;
      u.uBall0Center.value.set(mainBall.centerX, mainBall.centerY, mainBall.centerZ);
      u.uBall1Center.value.set(childBall.centerX, childBall.centerY, childBall.centerZ);
      u.uSectionScale.value = 1 + blend;
      u.uPlanetForm.value = planetFormRef.current;
      const planetSpin = time * 0.12;
      u.uPlanetSpin.value.set(Math.cos(planetSpin), Math.sin(planetSpin));
      u.uBallDepth.value.set(mainDepth, childDepth);

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

      // Update planet mesh
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
        role='button'
        tabIndex={0}
        aria-label='Fly to portfolio'
        onClick={handlePlanetClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePlanetClick();
          }
        }}
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
