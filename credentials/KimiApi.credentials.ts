import type {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
} from 'n8n-workflow';

export class KimiApi implements ICredentialType {
    name = 'kimiApi';

    displayName = 'Kimi API';

    documentationUrl = 'https://platform.moonshot.cn/docs/api';

    properties: INodeProperties[] = [
        {
            displayName: 'API Key',
            name: 'apiKey',
            type: 'string',
            typeOptions: { password: true },
            required: true,
            default: '',
            description:
                'Kimi (Moonshot) API Key, 形如 sk-***。获取地址：https://platform.moonshot.cn/',
        },
        {
            displayName: 'Base URL',
            name: 'baseUrl',
            type: 'string',
            default: 'https://api.moonshot.cn/v1',
            description: 'API 端点地址，如使用代理或专属部署可修改此项',
        },
    ];

    authenticate: IAuthenticateGeneric = {
        type: 'generic',
        properties: {
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
                'Content-Type': 'application/json',
            },
        },
    };

    test: ICredentialTestRequest = {
        request: {
            baseURL: '={{$credentials.baseUrl || "https://api.moonshot.cn/v1"}}',
            url: '/models',
            method: 'GET',
            headers: {
                Authorization: '=Bearer {{$credentials.apiKey}}',
                'Content-Type': 'application/json',
            },
        },
        rules: [
            {
                type: 'responseSuccessBody',
                properties: {
                    message: 'Kimi API 连接测试成功',
                    key: 'data',
                    value: 'array',
                },
            },
        ],
    };
}