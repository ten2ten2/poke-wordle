# 宝可梦数据工具

从 PokeAPI 生成游戏主数据、九语言名称和恶作剧模式图片。工具链由根目录 `mise.toml` 固定。

在仓库根目录运行：

```sh
mise run data:generate
mise run data:review -- <run-id>
mise run data:apply -- <run-id> --review <报告输出的 SHA-256>
mise run check
```

生成隔离候选并缓存响应，校对以 `src/data/` 为基准。应用时核验来源、基准、候选和报告哈希，并同步稳定 ID 与数据版本。不会自动提交或推送。

- [更新、修正、离线重建与发布流程](UPDATE_WORKFLOW.md)
- [本次数据更新报告](reports/2026-09-11.md)
- [按语言维护的人工修正表](corrections.json)

`mise run data:check` 包含 Go 静态/竞态检查、流程回归和发布数据校验；`mise run data:verify` 只校验已发布数据。两个命令均不访问上游。

直接在工具目录运行 `go run .` 仍提供历史交互导出/比较功能，其 `output/`、`backup/` 和分类翻译只供临时用途，不能用作发布基准。正式更新统一使用上面的批次命令。
