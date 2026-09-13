# Mega 资格的形态校正（2026-09-12）

基格尔德只有完全体形态可以直接超级进化。10% 与 50% 形态可先变为完全体，但形态转换不代表它们自身具有 Mega 资格。[Bulbapedia：Zygarde，Mega Evolution](https://bulbapedia.bulbagarden.net/wiki/Zygarde_(Pok%C3%A9mon)#Mega_Evolution)

花叶蒂只有永恒之花形态可以超级进化，普通花色不能。官方图鉴的 Mega 描述对应永恒之花；形态限制详见 [Bulbapedia：Floette](https://bulbapedia.bulbagarden.net/wiki/Floette_(Pok%C3%A9mon)#Form_data) 和[官方图鉴](https://www.pokemon.com/us/pokedex/floette)。

## 数据规则

PokeAPI 的种族 `varieties` 把基础形态与 Mega 形态列在一起，没有提供“Mega 对应哪个基础形态”的关系。原生成器检测到 `floette-mega` / `zygarde-mega` 后，便给该种族的所有非地区形态添加 `has-mega`。

生成器保留上游 Mega 存在检查，并通过 `megaEvolutionFormEligible` 对这两个种族按具体形态限制。

| 数据名称 | `has-mega` 校正 |
| --- | --- |
| `floette` | 删除 |
| `floette-eternal` | 保留 |
| `zygarde-10` | 删除 |
| `zygarde-50` | 删除 |
| `zygarde-complete` | 保留 |

批次 `20260911T172451927Z-87407` 复用批次 `20260911T164124744Z-57826` 的缓存，仅删除上述三个标签，`has-mega` 记录从 91 条减为 88 条；ID、其他字段、翻译和图片均不变。修正保留于[后续发布数据](2026-09-12.md)。
