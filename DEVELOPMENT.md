# n8n-nodes-kimi 开发文档

本开发文档面向贡献者与维护者，指导如何在 `n8n-nodes-kimi` 项目中实现、测试和发布基于 Moonshot AI Kimi 的 n8n 社区节点。文档参考了本仓库中的《n8n 插件开发和发布指南》、`n8n-nodes-modelscope-llm` 的实现风格，以及 Kimi 官方 API 说明。

## 目标与范围

- 提供 Kimi 的原生 API 集成节点（编程式/声明式均可）
- 提供 Kimi Chat Model 节点，用于 n8n AI Agent/AI Chain 集成
- 支持核心能力：Chat Completions（非流式）、Vision（图像理解）；模型列表用于下拉搜索（非独立操作）
- 完成凭据管理、错误处理与本地开发发布流程

## 节点架构设计

项目采用「双节点」架构：

### 1) Kimi 节点（常规 API 集成）
- 操作：
  - `chatCompletions`（对话补全，非流式）
  - `visionChat`（图像理解）
- 模型列表：通过 `resourceLocator` 的 `searchListMethod` 动态下拉（远端 `/models`，失败时本地回退）；非独立操作。
- 适合 HTTP API 集成；采用声明式与编程式结合的方式。

### 2) KimiChain 节点（AI 工作流集成）
- 面向 n8n 的 AI Agent/AI Chain，用作 `Chat Model`（输出 `AiLanguageModel`）
- 参数：`model` 等常用配置；在链式使用中由 LangChain 适配层处理输入与输出。
- 对接 Kimi 的 Chat Completion 接口，返回标准文本/JSON 响应，集成 `N8nLlmTracing` 进行日志与观测。

## 环境与兼容性

- Node.js ≥ 18.17.0（推荐使用 LTS 18/20，或与本仓库 CI 对齐）
- npm 或 pnpm
- n8n 本地开发环境（使用 `@n8n/node-cli`）

参考：《/Users/jackwang/n8n-nodes/n8n-plugin-development-guide.md》中的“开发环境准备”和“本地测试方法”。

## 项目结构建议

```
n8n-nodes-kimi/
├── credentials/
│   └── KimiApi.credentials.ts        # Kimi 凭据（API Key）
├── nodes/
│   ├── Kimi/                         # Kimi API 节点（声明式/编程式）
│   │   └── Kimi.node.ts
│   ├── KimiChain/                    # AI Chain Chat Model 节点
│   │   └── KimiChain.node.ts
│   └── N8nLlmTracing.ts              # LLM 运行日志与观测辅助
├── package.json
├── tsconfig.json
├── DEVELOPMENT.md                    # 本开发文档
└── README.md                         # 面向用户的使用文档
```

说明：示例与 GitHub 相关节点已清理，仅保留与 Kimi 相关的实现。

## 凭据设计（KimiApi.credentials.ts）

- 名称：`KimiApi`
- 字段：
  - `apiKey`（string，必填）：Moonshot 平台创建的 API Key（`MOONSHOT_API_KEY`）
  - 可选：`baseUrl`（string，默认 `https://api.moonshot.cn/v1`）

示例（声明式）：

```ts
import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class KimiApi implements ICredentialType {
  name = 'kimiApi';
  displayName = 'Kimi API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.moonshot.cn/v1',
    },
  ];
}
```

## Kimi API 映射

参考：《/Users/jackwang/n8n-nodes/kimi_api.md》。Kimi 提供与 OpenAI SDK 兼容的 HTTP API（基于 `Chat Completions`）。

### Chat Completions（非流式）

- `POST /chat/completions`
- 请求示例：

```json
{
  "model": "kimi-k2-turbo-preview",
  "messages": [
    {"role": "system", "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手..."},
    {"role": "user", "content": "你好，我叫李雷，1+1等于多少？"}
  ],
  "temperature": 0.6,
  "max_tokens": 1024
}
```

- 返回摘要：
  - `choices[0].message.content` 为主要输出
  - `usage` 含 `prompt_tokens`、`completion_tokens`、`total_tokens`

（当前实现不支持流式，统一为非流式请求与返回。）

### Vision（图像理解）

- `model`: `moonshot-v1-vision`（或平台当前提供的视觉模型）
- `message.content` 为数组，包含 `image_url`（base64）与文本描述：

```json
{
  "model": "moonshot-v1-8k-vision-preview",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {"url": "data:image/jpeg;base64,<BASE64>"}
        },
        {"type": "text", "text": "请描述这个图片"}
      ]
    }
  ]
}
```

> 注：节点支持两种输入：图像 URL（由节点内部下载并转 base64），或从上游 `binary` 读取并编码为 Data URL/Raw Base64。

### 模型列表（用于下拉搜索）

- `GET /models`
- 返回 `data[i].id` 列表，用于 `resourceLocator` 的 `searchListMethod`。请求失败时节点回退至本地静态模型列表。

## 声明式风格（HTTP API 集成）要点

— 资源与操作：以 `chatCompletions` 与 `visionChat` 为核心；模型列表作为下拉搜索辅助，不是独立操作。
— 请求配置：
  - `baseURL` 来自凭据 `baseUrl`
  - `url` 为 `/chat/completions`
  - `method` 为 `POST`
  - `body` 根据操作注入参数（文本消息或视觉消息组合）
— 列表搜索：通过 `searchListMethod` 调用 `/models`，失败时使用本地静态列表。
— 错误处理：将 HTTP 错误映射为 n8n 友好消息（见下文）。

> 若需流式响应，建议改用编程式 `execute()` 读取 SSE 并聚合返回。

## 编程式风格要点（`execute()`）

- 使用 `this.getCredentials('kimiApi')` 获取 `apiKey` 与 `baseUrl`
- 通过 `fetch` 或 n8n 提供的 `this.helpers.httpRequest` 发起请求
- 输出：
  - 主输出（`main`）返回一个或多条消息对象（例如 `{ text, usage }`）
  - 错误时抛出带上下文的 `NodeOperationError`

## 节点参数与校验

- 通用参数：
  - `model`（string，下拉枚举，来源于 `GET /models`）
  - `messages`（json，校验角色与内容）
  - `maxTokens`（int，<= 模型上限；注意输入+输出总长度约束）
  - `temperature`（float，0-1，Kimi 建议 0.6）
  - `topP`（float，0-1，与 temperature 仅改其一）
  - `responseFormat`（`text` / `json_object`）
- Vision：
  - `imageUrl` 或 `imageBase64`（二选一）
  - `prompt`（文本）

## 错误处理建议

参考 Kimi 错误码（见 `kimi_api.md`）：

- `401 invalid_authentication_error`：鉴权失败（API Key 无效或未提供）
- `429`：配额不足或速率限制（提示用户稍后重试/升级计划）
- `400 invalid_request_error`：参数错误（提示检查 `model`、`max_tokens`、`messages` 等）
- `403 permission_denied_error`：未开放的 API 或权限不足
- `404 resource_not_found_error`：模型不存在或无权限
- `500 server_error/unexpected_output`：服务端错误（提示稍后重试）

在节点中将错误转化为清晰的 `NodeOperationError`：携带 `statusCode`、`error.type`、`error.message`。

## 本地开发与测试

```bash
# 安装依赖
npm install

# 启动本地开发（热重载）
npm run dev

# 构建
npm run build

# 链接到本地 n8n（可选手动方式）
npm link
cd ~/.n8n/custom/
npm link n8n-nodes-kimi
```

> 使用 `npm run dev` 时，`@n8n/node-cli` 会自动构建并启动 n8n，加载本节点。

质量检查：

```bash
npm run lint
npm run lint:fix
```

## 包配置（package.json）

发布到 npm 前，确保 `package.json` 包含：

```json
{
  "name": "n8n-nodes-kimi",
  "version": "0.1.0",
  "keywords": ["n8n-community-node-package"],
  "n8n": {
    "nodes": [
      "dist/nodes/KimiChain/KimiChain.node.js",
      "dist/nodes/Kimi/Kimi.node.js"
    ],
    "credentials": [
      "dist/credentials/KimiApi.credentials.js"
    ]
  }
}
```

> 社区节点验证要求：不添加运行时依赖、通过自动化检查、遵循 UX 指南、文档完整。详见《n8n 插件开发和发布指南》。

## 发布流程

```bash
# 构建
npm run build

# 发布到 npm
npm publish
```

可选：提交到 n8n Creator Portal 申请验证（出现在 n8n Cloud 节点面板）。

## 示例使用（Chat Completion 非流式）

在 Kimi API 节点中配置：

```json
{
  "resource": "chat",
  "operation": "chatCompletion",
  "model": "kimi-k2-turbo-preview",
  "messages": [
    {"role": "system", "content": "你是 Kimi，由 Moonshot AI 提供的人工智能助手..."},
    {"role": "user", "content": "帮我写一个 JS 函数，实现斐波那契"}
  ],
  "temperature": 0.6,
  "maxTokens": 1024
}
```

返回：`text` 字段为主要回答，附带 `usage` 用于用量统计。

## 资源链接

- Kimi/Moonshot API 文档与服务：`https://api.moonshot.cn`（详见本仓库 `/kimi_api.md`）
- n8n 节点开发指南：`https://docs.n8n.io/integrations/creating-nodes/`
- n8n 社区节点安装指南：`https://docs.n8n.io/integrations/community-nodes/installation/`
- 本仓库参考实现：`/n8n-nodes-modelscope-llm/README.md`
- 本仓库开发指引：`/n8n-plugin-development-guide.md`

## 版本历史

- `v0.1.0` 初始开发文档与结构约定