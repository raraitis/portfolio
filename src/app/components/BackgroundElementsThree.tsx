'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useAnimationActions } from '@/contexts/AnimationContext';
import { useDevice } from '../hooks/useDevice';

// Three.js Background Component for GPU Acceleration Evaluation
const BackgroundElementsThree = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animationActions = useAnimationActions();
  const device = useDevice();

  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particleSystemsRef = useRef<{
    staticDots: THREE.Points | null;
    planetDots: THREE.Points | null;
    orbitalDots: THREE.Points | null;
  }>({ staticDots: null, planetDots: null, orbitalDots: null });
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  // Listen for global section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setBackgroundSection = (section: 'home' | 'me') => {
        setCurrentSection(section);
      };
    }
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Setup camera
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Setup renderer with GPU optimization
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !device.isMobile, // Disable antialiasing on mobile for performance
        powerPreference: 'high-performance',
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
      renderer.setClearColor(0x000000, 0); // Transparent background
      rendererRef.current = renderer;

      mountRef.current.appendChild(renderer.domElement);

      // Create particle systems
      createParticleSystems(scene);

      // Setup resize handler
      const handleResize = () => {
        if (!camera || !renderer) return;
        
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener('resize', handleResize);

      // Start animation loop
      animate();

      setIsInitialized(true);

      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // Dispose of Three.js resources
        if (renderer) {
          renderer.dispose();
        }

        // Clean up particle systems
        Object.values(particleSystemsRef.current).forEach(system => {
          if (system) {
            scene.remove(system);
            if (system.geometry) system.geometry.dispose();
            if (system.material instanceof THREE.Material) {
              system.material.dispose();
            }
          }
        });

        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
      };

    } catch (err) {
      console.error('Three.js initialization error:', err);
      setError('Failed to initialize Three.js. Your browser may not support WebGL.');
    }
  }, [device.isMobile]);

  const createParticleSystems = (scene: THREE.Scene) => {
    // Static dots particle system
    const staticDotsCount = 1000;
    const staticGeometry = new THREE.BufferGeometry();
    const staticPositions = new Float32Array(staticDotsCount * 3);
    const staticColors = new Float32Array(staticDotsCount * 3);
    const staticSizes = new Float32Array(staticDotsCount);

    for (let i = 0; i < staticDotsCount; i++) {
      const i3 = i * 3;
      
      // Position dots in a sphere pattern
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const radius = 2 + Math.random() * 1;
      
      staticPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      staticPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      staticPositions[i3 + 2] = radius * Math.cos(phi);

      // Brown color for static dots
      staticColors[i3] = 0.545; // R
      staticColors[i3 + 1] = 0.271; // G
      staticColors[i3 + 2] = 0.075; // B

      staticSizes[i] = Math.random() * 2 + 1;
    }

    staticGeometry.setAttribute('position', new THREE.BufferAttribute(staticPositions, 3));
    staticGeometry.setAttribute('color', new THREE.BufferAttribute(staticColors, 3));
    staticGeometry.setAttribute('size', new THREE.BufferAttribute(staticSizes, 1));

    const staticMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        uniform float pixelRatio;
        varying vec3 vColor;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Gentle floating animation
          pos.x += sin(time * 0.7 + position.y * 3.0) * 0.05;
          pos.y += cos(time * 0.5 + position.x * 2.0) * 0.05;
          pos.z += sin(time * 0.8 + position.x + position.y) * 0.03;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
          
          gl_FragColor = vec4(vColor, alpha * 0.6);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      vertexColors: true,
    });

    const staticDots = new THREE.Points(staticGeometry, staticMaterial);
    scene.add(staticDots);
    particleSystemsRef.current.staticDots = staticDots;

    // Planet dots particle system
    const planetDotsCount = 5;
    const planetGeometry = new THREE.BufferGeometry();
    const planetPositions = new Float32Array(planetDotsCount * 3);
    const planetColors = new Float32Array(planetDotsCount * 3);
    const planetSizes = new Float32Array(planetDotsCount);

    for (let i = 0; i < planetDotsCount; i++) {
      const i3 = i * 3;
      const angle = (i / planetDotsCount) * Math.PI * 2;
      const radius = 3;
      
      planetPositions[i3] = Math.cos(angle) * radius;
      planetPositions[i3 + 1] = Math.sin(angle) * radius;
      planetPositions[i3 + 2] = 0;

      // BEIGE for fat planets, RED for normal
      if (i >= 3) {
        planetColors[i3] = 0.96; // BEIGE R
        planetColors[i3 + 1] = 0.87; // BEIGE G
        planetColors[i3 + 2] = 0.70; // BEIGE B
        planetSizes[i] = 8; // Fat planets
      } else {
        planetColors[i3] = 0.86; // RED R
        planetColors[i3 + 1] = 0.08; // RED G
        planetColors[i3 + 2] = 0.24; // RED B
        planetSizes[i] = 4; // Normal planets
      }
    }

    planetGeometry.setAttribute('position', new THREE.BufferAttribute(planetPositions, 3));
    planetGeometry.setAttribute('color', new THREE.BufferAttribute(planetColors, 3));
    planetGeometry.setAttribute('size', new THREE.BufferAttribute(planetSizes, 1));

    const planetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        uniform float pixelRatio;
        varying vec3 vColor;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Orbital animation
          float angle = time * 0.3 + atan(position.y, position.x);
          float radius = length(position.xy);
          
          pos.x = cos(angle) * radius;
          pos.y = sin(angle) * radius;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
          
          // Add glow effect for planets
          float glow = 1.0 - smoothstep(0.0, 1.0, distanceFromCenter);
          alpha = max(alpha, glow * 0.3);
          
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      vertexColors: true,
    });

    const planetDots = new THREE.Points(planetGeometry, planetMaterial);
    scene.add(planetDots);
    particleSystemsRef.current.planetDots = planetDots;

    // Orbital big dots particle system
    const orbitalDotsCount = 6;
    const orbitalGeometry = new THREE.BufferGeometry();
    const orbitalPositions = new Float32Array(orbitalDotsCount * 3);
    const orbitalColors = new Float32Array(orbitalDotsCount * 3);
    const orbitalSizes = new Float32Array(orbitalDotsCount);

    for (let i = 0; i < orbitalDotsCount; i++) {
      const i3 = i * 3;
      const angle = (i / orbitalDotsCount) * Math.PI * 2;
      const radius = 4;
      
      orbitalPositions[i3] = Math.cos(angle) * radius;
      orbitalPositions[i3 + 1] = Math.sin(angle) * radius;
      orbitalPositions[i3 + 2] = Math.sin(angle * 2) * 0.5; // Add some Z variation

      // Blue color for orbital dots
      orbitalColors[i3] = 0.0; // B
      orbitalColors[i3 + 1] = 0.0; // G
      orbitalColors[i3 + 2] = 1.0; // R (Blue)

      orbitalSizes[i] = 3 + Math.sin(i) * 1;
    }

    orbitalGeometry.setAttribute('position', new THREE.BufferAttribute(orbitalPositions, 3));
    orbitalGeometry.setAttribute('color', new THREE.BufferAttribute(orbitalColors, 3));
    orbitalGeometry.setAttribute('size', new THREE.BufferAttribute(orbitalSizes, 1));

    const orbitalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float time;
        uniform float pixelRatio;
        varying vec3 vColor;

        void main() {
          vColor = color;
          
          vec3 pos = position;
          
          // Complex 3D orbital animation
          float angle = time * 0.4 + atan(position.y, position.x);
          float radius = length(position.xy);
          
          pos.x = cos(angle) * radius;
          pos.y = sin(angle) * radius;
          pos.z = sin(angle * 2.0 + time) * 0.5;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
          
          gl_FragColor = vec4(vColor, alpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      vertexColors: true,
    });

    const orbitalDots = new THREE.Points(orbitalGeometry, orbitalMaterial);
    scene.add(orbitalDots);
    particleSystemsRef.current.orbitalDots = orbitalDots;
  };

  const animate = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    // Performance measurement
    const frameStart = performance.now();

    timeRef.current += 0.008;

    // Update shader uniforms
    Object.values(particleSystemsRef.current).forEach(system => {
      if (system && system.material instanceof THREE.ShaderMaterial) {
        system.material.uniforms.time.value = timeRef.current;
      }
    });

    // Update camera position based on current section
    const targetY = currentSection === 'me' ? -0.5 : 0;
    cameraRef.current.position.y += (targetY - cameraRef.current.position.y) * 0.02;

    // Update sphere position for context
    const sphereX = Math.sin(timeRef.current * 0.5) * 0.2;
    const sphereY = Math.cos(timeRef.current * 0.3) * 0.15;
    animationActions.updateSpherePosition({ x: sphereX, y: sphereY });

    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    const frameEnd = performance.now();
    const frameDuration = frameEnd - frameStart;

    // Expose performance data
    (window as any).threeJsPerformance = {
      frameDuration,
      particleCount: 1011, // Total particles
      gpuAccelerated: true,
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  if (error) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        <p className="font-bold">Three.js Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />
      
      {isInitialized && (
        <div className="fixed bottom-4 left-4 text-xs text-green-500 z-50">
          🚀 Three.js GPU Acceleration Active
        </div>
      )}
    </>
  );
};

export default BackgroundElementsThree;