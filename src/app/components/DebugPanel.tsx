'use client';

import { useState } from 'react';
import BackgroundRenderer from './BackgroundRenderer';
import PerformanceMonitor from './PerformanceMonitor';
import PerformanceComparison from './PerformanceComparison';

const DebugPanel = () => {
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Toggle debug mode with keyboard shortcut
  const toggleDebug = () => {
    setIsDebugMode(!isDebugMode);
  };

  return (
    <>
      {/* Main background renderer (always visible) */}
      <BackgroundRenderer showControls={isDebugMode} />
      
      {/* Debug toggle button */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={toggleDebug}
          className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
            isDebugMode 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-black/60 text-gray-300 hover:bg-black/80'
          }`}
          title="Toggle debug tools (Ctrl+D)"
        >
          {isDebugMode ? '🛠️ Debug ON' : '⚙️ Debug'}
        </button>
      </div>

      {/* Debug tools (only show when debug mode is active) */}
      {isDebugMode && (
        <>
          <PerformanceMonitor />
          <PerformanceComparison />
          
          {/* Debug info panel */}
          <div className="fixed top-20 left-4 z-40 bg-black/90 text-white p-3 rounded-lg text-xs font-mono max-w-sm">
            <div className="text-green-400 mb-2">🛠️ Debug Mode Active</div>
            <div className="space-y-1 text-gray-300">
              <div>• Switch rendering modes (top-left)</div>
              <div>• Monitor performance (top-right)</div>
              <div>• Compare modes (bottom-right)</div>
              <div>• Press Ctrl+Shift+P for detailed metrics</div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600 text-gray-500">
              Click "Debug OFF" to hide all tools
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DebugPanel;