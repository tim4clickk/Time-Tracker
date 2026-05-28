import { ClickUpTask } from './clickup';

const CACHE_KEY = 'clickup_task_cache_v1';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface TaskCacheData {
  tasks: ClickUpTask[];
  scopeKey: string;
  fetchedAt: number;
}

export function buildScopeKey(workspaceId: string, listIds: string[], spaceIds: string[]): string {
  if (listIds.length > 0) return `lists:${[...listIds].sort().join(',')}`;
  if (spaceIds.length > 0) return `spaces:${[...spaceIds].sort().join(',')}`;
  return `team:${workspaceId}`;
}

export function loadTaskCache(scopeKey: string): { tasks: ClickUpTask[]; ageMs: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: TaskCacheData = JSON.parse(raw);
    if (cache.scopeKey !== scopeKey) return null;
    const ageMs = Date.now() - cache.fetchedAt;
    if (ageMs > CACHE_TTL_MS) return null;
    return { tasks: cache.tasks, ageMs };
  } catch {
    return null;
  }
}

export function saveTaskCache(tasks: ClickUpTask[], scopeKey: string): void {
  try {
    const data: TaskCacheData = { tasks, scopeKey, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save task cache', e);
  }
}

export function clearTaskCache(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

export function formatCacheAge(ageMs: number): string {
  const mins = Math.floor(ageMs / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 min ago';
  return `${mins} mins ago`;
}
