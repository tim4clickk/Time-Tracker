interface NetlifyEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string> | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  const apiKey = process.env.CLICKUP_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CLICKUP_API_KEY environment variable is not set' }),
    };
  }

  const { teamId, query, spaceIds, listIds } = event.queryStringParameters || {};
  if (!teamId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'teamId is required' }) };
  }

  // Build URL manually — array params must be appended individually
  let url = `https://api.clickup.com/api/v2/team/${teamId}/task?page=0&subtasks=true&include_closed=false`;

  // list_ids[] takes priority over space_ids[] when both are provided
  if (listIds) {
    listIds.split(',').forEach(id => {
      url += `&list_ids[]=${encodeURIComponent(id.trim())}`;
    });
  } else if (spaceIds) {
    spaceIds.split(',').forEach(id => {
      url += `&space_ids[]=${encodeURIComponent(id.trim())}`;
    });
  }

  const response = await fetch(url, { headers: { Authorization: apiKey } });

  if (!response.ok) {
    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  }

  const data = await response.json();
  const allTasks: Array<{ name: string; [key: string]: unknown }> = data.tasks || [];

  // Filter by name client-side — reliable regardless of ClickUp API behaviour
  const term = (query || '').toLowerCase().trim();
  const filtered = term
    ? allTasks.filter(task => task.name.toLowerCase().includes(term))
    : allTasks;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks: filtered }),
  };
};
