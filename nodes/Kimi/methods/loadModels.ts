import type { ILoadOptionsFunctions } from 'n8n-workflow';

export async function searchModels(this: ILoadOptionsFunctions) {
  const baseURL = 'https://api.moonshot.cn/v1';
  try {
    const response = await this.helpers.requestWithAuthentication.call(this, 'kimiApi', {
      baseURL,
      url: '/models',
      method: 'GET',
      json: true,
    });

    const models = Array.isArray(response?.data) ? response.data : response?.data?.data;
    if (!Array.isArray(models)) return [];

    return models.map((m: any) => ({ name: `${m.id}`, value: m.id }));
  } catch (e) {
    return [
      { name: 'moonshot-v1-8k', value: 'moonshot-v1-8k' },
      { name: 'moonshot-v1-32k', value: 'moonshot-v1-32k' },
      { name: 'moonshot-v1-128k', value: 'moonshot-v1-128k' },
    ];
  }
}