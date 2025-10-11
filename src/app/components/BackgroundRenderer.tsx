'use client';

import { useState } from 'react';
import BackgroundElements from './BackgroundElements';
import BackgroundElementsWorker from './BackgroundElementsWorker';
import BackgroundElementsThree from './BackgroundElementsThree';

type RenderMode = 'main-thread' | 'web-worker' | 'three-gpu';

interface BackgroundRendererProps {
  showControls?: boolean;
}

const BackgroundRenderer = ({ showControls = false }: BackgroundRendererProps) => {
  const [renderMode, setRenderMode] = useState<RenderMode>('main-thread');

  const renderModeLabels = {
    'main-thread': '🖥️ Main Thread',
    'web-worker': '🧵 Web Worker',
    'three-gpu': '🚀 Three.js GPU',
  };

  const renderModeDescriptions = {
    'main-thread': 'Canvas 2D on main thread',
    'web-worker': 'OffscreenCanvas in worker',
    'three-gpu': 'WebGL GPU acceleration',
  };

  return (
    <>
      {/* Render mode selector - only show if showControls is true */}
      {showControls && (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-3 rounded text-xs font-mono">
          <div className="mb-2 text-gray-300">Background Renderer:</div>
          
          {(Object.keys(renderModeLabels) as RenderMode[]).map((mode) => (
            <label key={mode} className="flex items-center space-x-2 cursor-pointer mb-1">
              <input
                type="radio"
                name="renderMode"
                value={mode}
                checked={renderMode === mode}
                onChange={(e) => setRenderMode(e.target.value as RenderMode)}
                className="form-radio h-3 w-3"
              />
              <span className={renderMode === mode ? 'text-white' : 'text-gray-400'}>
                {renderModeLabels[mode]}
              </span>
            </label>
          ))}
          
          <div className="text-gray-500 text-xs mt-2 border-t border-gray-600 pt-2">
            {renderModeDescriptions[renderMode]}
          </div>
        </div>
      )}

      {/* Render appropriate background */}
      {renderMode === 'main-thread' && <BackgroundElements />}
      {renderMode === 'web-worker' && <BackgroundElementsWorker />}
      {renderMode === 'three-gpu' && <BackgroundElementsThree />}
    </>
  );
};

export default BackgroundRenderer;