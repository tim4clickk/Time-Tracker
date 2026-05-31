
import { Timer, HistoryItem } from '../types';

const STORAGE_KEY = 'notion_timers_v1';
const HISTORY_STORAGE_KEY = 'notion_timers_history_v1';
const CLICKUP_WORKSPACE_KEY = 'clickup_workspace_v1';
const CLICKUP_SPACE_IDS_KEY = 'clickup_search_space_ids_v1';
const CLICKUP_LIST_IDS_KEY = 'clickup_search_list_ids_v1';
const USER_IDENTITY_KEY = 'app_user_identity_v1';

export interface UserIdentity {
  id: string;
  username: string;
  email: string;
  profilePicture?: string | null;
}

export const saveUserIdentity = (user: UserIdentity): void => {
  try {
    localStorage.setItem(USER_IDENTITY_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user identity', e);
  }
};

export const loadUserIdentity = (): UserIdentity | null => {
  try {
    const raw = localStorage.getItem(USER_IDENTITY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearUserIdentity = (): void => {
  try { localStorage.removeItem(USER_IDENTITY_KEY); } catch {}
};

export const saveSearchSpaceIds = (ids: string[]): void => {
  try {
    localStorage.setItem(CLICKUP_SPACE_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save search space IDs', e);
  }
};

export const loadSearchSpaceIds = (): string[] => {
  try {
    const raw = localStorage.getItem(CLICKUP_SPACE_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export interface ClickUpWorkspaceConfig {
  id: string;
  name: string;
}

export const saveClickUpWorkspace = (workspace: ClickUpWorkspaceConfig | null): void => {
  try {
    if (workspace) {
      localStorage.setItem(CLICKUP_WORKSPACE_KEY, JSON.stringify(workspace));
    } else {
      localStorage.removeItem(CLICKUP_WORKSPACE_KEY);
    }
  } catch (e) {
    console.error('Failed to save ClickUp workspace config', e);
  }
};

export const loadClickUpWorkspace = (): ClickUpWorkspaceConfig | null => {
  try {
    const raw = localStorage.getItem(CLICKUP_WORKSPACE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveSearchListIds = (ids: string[]): void => {
  try {
    localStorage.setItem(CLICKUP_LIST_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save search list IDs', e);
  }
};

export const loadSearchListIds = (): string[] => {
  try {
    const raw = localStorage.getItem(CLICKUP_LIST_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveTimers = (timers: Timer[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
};

export const loadTimers = (): Timer[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  
  try {
    const timers: Timer[] = JSON.parse(data);
    return timers;
  } catch (e) {
    console.error("Failed to parse timers from storage", e);
    return [];
  }
};

export const saveHistory = (history: HistoryItem[]) => {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

export const loadHistory = (): HistoryItem[] => {
  const data = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!data) return [];
  
  try {
    const history: HistoryItem[] = JSON.parse(data);
    return history;
  } catch (e) {
    console.error("Failed to parse history from storage", e);
    return [];
  }
};
