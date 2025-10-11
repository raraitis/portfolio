'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimationActions } from '@/contexts/AnimationContext';
import { useDevice } from '../hooks/useDevice';

const BackgroundElementsWorker = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const offscreenCanvasRef = useRef<OffscreenCanvas | null>(null);
  const [currentSection, setCurrentSection] = useState<'home' | 'me'>('home');
  const [isWorkerSupported, setIsWorkerSupported] = useState(false);
  const [workerError, setWorkerError] = useState<string | null>(null);
  const animationActions = useAnimationActions();
  const device = useDevice();

  // Check Web Worker and OffscreenCanvas support
  useEffect(() => {
    const checkSupport = () => {
      const hasWorker = typeof Worker !== 'undefined';
      const hasOffscreenCanvas = typeof OffscreenCanvas !== 'undefined';
      const hasTransferable = 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
      
      const supported = hasWorker && hasOffscreenCanvas && hasTransferable;
      setIsWorkerSupported(supported);
      
      if (!supported) {
        console.warn('Web Worker background animation not supported:', {
          hasWorker,
          hasOffscreenCanvas,
          hasTransferable,
        });
      }
      
      return supported;
    };

    checkSupport();
  }, []);

  // Listen for global section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).setBackgroundSection = (section: 'home' | 'me') => {
        setCurrentSection(section);
      };
    }
  }, []);

  useEffect(() => {
    if (!isWorkerSupported || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const isMobile = device.type === 'mobile';

    try {
      // Create and transfer OffscreenCanvas to worker
      const offscreenCanvas = canvas.transferControlToOffscreen();
      offscreenCanvasRef.current = offscreenCanvas;

      // Create worker
      const worker = new Worker('/workers/backgroundWorker.js');
      workerRef.current = worker;

      // Handle worker messages
      worker.onmessage = (event) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'CANVAS_INITIALIZED':
            console.log('Worker canvas initialized:', payload);
            // Start animation after initialization
            worker.postMessage({ type: 'START_ANIMATION' });
            break;
          case 'PERFORMANCE_DATA':
            // Handle performance data from worker
            console.log('Worker performance:', payload);
            break;
          case 'ERROR':
            console.error('Worker error:', payload);
            setWorkerError(payload.message);
            break;
          default:
            console.log('Unknown worker message:', type, payload);
        }
      };

      // Handle worker errors
      worker.onerror = (error) => {
        console.error('Worker error:', error);
        setWorkerError('Worker failed to load or execute');
      };

      // Resize function
      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width * window.devicePixelRatio;
        const height = rect.height * window.devicePixelRatio;

        worker.postMessage({
          type: 'RESIZE_CANVAS',
          payload: { width, height },
        });
      };

      // Initialize canvas in worker
      worker.postMessage({
        type: 'INIT_CANVAS',
        payload: {
          canvas: offscreenCanvas,
          width: canvas.clientWidth * window.devicePixelRatio,
          height: canvas.clientHeight * window.devicePixelRatio,
        },
      }, [offscreenCanvas]);

      // Setup resize listener
      window.addEventListener('resize', resizeCanvas);

      // Update worker state
      const updateWorkerState = () => {
        worker.postMessage({
          type: 'UPDATE_STATE',
          payload: {
            currentSection,
            isMobile,
          },
        });
      };

      updateWorkerState();

      // Cleanup
      return () => {
        worker.postMessage({ type: 'STOP_ANIMATION' });
        worker.terminate();
        window.removeEventListener('resize', resizeCanvas);
      };

    } catch (error) {
      console.error('Failed to setup worker:', error);
      setWorkerError('Failed to initialize Web Worker');
    }
  }, [isWorkerSupported, device.type, currentSection]);

  // Fallback message if worker not supported
  if (!isWorkerSupported) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
        <p className="font-bold">Web Worker Not Supported</p>
        <p className="text-sm">Your browser doesn't support OffscreenCanvas or Web Workers.</p>
        <p className="text-sm">Please use Chrome 69+ or Firefox 105+ for the best experience.</p>
      </div>
    );
  }

  // Error state
  if (workerError) {
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50">
        <p className="font-bold">Web Worker Error</p>
        <p className="text-sm">{workerError}</p>
        <p className="text-sm">Falling back to main thread rendering...</p>
      </div>
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'transparent',
          zIndex: -1,
        }}
      />
      
      {/* Loading indicator while worker initializes */}
      <div className="fixed bottom-4 left-4 text-xs text-gray-500 z-50">
        🔧 Web Worker Mode Active
      </div>
    </>
  );
};

export default BackgroundElementsWorker;