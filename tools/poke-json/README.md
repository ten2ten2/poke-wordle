# 宝可梦数据工具

从 PokeAPI 生成主数据、九语言名称和恶作剧图片，经审核后发布到 `src/data/`。工具链使用仓库根目录的 mise 配置。

```sh
mise run data:console
```

打开 http://127.0.0.1:3318：

- **当前数据**：浏览五份已发布 JSON，支持搜索、筛选、详情及导出。
- **检查上游更新**：生成候选，对照旧值、新值、图片与来源，逐项确认或记录修正意见。
- **应用并运行检查**：全部待确认项接受后同步数据，执行完整检查及游戏 E2E。

控制台仅在本机运行。审核记录保存在本地；不会自动提交或推送。

[更新、修正与离线重建流程](UPDATE_WORKFLOW.md) · [人工修正表](corrections.json) · [来源报告](reports/)

`mise run data:check` 运行 Go 和数据流程回归；`mise run data:verify` 校验已发布数据；`mise run data:console:test` 运行控制台浏览器回归。浏览器安装见[根目录说明](../../README.md#开发)。
