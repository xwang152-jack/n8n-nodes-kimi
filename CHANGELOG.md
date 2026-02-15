# Changelog

所有重要变更都会记录在此文件中。

## v0.1.7 — 2026-02-15

### 新增
- 支持 Kimi K2.5 系列模型（`kimi-k2.5`、`kimi-k2.5-thinking`），自动检测 Thinking 模型并应用推荐默认值。
- 凭据新增 `Base URL` 字段，支持自定义 API 端点（代理、专属部署等）。
- Fallback 模型列表新增 `kimi-k2-turbo-preview`、`kimi-k2-thinking-turbo` 等模型。

### 改进
- 代码结构优化：将重复的 `loadModels.ts` 提取为 `nodes/shared/loadModels.ts` 共享模块。
- 替换已弃用的 `requestWithAuthentication` 为 `httpRequestWithAuthentication`。
- 清理 `N8nLlmTracing.ts` 中未使用的导入和常量，`estimateTokensFromStringList` 改为同步函数。

### 维护
- 完善 `.gitignore`（添加 `.DS_Store`、`*.tsbuildinfo`）。
- 构建验证通过。

## v0.1.4 — 2025-11-08

### 新增
- `KimiChain` 节点：新增 `Streaming Output` 选项；当模型为 `kimi-k2-thinking` 时默认启用 `streaming = true`，以便流式输出包含 `reasoning_content` 与 `content`。

### 改进
- `Kimi` 节点（REST）：新增 `Tools JSON` 与 `Tool Choice` 选项，支持 Moonshot/OpenAI 兼容的函数工具定义与调用；自动应用 K2 推荐默认值（未显式设置时）：`max_tokens = 16000`、`temperature = 1.0`、`response_format = json_object`。
- 输出：在 `Kimi` 节点返回中增加 `reasoning` 字段，透出 `reasoning_content`，便于观察多步推理与工具调用链路。

### 维护
- `KimiChain` 节点：在未显式设置时应用 K2 推荐默认值（`maxTokens = 16000`、`temperature = 1.0`、`responseFormat = json_object`）。

## v0.1.3 — 2025-11-08

### 改进
- 图标更新：将节点图标统一为 PNG，并确保 `dist/nodes/Kimi/` 与 `dist/nodes/KimiChain/` 目录包含 `kimi.png`，修复在 n8n 中的显示一致性。

### 维护
- 构建并验证通过，发布至 npm。


## v0.1.2 — 2025-11-08

### 维护
- 常规版本号更新与重新发布，无功能变化。
- 保持 `v0.1.1` 的图标与模型搜索改进。

## v0.1.1 — 2025-11-08

### 修复
- 修复图标显示：将 `Kimi` 节点的 `icon` 简化为 `file:kimi.svg`，并确保 `icons/` 目录包含在发布包内（`package.json#files`）。
- 解决安装到 n8n 后 SVG 不显示的问题（路径与打包一致）。

### 改进
- 模型下拉搜索：`Kimi` 节点改用 `listSearch.searchModels`，支持本地过滤与排序，交互更顺滑。
- HTTP 请求：`loadModels` 改用 `httpRequestWithAuthentication`，替代过时的请求方式。
- 回退模型列表更丰富，并统一模型别名（如 `moonshot-v1`）。

### 维护
- 构建验证通过：`npm run build` 成功，`dist/icons/` 包含 SVG 图标。

## v0.1.0 — 2025-11-08

### 新增
- 初始发布：提供两个节点：`Kimi`（传统 REST API）与 `KimiChain`（AI Chain Chat Model）。
- 支持操作：`chatCompletions`（对话补全，非流式）与 `visionChat`（视觉多模态对话）。
- 模型选择：支持远端 `/models` 下拉搜索，失败时回退至本地静态列表。
- 文档：完善 `README.md`，补充 Vision 二进制输入与 UI 使用说明。

### 变更
- 同步文档至当前实现：统一操作命名为 `chatCompletions` / `visionChat`，移除未实现的流式说明与独立 `listModels` 操作描述。

### 移除
- 删除示例与 GitHub 节点及其凭据：`nodes/Example/`、`nodes/GithubIssues/`、`credentials/GithubApi.credentials.ts`。
- 删除未使用图标：`icons/github.svg`、`icons/github.dark.svg`。
- 删除模板文档：`README_TEMPLATE.md`。
- 删除 CI 配置目录：`.github/workflows/`。

### 维护
- 构建验证：`npm run build` 编译成功（TypeScript 构建与静态文件拷贝通过）。