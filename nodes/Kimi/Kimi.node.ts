import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

export class Kimi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Kimi',
    name: 'kimi',
    icon: 'file:kimi.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Use Kimi (Moonshot) traditional REST API',
    defaults: {
      name: 'Kimi',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'kimiApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL: 'https://api.moonshot.cn/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    },
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Chat Completions', value: 'chatCompletions', description: '对话补全' },
          { name: 'Vision Chat', value: 'visionChat', description: '视觉多模态对话' },
        ],
        default: 'chatCompletions',
      },

      // Model selector
      {
        displayName: 'Model',
        name: 'model',
        type: 'resourceLocator',
        default: { mode: 'list', value: 'moonshot-v1-8k' },
        description: '选择用于推理的模型',
        modes: [
          {
            displayName: 'Models',
            name: 'list',
            type: 'list',
            placeholder: 'Select a Kimi model...',
            typeOptions: {
              searchListMethod: 'searchModels',
              searchable: true,
            },
          },
          {
            displayName: 'By ID',
            name: 'id',
            type: 'string',
            placeholder: 'moonshot-v1-8k',
          },
        ],
      },

      // Chat fields
      {
        displayName: 'Compose Mode',
        name: 'composeMode',
        type: 'options',
        options: [
          { name: 'Simple', value: 'simple' },
          { name: 'Raw JSON', value: 'rawJson' },
        ],
        default: 'simple',
        displayOptions: {
          show: {
            operation: ['chatCompletions'],
          },
        },
      },
      {
        displayName: 'System Instruction',
        name: 'system',
        type: 'string',
        default: '',
        typeOptions: { rows: 2 },
        displayOptions: {
          show: {
            operation: ['chatCompletions'],
            composeMode: ['simple'],
          },
        },
      },
      {
        displayName: 'User Message',
        name: 'userMessage',
        type: 'string',
        default: '',
        required: true,
        typeOptions: { rows: 4 },
        displayOptions: {
          show: {
            operation: ['chatCompletions'],
            composeMode: ['simple'],
          },
        },
      },
      {
        displayName: 'Messages JSON',
        name: 'messagesJson',
        type: 'string',
        default: '',
        description: 'Raw OpenAI-format messages array JSON',
        typeOptions: { rows: 6 },
        displayOptions: {
          show: {
            operation: ['chatCompletions'],
            composeMode: ['rawJson'],
          },
        },
      },

      // Vision fields
      {
        displayName: 'Vision Prompt',
        name: 'visionPrompt',
        type: 'string',
        default: '',
        required: true,
        typeOptions: { rows: 4 },
        displayOptions: {
          show: {
            operation: ['visionChat'],
          },
        },
      },
      {
        displayName: 'Image Source',
        name: 'imageSource',
        type: 'options',
        options: [
          { name: 'URL', value: 'url' },
          { name: 'Binary (from input)', value: 'binary' },
        ],
        default: 'url',
        displayOptions: {
          show: {
            operation: ['visionChat'],
          },
        },
      },
      {
        displayName: 'Image URL',
        name: 'imageUrl',
        type: 'string',
        default: '',
        required: true,
        placeholder: 'https://...',
        displayOptions: {
          show: {
            operation: ['visionChat'],
            imageSource: ['url'],
          },
        },
      },
      {
        displayName: 'Binary Property',
        name: 'binaryProperty',
        type: 'string',
        default: 'data',
        placeholder: 'e.g. image, data, file',
        description: 'Name of the binary property that contains the image',
        displayOptions: {
          show: {
            operation: ['visionChat'],
            imageSource: ['binary'],
          },
        },
      },
      {
        displayName: 'Encoding Mode',
        name: 'encodingMode',
        type: 'options',
        options: [
          { name: 'Data URL (image_url)', value: 'data_url' },
          { name: 'Raw Base64 (image_base64)', value: 'image_base64' },
        ],
        default: 'data_url',
        description: 'How to include binary image in the request payload',
        displayOptions: {
          show: {
            operation: ['visionChat'],
            imageSource: ['binary'],
          },
        },
      },
      {
        displayName: 'MIME Type',
        name: 'mimeType',
        type: 'string',
        default: 'image/png',
        placeholder: 'image/png, image/jpeg, etc.',
        description: 'Used for data URL when binary source is selected',
        displayOptions: {
          show: {
            operation: ['visionChat'],
            imageSource: ['binary'],
            encodingMode: ['data_url'],
          },
        },
      },
      {
        displayName: 'Image Detail',
        name: 'imageDetail',
        type: 'options',
        options: [
          { name: 'Auto', value: 'auto' },
          { name: 'Low', value: 'low' },
          { name: 'High', value: 'high' },
        ],
        default: 'auto',
        displayOptions: {
          show: {
            operation: ['visionChat'],
          },
        },
      },

      // Options
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add option',
        default: {},
        options: [
          {
            displayName: 'Base URL',
            name: 'baseURL',
            type: 'string',
            default: 'https://api.moonshot.cn/v1',
          },
          {
            displayName: 'Temperature',
            name: 'temperature',
            type: 'number',
            typeOptions: { minValue: 0, maxValue: 2 },
            default: 1,
          },
          {
            displayName: 'Top P',
            name: 'top_p',
            type: 'number',
            typeOptions: { minValue: 0, maxValue: 1 },
            default: 1,
          },
          {
            displayName: 'Max Tokens',
            name: 'max_tokens',
            type: 'number',
            default: 0,
          },
          {
            displayName: 'Presence Penalty',
            name: 'presence_penalty',
            type: 'number',
            typeOptions: { minValue: -2, maxValue: 2 },
            default: 0,
          },
          {
            displayName: 'Frequency Penalty',
            name: 'frequency_penalty',
            type: 'number',
            typeOptions: { minValue: -2, maxValue: 2 },
            default: 0,
          },
          {
            displayName: 'Response Format',
            name: 'response_format',
            type: 'options',
            options: [
              { name: 'Text', value: 'text' },
              { name: 'JSON Object', value: 'json_object' },
            ],
            default: 'text',
          },
          {
            displayName: 'Tool Choice',
            name: 'tool_choice',
            type: 'options',
            options: [
              { name: 'Auto', value: 'auto' },
              { name: 'Required', value: 'required' },
              { name: 'None', value: 'none' },
            ],
            default: 'auto',
            description: 'Control how tools are invoked when tools are provided',
          },
          {
            displayName: 'Tools JSON',
            name: 'tools_json',
            type: 'string',
            typeOptions: { rows: 6 },
            default: '',
            description:
              'JSON array of tool definitions (OpenAI/Kimi format), e.g. [{"type":"function","function":{"name":"web_search","parameters":{...}}}]',
          },
        ],
      },
    ],
  };

  methods = {
    listSearch: {
      async searchModels(this: ILoadOptionsFunctions, filter?: string) {
        const { searchModels } = await import('./methods/loadModels');
        return searchModels.call(this, filter);
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        // Resolve model from resource locator
        const modelLocator = this.getNodeParameter('model', i) as any;
        const model = (modelLocator?.value ?? modelLocator) as string;

        const options = this.getNodeParameter('options', i, {}) as Record<string, any>;
        const baseURL = (options.baseURL as string) || 'https://api.moonshot.cn/v1';

        let messages: any[] = [];
        if (operation === 'chatCompletions') {
          const composeMode = this.getNodeParameter('composeMode', i) as string;
          if (composeMode === 'rawJson') {
            const messagesJson = this.getNodeParameter('messagesJson', i) as string;
            try {
              const parsed = JSON.parse(messagesJson || '[]');
              if (!Array.isArray(parsed)) {
                throw new Error('messagesJson must be an array');
              }
              messages = parsed;
            } catch (err) {
              throw new NodeOperationError(this.getNode(), `Invalid messages JSON: ${(err as Error).message}`, { itemIndex: i });
            }
          } else {
            const system = this.getNodeParameter('system', i) as string;
            const userMessage = this.getNodeParameter('userMessage', i) as string;
            if (system) messages.push({ role: 'system', content: system });
            messages.push({ role: 'user', content: userMessage });
          }
        } else if (operation === 'visionChat') {
          const visionPrompt = this.getNodeParameter('visionPrompt', i) as string;
          const imageSource = this.getNodeParameter('imageSource', i) as string;
          const imageDetail = this.getNodeParameter('imageDetail', i) as string;

          let imageContent: Record<string, any> = { type: 'input_image', detail: imageDetail };

          if (imageSource === 'url') {
            const imageUrl = this.getNodeParameter('imageUrl', i) as string;
            imageContent.image_url = imageUrl;
          } else if (imageSource === 'binary') {
            const binaryProperty = this.getNodeParameter('binaryProperty', i) as string;
            const encodingMode = this.getNodeParameter('encodingMode', i) as string;
            const item = items[i] as unknown as { binary?: Record<string, any> };
            const binaryData = item?.binary?.[binaryProperty];
            if (!binaryData || typeof binaryData.data !== 'string' || binaryData.data.length === 0) {
              throw new NodeOperationError(this.getNode(), `Binary property "${binaryProperty}" not found or empty`, { itemIndex: i });
            }

            const base64Data = binaryData.data as string;
            if (encodingMode === 'image_base64') {
              imageContent.image_base64 = base64Data;
            } else {
              const mimeTypeParam = this.getNodeParameter('mimeType', i) as string;
              const mimeType = binaryData.mimeType || mimeTypeParam || 'image/png';
              const dataUrl = `data:${mimeType};base64,${base64Data}`;
              imageContent.image_url = dataUrl;
            }
          } else {
            throw new NodeOperationError(this.getNode(), `Unknown image source: ${imageSource}`, { itemIndex: i });
          }

          messages = [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: visionPrompt },
                imageContent,
              ],
            },
          ];
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, { itemIndex: i });
        }

        const payload: Record<string, any> = {
          model,
          messages,
        };

        // K2 thinking model detection
        const isK2Thinking = /k2.*thinking/i.test(model) || /kimi-k2-thinking/i.test(model);

        // Options mapping
        if (typeof options.temperature === 'number') payload.temperature = options.temperature;
        if (typeof options.top_p === 'number') payload.top_p = options.top_p;
        if (typeof options.max_tokens === 'number' && options.max_tokens > 0) payload.max_tokens = options.max_tokens;
        if (typeof options.presence_penalty === 'number') payload.presence_penalty = options.presence_penalty;
        if (typeof options.frequency_penalty === 'number') payload.frequency_penalty = options.frequency_penalty;
        if (typeof options.response_format === 'string' && options.response_format !== 'text') {
          payload.response_format = { type: options.response_format };
        } else if (isK2Thinking) {
          // For best tool-calling performance and stable structured outputs
          payload.response_format = { type: 'json_object' };
        }

        // Tools support
        if (typeof options.tools_json === 'string' && options.tools_json.trim()) {
          try {
            const tools = JSON.parse(options.tools_json);
            if (!Array.isArray(tools)) {
              throw new Error('tools_json must be an array');
            }
            payload.tools = tools;
          } catch (err) {
            throw new NodeOperationError(
              this.getNode(),
              `Invalid tools JSON: ${(err as Error).message}`,
              { itemIndex: i },
            );
          }
        }
        if (typeof options.tool_choice === 'string' && options.tool_choice !== 'none') {
          payload.tool_choice = options.tool_choice;
        }

        // K2 thinking recommended defaults
        if (isK2Thinking) {
          if (!(typeof options.max_tokens === 'number' && options.max_tokens > 0)) {
            payload.max_tokens = 16000;
          }
          if (typeof options.temperature !== 'number') {
            payload.temperature = 1.0;
          }
        }

        const response = await this.helpers.requestWithAuthentication.call(this, 'kimiApi', {
          baseURL,
          url: '/chat/completions',
          method: 'POST',
          body: payload,
          json: true,
        });

        const content = response?.choices?.[0]?.message?.content ?? null;
        const reasoning = response?.choices?.[0]?.message?.reasoning_content ?? null;
        const executionData = this.helpers.constructExecutionMetaData(
          this.helpers.returnJsonArray({
            model,
            usage: response?.usage,
            id: response?.id,
            created: response?.created,
            content,
            reasoning,
            raw: response,
          }),
          { itemData: { item: i } },
        );

        returnData.push(...executionData);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}