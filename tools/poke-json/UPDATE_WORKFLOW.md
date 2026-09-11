# 数据更新与校对

发布基准始终是 `src/data/`。从仓库根目录使用 mise：

```sh
mise run data:generate
mise run data:review -- <run-id>
# 阅读 output/runs/<run-id>/review.md 和 review.json 后，使用命令输出的报告哈希：
mise run data:apply -- <run-id> --review <sha256>
mise run check
mise run e2e
```

`data:run` 是 `data:generate` 的兼容入口。实际更新示例及来源见 [2026-09-11 报告](reports/2026-09-11.md)。

## 生成和修正

每次生成创建 `tools/poke-json/output/runs/<run-id>/`，不覆盖前端或其他批次。目录包含：

| 文件 | 用途 |
| --- | --- |
| `started.json` | 基准 Git 提交、四个发布文件和 ID 注册表哈希、生成器与修正表哈希 |
| `cache/*.json` | 规范化请求 URL、获取时间、响应 SHA-256 和响应正文 |
| `output/*.json` | 主数据、九语言名称、恶作剧图片三个候选 |
| `id-registry.json` | 保留历史名称与 ID 的候选注册表 |
| `translation-events.json` | 本地覆盖、修正依据和中间英文回退记录 |
| `manifest.json` | 全部生成成功才写入的完整清单 |
| `review.json` / `review.md` | 校验结果、语义差异、高风险身份变化和新图片检查 |

在线 API 没有提交参数，因此按实际请求分别记录获取时间，不能把响应称为同一 Git 快照。首次生成联网，同一 URL 合并并发请求并缓存；符合 [PokeAPI 缓存要求](https://pokeapi.co/docs/v2#fairuse)。缓存损坏会报错，不会静默重取。

```sh
# 修正生成器后，完全离线重建；缺少任何响应即失败
mise run data:generate -- --from <run-id>
# 失败重试或新增请求：复用已缓存的响应，只联网补齐缺失响应
mise run data:generate -- --resume <run-id>
```

两种方式都创建新批次。`--resume` 可能包含不同获取时间的响应，清单如实记录；需要全新上游状态时运行不带参数的 `data:generate`。保留批次缓存才能离线复现；缓存不提交到 Git。使用 Git 回退发布文件，不另建备份目录。

上游有新种族时，生成器会报错要求审核范围。当前支持全国编号 `1..1025` 和九世代，继续排除 Mega/Gmax 等答案，并保留形态合并、特性补充和静态分类规则。`has-mega` 表示种族存在 Mega 形态，同时排除地区形态，并不逐形态判断 Mega 资格。进化优先使用上游 `is_default` 条件，没有该标记时保留原有顺序；项目的形态修正规则继续生效。

翻译按大小写无关的语言代码读取，输出小写代码并去除首尾空格。种族名与上游形态名先拼接，再按语言应用非空修正；地区标签只填补上游缺失字段。特性名称直接使用上游；不再保留已过时的整条特性覆盖。

人工修正维护在 [`corrections.json`](corrections.json)，每个字段包括实体、语言、预期的上游拼接值、修正值、理由、证据 URL、核对日期。上游原值变化会中止生成，需重新校对并移除或调整失效修正。英文回退在报告中保留过程记录；`remaining_english_fallbacks` 仅列最终仍未被本地修正替换的回退。

## 校对与应用

`data:review` 对照当前 `src/data/`，按名称对齐主数据并逐字段比较。对象键顺序不算变化；特性、标签、恶作剧图片按集合比较，`tags: null` 与 `[]` 等价；属性槽位顺序仍有意义。新增、删除和 ID/全国编号变化单独列为高风险项目，必须逐项核对来源与规则。

自动校验覆盖：三文件非空且可解析；ID/名称唯一；注册表一致；1,025 种族覆盖；世代、属性、六项种族值及总和；答案、属性、特性的九语言引用及非空名称；九种界面语言的标签/进化细类；已确认翻译与进化回归样例；图片 HTTPS、无重复，以及新增/变更图片的 HTTP 状态、内容类型和正文哈希。结构校验不能替代语言内容校对。

`data:apply` 只接受指定校对报告的 SHA-256。重新检查基准、候选、注册表、生成器、缓存和报告哈希，确认仍是同一批数据。写入范围固定为：

- `src/data/pokemon_data.json`
- `src/data/pokemon_i18n.json`
- `src/data/prankster_profile.json`
- `src/data/dataset.json`（数据版本及三文件哈希）
- `tools/poke-json/id-registry.json`（保留删除名称的 ID，新名称仅追加）

`knowledge_data.json`、文章和分类翻译不在发布范围。先暂存所有待写文件，再逐项替换；普通 I/O 失败会用内存中的原内容恢复。多文件替换无法保证断电原子性：进程被强制终止时，`mise run data:verify` 会检测版本/文件不一致，应通过 Git 恢复后重新执行；不要部署不通过检查的工作区。发布锁残留时先确认没有应用进程运行，再移除 `output/apply.lock`。

存档和猜测请求携带数据版本。旧版本存档会清除进度但保留设置；服务器拒绝旧页面请求并返回 409，新客户端自动刷新。这样既保持数字 ID 稳定，也避免标签或属性变化后沿用失效的猜测记录。

## 日常维护

CI 的 `mise run check` 离线运行 Go 检查、流程回归测试、已发布数据校验及前端完整检查。上游核对建议每月或遇到新游戏/DLC/数据源修订时手动触发，不自动发布。完成校对后将源修正、三个 JSON、版本/注册表和报告一起提交；报告保留实际来源、差异和验证结果。
