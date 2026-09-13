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

打开 http://localhost:3000。工具和依赖版本分别由 `mise.toml`、`package-lock.json` 固定；可选环境变量见 [.env.example](.env.example)，本地配置写入 `.env.local`。

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

首次运行浏览器测试前执行 `mise exec -- npm exec -- playwright install chromium`。E2E 默认检查生产构建；`E2E_DEV=1 mise run e2e` 改用开发服务器，`mise run e2e -- --grep '关键词'` 筛选用例。

## 代码与数据

- Next.js App Router、React、Tailwind CSS。`src/app/[locale]` 和 `src/proxy.ts` 统一语言路由；英文不带路径前缀。
- `src/hooks/useGameState.ts` 管理游戏与持久化，`src/app/api/checkGuess/route.ts` 比较猜测。
- `src/data/` 是发布数据，`src/config/dataset.ts` 提供版本号；[tools/](tools/README.md) 负责候选审核、数据校正和 MDX 文章管理。
- 知识库、隐私正文和面包屑由服务端渲染；首页随机问答只向客户端传入当前语言的标题和路径。
- `public/styles/theme.css`、`buttons.css` 供网站、控制台和文章预览共用。字体使用自托管 Inter，中日韩回退到系统字体；许可见 `public/fonts/OFL.txt`。

## 检查与部署

GitHub Actions 在 `dev`、`main` 推送及 Pull Request 时执行 `mise run check`。数据检查使用本地文件与测试夹具，上游更新由人工触发。

部署执行 `npm ci`、`npm run build`；自托管通过 `npm start` 启动。Node.js 使用 `24.x`，与 [Vercel 运行时](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)对齐。环境变量修改后需重新构建。

`/favicon.ico` 使用 7 天浏览器缓存；替换 `public/favicon.ico` 时，同步递增 `src/app/[locale]/layout.tsx` 中图标 URL 的 `v` 参数，让浏览器获取新版本。

TypeScript 6、ESLint 9 受当前插件的 peer 依赖范围约束；升级时重新核验兼容性，不用 `--force` 或 `--legacy-peer-deps` 绕过约束。

配置 `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...` 后，Google Analytics 默认启用；明确拒绝后停止采集并清除 GA Cookie。用户可通过页脚「隐私偏好」更改选择。GA4 数据流的增强型衡量应开启「基于浏览器历史记录事件的网页更改」，由 Google 标签自动统计站内跳转，避免重复上报。

验证真实 Google 标签：先用上述 ID 构建，再运行 `GA4_E2E_MEASUREMENT_ID=G-... mise run e2e -- tests/e2e/analytics.spec.ts`（两个 ID 必须一致）。此检查需要联网，所有 GA 上报均被拦截，不会污染正式统计；未设置测试 ID 时跳过真实标签检查。

SEO 校验检查实际构建输出，无需安装浏览器。部署后可运行 `SEO_BASE_URL=https://www.pokewordle.app mise run seo:check`。文章元数据、语言互链和历史地址由索引生成，sitemap 日期只随实际内容更新；编辑约定见[知识文章](tools/README.md#知识文章)。

上线后在 Google Search Console 提交 `/sitemap.xml`，用 URL 检查确认收录和规范网址；必要时[请求重新抓取](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)。
