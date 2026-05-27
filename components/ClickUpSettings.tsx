import React, { useState, useEffect } from 'react';
import { getWorkspaces, ClickUpWorkspace } from '../utils/clickup';
import { ClickUpWorkspaceConfig } from '../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: ClickUpWorkspaceConfig | null;
  onSelectWorkspace: (workspace: ClickUpWorkspaceConfig | null) => void;
}

const ClickUpSettings: React.FC<Props> = ({ isOpen, onClose, currentWorkspace, onSelectWorkspace }) => {
  const [workspaces, setWorkspaces] = useState<ClickUpWorkspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    getWorkspaces()
      .then(setWorkspaces)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#37352f]">ClickUp Integration</h2>
            <p className="text-xs text-[#a4a4a2] mt-0.5">Select a workspace to enable time syncing</p>
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

        {loading && (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin" />
            <span className="text-sm text-[#a4a4a2]">Connecting to ClickUp...</span>
          </div>
        )}

        {!loading && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            <p className="font-semibold mb-1">Could not connect to ClickUp</p>
            <p className="text-red-600">{error}</p>
            {error.includes('not set') && (
              <p className="mt-3 text-red-600">
                Add <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">CLICKUP_API_KEY</code> to your Netlify environment variables, then redeploy.
              </p>
            )}
          </div>
        )}

        {!loading && !error && workspaces.length > 0 && (
          <div className="space-y-2">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => { onSelectWorkspace(ws); onClose(); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  currentWorkspace?.id === ws.id
                    ? 'border-[#37352f] bg-[#37352f] text-white'
                    : 'border-[#e9e9e7] hover:border-[#37352f] hover:bg-[#f7f7f5] text-[#37352f]'
                }`}
              >
                <div className="font-medium text-sm">{ws.name}</div>
                {currentWorkspace?.id === ws.id && (
                  <div className="text-xs opacity-60 mt-0.5">Active workspace</div>
                )}
              </button>
            ))}

            {currentWorkspace && (
              <button
                onClick={() => { onSelectWorkspace(null); onClose(); }}
                className="w-full mt-2 text-xs text-[#a4a4a2] hover:text-red-500 transition-colors py-2.5"
              >
                Disconnect ClickUp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClickUpSettings;
