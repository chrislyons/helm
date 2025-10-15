import React, { useRef, useEffect } from 'react';
import { useStore } from '../../store';

const Copilot: React.FC = () => {
  const { copilot, updateCopilot } = useStore();
  const stopFlagRef = useRef({ stop: false });

  useEffect(() => {
    if (!copilot.enabled) {
      stopFlagRef.current.stop = true;
    }
  }, [copilot.enabled]);

  return (
    <div className="h-full flex flex-col bg-sky-light overflow-y-auto">
      <div className="p-3">
        <h3 className="text-sm font-semibold mb-3 text-gray-800">Copilot</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Enable Copilot</label>
            <button
              onClick={() => {
                const newEnabled = !copilot.enabled;
                if (!newEnabled) {
                  stopFlagRef.current.stop = true;
                  setTimeout(() => {
                    stopFlagRef.current.stop = false;
                  }, 100);
                }
                updateCopilot({ enabled: newEnabled });
              }}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                copilot.enabled
                  ? 'bg-sky-medium hover:bg-sky-dark text-gray-800'
                  : 'bg-sky-accent hover:bg-sky-dark text-gray-800'
              }`}
            >
              {copilot.enabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-700">Enable Expansion</label>
            <button
              onClick={() => updateCopilot({ expansionEnabled: !copilot.expansionEnabled })}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                copilot.expansionEnabled
                  ? 'bg-sky-medium hover:bg-sky-dark text-gray-800'
                  : 'bg-sky-accent hover:bg-sky-dark text-gray-800'
              }`}
            >
              {copilot.expansionEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={copilot.instructions}
              onChange={(e) => updateCopilot({ instructions: e.target.value })}
              className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
              rows={4}
              placeholder="Instructions for the copilot to decide whether to expand or cull nodes..."
              disabled={!copilot.enabled}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Vision</label>
              <input
                type="number"
                min="1"
                max="10"
                value={copilot.vision}
                onChange={(e) => updateCopilot({ vision: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                disabled={!copilot.enabled}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Range</label>
              <input
                type="number"
                min="1"
                max="10"
                value={copilot.range}
                onChange={(e) => updateCopilot({ range: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                disabled={!copilot.enabled}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Depth</label>
              <input
                type="number"
                min="1"
                max="10"
                value={copilot.depth}
                onChange={(e) => updateCopilot({ depth: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                disabled={!copilot.enabled}
              />
            </div>
          </div>

          {/* Output display */}
          {copilot.outputs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Previous Output
              </label>
              <div className="max-h-48 overflow-y-auto bg-gray-50 rounded border border-gray-300 p-2">
                <div className="text-xs text-gray-800 whitespace-pre-wrap">
                  {copilot.outputs[copilot.outputs.length - 1]}
                </div>
              </div>
              <button
                onClick={() => updateCopilot({ outputs: [] })}
                className="mt-2 px-2 py-1 rounded bg-gray-300 hover:bg-gray-400 text-xs transition-colors"
                disabled={copilot.enabled}
              >
                Clear Output
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Copilot;
