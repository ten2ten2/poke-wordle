# 宝可梦数据工具

使用 PokeAPI 生成游戏数据、九种语言的名称与属性翻译，以及恶作剧模式图片。Go 版本由仓库根目录的 `mise.toml` 固定。

在仓库根目录运行：

```sh
mise run data:check
mise run data:run
```

交互菜单提供完整生成、基础数据、恶作剧图片、JSON 比较和分类翻译五种操作。抓取需要联网，耗时取决于 PokeAPI 响应。

输出保存在 `poke-json/output/`。生成前将现有对应文件移入 `backup/`；备份或生成失败会报错退出。比较报告写入 `compare_result_*.json`。首次生成没有旧文件时跳过比较。

审核 JSON 差异后，将需要更新的 `pokemon_data.json`、`pokemon_i18n.json`、`prankster_profile.json` 复制到前端 `src/data/`，再运行 `mise run check`。输出和备份目录不提交到 Git。

主数据区分属性、特性或种族值等不同的形态；翻译使用小写语言代码（例如 `zh-hans`）。数据结构见 `types.go`；比较实现见 `compare_json.go`。
