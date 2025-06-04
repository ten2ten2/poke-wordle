# 宝可梦数据获取工具

这是一个使用 Go 语言编写的工具，用于从 [PokeAPI](https://pokeapi.co/) 获取所有宝可梦的详细数据，并保存为 JSON 格式。

## 功能特性

- 获取所有宝可梦的基础信息（ID、名称、图片等）
- 包含详细的种族值信息
- 自动识别宝可梦属性和特性
- 分析进化阶段和进化方式
- 根据预设规则和API数据自动添加标签
- **从API直接获取传说和幻之宝可梦信息，确保准确性**
- **通过API检测Mega进化和超极巨化形态**
- **智能处理不同形态：只有在属性、特性、种族值总和、进化方式、标签任一不同时才分开存储**
- **多语言翻译支持：自动生成宝可梦名称、属性、特性的多语言翻译文件**
- **形态后缀翻译：支持地区形态、战斗形态等后缀的准确翻译**
- 支持并发获取数据，提高效率
- 正确命名和区分不同形态的宝可梦

## 数据格式

每个宝可梦的数据结构如下：

```json
{
    "id": 1,
    "pokedex_id_national": 1,
    "name": "Bulbasaur",
    "profile": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    "generation": 1,
    "types": ["grass", "poison"],
    "abilities": ["overgrow", "chlorophyll"],
    "base_stats_total": 318,
    "base_stats": {
        "hp": 45,
        "attack": 49,
        "defense": 49,
        "sp_attack": 65,
        "sp_defense": 65,
        "speed": 45
    },
    "evolution_stage": 1,
    "evolution_method": "",
    "evolution_method_detail": "",
    "tags": ["starter"]
}
```

## 标签说明

- `starter`: 最初的伙伴宝可梦
- `fossil`: 化石宝可梦
- `late`: 大器晚成的宝可梦
- `legendary`: 传说中的宝可梦 **（从API获取）**
- `mythical`: 幻之宝可梦 **（从API获取）**
- `ultra`: 究极异兽
- `paradox`: 悖谬宝可梦
- `regional`: 有地区形态 **（从API检测）**
- `has-mega`: 有 Mega 进化 **（从API检测）**
- `has-gmax`: 有超极巨化 **（从API检测）**

### 最新改进

#### 1. API驱动的特殊形态检测
- **传说宝可梦**：通过 `pokemon-species` API 的 `is_legendary` 字段直接获取
- **幻之宝可梦**：通过 `pokemon-species` API 的 `is_mythical` 字段直接获取
- **Mega进化**：通过检测 `varieties` 中是否包含 `-mega` 形态来判断
- **超极巨化**：通过检测 `varieties` 中是否包含 `-gmax` 形态来判断
- **地区形态**：通过检测 `varieties` 中是否包含地区标识符（`-alola`、`-galar`、`-hisui`、`-paldea`）来判断

#### 2. 智能形态处理
程序会从API获取每个宝可梦的所有形态（varieties），然后比较以下关键属性：
- 属性（types）
- 特性（abilities）
- 种族值总和（base_stats_total）
- 进化方式（evolution_method 和 evolution_method_detail）

**只有在以上任意一项不同时，才会作为不同的element存储。**

**特殊合并规则：**
- **Mega形态**：与基础形态合并（如Charizard-Mega-X、Charizard-Mega-Y合并到Charizard）
- **超极巨化形态**：与基础形态合并（如Charizard-Gmax合并到Charizard）
- **伙伴形态**：与基础形态合并（如Pikachu-Starter、Eevee-Starter合并到基础形态）
- **地区形态**：保持分开（如Vulpix和Vulpix-Alola分别存储）

#### 3. 形态命名示例
- **喷火龙**：`Charizard`（合并了Mega-X、Mega-Y、Gmax形态）
- **六尾**：`Vulpix`、`Vulpix-Alola`（因属性不同，地区形态保持分开）
- **皮卡丘**：`Pikachu`（合并了所有cosplay形态和伙伴形态）
- **伊布**：`Eevee`（合并了伙伴形态）
- **代欧奇希斯**：只有一个`Deoxys`（虽有不同形态但种族值总和相同）

#### 4. 形态后缀翻译功能
**最新特性**：支持形态后缀的多语言翻译，例如：

- **地区形态**：
  - `Arcanine-Hisui` → `风速狗-洗翠的样子` (zh-Hans)
  - `Vulpix-Alola` → `六尾-阿羅拉的樣子` (zh-Hant)
  - `Zigzagoon-Galar` → `지그제구리-가라르의 모습` (ko)

- **战斗形态**：
  - `Shaymin-Land` → `谢米-陆上形态` (zh-Hans)
  - `Shaymin-Sky` → `シェイミ-スカイフォルム` (ja)
  - `Giratina-Origin` → `기라티나-오리진폼` (ko)

支持的形态后缀翻译包括：
- 地区形态：`-alola`, `-galar`, `-hisui`, `-paldea`
- 战斗形态：`-land`, `-sky`, `-origin`, `-altered`
- 形态变化：`-attack`, `-defense`, `-speed`, `-shield`, `-blade`
- 性别差异：`-male`, `-female`

## 进化方式说明

### 进化方法 (evolution_method)
- `level`: 等级进化
- `item`: 道具进化
- `trade`: 交换进化
- `unique`: 特殊进化

### 具体进化方式 (evolution_method_detail)

**等级进化类型：**
- `level-normal`: 普通提升等级
- `level-friendship`: 达到亲密度要求提升等级
- `level-move`: 学会招式提升等级
- `level-location`: 特定地点提升等级
- `level-time`: 特定时间提升等级
- `level-holding-item`: 持有道具提升等级
- `level-gender`: 特定性别提升等级
- `level-version`: 特定游戏版本提升等级
- `level-unique`: 满足特殊条件提升等级

**道具进化类型：**
- `item-stone-fire`: 使用火之石
- `item-stone-water`: 使用水之石
- `item-stone-thunder`: 使用雷之石
- `item-stone-leaf`: 使用叶之石
- `item-stone-moon`: 使用月之石
- `item-stone-shiny`: 使用光之石
- `item-stone-dusk`: 使用暗之石
- `item-stone-dawn-male`: 雄性使用觉醒石
- `item-stone-dawn-female`: 雌性使用觉醒石
- `item-stone-ice`: 使用冰之石
- `item-unique`: 使用特殊指定道具

**交换进化类型：**
- `trade-normal`: 普通通信交换
- `trade-item`: 携带道具交换
- `trade-certain`: 指定宝可梦交换

## 使用方法

### 前置要求

- Go 1.21 或更高版本
- 网络连接（用于访问 PokeAPI）

### 安装依赖

```bash
go mod tidy
```

### 运行程序

```bash
go run main.go
```

程序会自动：

1. 获取所有宝可梦种族列表
2. 获取每个种族的所有形态（varieties）
3. 并发获取每个形态的详细信息
4. 智能比较和过滤相同的形态
5. 从API获取准确的传说、幻之、特殊形态信息
6. **收集和获取多语言翻译数据（包含形态后缀翻译）**
7. 分析和处理数据
8. 保存到 `pokemon_data.json` 和 `pokemon_i18n.json` 文件

### 输出

程序运行完成后，会在当前目录生成以下文件：

1. **`pokemon_data.json`** - 包含所有宝可梦的完整数据
2. **`pokemon_i18n.json`** - 包含宝可梦名称、属性、特性的多语言翻译

#### 多语言翻译文件格式

`pokemon_i18n.json` 包含以下语言的翻译：
- `en` - 英语
- `ja` - 日语
- `es` - 西班牙语  
- `de` - 德语
- `it` - 意大利语
- `fr` - 法语
- `zh-Hant` - 繁体中文
- `zh-Hans` - 简体中文
- `ko` - 韩语

```json
{
  "Bulbasaur": {
    "en": "Bulbasaur",
    "ja": "フシギダネ",
    "es": "Bulbasaur",
    "de": "Bisasam",
    "it": "Bulbasaur",
    "fr": "Bulbizarre",
    "zh-Hant": "妙蛙種子",
    "zh-Hans": "妙蛙种子",
    "ko": "이상해씨"
  },
  "Arcanine-Hisui": {
    "en": "Arcanine-Hisui",
    "ja": "ウインディ-ヒスイのすがた",
    "es": "Arcanine-de Hisui",
    "de": "Arkani-Hisui-Form",
    "it": "Arcanine-di Hisui",
    "fr": "Arcanin-de Hisui",
    "zh-Hant": "風速狗-洗翠的樣子",
    "zh-Hans": "风速狗-洗翠的样子",
    "ko": "윈디-히스이의 모습"
  },
  "fire": {
    "en": "fire",
    "ja": "ほのお",
    "es": "Fuego",
    "de": "Feuer",
    "it": "Fuoco",
    "fr": "Feu",
    "zh-Hant": "火",
    "zh-Hans": "火",
    "ko": "불꽃"
  }
}
```

## 最新统计数据

- **总数据条目**: 1147 个（包含不同形态，已合并特殊形态）
- **翻译条目**: 1468 个（包含宝可梦名称、属性、特性的多语言翻译）
- **独特宝可梦种族**: 1025 个
- **传说宝可梦**: 108 个（从API获取，包含不同形态）
- **幻之宝可梦**: 27 个（从API获取，包含不同形态）
- **具有地区形态**: 114 个
- **具有Mega进化**: 47 个（从API检测，已与基础形态合并）
- **具有超极巨化**: 36 个（从API检测，已与基础形态合并）
- **支持形态后缀翻译**: 16 种不同类型的形态后缀

## 注意事项

- 程序使用并发请求来提高效率，但会控制并发数以避免对 API 造成过大压力
- 获取完整数据可能需要较长时间（约 3-4 分钟，包含多语言翻译）
- 请确保网络连接稳定
- 形态检测和过滤完全基于API数据，确保准确性和及时性
- 多语言翻译数据直接从API获取，包含9种语言的完整翻译
- **形态后缀翻译功能**：对于地区形态等变种，会在基础翻译后添加对应语言的形态标识符
- 翻译质量依赖于PokeAPI提供的官方翻译数据

## 依赖库

- `github.com/tidwall/gjson`: 用于解析 JSON 数据

## API 数据源

本工具使用 [PokeAPI](https://pokeapi.co/) 作为数据源，这是一个免费的 RESTful API，提供所有宝可梦相关数据。数据的准确性依赖于 PokeAPI 提供的信息。 