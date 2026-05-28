interface NetlifyEvent {
  httpMethod: string;
  queryStringParameters?: Record<string, string> | null;
}

interface NetlifyResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

interface RawList {
  id: string;
  name: string;
  task_count?: number;
}

export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  const apiKey = process.env.CLICKUP_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'CLICKUP_API_KEY environment variable is not set' }),
    };
  }

  const { spaceId } = event.queryStringParameters || {};
  if (!spaceId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'spaceId is required' }) };
  }

  const headers = { Authorization: apiKey };

  // Fetch folders and folderless lists in parallel
  const [foldersRes, folderlessRes] = await Promise.all([
    fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder?archived=false`, { headers }),
    fetch(`https://api.clickup.com/api/v2/space/${spaceId}/list?archived=false`, { headers }),
  ]);

  const [foldersData, folderlessData] = await Promise.all([
    foldersRes.json(),
    folderlessRes.json(),
  ]);

  // Fetch lists from each folder in parallel
  const folders: Array<{ id: string; name: string }> = foldersData.folders || [];
  const folderListResults = await Promise.all(
    folders.map(async folder => {
      const res = await fetch(
        `https://api.clickup.com/api/v2/folder/${folder.id}/list?archived=false`,
        { headers }
      );
      const data = await res.json();
      return (data.lists || []).map((l: RawList) => ({
        id: l.id,
        name: l.name,
        taskCount: l.task_count ?? null,
        folderName: folder.name,
      }));
    })
  );

  // Folderless lists have no folder label
  const folderlessLists = (folderlessData.lists || []).map((l: RawList) => ({
    id: l.id,
    name: l.name,
    taskCount: l.task_count ?? null,
    folderName: null as string | null,
  }));

  const allLists = [...folderlessLists, ...folderListResults.flat()];

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lists: allLists }),
  };
};
