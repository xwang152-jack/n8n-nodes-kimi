# n8n-nodes-kimi

这是一个面向 [n8n](https://n8n.io/) 的 Kimi（Moonshot AI）节点包，提供 Chat Completions 与 Vision（图像理解），并支持在 n8n 的 AI Chain 中作为 Chat Model 使用。内置模型下拉搜索（含远端查询与本地回退）以及 Vision 的二进制图片输入支持。

## 作者与仓库

- 作者：`xwang152-jack`（邮箱：`xwang152@163.com`）
- 仓库：`https://github.com/xwang152-jack/n8n-nodes-kimi`
- 更新日期：`2025-11-08`

## 功能概览

- KimiChain（Chat Model，用于 AI Chain，输出 `AiLanguageModel`）
- Kimi 传统 API 节点：Chat Completions、Vision Chat
- 模型下拉搜索与手动指定（`resourceLocator`）
- Vision 的二进制图片输入（从上游 `binary` 字段读取）
- 凭据与错误处理：完整接入 `MOONSHOT_API_KEY` 与错误码映射

## 安装

### 社区节点安装

请参考 n8n 社区节点安装指南：
https://docs.n8n.io/integrations/community-nodes/installation/

### 本地开发

```bash
npm install
npm run dev
```

`npm run dev` 将通过 `@n8n/node-cli` 启动 n8n 并热重载本节点，通常在 `http://localhost:5678` 打开。

## 操作（Operations）

- `chatCompletions`：对话补全（非流式）
- `visionChat`：图像理解/视觉问答

## 凭据（Credentials）

- 在 n8n 中创建 `Kimi API` 凭据：
  - `apiKey`：Moonshot 平台创建的 API Key（`MOONSHOT_API_KEY`）
  - `baseUrl`：可选，默认 `https://api.moonshot.cn/v1`

获取 API Key：
- 访问 `https://api.moonshot.cn` 并在平台上创建 API Key（详见本仓库 `kimi_api.md` 中的示例）

## 兼容性

- Node.js ≥ 18.17.0
- n8n（自托管或 CLI 开发环境）

## 使用（Usage）

### Chat Completions 使用（UI）

- 添加 `Kimi` 节点 → `Operation = Chat Completions`
- 选择 `Model`（下拉搜索或手动输入模型 ID，如 `moonshot-v1-8k`）
- `Compose Mode`：
  - `Simple`：填写 `System Instruction`（可空）与 `User Message`
  - `Raw JSON`：直接粘贴 `messages` 数组（兼容 OpenAI/Kimi 格式）
- 运行节点，输出 `json` 中包含模型回复与原始响应。

### Vision（二进制输入）说明

当 `Image Source = Binary` 时：
- 指定 `Binary Property`（如 `data`），从上游节点的 `binary[data]` 读取图像内容
- 选择 `Encoding Mode`：`Data URL`（生成 `data:<mime>;base64,<content>`）或 `Raw Base64`
- 使用 `Raw Base64` 时需设置 `MIME Type`（如 `jpeg`/`png`），节点会传递 `image_base64` 与 `mime_type`

### Vision 图像理解（UI）

- 添加 `Kimi` 节点 → `Operation = Vision Chat`
- 文本提示：填写 `Vision Prompt`
- 图片来源：
  - `URL`：填写 `Image URL`
  - `Binary`：指定 `Binary Property`、选择 `Encoding Mode`（`Data URL` 或 `Raw Base64`），必要时设置 `MIME Type`
- 运行节点，输出包含视觉模型的回复与原始响应。

模型选择说明：
- `Model` 字段为 `resourceLocator`，支持远端查询 `/models`，在失败时回退到本地静态列表；亦可手动输入模型 ID。

## 错误处理

节点将 Kimi 的错误码（详见 `kimi_api.md`）转换为清晰的提示：
- `401 invalid_authentication_error`：鉴权失败（API Key 无效/缺失）
- `429`：配额不足 / 并发或速率限制达上限
- `400 invalid_request_error`：参数错误（检查 `model`、`max_tokens`、`messages`）
- `403 permission_denied_error`：API 未开放或权限不足
- `404 resource_not_found_error`：模型不存在或无权限
- `500 server_error/unexpected_output`：服务内部错误

## 资源（Resources）

- n8n 社区节点文档：https://docs.n8n.io/integrations/#community-nodes
- Moonshot/Kimi API 说明：见本仓库 `/kimi_api.md` 与 `https://api.moonshot.cn/v1`
- 开发指南：本仓库 `/n8n-plugin-development-guide.md`
- 参考实现：`/n8n-nodes-modelscope-llm/README.md`

## 版本历史

- `v0.1.0` 初始版本（文档更新：2025-11-08）
  - 统一实际能力：保留 `Chat Completions` 与 `Vision Chat`
  - 补充 Vision 的二进制输入说明
  - 移除未实现的流式操作与独立 `listModels` 操作说明

## 开发者指引

面向贡献者的详细开发信息请参阅本仓库的 `DEVELOPMENT.md`。
