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

- 字体使用自托管 Inter 拉丁可变字体，中日韩按页面语言回退到系统字体；许可见 `public/fonts/OFL.txt`。
- Header 语言按钮左侧可切换日间／夜间；首次跟随系统，手动选择保存在本机并同步同源标签页。页面、控制台与 MDX 预览共用 `public/styles/theme.css`。
- 页面、弹窗和数据控制台共用 `public/styles/buttons.css`，统一按钮尺寸与交互状态；组件仅指定操作类型和布局。
- Next.js App Router、React、Tailwind CSS。`src/app/[locale]` 和 `src/proxy.ts` 统一语言路由；英文不带路径前缀。
- `src/hooks/useGameState.ts` 管理游戏与持久化，`src/app/api/checkGuess/route.ts` 比较猜测。
- `src/data/` 是游戏数据发布目录；`tools/` 负责抓取、修正、校对和知识文章管理。使用[数据控制台](tools/README.md)浏览全量数据、审核候选、编辑 MDX；操作见[更新流程](tools/UPDATE_WORKFLOW.md)。
- 在[控制台的知识文章页面](http://127.0.0.1:3318/#knowledge)管理四种语言的 MDX、摘要、SEO 标题和分享图片。保存同步正文、索引、语言关联、加载清单和历史路径；通过 Git 和部署流程上线。
- Google Analytics 在用户接受后加载；Vercel Analytics 和 Speed Insights 位于根布局。

## 检查与部署

GitHub Actions 在 `dev`、`main` 推送及 Pull Request 时执行 `mise run check`。数据检查使用本地文件与测试夹具，上游更新由人工触发。

SEO 校验会临时启动生产服务器，逐页检查构建后的输出，不需要浏览器安装。单独运行时先执行 `mise run build`。部署后可运行 `SEO_BASE_URL=https://www.pokewordle.app mise run seo:check`，核对线上页面是否与当前索引一致；自定义外部分享图片需要网络访问。

分享元数据统一生成，包含图片描述；`TWITTER_SITE` 和 `TWITTER_CREATOR` 仅填写真实的 `@账号`，没有账号时留空，不输出对应标签，修改后需重新构建。根首页输出 WebSite 结构化数据。

文章摘要必须使用对应语言；Article 和面包屑结构化数据自动生成。MDX 链接缺少 `title` 时从链接文字自动补齐，已有提示保留，控制台预览与网站一致。改名会把历史地址直接永久跳转到最新地址，删除版本后对应地址返回 404。重复保存不刷新 `updatedAt`；手动实质修改正文或摘要时同步更新索引日期。sitemap 不使用 `priority`、`changefreq`，也不随构建或版权年份刷新日期。

上线后在 Google Search Console 提交 `/sitemap.xml`，对重点修改的页面使用 URL 检查，查看收录状态、Google 选择的规范网址和 404。自动校验通过表示页面技术条件正常，不等于搜索引擎已经收录。[重新抓取流程](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)。

当前工具链保留 TypeScript 6 和 ESLint 9：TypeScript 7 的编译器 API 尚不满足 typescript-eslint，Next.js 的 React 插件仍使用 ESLint 10 已移除的 API。升级前运行完整检查，不用 `--force` 或 `--legacy-peer-deps` 绕过兼容约束。参考 [TypeScript 工具兼容说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)。

部署执行 `npm ci`、`npm run build`；自托管通过 `npm start` 启动。Node.js 使用 `package.json` 声明的 `24.x`，与 [Vercel 运行时](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)对齐。修改公开环境变量后需重新构建。
