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

开发环境由浏览器直接加载原图，兼容代理的 Fake-IP DNS；生产环境保留 Next.js 图片优化和私有 IP 检查。

| 命令 | 用途 |
| --- | --- |
| `mise run check` | 数据与知识库校验、ESLint、TypeScript、Jest、生产构建和 SEO 校验 |
| `mise run test` | Jest 单元测试 |
| `mise run build` / `mise run start` | 构建 / 启动生产服务器 |
| `mise run e2e` | 游戏桌面和手机浏览器回归 |
| `mise run data:console` | 本地数据审核与知识文章管理，http://127.0.0.1:3318 |
| `mise run data:console:test` | 数据与知识文章控制台浏览器回归 |
| `mise run knowledge:check` | 校验 MDX、文章索引、语言关联和加载清单 |
| `mise run knowledge:sync` | 手动编辑索引后重新生成 MDX 加载清单 |
| `mise run seo:check` | 构建后检查实际 HTML、sitemap、语言互链、分享图片和重定向 |

首次运行浏览器测试前执行 `mise exec -- npm exec -- playwright install chromium`。游戏 E2E 默认启动生产服务器，需先构建；`E2E_DEV=1 mise run e2e` 使用开发服务器。测试使用本地图像替身并屏蔽外部分析脚本。

## 代码与数据

- Next.js App Router、React、Tailwind CSS。`src/app/[locale]` 和 `src/proxy.ts` 统一语言路由；英文不带路径前缀。
- `src/hooks/useGameState.ts` 管理游戏与持久化，`src/app/api/checkGuess/route.ts` 比较猜测。
- `src/data/` 是发布数据，`src/config/dataset.ts` 提供统一版本号；[tools/](tools/README.md)负责候选审核、数据校正和 MDX 文章管理。
- `public/styles/theme.css`、`buttons.css` 供网站、控制台和文章预览共用。字体使用自托管 Inter，中日韩回退到系统字体；许可见 `public/fonts/OFL.txt`。

## 检查与部署

GitHub Actions 在 `dev`、`main` 推送及 Pull Request 时执行 `mise run check`。数据检查使用本地文件与测试夹具，上游更新由人工触发。

部署执行 `npm ci`、`npm run build`；自托管通过 `npm start` 启动。Node.js 使用 `package.json` 声明的 `24.x`，与 [Vercel 运行时](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)对齐。修改公开环境变量后需重新构建。

当前兼容版本为 TypeScript 6、ESLint 9：`typescript-eslint` 的 peer 范围为 `<6.1.0`，`eslint-plugin-react` 尚未声明支持 ESLint 10。升级时重新检查依赖约束并运行完整检查，不用 `--force` 或 `--legacy-peer-deps` 绕过约束。

Google Analytics 在用户接受后加载；Vercel Analytics 和 Speed Insights 位于根布局。`TWITTER_SITE`、`TWITTER_CREATOR` 为可选的真实 `@账号`，没有账号时留空，修改后重新构建。

SEO 校验临时启动生产服务器检查构建输出，无需浏览器安装。部署后可运行 `SEO_BASE_URL=https://www.pokewordle.app mise run seo:check`；检查外部分享图片需要网络。文章结构化数据、语言互链和历史地址由索引生成，编辑约定见[知识文章](tools/README.md#知识文章)。sitemap 日期只随实际内容变更更新。

上线后在 Google Search Console 提交 `/sitemap.xml`，用 URL 检查查看重点页面的收录、规范网址和 404。技术校验通过不代表已收录；参见[重新抓取流程](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)。
