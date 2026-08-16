'use client';

/**
 * LogoSting — EA-Sports-style boot sting: red/blue wordmark inside a silver
 * 3D oval ring on a light backdrop (Three.js + GSAP). Test component:
 * mounted on demand, plays once, self-dismisses via onDone.
 * Click/Enter/Space/Escape skips.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { MOBILE_BREAKPOINT, zIndex } from '@/styles/sizing';
import { colors, shimmer } from '@/styles/colors';
import { fonts } from '@/styles/typography';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface LogoStingProps {
  onDone: () => void;
  word?: string;
  tagline?: string;
}

const FONT_URL = '/fonts/helvetiker_bold.typeface.json';
// Sports-sting palette (single definition — CSS strings, parsed by THREE.Color for GL)
const WORD_RED = '#d22630';
const WORD_BLUE = '#1c4da1';
const RING_SILVER = '#c9c9c9';
const BACKDROP_GRAY = '#e9e9e9';

const CAMERA_FOV = 38;
/** Fraction of the viewport width the settled ring should fill. */
const WORD_FILL = 0.8;
/** Vertical margin factor so the ring leaves headroom + tagline room. */
const RING_V_MARGIN = 1.45;
/** Ring center sits slightly above screen center (tagline space below). */
const RING_Y_LIFT = 0.12;
const MIN_CAMERA_DIST = 3;
/** Reduced-motion / WebGL-fallback static card duration. */
const STATIC_HOLD_MS = 2600;
/** Sports-logotype italics: x' = x + shear * y, applied per glyph geometry. */
const ITALIC_SHEAR = 0.25;
/** Gap between word tokens, in text-size units. */
const SEGMENT_GAP = 0.28;
/** Silver oval ring: band width and clearance around the wordmark. */
const RING_WIDTH = 0.22;
const RING_PAD = 0.55;

// Timeline choreography (seconds from sting start)
const T = {
  spinInDur: 1.3, // ring + wordmark whip from edge-on to face-on
  flyInDur: 1.5, // camera drops from above/behind to final framing
  sweepAt: 0.7, // specular glint travels across the ring
  sweepDur: 0.7,
  flashAt: 1.05, // white "hit" as the mark locks in
  taglineAt: 1.5,
  endAt: 3.9,
} as const;

/** Uppercase tokens (the "IT" in "ra IT is") get the blue; the rest the red. */
const isAccentToken = (token: string): boolean => token !== token.toLowerCase();

const LogoSting = ({
  onDone,
  word = 'ra IT is',
  tagline = "it's in the name.",
}: LogoStingProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const taglineRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
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

    let cancelled = false;
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

    new FontLoader()
      .loadAsync(FONT_URL)
      .then((font) => {
        if (cancelled) return;

        // Italic shear + slight condense push helvetiker toward the sports-logotype look
        const shear = new THREE.Matrix4().makeShear(ITALIC_SHEAR, 0, 0, 0, 0, 0);
        const tokens = word.split(' ').filter(Boolean);
        const meshes: THREE.Mesh[] = [];
        const widths: number[] = [];
        let minY = Infinity;
        let maxY = -Infinity;

        for (const token of tokens) {
          const geometry = new TextGeometry(token, {
            font,
            size: 1,
            depth: 0.32,
            curveSegments: 10,
            bevelEnabled: true,
            bevelThickness: 0.05,
            bevelSize: 0.03,
            bevelSegments: 4,
          });
          // Condense + shear about the baseline origin, then center x/z ONLY —
          // y stays authored so every token shares one baseline (like a logotype)
          geometry.scale(0.88, 1.05, 1);
          geometry.applyMatrix4(shear);
          geometry.computeBoundingBox();
          const raw = geometry.boundingBox!;
          geometry.translate(-(raw.min.x + raw.max.x) / 2, 0, -(raw.min.z + raw.max.z) / 2);
          geometry.computeBoundingBox();
          const bbox = geometry.boundingBox!;
          widths.push(bbox.max.x - bbox.min.x);
          minY = Math.min(minY, bbox.min.y);
          maxY = Math.max(maxY, bbox.max.y);
          geometries.push(geometry);

          // Glossy colored letters (not full metal — keeps the red/blue saturated)
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(isAccentToken(token) ? WORD_BLUE : WORD_RED),
            metalness: 0.2,
            roughness: 0.28,
            envMapIntensity: 0.9,
          });
          materials.push(material);
          meshes.push(new THREE.Mesh(geometry, material));
        }

        const wordWidth = widths.reduce((a, b) => a + b, 0) + SEGMENT_GAP * (tokens.length - 1);
        const wordMidY = (minY + maxY) / 2;
        let cursor = -wordWidth / 2;
        meshes.forEach((mesh, i) => {
          mesh.position.x = cursor + widths[i] / 2;
          mesh.position.y = -wordMidY; // shared shift keeps the common baseline
          cursor += widths[i] + SEGMENT_GAP;
          group.add(mesh);
        });

        // Silver oval ring: flat extruded ellipse band with a bevel, like a badge
        ovalX = wordWidth / 2 + RING_PAD + RING_WIDTH;
        ovalY = Math.max(1.25, ovalX * 0.55);
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
        const fillMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(colors.white) });
        materials.push(fillMaterial);
        const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
        fillMesh.position.z = -0.25;
        group.add(fillMesh);

        group.position.y = ovalY * RING_Y_LIFT;

        finalDist = fitCameraDistance();
        camera.position.set(0, group.position.y, finalDist);

        const tl = gsap.timeline();
        timelineRef.current = tl;
        tl
          .fromTo(group.rotation, { y: -1.25 }, { y: 0, duration: T.spinInDur, ease: 'power4.out' }, 0)
          .fromTo(
            camera.position,
            { z: finalDist * 2.4, y: group.position.y + finalDist * 0.35 },
            { z: finalDist, y: group.position.y, duration: T.flyInDur, ease: 'power3.out' },
            0
          )
          // Rotating environment keeps the reflections traveling during the whip
          .fromTo(scene.environmentRotation, { y: 0.6 }, { y: -0.4, duration: 3.5, ease: 'power1.out' }, 0)
          .fromTo(
            sweepLight.position,
            { x: -ovalX },
            { x: ovalX, duration: T.sweepDur, ease: 'power2.inOut' },
            T.sweepAt
          )
          .to(flashRef.current, { autoAlpha: 0.9, duration: 0.1, ease: 'power1.in' }, T.flashAt)
          .to(flashRef.current, { autoAlpha: 0, duration: 0.55, ease: 'power2.out' }, T.flashAt + 0.1)
          .to(taglineRef.current, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' }, T.taglineAt)
          // Settled hold: gentle drift so the metal keeps living
          .to(group.rotation, { y: 0.06, duration: 2.4, ease: 'sine.inOut' }, T.taglineAt)
          .to(camera.position, { z: finalDist * 0.96, duration: 2.4, ease: 'sine.out' }, T.taglineAt)
          .add(finish, T.endAt);

        frameId = requestAnimationFrame(animate);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (process.env.NODE_ENV !== 'production') {
          console.warn('Logo sting font failed to load — falling back to static card', err);
        }
        setWebglFailed(true);
      });

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
      cancelled = true;
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
  }, [staticMode, word, finish]);

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
              padding: '2.5rem 4rem',
            }}
          >
            <div
              style={{
                fontFamily: fonts.alien,
                fontStyle: 'italic',
                fontSize: 'clamp(2.2rem, 11vw, 5.5rem)',
                color: WORD_RED,
                letterSpacing: '0.04em',
              }}
            >
              {word.split(' ').map((token, i) => (
                <span
                  key={`${token}-${i}`}
                  style={isAccentToken(token) ? { color: WORD_BLUE } : undefined}
                >
                  {i > 0 ? ' ' : ''}
                  {token}
                </span>
              ))}
            </div>
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
              top: '84%',
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
