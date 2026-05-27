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

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'APP_PASSWORD environment variable is not set' }),
    };
  }

  const { action, password, token } = JSON.parse(event.body || '{}');

  // Token is derived server-side from the password — client can't forge it without knowing the password
  const expectedToken = Buffer.from(`tt-auth:${appPassword}`).toString('base64');

  if (action === 'login') {
    if (password === appPassword) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: expectedToken }),
      };
    }
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Incorrect password' }),
    };
  }

  if (action === 'verify') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: token === expectedToken }),
    };
  }

  return {
    statusCode: 400,
    body: JSON.stringify({ error: 'Invalid action' }),
  };
};
