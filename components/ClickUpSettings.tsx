import React, { useState, useEffect } from 'react';
import { getWorkspaces, getSpaces, getLists, ClickUpWorkspace, ClickUpSpace, ClickUpList } from '../utils/clickup';
import {
  ClickUpWorkspaceConfig,
  saveSearchSpaceIds, loadSearchSpaceIds,
  saveSearchListIds, loadSearchListIds,
} from '../utils/storage';

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
  const [selectedListIds, setSelectedListIds] = useState<string[]>(loadSearchListIds);
  // Map of spaceId → lists (loaded on demand)
  const [listsMap, setListsMap] = useState<Record<string, ClickUpList[]>>({});
  const [loadingListsFor, setLoadingListsFor] = useState<string | null>(null);
  const [expandedSpaceIds, setExpandedSpaceIds] = useState<string[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoadingWorkspaces(true);
    setError(null);
    getWorkspaces()
      .then(setWorkspaces)
      .catch(err => setError(err.message))
      .finally(() => setLoadingWorkspaces(false));
  }, [isOpen]);

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
    setSelectedSpaceIds([]); saveSearchSpaceIds([]);
    setSelectedListIds([]); saveSearchListIds([]);
    setListsMap({});
    setExpandedSpaceIds([]);
  };

  const toggleSpace = (id: string) => {
    const next = selectedSpaceIds.includes(id)
      ? selectedSpaceIds.filter(s => s !== id)
      : [...selectedSpaceIds, id];
    setSelectedSpaceIds(next);
    saveSearchSpaceIds(next);
    // Auto-expand when checked
    if (!selectedSpaceIds.includes(id)) expandSpace(id);
  };

  const expandSpace = (spaceId: string) => {
    if (expandedSpaceIds.includes(spaceId)) return;
    setExpandedSpaceIds(prev => [...prev, spaceId]);
    if (listsMap[spaceId]) return;
    setLoadingListsFor(spaceId);
    getLists(spaceId)
      .then(lists => setListsMap(prev => ({ ...prev, [spaceId]: lists })))
      .catch(() => setListsMap(prev => ({ ...prev, [spaceId]: [] })))
      .finally(() => setLoadingListsFor(null));
  };

  const collapseSpace = (spaceId: string) => {
    setExpandedSpaceIds(prev => prev.filter(id => id !== spaceId));
  };

  const toggleList = (listId: string) => {
    const next = selectedListIds.includes(listId)
      ? selectedListIds.filter(l => l !== listId)
      : [...selectedListIds, listId];
    setSelectedListIds(next);
    saveSearchListIds(next);
  };

  // Describe current scope in plain English
  const scopeLabel = (() => {
    if (selectedListIds.length > 0)
      return `Searching ${selectedListIds.length} list${selectedListIds.length > 1 ? 's' : ''}`;
    if (selectedSpaceIds.length > 0)
      return `Searching ${selectedSpaceIds.length} space${selectedSpaceIds.length > 1 ? 's' : ''} (all lists)`;
    return 'Searching all spaces';
  })();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" onClick={onClose}>
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
          <button onClick={onClose} className="text-[#a4a4a2] hover:text-[#37352f] transition-colors p-1 rounded hover:bg-[#f7f7f5]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 space-y-5">
          {/* Workspace */}
          <div>
            <p className="text-xs font-semibold text-[#a4a4a2] uppercase tracking-wider mb-2">Workspace</p>
            {loadingWorkspaces && (
              <div className="py-4 flex items-center gap-2 text-[#a4a4a2]">
                <div className="w-4 h-4 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
                <span className="text-sm">Connecting to ClickUp...</span>
              </div>
            )}
            {!loadingWorkspaces && error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                <p className="font-semibold mb-1">Could not connect</p>
                <p>{error}</p>
                {error.includes('not set') && (
                  <p className="mt-2">Add <code className="bg-red-100 px-1.5 py-0.5 rounded font-mono text-xs">CLICKUP_API_KEY</code> to your Netlify environment variables.</p>
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
                    {currentWorkspace?.id === ws.id && <div className="text-xs opacity-60 mt-0.5">Active workspace</div>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search scope — spaces + lists */}
          {currentWorkspace && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-[#a4a4a2] uppercase tracking-wider">Search Scope</p>
                {(selectedSpaceIds.length > 0 || selectedListIds.length > 0) && (
                  <button
                    onClick={() => {
                      setSelectedSpaceIds([]); saveSearchSpaceIds([]);
                      setSelectedListIds([]); saveSearchListIds([]);
                    }}
                    className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <p className="text-xs text-[#a4a4a2] mb-3">{scopeLabel}</p>

              {loadingSpaces && (
                <div className="py-3 flex items-center gap-2 text-[#a4a4a2]">
                  <div className="w-3 h-3 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
                  <span className="text-xs">Loading spaces...</span>
                </div>
              )}

              {!loadingSpaces && spaces.length > 0 && (
                <div className="space-y-1">
                  {spaces.map(space => {
                    const spaceChecked = selectedSpaceIds.includes(space.id);
                    const expanded = expandedSpaceIds.includes(space.id);
                    const lists = listsMap[space.id] || [];
                    const loadingLists = loadingListsFor === space.id;

                    return (
                      <div key={space.id}>
                        {/* Space row */}
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                          spaceChecked ? 'border-[#37352f] bg-[#f7f7f5]' : 'border-[#e9e9e7] hover:border-[#d3d1cb]'
                        }`}>
                          <input
                            type="checkbox"
                            checked={spaceChecked}
                            onChange={() => toggleSpace(space.id)}
                            className="w-4 h-4 rounded accent-[#37352f] shrink-0"
                          />
                          <span className="text-sm font-medium text-[#37352f] flex-1">{space.name}</span>
                          {/* Expand/collapse toggle */}
                          <button
                            onClick={() => expanded ? collapseSpace(space.id) : expandSpace(space.id)}
                            className="text-[#a4a4a2] hover:text-[#37352f] transition-colors p-0.5"
                            title={expanded ? 'Collapse lists' : 'Show lists'}
                          >
                            <svg
                              width="12" height="12" viewBox="0 0 12 12" fill="none"
                              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                            >
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>

                        {/* Lists under this space */}
                        {expanded && (
                          <div className="ml-4 mt-1 mb-1 space-y-1">
                            {loadingLists && (
                              <div className="flex items-center gap-2 px-3 py-2 text-[#a4a4a2]">
                                <div className="w-3 h-3 border-2 border-[#e9e9e7] border-t-[#37352f] rounded-full animate-spin shrink-0" />
                                <span className="text-xs">Loading lists...</span>
                              </div>
                            )}
                            {!loadingLists && lists.length === 0 && (
                              <p className="text-xs text-[#a4a4a2] px-3 py-1.5">No lists found</p>
                            )}
                            {!loadingLists && lists.map(list => {
                              const listChecked = selectedListIds.includes(list.id);
                              return (
                                <label
                                  key={list.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                    listChecked ? 'border-[#37352f] bg-[#f7f7f5]' : 'border-[#e9e9e7] hover:border-[#d3d1cb] hover:bg-[#f7f7f5]'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={listChecked}
                                    onChange={() => toggleList(list.id)}
                                    className="w-3.5 h-3.5 rounded accent-[#37352f] shrink-0"
                                  />
                                  <span className="text-xs font-medium text-[#37352f] flex-1 truncate">{list.name}</span>
                                  {list.folderName && (
                                    <span className="text-[10px] text-[#a4a4a2] shrink-0">{list.folderName}</span>
                                  )}
                                  {list.taskCount !== null && (
                                    <span className="text-[10px] text-[#a4a4a2] shrink-0">{list.taskCount}</span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Disconnect */}
          {currentWorkspace && (
            <button
              onClick={() => {
                onSelectWorkspace(null);
                setSpaces([]); setListsMap({}); setExpandedSpaceIds([]);
                setSelectedSpaceIds([]); saveSearchSpaceIds([]);
                setSelectedListIds([]); saveSearchListIds([]);
                onClose();
              }}
              className="w-full text-xs text-[#a4a4a2] hover:text-red-500 transition-colors py-2"
            >
              Disconnect ClickUp
            </button>
          )}
        </div>

        {/* Done */}
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
