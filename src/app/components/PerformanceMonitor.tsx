'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  animationTime: number;
  canvasClear: number;
  backgroundPattern: number;
  sphereCalculations: number;
  staticDots: number;
  spatialOptimization: number;
  dotRendering: number;
  planetDots: number;
  orbitalBigDots: number;
  sphereGlow: number;
  memoryUsage: number;
  // Spatial optimization metrics
  totalDots: number;
  visibleDots: number;
  cullingRatio: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    animationTime: 0,
    canvasClear: 0,
    backgroundPattern: 0,
    sphereCalculations: 0,
    staticDots: 0,
    spatialOptimization: 0,
    dotRendering: 0,
    planetDots: 0,
    orbitalBigDots: 0,
    sphereGlow: 0,
    memoryUsage: 0,
    totalDots: 0,
    visibleDots: 0,
    cullingRatio: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let averages: { [key: string]: number[] } = {};
    const SAMPLE_SIZE = 30; // Average over 30 frames

    const updateMetrics = () => {
      const currentTime = performance.now();
      frameCount++;
      
      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;

        // Get performance measurements
        const measurements = performance.getEntriesByType('measure') as PerformanceMeasure[];
        
        // Function to get average duration for a measurement name
        const getAverageDuration = (name: string): number => {
          const entries = measurements.filter(m => m.name === name);
          if (entries.length === 0) return 0;
          
          if (!averages[name]) averages[name] = [];
          averages[name].push(entries[entries.length - 1].duration);
          
          // Keep only last SAMPLE_SIZE samples
          if (averages[name].length > SAMPLE_SIZE) {
            averages[name] = averages[name].slice(-SAMPLE_SIZE);
          }
          
          return averages[name].reduce((sum, val) => sum + val, 0) / averages[name].length;
        };

        // Get memory usage
        const memoryInfo = (performance as any).memory;
        const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0; // MB

        setMetrics({
          fps,
          frameTime: getAverageDuration('animation-frame-total'),
          animationTime: getAverageDuration('animation-frame-total'),
          canvasClear: getAverageDuration('canvas-clear-duration'),
          backgroundPattern: getAverageDuration('background-pattern-duration'),
          sphereCalculations: getAverageDuration('sphere-calculations-duration'),
          staticDots: getAverageDuration('static-dots-duration'),
          spatialOptimization: getAverageDuration('spatial-optimization-duration'),
          dotRendering: getAverageDuration('dot-rendering-duration'),
          planetDots: getAverageDuration('planet-dots-duration'),
          orbitalBigDots: getAverageDuration('orbital-big-dots-duration'),
          sphereGlow: getAverageDuration('sphere-glow-duration'),
          memoryUsage,
          // Get spatial optimization data from window global
          totalDots: (window as any).spatialMetrics?.totalDots || 0,
          visibleDots: (window as any).spatialMetrics?.visibleDots || 0,
          cullingRatio: (window as any).spatialMetrics?.cullingRatio || 0,
        });
      }

      requestAnimationFrame(updateMetrics);
    };

    updateMetrics();

    // Keyboard shortcut to toggle performance monitor
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isVisible]);

  if (!isVisible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/80 text-white px-3 py-1 rounded text-xs font-mono"
        >
          📊 Perf
        </button>
      </div>
    );
  }

  const formatTime = (ms: number) => ms.toFixed(2);
  const formatMemory = (mb: number) => mb.toFixed(1);

  // Color coding for performance levels
  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-green-400';
    if (value <= thresholds[1]) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return 'text-green-400';
    if (fps >= 30) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg font-mono text-xs space-y-2 min-w-[280px]">
      <div className="flex justify-between items-center border-b border-gray-600 pb-2">
        <h3 className="font-bold text-sm">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={`font-bold ${getFpsColor(metrics.fps)}`}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Frame Time:</span>
          <span className={getPerformanceColor(metrics.frameTime, [16, 33])}>
            {formatTime(metrics.frameTime)}ms
          </span>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <div className="text-gray-400 mb-1">Breakdown:</div>
          
          <div className="flex justify-between pl-2">
            <span>Canvas Clear:</span>
            <span className={getPerformanceColor(metrics.canvasClear, [1, 3])}>
              {formatTime(metrics.canvasClear)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Background:</span>
            <span className={getPerformanceColor(metrics.backgroundPattern, [2, 5])}>
              {formatTime(metrics.backgroundPattern)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Sphere Calc:</span>
            <span className={getPerformanceColor(metrics.sphereCalculations, [1, 2])}>
              {formatTime(metrics.sphereCalculations)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Static Dots:</span>
            <span className={getPerformanceColor(metrics.staticDots, [3, 6])}>
              {formatTime(metrics.staticDots)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Spatial Opt:</span>
            <span className={getPerformanceColor(metrics.spatialOptimization, [1, 3])}>
              {formatTime(metrics.spatialOptimization)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Dot Render:</span>
            <span className={getPerformanceColor(metrics.dotRendering, [2, 4])}>
              {formatTime(metrics.dotRendering)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Planet Dots:</span>
            <span className={getPerformanceColor(metrics.planetDots, [2, 4])}>
              {formatTime(metrics.planetDots)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Orbital Big:</span>
            <span className={getPerformanceColor(metrics.orbitalBigDots, [2, 4])}>
              {formatTime(metrics.orbitalBigDots)}ms
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Sphere Glow:</span>
            <span className={getPerformanceColor(metrics.sphereGlow, [1, 2])}>
              {formatTime(metrics.sphereGlow)}ms
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <div className="text-gray-400 mb-1">Spatial Optimization:</div>
          
          <div className="flex justify-between pl-2">
            <span>Total Dots:</span>
            <span className="text-blue-400">
              {metrics.totalDots}
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Visible:</span>
            <span className="text-green-400">
              {metrics.visibleDots}
            </span>
          </div>
          
          <div className="flex justify-between pl-2">
            <span>Culled:</span>
            <span className="text-yellow-400">
              {(metrics.cullingRatio * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-600 pt-2">
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={getPerformanceColor(metrics.memoryUsage, [50, 100])}>
              {formatMemory(metrics.memoryUsage)}MB
            </span>
          </div>
        </div>
        
        <div className="text-gray-500 text-xs pt-2 border-t border-gray-600">
          Press Ctrl+Shift+P to toggle
        </div>
      </div>
    </div>
  );
};

export default PerformanceMonitor;