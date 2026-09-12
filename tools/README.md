# 宝可梦数据与内容工具

从 PokeAPI 生成主数据、九语言名称和恶作剧图片，经审核后发布到 `src/data/`。工具链使用仓库根目录的 mise 配置。

```sh
mise run data:console
```

源码或依赖变更后需重启；仅刷新网页不会重载后台。自定义端口：`mise run data:console -- --port 3319`。

打开 http://127.0.0.1:3318，通过顶部主菜单切换：

- **更新数据**：生成候选，按批次对照旧值、新值、图片与来源，逐项确认或记录修正意见。
- **当前数据**：浏览五份已发布 JSON，支持搜索、筛选、详情及导出。
- **知识文章**：管理英、日、法、德、意、西、韩、简中、繁中九种语言版本，编辑、导入、导出 MDX，预览校验后保存到项目。

控制台仅在本机运行；保存、审核及应用结果通过 Git 和部署流程上线。

[更新、修正与离线重建流程](UPDATE_WORKFLOW.md) · [人工修正表](corrections.json) · [来源报告](reports/)

`mise run data:check` 运行 Go 和数据流程回归；`mise run data:verify` 校验已发布数据；`mise run data:console:test` 运行控制台浏览器回归。浏览器安装见[根目录说明](../README.md#开发)。

## 知识文章

在[知识文章](http://127.0.0.1:3318/#knowledge)选择或新建文章，切换语言编辑对应版本；可复制已有正文作为翻译起点。标题、路径、日期和对应语言的摘要在正文之外编辑；SEO 标题和分享图片可选。图片接受 HTTPS 地址或项目 `public/images/` 中的 PNG、JPEG、WebP、GIF。

各语言版本统一使用英文路径，如 `late-bloomers-pokemon`。新增版本沿用已有路径，修改标题保持路径不变；旧地址保留永久跳转。

宝可梦资料链接按语言选站：德语 PokéWiki、西语 WikiDex、法语 Poképédia、意语 Pokémon Central Wiki、韩语 Pokémon Wiki（Fandom）。条目名称使用对应语言；韩语条目带 `_(포켓몬)` 后缀。

术语优先采用当地官方译名，玩家称呼参考对应百科，例如法语 [Pokémon surpuissant](https://www.pokepedia.fr/Pok%C3%A9mon_surpuissant)。标题、摘要、正文、标签和 About 保持一致；区分特性与招式、传说与幻之宝可梦、极巨化与超极巨化。进化石可对照 [PokeAPI 多语言道具表](https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/item_names.csv)。

MDX 支持 Markdown、GFM 表格、静态 HTML/JSX 和 `FAQ`、`Question`、`Answer` 组件，正文从二级标题开始。主标题和结构化数据由页面生成，链接 `title` 从文字补齐。隔离预览不执行 JavaScript 或模块导入，语法错误标出行列位置。

PokeAPI 默认正面精灵图自动补充 `96 × 96` 尺寸、懒加载和异步解码，前台与预览一致。其他图片用 `<img>` 声明实际宽高；显式尺寸不被覆盖。分享封面建议 `1200 × 630` PNG/WebP、与主题相关、九语言共用无文字插图；填写「分享图片」后用于 Open Graph、Twitter 和 Article。

保存同步正文、索引、语言关联和加载清单，仅在内容或元数据改变时更新日期。改名维护 `src/data/knowledge-redirects.json`，历史路径不能被其他文章占用；删除版本同步清理关联。若发生文件冲突，先导出 MDX、复制元数据，再重新载入合并。

保存后点击“检查已保存文章”，运行知识库校验、生产构建和 SEO 检查。直接编辑仓库文件时，实质修改需更新 `updatedAt`，改名需补充历史路径，再依次运行 `mise run knowledge:sync`、`mise run knowledge:check`、`mise run build` 和 `mise run seo:check`。
