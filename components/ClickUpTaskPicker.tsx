import React, { useState, useEffect, useRef, useMemo } from 'react';
import { searchTasks, logTime, ClickUpTask } from '../utils/clickup';
import { loadSearchSpaceIds, loadSearchListIds } from '../utils/storage';
import { buildScopeKey, loadTaskCache, saveTaskCache, clearTaskCache, formatCacheAge } from '../utils/taskCache';

interface Props {
  workspaceId: string;
  timerTitle: string;
  currentElapsed: number;
  linkedTaskId?: string;
  linkedTaskName?: string;
  isSynced?: boolean;
  onLink: (taskId: string, taskName: string) => void;
  onUnlink: () => void;
  onSynced: () => void;
}

type SyncState = 'idle' | 'syncing' | 'error';

const ClickUpTaskPicker: React.FC<Props> = ({
  workspaceId,
  timerTitle,
  currentElapsed,
  linkedTaskId,
  linkedTaskName,
  isSynced,
  onLink,
  onUnlink,
  onSynced,
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [allTasks, setAllTasks] = useState<ClickUpTask[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [cacheAgeMs, setCacheAgeMs] = useState<number | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when search opens
  useEffect(() => {
    if (isSearching) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isSearching]);

  // Fetch all tasks once when search is first opened — subsequent opens use cache
  useEffect(() => {
    if (!isSearching || hasLoaded) return;

    const listIds = loadSearchListIds();
    const spaceIds = loadSearchSpaceIds();
    const scopeKey = buildScopeKey(workspaceId, listIds, spaceIds);

    const cached = loadTaskCache(scopeKey);
    if (cached) {
      setAllTasks(cached.tasks);
      setCacheAgeMs(cached.ageMs);
      setHasLoaded(true);
      return;
    }

    setLoadingAll(true);
    const options = listIds.length > 0
      ? { listIds }
      : spaceIds.length > 0
      ? { spaceIds }
      : undefined;

    searchTasks(workspaceId, '', options)
      .then(tasks => {
        setAllTasks(tasks);
        setCacheAgeMs(null);
        saveTaskCache(tasks, scopeKey);
        setHasLoaded(true);
      })
      .catch(() => setAllTasks([]))
      .finally(() => setLoadingAll(false));
  }, [isSearching, hasLoaded, workspaceId]);

  // Filter locally — instant, no API call
  const filteredResults = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return allTasks;
    return allTasks.filter(t => t.name.toLowerCase().includes(term));
  }, [allTasks, query]);

  const handleRefresh = () => {
    clearTaskCache();
    setAllTasks([]);
    setHasLoaded(false);
    setCacheAgeMs(null);
  };

  const closeSearch = () => {
    setIsSearching(false);
    setQuery('');
  };

  const handleSync = async () => {
    if (!linkedTaskId || currentElapsed === 0) return;
    setSyncState('syncing');
    setSyncError(null);
    try {
      const durationMs = currentElapsed * 1000;
      const startMs = Date.now() - durationMs;
      await logTime(workspaceId, linkedTaskId, startMs, durationMs, timerTitle);
      onSynced();
    } catch (err: unknown) {
      setSyncState('error');
      setSyncError(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => setSyncState('idle'), 4000);
    }
  };

  // — Linked + synced state —
  if (linkedTaskId) {
    return (
      <div className="mt-4 pt-4 border-t border-[#e9e9e7]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a4a4a2] shrink-0">CU</span>
            <span className="text-xs font-medium text-[#37352f] truncate">{linkedTaskName}</span>
            {!isSynced && (
              <button
                onClick={onUnlink}
                title="Unlink task"
                className="shrink-0 text-[#a4a4a2] hover:text-red-500 transition-colors leading-none"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {isSynced ? (
            <span className="shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium bg-green-50 text-green-600 border border-green-200 opacity-70">
              ✓ Synced
            </span>
          ) : (
            <button
              onClick={handleSync}
              disabled={syncState === 'syncing' || currentElapsed === 0}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all active:scale-95 ${
                syncState === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : syncState === 'syncing'
                  ? 'bg-[#f7f7f5] text-[#a4a4a2] border border-[#e9e9e7] cursor-wait'
                  : currentElapsed === 0
                  ? 'bg-[#f7f7f5] text-[#a4a4a2] border border-[#e9e9e7] cursor-not-allowed opacity-50'
                  : 'bg-[#37352f] text-white hover:bg-[#25241f]'
              }`}
            >
              {syncState === 'syncing' ? 'Syncing...' : syncState === 'error' ? 'Failed' : 'Sync'}
            </button>
          )}
        </div>
        {syncState === 'error' && syncError && (
          <p className="mt-1.5 text-xs text-red-500 leading-snug">{syncError}</p>
        )}
      </div>
    );
  }

  // — Search open —
  if (isSearching) {
    return (
      <div className="mt-4 pt-4 border-t border-[#e9e9e7]">
        {/* Search input */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && closeSearch()}
            placeholder={loadingAll ? 'Loading tasks...' : `Search ${allTasks.length} tasks...`}
            disabled={loadingAll}
            className="w-full text-sm border border-[#e9e9e7] rounded-lg px-3 py-2 outline-none focus:border-[#37352f] text-[#37352f] placeholder-[#a4a4a2] bg-white disabled:bg-[#f7f7f5]"
          />
          {loadingAll && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-[#a4a4a2] border-t-[#37352f] rounded-full animate-spin" />
          )}
        </div>

        {/* Results — filtered locally */}
        {!loadingAll && filteredResults.length > 0 && (
          <div className="mt-1 border border-[#e9e9e7] rounded-xl overflow-y-auto shadow-sm max-h-60">
            {filteredResults.map(task => (
              <button
                key={task.id}
                onClick={() => { onLink(task.id, task.name); closeSearch(); }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#f7f7f5] border-b border-[#e9e9e7] last:border-0 transition-colors"
              >
                <div className="text-sm font-medium text-[#37352f] truncate">{task.name}</div>
                {task.list?.name && (
                  <div className="text-xs text-[#a4a4a2] mt-0.5 truncate">{task.list.name}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {!loadingAll && query.trim() && filteredResults.length === 0 && (
          <p className="mt-2 text-xs text-[#a4a4a2] text-center py-1">No tasks found</p>
        )}

        {/* Footer: cancel + cache info */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={closeSearch}
            className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors"
          >
            Cancel
          </button>
          {hasLoaded && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#a4a4a2]">
                {cacheAgeMs !== null ? `Cached ${formatCacheAge(cacheAgeMs)}` : `${allTasks.length} tasks loaded`}
              </span>
              <button
                onClick={handleRefresh}
                title="Refresh task list"
                className="text-[10px] text-[#a4a4a2] hover:text-[#37352f] transition-colors underline underline-offset-2"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // — Default: link prompt —
  return (
    <div className="mt-4 pt-4 border-t border-[#e9e9e7]">
      <button
        onClick={() => setIsSearching(true)}
        className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors"
      >
        + Link ClickUp task
      </button>
    </div>
  );
};

export default ClickUpTaskPicker;
