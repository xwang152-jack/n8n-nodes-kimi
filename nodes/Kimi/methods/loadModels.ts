import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

type KimiModel = { id: string; name?: string };

export async function searchModels(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const baseURL = 'https://api.moonshot.cn/v1';

  const fallbackModels: KimiModel[] = [
    { id: 'moonshot-v1-8k', name: 'moonshot-v1-8k' },
    { id: 'moonshot-v1-32k', name: 'moonshot-v1-32k' },
    { id: 'moonshot-v1-128k', name: 'moonshot-v1-128k' },
    { id: 'moonshot-v1-vision', name: 'moonshot-v1-vision' },
    { id: 'moonshot-v1', name: 'moonshot-v1 (alias)' },
  ];

  try {
    const response = await this.helpers.requestWithAuthentication.call(this, 'kimiApi', {
      baseURL,
      url: '/models',
      method: 'GET',
      json: true,
    });

    const data = Array.isArray((response as any)?.data) ? (response as any).data : [];
    const models: KimiModel[] = data.map((m: any) => ({ id: m.id, name: m.id }));

    const filtered = models.filter((model) => {
      if (!filter) return true;
      return (
        model.id.toLowerCase().includes(filter.toLowerCase()) ||
        (model.name ?? '').toLowerCase().includes(filter.toLowerCase())
      );
    });

    filtered.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

    return {
      results: filtered.map((model) => ({
        name: model.name ?? model.id,
        value: model.id,
      })),
    };
  } catch (error) {
    const filtered = fallbackModels.filter((model) => {
      if (!filter) return true;
      return (
        model.id.toLowerCase().includes(filter.toLowerCase()) ||
        (model.name ?? '').toLowerCase().includes(filter.toLowerCase())
      );
    });

    filtered.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

    return {
      results: filtered.map((model) => ({ name: model.name ?? model.id, value: model.id })),
    };
  }
}