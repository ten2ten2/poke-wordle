# Poke Wordle

基于宝可梦属性、特性、种族值和进化信息的猜谜游戏，支持九种语言。输入名称或点击随机猜测开始；游戏进度和设置保存在浏览器中。

## 开发

先安装 [mise](https://mise.jdx.dev/getting-started.html)，然后在仓库根目录运行：

```sh
mise trust
mise install
mise run install
mise run dev
```

打开 http://localhost:3000。`mise.toml` 固定 Node.js 和 Go 版本；JavaScript 依赖由 `package-lock.json` 锁定。可选环境变量见 `.env.example`，复制到 `.env.local` 后配置。

| 命令                                | 用途                                   |
| ----------------------------------- | -------------------------------------- |
| `mise run dev`                      | Turbopack 开发服务器                   |
| `mise run check`                    | ESLint、TypeScript、单元测试、生产构建 |
| `mise run test`                     | Jest 单元测试                          |
| `mise run build` / `mise run start` | 构建 / 启动生产服务器                  |
| `mise run e2e`                      | Playwright 桌面和移动端回归            |
| `mise run data:check`               | Go 数据工具检查和测试                  |
| `mise run data:run`                 | 交互式生成宝可梦数据（需要联网）       |

首次运行浏览器测试前：

```sh
mise exec -- npm exec -- playwright install chromium
mise run build
mise run e2e
```

E2E 默认自动启动生产服务器；`E2E_DEV=1 mise run e2e` 改用开发模式，便于验证 MDX 和热更新。测试使用本地图像替身并屏蔽托管平台分析脚本，不验证第三方服务可用性。

## 实现

- Next.js 16 App Router、React 19、Tailwind CSS 4。
- `src/app/[locale]` 统一处理所有语言；`src/proxy.ts` 使用 next-intl 路由。英文不带前缀，例如 `/knowledge`；其他语言使用 `/ja`、`/zh-hans` 等前缀。
- `src/hooks/useGameState.ts` 管理游戏和持久化；`src/app/api/checkGuess/route.ts` 比较猜测。
- `src/data` 保存离线游戏数据。Go 工具输出到 `poke-json/output`，审核后再复制到 `src/data`，不会自动覆盖前端数据。
- 知识文章使用构建时编译的 MDX。新增文章时更新 `src/data/knowledge_data.json`、对应 MDX 文件和 `src/components/MdxContent.tsx` 的导入映射。跨语言链接使用文章的 `translations`。
- Google Analytics 仅在接受后加载；Vercel Analytics 和 Speed Insights 保留在根布局。

## 依赖维护

本次升级按 npm registry 的稳定版本更新；保留两个经过实测的兼容约束：

- TypeScript 6.0.3：TypeScript 7.0 尚无编译器 API，当前 typescript-eslint 无法使用。
- ESLint 9.39.5：当前 Next.js 配套的 React 插件在 ESLint 10 下调用已移除 API。

升级这些约束前运行完整检查，不使用 `--force` 或 `--legacy-peer-deps` 跳过兼容性检查。参考 [Next.js 16 迁移指南](https://nextjs.org/docs/app/guides/upgrading/version-16)、[Tailwind CSS 4 迁移指南](https://tailwindcss.com/docs/upgrade-guide)、[next-intl 路由](https://next-intl.dev/docs/routing/setup) 和 [TypeScript 7 工具兼容说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)。

## 部署

构建命令为 `npm run build`，启动命令为 `npm start`，安装时运行 `npm ci`。本地通过 mise 固定 Node.js 24.21.0，`package.json` 的 `engines.node` 固定为 `24.x`，与 [Vercel 支持的 Node.js 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) 对齐。Vercel 自动维护 24.x 的补丁版本；`@types/node` 同步使用 24 系列。修改公开环境变量后需要重新构建。
