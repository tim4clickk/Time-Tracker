export interface ClickUpWorkspace {
  id: string;
  name: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  status: { status: string; color: string };
  list: { id: string; name: string };
}

export async function getWorkspaces(): Promise<ClickUpWorkspace[]> {
  const res = await fetch('/.netlify/functions/get-workspaces');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch workspaces');
  return data.teams || [];
}

export async function searchTasks(teamId: string, query: string): Promise<ClickUpTask[]> {
  const params = new URLSearchParams({ teamId, query });
  const res = await fetch(`/.netlify/functions/search-tasks?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to search tasks');
  return data.tasks || [];
}

export async function logTime(
  teamId: string,
  taskId: string,
  startMs: number,
  durationMs: number,
  description: string
): Promise<void> {
  const res = await fetch('/.netlify/functions/log-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, taskId, start: startMs, duration: durationMs, description }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.err || data.error || 'Failed to log time to ClickUp');
  }
}
