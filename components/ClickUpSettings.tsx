import React, { useState, useEffect } from 'react';
import { getWorkspaces, getSpaces, ClickUpWorkspace, ClickUpSpace } from '../utils/clickup';
import { ClickUpWorkspaceConfig, saveSearchSpaceIds, loadSearchSpaceIds } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: ClickUpWorkspaceConfig | null;
  onSelectWorkspace: (workspace: ClickUpWorkspaceConfig | null) => void;
}

const ClickUpSettings: React.FC<Props> = ({ isOpen, onClose, currentWorkspace, onSelectWorkspace }) => {
  const [workspaces, setWorkspaces] = useState<ClickUpWorkspace[]>([]);
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<string[]>(loadSearchSpaceIds);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load workspaces when panel opens
  useEffect(() => {
    if (!isOpen) return;
    setLoadingWorkspaces(true);
    setError(null);
    getWorkspaces()
      .then(setWorkspaces)
      .catch(err => setError(err.message))
      .finally(() => setLoadingWorkspaces(false));
  }, [isOpen]);

  // Load spaces whenever the active workspace changes
  useEffect(() => {
    if (!isOpen || !currentWorkspace) return;
    setLoadingSpaces(true);
    getSpaces(currentWorkspace.id)
      .then(setSpaces)
      .catch(() => setSpaces([]))
      .finally(() => setLoadingSpaces(false));
  }, [isOpen, currentWorkspace?.id]);

  const handleSelectWorkspace = (ws: ClickUpWorkspace) => {
    onSelectWorkspace(ws);
    // Reset space selection when workspace changes
    setSelectedSpaceIds([]);
    saveSearchSpaceIds([]);
  };

  const toggleSpace = (id: string) => {
    setSelectedSpaceIds(prev => {
      const next = prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id];
      saveSearchSpaceIds(next);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-5 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#37352f]">ClickUp Integration</h2>
            <p className="text-xs text-[#a4a4a2] mt-0.5">Connect your workspace and set your search scope</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#a4a4a2] hover:text-[#37352f] transition-colors p-1 rounded hover:bg-[#f7f7f5]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-5">
          {/* Workspace selection */}
          <div>
            <p className="text-xs font-semibold text-[#a4a4a2] uppercase tracking-wider mb-2">Workspace</p>

            {loadingWorkspaces && (
              <div className="py-6 flex items-center gap-2 text-[#a4a4a2]">
                <div className="w-4 h-4 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
                <span className="text-sm">Connecting to ClickUp...</span>
              </div>
            )}

            {!loadingWorkspaces && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">Could not connect</p>
                <p className="text-red-600">{error}</p>
                {error.includes('not set') && (
                  <p className="mt-2 text-red-600">
                    Add <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">CLICKUP_API_KEY</code> to your Netlify environment variables.
                  </p>
                )}
              </div>
            )}

            {!loadingWorkspaces && !error && (
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all text-sm ${
                      currentWorkspace?.id === ws.id
                        ? 'border-[#37352f] bg-[#37352f] text-white'
                        : 'border-[#e9e9e7] hover:border-[#37352f] hover:bg-[#f7f7f5] text-[#37352f]'
                    }`}
                  >
                    <div className="font-medium">{ws.name}</div>
                    {currentWorkspace?.id === ws.id && (
                      <div className="text-xs opacity-60 mt-0.5">Active workspace</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Space scope selection — only shown when workspace connected */}
          {currentWorkspace && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#a4a4a2] uppercase tracking-wider">
                  Search Scope
                </p>
                {selectedSpaceIds.length > 0 && (
                  <button
                    onClick={() => { setSelectedSpaceIds([]); saveSearchSpaceIds([]); }}
                    className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <p className="text-xs text-[#a4a4a2] mb-3">
                Select which spaces the task search looks in.{' '}
                {selectedSpaceIds.length === 0
                  ? 'Currently searching all spaces.'
                  : `Searching ${selectedSpaceIds.length} space${selectedSpaceIds.length > 1 ? 's' : ''}.`}
              </p>

              {loadingSpaces && (
                <div className="py-3 flex items-center gap-2 text-[#a4a4a2]">
                  <div className="w-3 h-3 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
                  <span className="text-xs">Loading spaces...</span>
                </div>
              )}

              {!loadingSpaces && spaces.length > 0 && (
                <div className="space-y-1.5">
                  {spaces.map(space => {
                    const checked = selectedSpaceIds.includes(space.id);
                    return (
                      <label
                        key={space.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all ${
                          checked
                            ? 'border-[#37352f] bg-[#f7f7f5]'
                            : 'border-[#e9e9e7] hover:border-[#d3d1cb] hover:bg-[#f7f7f5]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSpace(space.id)}
                          className="w-4 h-4 rounded accent-[#37352f] shrink-0"
                        />
                        <span className="text-sm font-medium text-[#37352f]">{space.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Disconnect */}
          {currentWorkspace && (
            <button
              onClick={() => { onSelectWorkspace(null); setSpaces([]); setSelectedSpaceIds([]); saveSearchSpaceIds([]); onClose(); }}
              className="w-full text-xs text-[#a4a4a2] hover:text-red-500 transition-colors py-2"
            >
              Disconnect ClickUp
            </button>
          )}
        </div>

        {/* Done button */}
        <div className="mt-5 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#37352f] text-white rounded-xl text-sm font-medium hover:bg-[#25241f] transition-all active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClickUpSettings;
