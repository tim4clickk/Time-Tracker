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

  const { teamId, query } = event.queryStringParameters || {};
  if (!teamId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'teamId is required' }),
    };
  }

  const params = new URLSearchParams({
    search: query || '',
    subtasks: 'true',
    include_closed: 'false',
    page: '0',
  });

  const response = await fetch(
    `https://api.clickup.com/api/v2/team/${teamId}/task?${params}`,
    { headers: { Authorization: apiKey } }
  );

  const data = await response.json();
  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
