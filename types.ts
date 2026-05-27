
export interface Timer {
  id: string;
  title: string;
  baseSeconds: number; // Total seconds accumulated before the current session
  isRunning: boolean;
  sessionStartTime: number | null; // Timestamp (ms) when the current run started
  createdAt: number;
  clickupTaskId?: string;
  clickupTaskName?: string;
  syncedAt?: number;
}

export type TimerAction = 
  | { type: 'ADD_TIMER' }
  | { type: 'DELETE_TIMER'; id: string }
  | { type: 'UPDATE_TITLE'; id: string; title: string }
  | { type: 'SET_ELAPSED_TIME'; id: string; seconds: number }
  | { type: 'TOGGLE_TIMER'; id: string }
  | { type: 'RESET_TIMER'; id: string }
  | { type: 'TICK'; id: string };

export interface HistoryItem {
  id: string;
  title: string;
  totalSeconds: number;
  deletedAt: number;
}
