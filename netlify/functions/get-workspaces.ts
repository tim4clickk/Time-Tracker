interface NetlifyEvent {
  httpMethod: string;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

export const handler = async (_event: NetlifyEvent): Promise<NetlifyResponse> => {
  const apiKey = process.env.CLICKUP_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CLICKUP_API_KEY environment variable is not set' }),
    };
  }

  const response = await fetch('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: apiKey },
  });

  const data = await response.json();
  return {
    statusCode: response.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
};
