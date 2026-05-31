import React, { useState, useEffect, useCallback } from 'react';
import { getTimeEntries, ClickUpTimeEntry } from '../utils/clickup';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  userName: string;
}

const DAILY_TARGET_KEY = 'timesheet_daily_target_hours';

function loadDailyTarget(): number {
  const raw = localStorage.getItem(DAILY_TARGET_KEY);
  return raw ? parseFloat(raw) : 8;
}

function saveDailyTarget(hours: number) {
  localStorage.setItem(DAILY_TARGET_KEY, hours.toString());
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatStartTime(msString: string): string {
  const date = new Date(parseInt(msString, 10));
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDateLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return 'Today';
  if (d.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const TimesheetPanel: React.FC<Props> = ({ isOpen, onClose, workspaceId, userId, userName }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<ClickUpTimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number>(loadDailyTarget);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');

  const fetchEntries = useCallback(async () => {
    if (!userId) return;
    setLoadingEntries(true);
    setError(null);
    try {
      const data = await getTimeEntries(workspaceId, userId, selectedDate);
      const sorted = [...data].sort((a, b) => parseInt(a.start) - parseInt(b.start));
      setEntries(sorted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoadingEntries(false);
    }
  }, [workspaceId, userId, selectedDate]);

  useEffect(() => {
    if (isOpen && userId) fetchEntries();
  }, [isOpen, userId, selectedDate]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d);
  };

  const isToday = isSameDay(selectedDate, new Date());

  const totalMs = entries.reduce((sum, e) => sum + parseInt(e.duration || '0', 10), 0);
  const targetMs = dailyTarget * 3600000;
  const progressPct = targetMs > 0 ? Math.min(100, (totalMs / targetMs) * 100) : 0;
  const isOnTarget = totalMs >= targetMs;

  const handleSaveTarget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) {
      setDailyTarget(val);
      saveDailyTarget(val);
    }
    setEditingTarget(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e9e9e7] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#37352f]">Timesheet</h2>
            <p className="text-xs text-[#a4a4a2] mt-0.5">{userName}</p>
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

        {/* Date navigator */}
        <div className="px-6 py-4 border-b border-[#e9e9e7] shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => shiftDate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e9e9e7] text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5] transition-all"
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M5 1L1 5l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-semibold text-[#37352f]">
              {formatDateLabel(selectedDate)}
            </span>
            <button
              onClick={() => shiftDate(1)}
              disabled={isToday}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e9e9e7] text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Summary */}
        {!loadingEntries && !error && (
          <div className="px-6 py-4 border-b border-[#e9e9e7] shrink-0">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-3xl font-bold text-[#37352f] mono">
                  {formatDuration(totalMs)}
                </div>
                <div className="text-xs text-[#a4a4a2] mt-0.5">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
              <div className="text-right">
                {editingTarget ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      value={targetInput}
                      onChange={e => setTargetInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveTarget(); if (e.key === 'Escape') setEditingTarget(false); }}
                      autoFocus
                      className="w-16 px-2 py-1 border border-[#37352f] rounded text-sm text-[#37352f] outline-none text-right"
                    />
                    <span className="text-xs text-[#a4a4a2]">hrs</span>
                    <button onClick={handleSaveTarget} className="text-xs text-[#37352f] font-medium hover:underline">Save</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setTargetInput(String(dailyTarget)); setEditingTarget(true); }}
                    className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors text-right"
                  >
                    Target: {dailyTarget}h
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-[#f7f7f5] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOnTarget ? 'bg-green-400' : 'bg-[#37352f]'}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${isOnTarget ? 'text-green-600 font-medium' : 'text-[#a4a4a2]'}`}>
                {isOnTarget ? 'Target reached' : `${formatDuration(Math.max(0, targetMs - totalMs))} to go`}
              </span>
              <span className="text-xs text-[#a4a4a2]">{dailyTarget}h target</span>
            </div>
          </div>
        )}

        {/* Entries list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loadingEntries && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-[#f7f7f5] rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loadingEntries && error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loadingEntries && !error && entries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#37352f] font-medium mb-1">No time logged</p>
              <p className="text-sm text-[#a4a4a2]">Nothing tracked for this day yet.</p>
            </div>
          )}

          {!loadingEntries && !error && entries.length > 0 && (
            <div className="space-y-2">
              {entries.map(entry => {
                const durationMs = parseInt(entry.duration || '0', 10);
                return (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between p-4 rounded-xl border border-[#e9e9e7] hover:bg-[#f7f7f5] transition-colors"
                  >
                    <div className="min-w-0 mr-4">
                      <div className="text-sm font-medium text-[#37352f] truncate">
                        {entry.task?.name || <span className="text-[#a4a4a2] font-normal">No task</span>}
                      </div>
                      {entry.description && (
                        <div className="text-xs text-[#a4a4a2] mt-0.5 truncate">{entry.description}</div>
                      )}
                      <div className="text-xs text-[#a4a4a2] mt-1">
                        {formatStartTime(entry.start)}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-[#37352f] mono shrink-0">
                      {formatDuration(durationMs)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer refresh */}
        <div className="px-6 py-3 border-t border-[#e9e9e7] shrink-0">
          <button
            onClick={fetchEntries}
            disabled={loadingEntries}
            className="text-xs text-[#a4a4a2] hover:text-[#37352f] transition-colors disabled:opacity-50"
          >
            {loadingEntries ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimesheetPanel;
