import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Timer, HistoryItem } from './types';
import TimerCard from './components/TimerCard';
import SortableTimerCard from './components/SortableTimerCard';
import HistorySidebar from './components/HistorySidebar';
import ClickUpSettings from './components/ClickUpSettings';
import TimesheetPanel from './components/TimesheetPanel';
import LoginPage from './components/LoginPage';
import { PlusIcon, TrashIcon, HistoryIcon } from './components/Icons';
import { saveTimers, loadTimers, saveHistory, loadHistory, saveClickUpWorkspace, loadClickUpWorkspace, saveUserIdentity, loadUserIdentity, clearUserIdentity, UserIdentity, ClickUpWorkspaceConfig } from './utils/storage';
import UserPicker from './components/UserPicker';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(() => loadUserIdentity());
  const [timers, setTimers] = useState<Timer[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTimesheetOpen, setIsTimesheetOpen] = useState(false);
  const [isClickUpSettingsOpen, setIsClickUpSettingsOpen] = useState(false);
  const [clickupWorkspace, setClickupWorkspace] = useState<ClickUpWorkspaceConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Verify stored auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('app_auth_token');
    if (!token) { setIsAuthenticated(false); return; }
    fetch('/.netlify/functions/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', token }),
    })
      .then(r => r.json())
      .then(data => setIsAuthenticated(data.valid === true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // Initialize from storage
  useEffect(() => {
    const savedTimers = loadTimers();
    const savedHistory = loadHistory();
    const savedWorkspace = loadClickUpWorkspace();
    setTimers(savedTimers);
    setHistory(savedHistory);
    setClickupWorkspace(savedWorkspace);
    setIsLoaded(true);
  }, []);

  // Save to storage whenever timers state changes
  useEffect(() => {
    if (isLoaded) {
      saveTimers(timers);
    }
  }, [timers, isLoaded]);

  // Save history to storage
  useEffect(() => {
    if (isLoaded) {
      saveHistory(history);
    }
  }, [history, isLoaded]);

  // Global ticker to update the "Total Time Today" display in real-time
  useEffect(() => {
    const isAnyTimerRunning = timers.some(t => t.isRunning);
    if (isAnyTimerRunning) {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [timers]);

  const formatTitleTime = (totalSeconds: number) => {
    const absSeconds = Math.max(0, totalSeconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Update document title with active timer
  useEffect(() => {
    const activeTimers = timers.filter(t => t.isRunning && t.sessionStartTime);
    
    if (activeTimers.length > 0) {
      // Find the most recently started timer (largest sessionStartTime)
      const activeTimer = activeTimers.reduce((prev, current) => {
        return (prev.sessionStartTime! > current.sessionStartTime!) ? prev : current;
      });

      const sessionSeconds = activeTimer.sessionStartTime
        ? Math.floor((now - activeTimer.sessionStartTime) / 1000)
        : 0;
      const totalElapsed = activeTimer.baseSeconds + sessionSeconds;
      
      const timeString = formatTitleTime(totalElapsed);
      const titleString = activeTimer.title ? ` - ${activeTimer.title}` : '';
      
      document.title = `${timeString}${titleString}`;
    } else {
      document.title = 'Minimalist Notion Timer';
    }
  }, [timers, now]);

  // Calculate Total Time Today
  const totalSeconds = useMemo(() => {
    return timers.reduce((acc, timer) => {
      const sessionSeconds = (timer.isRunning && timer.sessionStartTime)
        ? Math.floor((now - timer.sessionStartTime) / 1000)
        : 0;
      return acc + timer.baseSeconds + sessionSeconds;
    }, 0);
  }, [timers, now]);

  const formatTotalTime = (total: number) => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const addTimer = useCallback(() => {
    const newTimer: Timer = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      baseSeconds: 0,
      isRunning: false,
      sessionStartTime: null,
      createdAt: Date.now()
    };
    setTimers(prev => [...prev, newTimer]);
  }, []);

  const deleteTimer = useCallback((id: string) => {
    const timerToDelete = timers.find(t => t.id === id);
    if (timerToDelete) {
      const timestamp = Date.now();
      const sessionSeconds = (timerToDelete.isRunning && timerToDelete.sessionStartTime)
        ? Math.floor((timestamp - timerToDelete.sessionStartTime) / 1000)
        : 0;
      const totalSeconds = timerToDelete.baseSeconds + sessionSeconds;

      const historyItem: HistoryItem = {
        id: timerToDelete.id,
        title: timerToDelete.title,
        totalSeconds: totalSeconds,
        deletedAt: timestamp
      };
      
      setHistory(prev => [historyItem, ...prev]);
      setTimers(prev => prev.filter(t => t.id !== id));
    }
  }, [timers]);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to delete all history? This cannot be undone.')) {
      setHistory([]);
    }
  }, []);

  const updateTitle = useCallback((id: string, title: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, title } : t));
  }, []);

  const setElapsedTime = useCallback((id: string, seconds: number) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          baseSeconds: seconds,
          isRunning: false,
          sessionStartTime: null
        };
      }
      return t;
    }));
  }, []);

  const toggleTimer = useCallback((id: string) => {
    const timestamp = Date.now();
    setTimers(prev => {
      const target = prev.find(t => t.id === id);
      const isStarting = target && !target.isRunning;
      return prev.map(t => {
        if (t.id === id) {
          if (!t.isRunning) {
            return { ...t, isRunning: true, sessionStartTime: timestamp };
          } else {
            const sessionElapsed = t.sessionStartTime ? Math.floor((timestamp - t.sessionStartTime) / 1000) : 0;
            return { ...t, isRunning: false, baseSeconds: t.baseSeconds + sessionElapsed, sessionStartTime: null };
          }
        }
        // Pause any other running timer when a new one starts
        if (isStarting && t.isRunning) {
          const sessionElapsed = t.sessionStartTime ? Math.floor((timestamp - t.sessionStartTime) / 1000) : 0;
          return { ...t, isRunning: false, baseSeconds: t.baseSeconds + sessionElapsed, sessionStartTime: null };
        }
        return t;
      });
    });
  }, []);

  const resetTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, baseSeconds: 0, isRunning: false, sessionStartTime: null, syncedAt: undefined };
      }
      return t;
    }));
  }, []);

  const markTimerSynced = useCallback((id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, syncedAt: Date.now() } : t));
  }, []);

  const restoreTimer = useCallback((item: HistoryItem) => {
    const restored: Timer = {
      id: Math.random().toString(36).substr(2, 9),
      title: item.title,
      baseSeconds: item.totalSeconds,
      isRunning: false,
      sessionStartTime: null,
      createdAt: Date.now(),
    };
    setTimers(prev => [restored, ...prev]);
    setHistory(prev => prev.filter(h => h.id !== item.id));
  }, []);

  const handleSelectClickUpWorkspace = useCallback((workspace: ClickUpWorkspaceConfig | null) => {
    setClickupWorkspace(workspace);
    saveClickUpWorkspace(workspace);
  }, []);

  const linkClickUpTask = useCallback((id: string, taskId: string, taskName: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, clickupTaskId: taskId, clickupTaskName: taskName } : t));
  }, []);

  const unlinkClickUpTask = useCallback((id: string) => {
    setTimers(prev => prev.map(t => t.id === id ? { ...t, clickupTaskId: undefined, clickupTaskName: undefined } : t));
  }, []);

  const clearAllTimers = useCallback(() => {
    if (timers.length === 0) return;
    if (window.confirm('Are you sure you want to delete all timers? This action cannot be undone.')) {
      const timestamp = Date.now();
      const historyItems = timers.map(timer => {
        const sessionSeconds = (timer.isRunning && timer.sessionStartTime)
          ? Math.floor((timestamp - timer.sessionStartTime) / 1000)
          : 0;
        const totalSeconds = timer.baseSeconds + sessionSeconds;
        
        return {
          id: timer.id,
          title: timer.title,
          totalSeconds: totalSeconds,
          deletedAt: timestamp
        };
      });

      setHistory(prev => [...historyItems, ...prev]);
      setTimers([]);
    }
  }, [timers]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTimers(prev => {
      const unsynced = prev.filter(t => !t.syncedAt);
      const synced = prev.filter(t => t.syncedAt);
      const oldIndex = unsynced.findIndex(t => t.id === active.id);
      const newIndex = unsynced.findIndex(t => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return [...arrayMove(unsynced, oldIndex, newIndex), ...synced];
    });
  }, []);

  const handleSelectUser = useCallback((user: UserIdentity) => {
    saveUserIdentity(user);
    setUserIdentity(user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('app_auth_token');
    clearUserIdentity();
    setUserIdentity(null);
    setIsAuthenticated(false);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-2 border-gray-100 border-t-[#37352f] rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  if (!userIdentity) {
    return <UserPicker onSelect={handleSelectUser} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-2 border-gray-100 border-t-[#37352f] rounded-full animate-spin mb-4"></div>
        <div className="text-[#a4a4a2] font-medium tracking-tight">Preparing your workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 md:p-12 max-w-7xl mx-auto selection:bg-[#37352f] selection:text-white">
      {/* App Header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-[#37352f] mb-2 tracking-tight">Time Tracking</h1>
          <div className="flex flex-wrap items-center gap-3">
             <p className="text-[#a4a4a2] text-lg">Clean, simple, and notion-inspired.</p>
             {timers.length > 0 && (
               <>
                 <span className="hidden sm:block w-1 h-1 rounded-full bg-[#e9e9e7]"></span>
                 <div className="flex items-center gap-2 bg-[#f7f7f5] px-3 py-1 rounded-full border border-[#e9e9e7]">
                    <div className={`w-2 h-2 rounded-full ${timers.some(t => t.isRunning) ? 'bg-orange-400 animate-pulse' : 'bg-gray-300'}`}></div>
                    <span className="text-sm font-semibold text-[#37352f] mono">
                      Total: {formatTotalTime(totalSeconds)}
                    </span>
                 </div>
               </>
             )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* History + Timesheet — grouped as one unit */}
          <div className="flex items-center bg-white border border-[#e9e9e7] rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setIsHistoryOpen(true)}
              title="History"
              className="flex items-center gap-1.5 px-3 py-2 text-[#37352f] hover:bg-[#f7f7f5] transition-colors text-sm font-medium"
            >
              <HistoryIcon />
              <span>History</span>
            </button>
            {clickupWorkspace && (
              <>
                <span className="w-px h-5 bg-[#e9e9e7] shrink-0" />
                <button
                  onClick={() => setIsTimesheetOpen(true)}
                  className="flex items-center px-3 py-2 text-[#37352f] hover:bg-[#f7f7f5] transition-colors text-sm font-medium"
                >
                  Timesheet
                </button>
              </>
            )}
          </div>

          {/* ClickUp status — compact badge */}
          <button
            onClick={() => setIsClickUpSettingsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all shadow-sm ${
              clickupWorkspace
                ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                : 'border-[#e9e9e7] bg-white text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5]'
            }`}
          >
            {clickupWorkspace
              ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" /><span>ClickUp</span></>
              : <span>Connect ClickUp</span>
            }
          </button>

          {/* Clear All — icon only */}
          {timers.length > 0 && (
            <button
              onClick={clearAllTimers}
              title="Clear all timers"
              className="flex items-center justify-center w-9 h-9 bg-white border border-[#e9e9e7] text-[#a4a4a2] rounded-lg hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm active:scale-95"
            >
              <TrashIcon />
            </button>
          )}

          {/* Add Task — primary CTA */}
          <button
            onClick={addTimer}
            className="flex items-center gap-2 px-4 py-2 bg-[#37352f] text-white rounded-lg font-medium hover:bg-[#25241f] transition-all shadow-md active:scale-95 text-sm"
          >
            <PlusIcon />
            <span>Add Task</span>
          </button>
        </div>
      </header>

      {/* Timers Grid */}
      {(() => {
        const unsyncedTimers = timers.filter(t => !t.syncedAt);
        const syncedTimers = [...timers.filter(t => t.syncedAt)]
          .sort((a, b) => (b.syncedAt ?? 0) - (a.syncedAt ?? 0));
        const sharedProps = {
          onUpdateTitle: updateTitle,
          onSetElapsedTime: setElapsedTime,
          onToggle: toggleTimer,
          onReset: resetTimer,
          onDelete: deleteTimer,
          clickupWorkspaceId: clickupWorkspace?.id,
          assigneeId: userIdentity?.id,
          onLinkClickUpTask: linkClickUpTask,
          onUnlinkClickUpTask: unlinkClickUpTask,
          onMarkSynced: markTimerSynced,
        };
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SortableContext items={unsyncedTimers.map(t => t.id)} strategy={rectSortingStrategy}>
                {unsyncedTimers.map(timer => (
                  <SortableTimerCard key={timer.id} timer={timer} {...sharedProps} />
                ))}
              </SortableContext>

              {syncedTimers.map(timer => (
                <TimerCard key={timer.id} timer={timer} {...sharedProps} />
              ))}

              {/* Inline Add Button */}
              <button
                onClick={addTimer}
                className="flex flex-col items-center justify-center p-6 min-h-[180px] rounded-xl border-2 border-dashed border-[#e9e9e7] text-[#a4a4a2] hover:border-[#37352f] hover:text-[#37352f] hover:bg-[#f7f7f5] transition-all group active:scale-[0.98]"
              >
                <div className="mb-3 group-hover:scale-110 transition-transform bg-[#f7f7f5] p-3 rounded-full group-hover:bg-[#e9e9e7]">
                  <PlusIcon />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider">New Task</span>
              </button>
            </div>
          </DndContext>
        );
      })()}

      {timers.length === 0 && (
        <div className="mt-12 text-center py-32 bg-[#f9f9f8] rounded-2xl border border-[#e9e9e7] border-dashed">
          <div className="max-w-xs mx-auto">
            <div className="text-5xl mb-6">⏱️</div>
            <p className="text-[#37352f] font-medium text-lg mb-2">No active tasks</p>
            <p className="text-[#a4a4a2] mb-8 text-sm">Create a task and hit play to start tracking your time.</p>
            <button 
              onClick={addTimer}
              className="w-full px-8 py-3 bg-[#37352f] text-white rounded-lg font-medium hover:bg-[#25241f] transition-all shadow-lg shadow-gray-200"
            >
              Start tracking
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 pt-10 border-t border-[#e9e9e7] flex flex-col sm:flex-row justify-between items-center text-xs text-[#a4a4a2] gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <div>All trackers are automatically synced to your local browser storage.</div>
        </div>
        <div className="flex gap-4 font-medium italic items-center">
          <span>Minimalism first</span>
          <button
            onClick={handleLogout}
            className="not-italic font-normal text-[#a4a4a2] hover:text-[#eb5757] transition-colors"
          >
            Sign out
          </button>
        </div>
      </footer>

      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={history}
        onDeleteOne={deleteHistoryItem}
        onClearAll={clearHistory}
        onRestore={restoreTimer}
      />

      <ClickUpSettings
        isOpen={isClickUpSettingsOpen}
        onClose={() => setIsClickUpSettingsOpen(false)}
        currentWorkspace={clickupWorkspace}
        onSelectWorkspace={handleSelectClickUpWorkspace}
      />

      {clickupWorkspace && userIdentity && (
        <TimesheetPanel
          isOpen={isTimesheetOpen}
          onClose={() => setIsTimesheetOpen(false)}
          workspaceId={clickupWorkspace.id}
          userId={userIdentity.id}
          userName={userIdentity.username || userIdentity.email}
        />
      )}
    </div>
  );
};

export default App;