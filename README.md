# Poke Wordle

宝可梦属性猜谜游戏，支持九种语言。游戏进度和设置保存在浏览器中。

## 开发

安装 [mise](https://mise.jdx.dev/getting-started.html)，在仓库根目录运行：

```sh
mise trust
mise install
mise run install
mise run dev
```

打开 http://localhost:3000。工具版本由 `mise.toml` 固定，JavaScript 依赖由 `package-lock.json` 锁定。可选环境变量见 `.env.example`，本地配置放在 `.env.local`。

| 命令 | 用途 |
| --- | --- |
| `mise run check` | Go 静态/竞态检查、数据流程回归、发布校验、ESLint、TypeScript、Jest 和生产构建 |
| `mise run test` | Jest 单元测试 |
| `mise run build` / `mise run start` | 构建 / 启动生产服务器 |
| `mise run e2e` | 游戏桌面和手机浏览器回归 |
| `mise run data:console` | 本地数据浏览与审核，http://127.0.0.1:3318 |
| `mise run data:console:test` | 数据控制台浏览器回归 |

首次运行浏览器测试前执行 `mise exec -- npm exec -- playwright install chromium`。游戏 E2E 默认启动生产服务器，需先构建；`E2E_DEV=1 mise run e2e` 使用开发服务器。测试使用本地图像替身并屏蔽外部分析脚本。

## 代码与数据

- Next.js App Router、React、Tailwind CSS。`src/app/[locale]` 和 `src/proxy.ts` 统一语言路由；英文不带路径前缀。
- `src/hooks/useGameState.ts` 管理游戏与持久化，`src/app/api/checkGuess/route.ts` 比较猜测。
- `src/data/` 是游戏数据发布目录；`tools/poke-json/` 负责抓取、修正和校对。使用[数据控制台](tools/poke-json/README.md)浏览全量数据、审核候选；操作见[更新流程](tools/poke-json/UPDATE_WORKFLOW.md)。
- 知识文章在构建时编译为 MDX。新增文章需更新 `src/data/knowledge_data.json`、MDX 文件及 `src/components/MdxContent.tsx` 的导入映射；`translations` 连接对应语言的文章。
- Google Analytics 在用户接受后加载；Vercel Analytics 和 Speed Insights 位于根布局。

## 检查与部署

GitHub Actions 在 `dev`、`main` 推送及 Pull Request 时执行 `mise run check`。数据检查使用本地文件与测试夹具，上游更新由人工触发。

当前工具链保留 TypeScript 6 和 ESLint 9：TypeScript 7 的编译器 API 尚不满足 typescript-eslint，Next.js 的 React 插件仍使用 ESLint 10 已移除的 API。升级前运行完整检查，不用 `--force` 或 `--legacy-peer-deps` 绕过兼容约束。参考 [TypeScript 工具兼容说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)。

部署执行 `npm ci`、`npm run build`；自托管通过 `npm start` 启动。Node.js 使用 `package.json` 声明的 `24.x`，与 [Vercel 运行时](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)对齐。修改公开环境变量后需重新构建。
