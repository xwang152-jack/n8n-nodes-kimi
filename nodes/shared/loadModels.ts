import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';

type KimiModel = { id: string; name?: string };

/**
 * Fallback model list — used when the remote /models endpoint is unreachable.
 * Keep this list updated whenever Moonshot publishes new models.
 */
const FALLBACK_MODELS: KimiModel[] = [
	// Kimi K2.5 (2026-01)
	{ id: 'kimi-k2.5', name: 'kimi-k2.5 (K2.5 Instant)' },
	{ id: 'kimi-k2.5-thinking', name: 'kimi-k2.5-thinking (K2.5 Thinking)' },
	// Kimi K2 series
	{ id: 'kimi-k2-0711', name: 'kimi-k2-0711 (K2)' },
	{ id: 'kimi-k2-turbo-preview', name: 'kimi-k2-turbo-preview' },
	{ id: 'kimi-k2-thinking', name: 'kimi-k2-thinking (K2 Thinking)' },
	{ id: 'kimi-k2-thinking-turbo', name: 'kimi-k2-thinking-turbo' },
	// Moonshot v1 series
	{ id: 'moonshot-v1-8k', name: 'moonshot-v1-8k' },
	{ id: 'moonshot-v1-32k', name: 'moonshot-v1-32k' },
	{ id: 'moonshot-v1-128k', name: 'moonshot-v1-128k' },
	{ id: 'moonshot-v1-vision', name: 'moonshot-v1-vision' },
	{ id: 'moonshot-v1-vision-32k', name: 'moonshot-v1-vision-32k' },
	{ id: 'moonshot-v1', name: 'moonshot-v1 (alias)' },
];

const DEFAULT_BASE_URL = 'https://api.moonshot.cn/v1';

function filterAndSort(models: KimiModel[], filter?: string): KimiModel[] {
	const lowerFilter = filter?.toLowerCase();
	const filtered = lowerFilter
		? models.filter(
			(m) =>
				m.id.toLowerCase().includes(lowerFilter) ||
				(m.name ?? '').toLowerCase().includes(lowerFilter),
		)
		: models;

	return filtered.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));
}

function toSearchResults(models: KimiModel[]): INodeListSearchResult {
	return {
		results: models.map((m) => ({
			name: m.name ?? m.id,
			value: m.id,
		})),
	};
}

export async function searchModels(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	let baseURL = DEFAULT_BASE_URL;

	try {
		const credentials = await this.getCredentials('kimiApi');
		if (credentials.baseUrl && typeof credentials.baseUrl === 'string') {
			baseURL = credentials.baseUrl;
		}
	} catch {
		// Credentials may not be available yet during model listing; ignore.
	}

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(this, 'kimiApi', {
			baseURL,
			url: '/models',
			method: 'GET',
			json: true,
		});

		const data = Array.isArray(response?.data) ? response.data : [];
		const models: KimiModel[] = data.map((m: Record<string, unknown>) => ({
			id: m.id as string,
			name: m.id as string,
		}));

		return toSearchResults(filterAndSort(models, filter));
	} catch {
		return toSearchResults(filterAndSort(FALLBACK_MODELS, filter));
	}
}
