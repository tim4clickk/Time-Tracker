interface NetlifyEvent {
  httpMethod: string;
  body?: string | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.CLICKUP_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CLICKUP_API_KEY environment variable is not set' }),
    };
  }

  const { teamId, taskId, start, duration, description } = JSON.parse(event.body || '{}');
  if (!teamId || !taskId || !start || !duration) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'teamId, taskId, start, and duration are required' }),
    };
  }

  const response = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/time_entries`,
    {
      method: 'POST',
      headers: {
        Authorization: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description || '',
        start,
        duration,
        tid: taskId,
      }),
    }
  );

  const data = await response.json();
  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
