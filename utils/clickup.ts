export interface ClickUpWorkspace {
  id: string;
  name: string;
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpList {
  id: string;
  name: string;
  taskCount: number | null;
  folderName: string | null;
}

export interface ClickUpMember {
  id: number;
  username: string;
  email: string;
  profilePicture: string | null;
}

export interface ClickUpTimeEntry {
  id: string;
  task: { id: string; name: string } | null;
  description: string;
  start: string;    // Unix ms as string
  end: string;      // Unix ms as string
  duration: string; // ms as string
  user: { id: number; username: string };
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

export async function searchTasks(
  teamId: string,
  query: string,
  options?: { spaceIds?: string[]; listIds?: string[] }
): Promise<ClickUpTask[]> {
  const params = new URLSearchParams({ teamId, query });
  if (options?.listIds?.length) params.set('listIds', options.listIds.join(','));
  else if (options?.spaceIds?.length) params.set('spaceIds', options.spaceIds.join(','));
  const res = await fetch(`/.netlify/functions/search-tasks?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to search tasks');
  return data.tasks || [];
}

export async function getSpaces(teamId: string): Promise<ClickUpSpace[]> {
  const params = new URLSearchParams({ teamId });
  const res = await fetch(`/.netlify/functions/get-spaces?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch spaces');
  return data.spaces || [];
}

export async function getLists(spaceId: string): Promise<ClickUpList[]> {
  const params = new URLSearchParams({ spaceId });
  const res = await fetch(`/.netlify/functions/get-lists?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch lists');
  return data.lists || [];
}

export async function getTeamMembers(teamId: string): Promise<ClickUpMember[]> {
  const params = new URLSearchParams({ teamId });
  const res = await fetch(`/.netlify/functions/get-team-members?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch team members');
  return data.members || [];
}

export async function getTimeEntries(
  teamId: string,
  assigneeId: string,
  date: Date
): Promise<ClickUpTimeEntry[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const params = new URLSearchParams({
    teamId,
    assigneeId,
    startDate: start.getTime().toString(),
    endDate: end.getTime().toString(),
  });

  const res = await fetch(`/.netlify/functions/get-time-entries?${params}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch time entries');
  return data.entries || [];
}

export async function logTime(
  teamId: string,
  taskId: string,
  startMs: number,
  durationMs: number,
  description: string,
  assigneeId?: string
): Promise<void> {
  const res = await fetch('/.netlify/functions/log-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId, taskId, start: startMs, duration: durationMs, description, assigneeId }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.err || data.error || 'Failed to log time to ClickUp');
  }
}
