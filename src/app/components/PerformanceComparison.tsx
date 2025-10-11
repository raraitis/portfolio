'use client';

import { useEffect, useState } from 'react';

interface RenderingMetrics {
  mode: string;
  fps: number;
  frameDuration: number;
  particleCount: number;
  memoryUsage: number;
  gpuAccelerated: boolean;
  timestamp: number;
}

const PerformanceComparison = () => {
  const [metrics, setMetrics] = useState<RenderingMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  useEffect(() => {
    if (!isCollecting) return;

    const interval = setInterval(() => {
      collectMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [isCollecting]);

  const collectMetrics = () => {
    // Get current performance data from different rendering modes
    const currentTime = Date.now();
    
    // Main thread Canvas 2D metrics
    const canvasMetrics = getCanvasMetrics();
    
    // Web Worker metrics
    const workerMetrics = getWorkerMetrics();
    
    // Three.js GPU metrics
    const threeMetrics = getThreeJsMetrics();

    const newMetrics: RenderingMetrics[] = [];
    
    if (canvasMetrics) {
      newMetrics.push({
        mode: 'Canvas 2D',
        ...canvasMetrics,
        timestamp: currentTime,
      });
    }
    
    if (workerMetrics) {
      newMetrics.push({
        mode: 'Web Worker',
        ...workerMetrics,
        timestamp: currentTime,
      });
    }
    
    if (threeMetrics) {
      newMetrics.push({
        mode: 'Three.js GPU',
        ...threeMetrics,
        timestamp: currentTime,
      });
    }

    setMetrics(prev => [
      ...prev.slice(-20), // Keep last 20 samples
      ...newMetrics,
    ]);
  };

  const getCanvasMetrics = () => {
    const measurements = performance.getEntriesByType('measure') as PerformanceMeasure[];
    const frameTime = measurements.find(m => m.name === 'animation-frame-total')?.duration || 0;
    const spatialMetrics = (window as any).spatialMetrics;
    const memoryInfo = (performance as any).memory;
    
    if (frameTime === 0) return null;
    
    return {
      fps: frameTime > 0 ? Math.min(60, 1000 / frameTime) : 0,
      frameDuration: frameTime,
      particleCount: spatialMetrics?.visibleDots || 0,
      memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
      gpuAccelerated: false,
    };
  };

  const getWorkerMetrics = () => {
    // Worker metrics would be collected from worker messages
    // For now, return simplified metrics
    return {
      fps: 0,
      frameDuration: 0,
      particleCount: 0,
      memoryUsage: 0,
      gpuAccelerated: false,
    };
  };

  const getThreeJsMetrics = () => {
    const threePerf = (window as any).threeJsPerformance;
    const memoryInfo = (performance as any).memory;
    
    if (!threePerf) return null;
    
    return {
      fps: threePerf.frameDuration > 0 ? Math.min(60, 1000 / threePerf.frameDuration) : 0,
      frameDuration: threePerf.frameDuration,
      particleCount: threePerf.particleCount || 0,
      memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0,
      gpuAccelerated: threePerf.gpuAccelerated || false,
    };
  };

  const getAverageMetrics = (mode: string) => {
    const modeMetrics = metrics.filter(m => m.mode === mode);
    if (modeMetrics.length === 0) return null;

    const avg = modeMetrics.reduce((acc, curr) => ({
      fps: acc.fps + curr.fps,
      frameDuration: acc.frameDuration + curr.frameDuration,
      particleCount: acc.particleCount + curr.particleCount,
      memoryUsage: acc.memoryUsage + curr.memoryUsage,
    }), { fps: 0, frameDuration: 0, particleCount: 0, memoryUsage: 0 });

    const count = modeMetrics.length;
    return {
      fps: avg.fps / count,
      frameDuration: avg.frameDuration / count,
      particleCount: avg.particleCount / count,
      memoryUsage: avg.memoryUsage / count,
      gpuAccelerated: modeMetrics[0].gpuAccelerated,
    };
  };

  const getRankings = () => {
    const modes = ['Canvas 2D', 'Three.js GPU'];
    const rankings = modes.map(mode => {
      const avg = getAverageMetrics(mode);
      return avg ? { mode, ...avg } : null;
    }).filter((r): r is NonNullable<typeof r> => r !== null && r.fps > 0);

    // Sort by FPS (higher is better)
    return rankings.sort((a, b) => b.fps - a.fps);
  };

  const formatNumber = (num: number, decimals: number = 1) => num.toFixed(decimals);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/80 text-white px-3 py-1 rounded text-xs font-mono"
        >
          📊 Performance Comparison
        </button>
      </div>
    );
  }

  const rankings = getRankings();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg font-mono text-xs space-y-3 min-w-[320px] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center border-b border-gray-600 pb-2">
        <h3 className="font-bold text-sm">Performance Comparison</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsCollecting(!isCollecting);
            if (!isCollecting) setMetrics([]);
          }}
          className={`px-2 py-1 rounded text-xs ${
            isCollecting 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isCollecting ? '⏹️ Stop' : '▶️ Start'} Collection
        </button>
        
        <button
          onClick={() => setMetrics([])}
          className="px-2 py-1 rounded text-xs bg-gray-600 hover:bg-gray-700"
        >
          🗑️ Clear
        </button>
      </div>

      {isCollecting && (
        <div className="text-green-400 text-xs">
          🔄 Collecting metrics... ({metrics.length} samples)
        </div>
      )}

      {rankings.length > 0 && (
        <div className="space-y-2">
          <div className="text-gray-400 text-xs border-b border-gray-600 pb-1">
            Performance Rankings:
          </div>
          
          {rankings.map((ranking, index) => (
            <div key={ranking.mode} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`font-bold ${
                  index === 0 ? 'text-green-400' : 
                  index === 1 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  #{index + 1}
                </span>
                <span className="flex-1">{ranking.mode}</span>
                <span className={ranking.gpuAccelerated ? 'text-green-400' : 'text-gray-400'}>
                  {ranking.gpuAccelerated ? '🚀 GPU' : '🖥️ CPU'}
                </span>
              </div>
              
              <div className="pl-6 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>FPS:</span>
                  <span className={
                    ranking.fps >= 55 ? 'text-green-400' :
                    ranking.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {formatNumber(ranking.fps)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Frame Time:</span>
                  <span className={
                    ranking.frameDuration <= 16 ? 'text-green-400' :
                    ranking.frameDuration <= 33 ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {formatNumber(ranking.frameDuration)}ms
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Particles:</span>
                  <span className="text-blue-400">
                    {Math.round(ranking.particleCount)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className={
                    ranking.memoryUsage <= 50 ? 'text-green-400' :
                    ranking.memoryUsage <= 100 ? 'text-yellow-400' : 'text-red-400'
                  }>
                    {formatNumber(ranking.memoryUsage)}MB
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rankings.length > 1 && rankings[0] && rankings[1] && (
        <div className="border-t border-gray-600 pt-2">
          <div className="text-gray-400 text-xs mb-1">Performance Improvement:</div>
          <div className="text-xs">
            {rankings[0].mode} is{' '}
            <span className="text-green-400 font-bold">
              {formatNumber((rankings[0].fps / rankings[1].fps - 1) * 100)}%
            </span>{' '}
            faster than {rankings[1].mode}
          </div>
        </div>
      )}

      <div className="text-gray-500 text-xs pt-2 border-t border-gray-600">
        Switch rendering modes to compare performance
      </div>
    </div>
  );
};

export default PerformanceComparison;