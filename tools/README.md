# 宝可梦数据与内容工具

从 PokeAPI 生成主数据、九语言名称和恶作剧图片，经审核后写入 `src/data/`。先按[根目录说明](../README.md#开发)安装工具和依赖，再在仓库根目录运行：

```sh
mise run data:console
```

默认打开 http://127.0.0.1:3318。若使用 `mise run data:console -- --port 3319`，则打开 http://127.0.0.1:3319；实际地址以启动日志为准。后台源码或依赖变更后需重启控制台。

通过顶部主菜单切换：

- **更新数据**：生成候选，按批次对照旧值、新值、图片与来源，逐项确认或记录修正意见。
- **当前数据**：浏览游戏数据、多语言名称、恶作剧图片和文章索引，并查看数据版本、搜索和导出。
- **知识文章**：管理英、日、法、德、意、西、韩、简中、繁中九种语言版本，编辑、导入、导出 MDX，预览校验后保存到项目。

控制台仅在本机运行；保存、审核及应用结果通过 Git 和部署流程上线。

[更新、修正与离线重建流程](UPDATE_WORKFLOW.md) · [人工修正表](corrections.json) · [来源报告](reports/)

`mise run data:check` 运行 Go 和数据流程回归；`mise run data:verify` 校验已发布数据；`mise run data:console:test` 运行控制台浏览器回归。浏览器安装见[根目录说明](../README.md#开发)。

## 知识文章

在控制台的「知识文章」中选择或新建文章，切换语言编辑对应版本；可复制已有正文作为翻译起点。标题、路径、创建时间和当前语言的摘要在正文之外编辑；更新时间由保存操作生成，SEO 标题和分享图片可选。

各语言版本统一使用英文路径，如 `late-bloomers-pokemon`。新增版本沿用已有路径，修改标题保持路径不变；旧地址保留永久跳转。

宝可梦资料链接按语言选站：德语 PokéWiki、西语 WikiDex、法语 Poképédia、意语 Pokémon Central Wiki、韩语 Pokémon Wiki（Fandom）。条目名称使用对应语言；韩语条目带 `_(포켓몬)` 后缀。

术语优先采用当地官方译名，玩家称呼参考对应百科；标题、摘要、正文和界面用语保持一致。

MDX 支持 Markdown、GFM 表格、静态 HTML/JSX 和 `FAQ`、`Question`、`Answer` 组件，正文从二级标题开始。主标题和结构化数据由页面生成，链接 `title` 从文字补齐。隔离预览不执行 JavaScript 或模块导入，语法错误标出行列位置。

PokeAPI 默认正面精灵图自动补充 `96 × 96` 尺寸、懒加载和异步解码，前台与预览一致。其他正文图片用 `<img>` 声明实际宽高；显式尺寸不被覆盖。

「分享图片」接受 HTTPS 地址或 `/images/` 开头的项目图片地址，格式为 PNG、JPEG、WebP、GIF；项目文件放在 `public/images/`。建议尺寸为 `1200 × 630`，填写后用于 Open Graph、Twitter 和 Article。

保存同步正文、索引、语言关联和加载清单，仅在内容或元数据改变时更新日期。改名维护 `src/data/knowledge-redirects.json`，历史路径不能被其他文章占用；删除版本同步清理关联。若发生文件冲突，先导出 MDX、复制元数据，再重新载入合并。

保存后点击“检查已保存文章”，运行知识库校验、生产构建和 SEO 检查。直接编辑仓库文件时，实质修改需更新 `updatedAt`，改名需补充历史路径，再依次运行 `mise run knowledge:sync`、`mise run knowledge:check`、`mise run build` 和 `mise run seo:check`。
