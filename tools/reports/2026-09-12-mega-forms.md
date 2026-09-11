# Mega 资格的形态校正（2026-09-12）

基格尔德只有完全体形态可以直接超级进化。10% 与 50% 形态可先变为完全体，但形态转换不代表它们自身具有 Mega 资格。[Bulbapedia：Zygarde，Mega Evolution](https://bulbapedia.bulbagarden.net/wiki/Zygarde_(Pok%C3%A9mon)#Mega_Evolution)

花叶蒂只有永恒之花形态可以超级进化，普通花色不能。官方图鉴的 Mega 描述对应永恒之花；形态限制详见 [Bulbapedia：Floette](https://bulbapedia.bulbagarden.net/wiki/Floette_(Pok%C3%A9mon)#Form_data) 和[官方图鉴](https://www.pokemon.com/us/pokedex/floette)。

## 原因与修复

PokeAPI 的种族 `varieties` 把基础形态与 Mega 形态列在一起，没有提供“Mega 对应哪个基础形态”的关系。原生成器检测到 `floette-mega` / `zygarde-mega` 后，便给该种族的所有非地区形态添加 `has-mega`。

生成器现保留上游 Mega 存在检查，并对这两个种族按具体形态限制。普通种族及地区形态的既有处理保持不变；后续发现其他限制时，应核对证据后扩展此规则。

| 数据名称 | `has-mega` 校正 |
| --- | --- |
| `floette` | 删除 |
| `floette-eternal` | 保留 |
| `zygarde-10` | 删除 |
| `zygarde-50` | 删除 |
| `zygarde-complete` | 保留 |

修正生成规则后复用已缓存的来源重建候选，通过控制台核对这 3 项标签删除，再应用到 `src/data/`。只编辑发布 JSON 会在下一次生成时复发。

回归测试从模拟 API 走完整的形态生成流程，覆盖上述五条记录、普通 Mega、地区形态、上游不存在 Mega 时不添加标签，以及保留基格尔德的传说标签。

## 本次候选

批次 `20260911T172451927Z-87407` 从已发布批次 `20260911T164124744Z-57826` 的缓存离线重建，自动校对仅发现上述 3 个标签字段变化。带 `has-mega` 的记录从 91 条减为 88 条；ID、其他字段、翻译和图片均无变化。

生成时保留为待确认状态，3 项备注均附核实依据。可在[本地控制台](http://127.0.0.1:3318/#20260911T172451927Z-87407)查看；应用状态以控制台和 `src/data/dataset.json` 为准。`mise run data:check` 已通过 Go 静态/竞态检查、形态生成回归与 10 项数据流程/控制台接口测试。
