import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { runScout, runWitness, runCampaign } from '../../utils/agents';

const Scout: React.FC = () => {
  const {
    currentTree,
    settings,
    lockNode,
    unlockNode,
    addNode,
    deleteNode,
    mergeWithParent,
    scouts,
    addScout,
    updateScout,
    deleteScout,
    addScoutOutput,
    scoutStartRequest,
    clearScoutStartRequest,
  } = useStore();
  const [expandedScout, setExpandedScout] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep track of active scouts and their stop flags
  const activeScouts = useRef<Map<string, { stop: boolean }>>(new Map());

  // Default instructions for each agent type
  const DEFAULT_SCOUT_INSTRUCTIONS = 'Choose to expand nodes that are interesting, and cull nodes that are boring.';
  const DEFAULT_WITNESS_INSTRUCTIONS = 'Choose the most interesting continuation.';

  const createScout = () => {
    const scoutId = `scout_${Date.now()}`;
    const newScout = {
      id: scoutId,
      name: `Agent ${scouts.length + 1}`,
      type: 'Scout' as const,
      instructions: DEFAULT_SCOUT_INSTRUCTIONS,
      vision: 3,
      range: 2,
      depth: 3,
      active: false,
      activeNodeId: null,
      outputs: [],
      buttonNumber: undefined,
      cycles: 3,
      campaignScoutInstructions: DEFAULT_SCOUT_INSTRUCTIONS,
      campaignWitnessInstructions: DEFAULT_WITNESS_INSTRUCTIONS,
    };
    addScout(newScout);
    setExpandedScout(scoutId);
  };

  const handleTypeChange = (scoutId: string, newType: 'Scout' | 'Witness' | 'Campaign') => {
    const scout = scouts.find(s => s.id === scoutId);
    if (!scout) return;

    // Check if instructions are still at default for current type
    const isDefaultInstructions =
      (scout.type === 'Scout' && scout.instructions === DEFAULT_SCOUT_INSTRUCTIONS) ||
      (scout.type === 'Witness' && scout.instructions === DEFAULT_WITNESS_INSTRUCTIONS) ||
      (scout.type === 'Campaign' && scout.instructions === DEFAULT_SCOUT_INSTRUCTIONS);

    // If still default, update to new default; otherwise keep custom instructions
    const updates: any = { type: newType };
    if (isDefaultInstructions) {
      if (newType === 'Witness') {
        updates.instructions = DEFAULT_WITNESS_INSTRUCTIONS;
      } else {
        // Scout or Campaign
        updates.instructions = DEFAULT_SCOUT_INSTRUCTIONS;
      }
    }

    updateScout(scoutId, updates);
  };

  const startScout = async (scoutId: string) => {
    if (!currentTree) {
      alert('No tree selected');
      return;
    }

    const scout = scouts.find((s) => s.id === scoutId);
    if (!scout) return;

    const currentNode = currentTree.nodes.get(currentTree.currentNodeId);
    if (!currentNode || currentNode.locked) {
      alert('Current node is locked');
      return;
    }

    // Create stop flag
    const stopFlag = { stop: false };
    activeScouts.current.set(scoutId, stopFlag);

    updateScout(scoutId, { active: true, activeNodeId: currentTree.currentNodeId });

    try {
      // Create getTree callback to always get fresh tree reference
      const getTree = () => useStore.getState().currentTree!;

      if (scout.type === 'Campaign') {
        await runCampaign(
          currentTree,
          currentTree.currentNodeId,
          scout,
          settings.apiKey,
          settings,
          lockNode,
          unlockNode,
          addNode,
          deleteNode,
          mergeWithParent,
          () => stopFlag.stop,
          (output) => addScoutOutput(scoutId, output),
          getTree
        );
      } else if (scout.type === 'Witness') {
        await runWitness(
          currentTree,
          currentTree.currentNodeId,
          scout,
          settings.apiKey,
          settings,
          (id) => lockNode(id, 'witness-active'),
          unlockNode,
          deleteNode,
          mergeWithParent,
          () => stopFlag.stop,
          (output) => addScoutOutput(scoutId, output)
        );
      } else {
        await runScout(
          currentTree,
          currentTree.currentNodeId,
          scout,
          settings.apiKey,
          settings,
          (id) => lockNode(id, 'scout-active'),
          unlockNode,
          addNode,
          deleteNode,
          () => stopFlag.stop,
          (output) => addScoutOutput(scoutId, output),
          getTree
        );
      }
    } catch (error) {
      console.error('Scout error:', error);
    } finally {
      updateScout(scoutId, { active: false, activeNodeId: null });
      activeScouts.current.delete(scoutId);
    }
  };

  const stopScout = (scoutId: string) => {
    const stopFlag = activeScouts.current.get(scoutId);
    if (stopFlag) {
      stopFlag.stop = true;
    }
    updateScout(scoutId, { active: false, activeNodeId: null });
  };

  const stopAllScouts = () => {
    scouts.forEach((scout) => {
      if (scout.active) {
        stopScout(scout.id);
      }
    });
  };

  const toggleScout = (scoutId: string) => {
    setExpandedScout(expandedScout === scoutId ? null : scoutId);
  };

  // Watch for scout start requests
  useEffect(() => {
    if (scoutStartRequest) {
      startScout(scoutStartRequest);
      clearScoutStartRequest();
    }
  }, [scoutStartRequest]);

  // Cleanup delete timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteClick = (scoutId: string) => {
    if (confirmingDelete === scoutId) {
      // Second click - actually delete
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
      deleteScout(scoutId);
      setConfirmingDelete(null);
    } else {
      // First click - enter confirmation mode
      setConfirmingDelete(scoutId);

      // Clear any existing timeout
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }

      // Reset after 3 seconds
      deleteTimeoutRef.current = setTimeout(() => {
        setConfirmingDelete(null);
      }, 3000);
    }
  };

  return (
    <div className="h-full flex flex-col bg-sky-light overflow-y-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Agents</h3>
          <div className="flex gap-2">
            <button
              onClick={createScout}
              className="px-2 py-1 rounded bg-sky-accent hover:bg-sky-dark text-xs transition-colors"
            >
              + New Agent
            </button>
            <button
              onClick={stopAllScouts}
              className="px-2 py-1 rounded bg-sky-accent hover:bg-sky-dark text-gray-800 text-xs transition-colors"
            >
              Stop All
            </button>
          </div>
        </div>

        {scouts.map((scout) => (
          <div key={scout.id} className="mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleScout(scout.id)}
                className="flex-1 flex items-center justify-between px-3 py-2 bg-sky-medium rounded-lg hover:bg-sky-dark transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{scout.name}</span>
                  {scout.active && <span className="text-xs">🔍</span>}
                </div>
                <span className="text-gray-600">{expandedScout === scout.id ? '▼' : '▶'}</span>
              </button>

              <button
                onClick={() => (scout.active ? stopScout(scout.id) : startScout(scout.id))}
                disabled={!currentTree}
                className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                  scout.active
                    ? 'bg-sky-medium hover:bg-sky-dark text-gray-800'
                    : 'bg-sky-accent hover:bg-sky-dark text-gray-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {scout.active ? 'Stop' : 'Start'}
              </button>
            </div>

            {expandedScout === scout.id && (
              <div className="mt-2 p-3 bg-white rounded-lg space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={scout.name}
                    onChange={(e) => updateScout(scout.id, { name: e.target.value })}
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                    disabled={scout.active}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Agent Type</label>
                  <select
                    value={scout.type}
                    onChange={(e) =>
                      handleTypeChange(scout.id, e.target.value as 'Scout' | 'Witness' | 'Campaign')
                    }
                    className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                    disabled={scout.active}
                  >
                    <option value="Scout">Scout</option>
                    <option value="Witness">Witness</option>
                    <option value="Campaign">Campaign</option>
                  </select>
                </div>

                {scout.type === 'Campaign' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Cycles
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={scout.cycles || 1}
                        onChange={(e) => updateScout(scout.id, { cycles: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                        disabled={scout.active}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scout Instructions
                      </label>
                      <textarea
                        value={scout.campaignScoutInstructions ?? scout.instructions ?? ''}
                        onChange={(e) => updateScout(scout.id, { campaignScoutInstructions: e.target.value })}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                        rows={3}
                        disabled={scout.active}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Witness Instructions
                      </label>
                      <textarea
                        value={scout.campaignWitnessInstructions ?? scout.instructions ?? ''}
                        onChange={(e) => updateScout(scout.id, { campaignWitnessInstructions: e.target.value })}
                        className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                        rows={3}
                        disabled={scout.active}
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Instructions
                    </label>
                    <textarea
                      value={scout.instructions}
                      onChange={(e) => updateScout(scout.id, { instructions: e.target.value })}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                      rows={3}
                      disabled={scout.active}
                    />
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Vision</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={scout.vision}
                      onChange={(e) => updateScout(scout.id, { vision: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                      disabled={scout.active}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Range</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={scout.range}
                      onChange={(e) => updateScout(scout.id, { range: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                      disabled={scout.active}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Depth</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={scout.depth}
                      onChange={(e) => updateScout(scout.id, { depth: parseInt(e.target.value) })}
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                      disabled={scout.active}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Button
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={scout.buttonNumber || ''}
                      onChange={(e) =>
                        updateScout(scout.id, {
                          buttonNumber: e.target.value ? parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="None"
                      className="w-full px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-sky-dark"
                      disabled={scout.active}
                    />
                  </div>
                </div>

                {scout.active && scout.activeNodeId && (
                  <div className="text-xs text-gray-600">
                    Active on: {scout.activeNodeId.substring(0, 16)}...
                  </div>
                )}

                {/* Output display */}
                {scout.outputs.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Previous Output
                    </label>
                    <div className="max-h-48 overflow-y-auto bg-gray-50 rounded border border-gray-300 p-2">
                      <div className="text-xs text-gray-800 whitespace-pre-wrap">
                        {scout.outputs[scout.outputs.length - 1]}
                      </div>
                    </div>
                    <button
                      onClick={() => updateScout(scout.id, { outputs: [] })}
                      className="mt-2 px-2 py-1 rounded bg-gray-300 hover:bg-gray-400 text-xs transition-colors"
                      disabled={scout.active}
                    >
                      Clear Output
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleDeleteClick(scout.id)}
                  className={`w-full px-2 py-1 rounded text-xs transition-colors ${
                    confirmingDelete === scout.id
                      ? 'bg-sky-medium hover:bg-sky-dark text-gray-800'
                      : 'bg-sky-accent hover:bg-sky-light text-gray-800'
                  }`}
                  disabled={scout.active}
                >
                  {confirmingDelete === scout.id ? 'Are you sure?' : 'Delete Agent'}
                </button>
              </div>
            )}
          </div>
        ))}

        {scouts.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-4">
            No agents created. Click "+ New Agent" to create one.
          </div>
        )}
      </div>
    </div>
  );
};

export default Scout;
