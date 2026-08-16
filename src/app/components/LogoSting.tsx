'use client';

/**
 * LogoSting — EA-Sports-style boot sting: red/blue wordmark in custom angular
 * letterforms inside a silver 3D oval ring on a light backdrop (Three.js +
 * GSAP). Test component: mounted on demand, plays once, self-dismisses via
 * onDone. Click/Enter/Space/Escape skips.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { buildGlyph, buildLineShapes, GLYPH_SPACING } from './logoSting.glyphs';
import { MOBILE_BREAKPOINT, zIndex } from '@/styles/sizing';
import { colors, shimmer } from '@/styles/colors';
import { fonts } from '@/styles/typography';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface LogoStingProps {
  onDone: () => void;
  word?: string;
  subline?: string;
  tagline?: string;
}

// Sports-sting palette (single definition — CSS strings, parsed by THREE.Color for GL)
const WORD_RED = '#d22630';
const WORD_BLUE = '#1c4da1';
const WORD_BLUE_LIGHT = '#3f8fd2';
const RING_SILVER = '#c9c9c9';
const BACKDROP_GRAY = '#e9e9e9';

const CAMERA_FOV = 38;
/** Fraction of the viewport width the settled ring may fill. */
const WORD_FILL = 0.4;
/** Vertical margin factor — badge occupies ~1/3 of the viewport height. */
const RING_V_MARGIN = 2.9;
/** Ring center sits slightly above screen center (tagline space below). */
const RING_Y_LIFT = 0.12;
const MIN_CAMERA_DIST = 3;
/** Reduced-motion / WebGL-fallback static card duration. */
const STATIC_HOLD_MS = 2600;
/** Sports-logotype italics: x' = x + shear * y, applied per glyph geometry. */
const ITALIC_SHEAR = 0.28;
/** Gap between word tokens on the single line, in text-size units. */
const SEGMENT_GAP = 0.3;
/** The red side tokens render at this fraction of the blue IT's size. */
const SIDE_TOKEN_SCALE = 0.62;
/** Secondary line (“SOLUTIONS”): upright caps under the mark, plus a tiny ™. */
const SUBLINE_SCALE = 0.36;
const TM_SCALE = 0.13;
const SUBLINE_BASELINE = -0.66;
/** Silver ring: band width and clearance around the wordmark. */
const RING_WIDTH = 0.22;
const RING_PAD = 0.55;

/** Bloom burst behind the badge at the lock-in moment. */
const BLOOM_GRADIENT =
  'radial-gradient(circle at 50% 46%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 60%)';

// Timeline choreography (seconds; later beats are computed from letter count).
// Documented phrasing for this era: elements arrive ONE PER BEAT — each letter
// stamps down from the camera with an impact — then the ring wraps the finished
// word with a slight spin, and the glint/flash lock the badge in.
const T = {
  stampStart: 0.3, // beat of empty backdrop before the first letter hits
  stampInterval: 0.2, // one letter per beat, falls overlapping the settles
  stampDur: 0.18, // accelerating fall from camera down onto the plane
  ringDur: 0.45, // ring arrives with an overshoot settle, spinning as it comes
  glintDur: 0.55, // fast specular pass across the ring
  glazeDur: 1.3, // slower return pass across the letters
} as const;

/** Uppercase tokens (the "IT" in "ra IT is") get the blue; the rest the red. */
const isAccentToken = (token: string): boolean => token !== token.toLowerCase();

const LogoSting = ({
  onDone,
  word = 'ra IT is',
  subline = 'SOLUTIONS',
  tagline = "it's in the name.",
}: LogoStingProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const finishedRef = useRef(false);

  const onDoneRef = useRef(onDone);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

  const reducedMotion = useReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);
  const staticMode = reducedMotion || webglFailed;

  // Refs-only so the identity stays stable for the timeline and key handlers.
  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    timelineRef.current?.kill();
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.out',
      onComplete: () => onDoneRef.current(),
    });
  }, []);

  // Static fallback: hold the composed card briefly, then dismiss.
  useEffect(() => {
    if (!staticMode) return;
    overlayRef.current?.focus();
    const timer = setTimeout(finish, STATIC_HOLD_MS);
    return () => clearTimeout(timer);
  }, [staticMode, finish]);

  useEffect(() => {
    if (staticMode) return;
    if (!canvasHostRef.current) return;
    const host = canvasHostRef.current;
    overlayRef.current?.focus();

    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = Math.min(width, height) < MOBILE_BREAKPOINT;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    } catch (err) {
      // WebGL disabled/blocklisted — fall back to the static card (IR-B2 pattern)
      if (process.env.NODE_ENV !== 'production') {
        console.warn('WebGL unavailable — logo sting falls back to static card', err);
      }
      setWebglFailed(true);
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2));
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKDROP_GRAY);

    // Procedural studio environment — sells the silver ring without HDR assets.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new RoomEnvironment();
    const envRT = pmrem.fromScene(envScene, 0.04);
    scene.environment = envRT.texture;

    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 200);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    // Sweeping glint light — its x position is animated across the ring
    const sweepLight = new THREE.PointLight(0xffffff, 80, 0, 2);
    sweepLight.position.set(0, 0.4, 2.2);
    scene.add(sweepLight);

    const group = new THREE.Group();
    scene.add(group);

    let frameId = 0;
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    let ovalX = 0;
    let ovalY = 0;
    let finalDist = MIN_CAMERA_DIST;

    const fitCameraDistance = (): number => {
      const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2);
      const widthFit = ((ovalX + RING_WIDTH) / WORD_FILL) / (tanHalfFov * camera.aspect);
      const heightFit = (ovalY * RING_V_MARGIN) / tanHalfFov;
      return Math.max(widthFit, heightFit, MIN_CAMERA_DIST);
    };

    const animate = () => {
      if (!rendererRef.current) return; // self-terminating after teardown (IR-R1)
      camera.lookAt(0, group.position.y, 0);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    // Wordmark: custom angular glyphs, one mesh per LETTER so each can stamp
    // in on its own beat. Materials are per-letter (not shared) because each
    // letter fades in during its fall — matte-leaning so the colors read as
    // flat print, with just enough gloss for the glint sweep to register.
    const shear = new THREE.Matrix4().makeShear(ITALIC_SHEAR, 0, 0, 0, 0, 0);
    // Single-line lockup on one shared baseline: the blue IT dominates and
    // the red side tokens render smaller
    const tokens = word.split(' ').filter(Boolean);
    const letterMeshes: THREE.Mesh[] = [];
    let minY = Infinity;
    let maxY = -Infinity;
    let cursor = 0;

    const letterExtrude = {
      depth: 0.32,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 2,
    };

    tokens.forEach((token, tokenIndex) => {
      if (tokenIndex > 0) cursor += SEGMENT_GAP;
      const accent = isAccentToken(token);
      const tokenScale = accent ? 1 : SIDE_TOKEN_SCALE;
      let firstInToken = true;
      for (const ch of token) {
        const glyph = buildGlyph(ch);
        if (!glyph) continue;
        const geometry = new THREE.ExtrudeGeometry(glyph.shapes, letterExtrude);
        // Bake the token size into the geometry (about the baseline origin) so
        // mesh.scale stays free for the landing squash; shear AFTER scaling
        // keeps the italic angle identical across sizes. Then center x/z ONLY —
        // y stays authored so every letter shares the one baseline.
        geometry.scale(tokenScale, tokenScale, tokenScale);
        geometry.applyMatrix4(shear);
        geometry.computeBoundingBox();
        const raw = geometry.boundingBox!;
        geometry.translate(-(raw.min.x + raw.max.x) / 2, 0, -(raw.min.z + raw.max.z) / 2);
        geometry.computeBoundingBox();
        const bbox = geometry.boundingBox!;
        minY = Math.min(minY, bbox.min.y);
        maxY = Math.max(maxY, bbox.max.y);
        geometries.push(geometry);

        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(accent ? WORD_BLUE : WORD_RED),
          metalness: 0.08,
          roughness: 0.32,
          envMapIntensity: 0.7,
          transparent: true,
        });
        materials.push(material);
        const mesh = new THREE.Mesh(geometry, material);
        const letterWidth = bbox.max.x - bbox.min.x;
        if (!firstInToken) cursor += GLYPH_SPACING * tokenScale;
        firstInToken = false;
        mesh.position.x = cursor + letterWidth / 2;
        cursor += letterWidth;
        letterMeshes.push(mesh);
      }
    });

    const wordWidth = cursor;

    // Secondary “SOLUTIONS™” line: upright caps as one mesh (it arrives as a
    // unit, not stamped), sharing one material with the top-aligned tiny ™
    const sublineMeshes: THREE.Mesh[] = [];
    let sublineHalfWidth = 0;
    if (subline) {
      const run = buildLineShapes(subline.toUpperCase());
      if (run.shapes.length > 0) {
        const subMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(WORD_BLUE_LIGHT),
          metalness: 0.08,
          roughness: 0.32,
          envMapIntensity: 0.7,
          transparent: true,
        });
        materials.push(subMaterial);

        const subGeometry = new THREE.ExtrudeGeometry(run.shapes, letterExtrude);
        subGeometry.scale(SUBLINE_SCALE, SUBLINE_SCALE, SUBLINE_SCALE);
        subGeometry.computeBoundingBox();
        const subRaw = subGeometry.boundingBox!;
        subGeometry.translate(-(subRaw.min.x + subRaw.max.x) / 2, 0, -(subRaw.min.z + subRaw.max.z) / 2);
        subGeometry.computeBoundingBox();
        const subBBox = subGeometry.boundingBox!;
        geometries.push(subGeometry);
        const subMesh = new THREE.Mesh(subGeometry, subMaterial);
        subMesh.position.y = SUBLINE_BASELINE;
        sublineHalfWidth = (subBBox.max.x - subBBox.min.x) / 2;
        minY = Math.min(minY, SUBLINE_BASELINE + subBBox.min.y);
        maxY = Math.max(maxY, SUBLINE_BASELINE + subBBox.max.y);
        sublineMeshes.push(subMesh);

        const tmRun = buildLineShapes('TM');
        const tmGeometry = new THREE.ExtrudeGeometry(tmRun.shapes, letterExtrude);
        tmGeometry.scale(TM_SCALE, TM_SCALE, TM_SCALE);
        tmGeometry.computeBoundingBox();
        const tmRaw = tmGeometry.boundingBox!;
        tmGeometry.translate(-(tmRaw.min.x + tmRaw.max.x) / 2, 0, -(tmRaw.min.z + tmRaw.max.z) / 2);
        tmGeometry.computeBoundingBox();
        const tmBBox = tmGeometry.boundingBox!;
        geometries.push(tmGeometry);
        const tmMesh = new THREE.Mesh(tmGeometry, subMaterial);
        const tmHalfWidth = (tmBBox.max.x - tmBBox.min.x) / 2;
        tmMesh.position.x = sublineHalfWidth + tmHalfWidth + 0.08;
        tmMesh.position.y = SUBLINE_BASELINE + SUBLINE_SCALE - TM_SCALE; // cap-top aligned
        sublineHalfWidth = tmMesh.position.x + tmHalfWidth;
        sublineMeshes.push(tmMesh);
      }
    }

    const wordMidY = (minY + maxY) / 2;
    for (const mesh of letterMeshes) {
      mesh.position.x -= wordWidth / 2;
      mesh.position.y = -wordMidY; // shared shift keeps the common baseline
      group.add(mesh);
    }
    for (const mesh of sublineMeshes) {
      mesh.position.y -= wordMidY;
      group.add(mesh);
    }

    // Silver ROUND ring: flat extruded band with a bevel, like a badge —
    // radius clears both lines and the lockup height
    const lockupHalfWidth = Math.max(wordWidth / 2, sublineHalfWidth);
    ovalX = Math.max(lockupHalfWidth + RING_PAD + RING_WIDTH, (maxY - minY) / 2 + 0.45);
    ovalY = ovalX;
    const ringShape = new THREE.Shape();
    ringShape.absellipse(0, 0, ovalX, ovalY, 0, Math.PI * 2, false, 0);
    const ringHole = new THREE.Path();
    ringHole.absellipse(0, 0, ovalX - RING_WIDTH, ovalY - RING_WIDTH, 0, Math.PI * 2, true, 0);
    ringShape.holes.push(ringHole);
    const ringGeometry = new THREE.ExtrudeGeometry(ringShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 3,
      curveSegments: 72,
    });
    geometries.push(ringGeometry);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(RING_SILVER),
      metalness: 1,
      roughness: 0.18,
      envMapIntensity: 1.15,
      transparent: true,
    });
    materials.push(ringMaterial);
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.position.z = -0.2;
    group.add(ringMesh);

    // White oval face inside the ring, behind the letters
    const fillShape = new THREE.Shape();
    fillShape.absellipse(0, 0, ovalX - RING_WIDTH, ovalY - RING_WIDTH, 0, Math.PI * 2, false, 0);
    const fillGeometry = new THREE.ShapeGeometry(fillShape, 64);
    geometries.push(fillGeometry);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.white),
      transparent: true,
    });
    materials.push(fillMaterial);
    const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
    fillMesh.position.z = -0.25;
    group.add(fillMesh);

    group.position.y = ovalY * RING_Y_LIFT;

    finalDist = fitCameraDistance();
    camera.position.set(0, group.position.y, finalDist);

    const tl = gsap.timeline();
    timelineRef.current = tl;
    const groupY = group.position.y;

    // Continuous slow camera drift under the whole intro — nothing sits still
    const sublineAt = T.stampStart + letterMeshes.length * T.stampInterval + 0.05;
    const ringAt = sublineAt + (sublineMeshes.length > 0 ? 0.35 : 0);
    tl.fromTo(
      camera.position,
      { z: finalDist * 1.07 },
      { z: finalDist, duration: ringAt + 0.6, ease: 'sine.out' },
      0
    );

    // Stamp phase: each letter fades in mid-fall (no pop), accelerates onto
    // the plane with a forward tilt that levels out late, and lands with a
    // squash-and-stretch settle, soft camera kick, and micro-flash. Falls
    // overlap the previous letter's settle so the phrase reads as one motion.
    letterMeshes.forEach((mesh, i) => {
      const at = T.stampStart + i * T.stampInterval;
      const land = at + T.stampDur;
      mesh.visible = false;
      const material = mesh.material as THREE.MeshStandardMaterial;
      tl
        .set(mesh, { visible: true }, at)
        .fromTo(material, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power1.out' }, at)
        .fromTo(mesh.position, { z: finalDist * 0.6 }, { z: 0, duration: T.stampDur, ease: 'expo.in' }, at)
        .fromTo(mesh.rotation, { x: -0.45 }, { x: 0, duration: 0.28, ease: 'back.out(3)' }, at)
        .to(mesh.scale, { y: 0.92, x: 1.05, duration: 0.05, ease: 'power2.in' }, land)
        .to(mesh.scale, { y: 1, x: 1, duration: 0.24, ease: 'elastic.out(1.8, 0.45)' }, land + 0.05)
        .fromTo(
          camera.position,
          { y: groupY - 0.05 },
          { y: groupY, duration: 0.2, ease: 'power2.out', overwrite: 'auto' },
          land
        )
        .to(flashRef.current, { autoAlpha: 0.12, duration: 0.04, ease: 'power1.in' }, land)
        .to(flashRef.current, { autoAlpha: 0, duration: 0.12, ease: 'power1.out' }, land + 0.04);
    });

    // Secondary line rises in as one unit once the mark is stamped
    if (sublineMeshes.length > 0) {
      const subMaterial = sublineMeshes[0].material as THREE.MeshStandardMaterial;
      tl.fromTo(subMaterial, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power1.out' }, sublineAt);
      for (const mesh of sublineMeshes) {
        mesh.visible = false;
        const finalY = mesh.position.y;
        tl
          .set(mesh, { visible: true }, sublineAt)
          .fromTo(mesh.position, { y: finalY - 0.15 }, { y: finalY, duration: 0.35, ease: 'power2.out' }, sublineAt);
      }
    }

    // Ring phase: the ring glides in over the finished word — overshoot
    // settle while it spins, fading up as it arrives — then the big
    // glint/flash lock the badge in
    const ringHit = ringAt + 0.25;
    ringMesh.visible = false;
    fillMesh.visible = false;
    tl
      .set(ringMesh, { visible: true }, ringAt)
      .set(fillMesh, { visible: true }, ringAt)
      .fromTo(ringMaterial, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: 'power1.out' }, ringAt)
      .fromTo(fillMaterial, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power1.out' }, ringAt)
      .fromTo(
        ringMesh.scale,
        { x: 1.22, y: 1.22, z: 1 },
        { x: 1, y: 1, z: 1, duration: T.ringDur, ease: 'back.out(2.2)' },
        ringAt
      )
      .fromTo(
        fillMesh.scale,
        { x: 1.22, y: 1.22, z: 1 },
        { x: 1, y: 1, z: 1, duration: T.ringDur, ease: 'back.out(2.2)' },
        ringAt
      )
      .fromTo(ringMesh.rotation, { z: -0.22 }, { z: 0, duration: 0.9, ease: 'power3.out' }, ringAt)
      .fromTo(
        camera.position,
        { y: groupY - 0.08 },
        { y: groupY, duration: 0.25, ease: 'power2.out', overwrite: 'auto' },
        ringHit
      )
      // Rotating environment keeps the reflections traveling
      .fromTo(scene.environmentRotation, { y: 0.8 }, { y: -0.5, duration: 3.5, ease: 'power1.out' }, ringAt)
      .fromTo(
        sweepLight.position,
        { x: -ovalX },
        { x: ovalX, duration: T.glintDur, ease: 'power2.inOut' },
        ringHit + 0.05
      )
      .to(flashRef.current, { autoAlpha: 0.85, duration: 0.08, ease: 'power1.in' }, ringHit)
      .to(flashRef.current, { autoAlpha: 0, duration: 0.45, ease: 'power2.out' }, ringHit + 0.08)
      .to(glowRef.current, { autoAlpha: 0.75, duration: 0.12, ease: 'power1.in' }, ringHit)
      .to(glowRef.current, { autoAlpha: 0, duration: 0.9, ease: 'power2.out' }, ringHit + 0.12)
      .to(taglineRef.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, ringHit + 0.45)
      // Living hold: perpetual gentle wobble, slow push-in, and a return glaze
      .to(group.rotation, { y: 0.055, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }, ringHit + 0.45)
      .to(camera.position, { z: finalDist * 0.965, duration: 2.4, ease: 'sine.out', overwrite: 'auto' }, ringHit + 0.7)
      .to(sweepLight.position, { x: -ovalX, y: 0.9, duration: T.glazeDur, ease: 'sine.inOut' }, ringHit + 0.85)
      .add(finish, ringHit + 2.55);

    frameId = requestAnimationFrame(animate);

    // A 4s one-shot doesn't warrant a full restore path — just end gracefully.
    const canvas = renderer.domElement;
    const onContextLost = () => finish();
    canvas.addEventListener('webglcontextlost', onContextLost);

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width = window.innerWidth;
        height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        // Re-fit framing; overwrite lets a late resize win over the intro tween
        if (ovalX > 0) {
          finalDist = fitCameraDistance();
          gsap.to(camera.position, { z: finalDist, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
      }, 150);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timelineRef.current?.kill();
      timelineRef.current = null;
      cancelAnimationFrame(frameId);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      envRT.dispose();
      envScene.dispose();
      pmrem.dispose();
      scene.clear();
      host.removeChild(canvas);
      renderer.forceContextLoss();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [staticMode, word, subline, finish]);

  return (
    <div
      ref={overlayRef}
      role='button'
      tabIndex={0}
      aria-label='Skip intro animation'
      onPointerDown={finish}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
          e.preventDefault();
          finish();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: BACKDROP_GRAY,
        // Above the saturn frame (modal), below the skip link
        zIndex: zIndex.popover,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {staticMode ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.25rem',
            textAlign: 'center',
            padding: '0 1rem',
          }}
        >
          <div
            style={{
              backgroundColor: colors.white,
              border: `4px solid ${RING_SILVER}`,
              borderRadius: '50%',
              aspectRatio: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '2rem',
            }}
          >
            <div
              style={{
                fontFamily: fonts.alien,
                fontStyle: 'italic',
                fontSize: 'clamp(1.4rem, 6vw, 2.75rem)',
                color: WORD_RED,
                letterSpacing: '0.04em',
                lineHeight: 1.15,
              }}
            >
              {word.split(' ').map((token, i) => (
                <span
                  key={`${token}-${i}`}
                  style={
                    isAccentToken(token)
                      ? { color: WORD_BLUE }
                      : { fontSize: `${SIDE_TOKEN_SCALE}em` }
                  }
                >
                  {i > 0 ? ' ' : ''}
                  {token}
                </span>
              ))}
            </div>
            {subline && (
              <div
                style={{
                  fontFamily: fonts.alien,
                  fontSize: 'clamp(0.75rem, 2.6vw, 1.2rem)',
                  color: WORD_BLUE_LIGHT,
                  letterSpacing: '0.25em',
                }}
              >
                {subline.toUpperCase()}™
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: fonts.alien,
              fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)',
              color: shimmer.sweepEdge,
              letterSpacing: '0.3em',
            }}
          >
            {tagline}
          </div>
        </div>
      ) : (
        <>
          <div ref={canvasHostRef} style={{ position: 'absolute', inset: 0 }} />
          <div
            ref={taglineRef}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '72%',
              textAlign: 'center',
              fontFamily: fonts.alien,
              fontSize: 'clamp(0.9rem, 3.5vw, 1.25rem)',
              color: shimmer.sweepEdge,
              letterSpacing: '0.3em',
              opacity: 0,
              visibility: 'hidden',
              transform: 'translateY(12px)',
            }}
          >
            {tagline}
          </div>
          <div
            ref={glowRef}
            aria-hidden='true'
            style={{
              position: 'absolute',
              inset: 0,
              background: BLOOM_GRADIENT,
              opacity: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />
          <div
            ref={flashRef}
            aria-hidden='true'
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: colors.white,
              opacity: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
};

export default LogoSting;
