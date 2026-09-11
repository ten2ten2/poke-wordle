# 宝可梦数据与内容工具

从 PokeAPI 生成主数据、九语言名称和恶作剧图片，经审核后发布到 `src/data/`。工具链使用仓库根目录的 mise 配置。

```sh
mise run data:console
```

打开 http://127.0.0.1:3318，通过顶部主菜单切换：

- **更新数据**：生成候选，按批次对照旧值、新值、图片与来源，逐项确认或记录修正意见。
- **当前数据**：浏览五份已发布 JSON，支持搜索、筛选、详情及导出。
- **知识文章**：按文章管理英、日、简中、繁中版本，编辑、导入、导出 MDX，预览校验后保存到项目。

控制台仅在本机运行，审核记录保存在本地；保存或应用后，通过 Git 和部署流程上线。

[更新、修正与离线重建流程](UPDATE_WORKFLOW.md) · [人工修正表](corrections.json) · [来源报告](reports/)

`mise run data:check` 运行 Go 和数据流程回归；`mise run data:verify` 校验已发布数据；`mise run data:console:test` 运行控制台浏览器回归。浏览器安装见[根目录说明](../README.md#开发)。

## 知识文章

在[知识文章](http://127.0.0.1:3318/#knowledge)选择或新建文章，切换语言编辑对应版本；可复制已有正文作为翻译起点。标题、路径、日期和对应语言的摘要在正文之外编辑；SEO 标题和分享图片可选。图片接受 HTTPS 地址或项目 `public/images/` 中的 PNG、JPEG、WebP、GIF。

MDX 支持 Markdown、GFM 表格、静态 HTML/JSX，以及 `FAQ`、`Question`、`Answer` 组件。正文从二级标题开始，页面自动提供主标题、Article 和面包屑结构化数据。链接缺少 `title` 时从文字补齐。预览在隔离页面渲染，不执行 JavaScript、函数或模块导入；语法错误显示行列位置并保留内容。

“保存到项目”同步正文、索引、语言关联和加载清单，仅在内容或元数据改变时更新日期。

改名会把旧路径写入 `src/data/knowledge-redirects.json`，直接永久跳转到最新地址；历史路径不能被其他文章占用。删除版本会清理正文、语言关联和历史跳转，对应地址返回 404。

保存检查文件版本以防覆盖。发生冲突时先导出未保存的 MDX、复制元数据，再重新载入合并。

保存后点击“检查已保存文章”，运行知识库校验、生产构建和 SEO 检查。直接编辑仓库文件时，实质修改需更新 `updatedAt`，改名需补充历史路径，再依次运行 `mise run knowledge:sync`、`mise run knowledge:check`、`mise run build` 和 `mise run seo:check`。
