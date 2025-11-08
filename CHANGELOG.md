# Changelog

所有重要变更都会记录在此文件中。

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