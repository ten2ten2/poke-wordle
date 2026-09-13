# 项目约定

- 在仓库根目录通过 `mise run` 执行命令，工具版本和依赖分别以 `mise.toml`、`package-lock.json` 为准。安装与常用命令见 [README.md](README.md)。
- 游戏状态和猜测比较在客户端执行，复用 `src/lib/pokemon.ts` 中的数据与比较逻辑；`/api/checkGuess` 仅供旧客户端兼容。
- 游戏数据通过[审核流程](tools/UPDATE_WORKFLOW.md)更新，保持发布 JSON、数据版本与 ID 注册表一致。知识文章遵循[编辑约定](tools/README.md#知识文章)。
- 按改动范围验证：前端使用 `mise run lint`、`mise run typecheck` 和相关 Jest 测试；数据工具使用 `mise run data:check`；知识文章使用 `mise run knowledge:check`。完整检查为 `mise run check`，浏览器回归 `mise run e2e` 默认需先构建。
- 文档以当前代码、配置和命令为准；修正相关说明，避免重复维护版本号、费用和操作流水。历史数据报告保留数据变化与来源依据。纯文档修改核对内容、链接和 `git diff --check`。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
