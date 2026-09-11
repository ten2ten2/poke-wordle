package main

import (
	"cmp"
	"fmt"
	"regexp"
	"slices"
	"strconv"
	"strings"

	"github.com/tidwall/gjson"
)

// 获取所有宝可梦种族信息
func fetchAllSpecies() error {
	fmt.Println("正在获取宝可梦种族列表...")

	url := "https://pokeapi.co/api/v2/pokemon-species?limit=2000"
	data, err := fetchURL(url)
	if err != nil {
		return err
	}

	results := gjson.Get(string(data), "results")
	if !results.IsArray() || len(results.Array()) == 0 {
		return fmt.Errorf("无法获取种族列表")
	}

	species := make(map[int]SpeciesData)
	re := regexp.MustCompile(`/(\d+)/$`)
	for _, value := range results.Array() {
		name := value.Get("name").String()
		url := value.Get("url").String()

		// 从URL中提取ID
		matches := re.FindStringSubmatch(url)
		if name == "" || len(matches) < 2 {
			return fmt.Errorf("无效的种族列表条目: %s", value.Raw)
		}

		id, err := strconv.Atoi(matches[1])
		if err != nil {
			return err
		}

		species[id] = SpeciesData{
			ID:   id,
			Name: name,
		}
	}
	speciesMap = species

	fmt.Printf("获取到 %d 个宝可梦种族\n", len(speciesMap))
	return nil
}

// 处理所有宝可梦
func processAllPokemon() error {
	fmt.Println("开始获取宝可梦详细信息...")

	// 获取所有种族ID
	var speciesIDs []int
	for id := range speciesMap {
		if id <= 1025 { // 限制在当前已知的宝可梦范围内
			speciesIDs = append(speciesIDs, id)
		}
	}

	slices.Sort(speciesIDs)

	if len(speciesIDs) == 0 {
		return fmt.Errorf("没有可处理的宝可梦种族")
	}
	// 每个任务只写入自己的结果，结束后再统一合并。
	results := make([][]Pokemon, len(speciesIDs))
	tasks := make([]func() error, len(speciesIDs))
	for i, id := range speciesIDs {
		tasks[i] = func() error {
			pokemon, err := fetchPokemonDetails(id)
			if err != nil {
				return fmt.Errorf("获取宝可梦详情失败 ID %d: %w", id, err)
			}
			results[i] = pokemon
			return nil
		}
	}
	if err := runTasks(tasks, 10); err != nil {
		return err
	}
	pokemonData = slices.Concat(results...)

	// 按照全国图鉴编号排序
	slices.SortFunc(pokemonData, func(a, b Pokemon) int {
		return cmp.Or(cmp.Compare(a.PokedexIDNational, b.PokedexIDNational), strings.Compare(a.Name, b.Name))
	})

	// 重新分配ID
	for i := range pokemonData {
		pokemonData[i].ID = i + 1
	}

	fmt.Printf("完成！共获取 %d 个宝可梦数据\n", len(pokemonData))
	return nil
}

// 获取宝可梦详细信息
func fetchPokemonDetails(speciesID int) ([]Pokemon, error) {
	// 首先获取species信息
	speciesURL := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-species/%d", speciesID)
	speciesData, err := fetchURL(speciesURL)
	if err != nil {
		return nil, err
	}

	speciesResult := gjson.Parse(string(speciesData))
	species := SpeciesData{
		ID:          int(speciesResult.Get("id").Int()),
		Name:        speciesResult.Get("name").String(),
		Generation:  1, // 默认值
		IsLegendary: speciesResult.Get("is_legendary").Bool(),
		IsMythical:  speciesResult.Get("is_mythical").Bool(),
	}

	// 提取世代编号
	genURL := speciesResult.Get("generation.url").String()
	re := regexp.MustCompile(`/(\d+)/$`)
	matches := re.FindStringSubmatch(genURL)
	if len(matches) >= 2 {
		if gen, err := strconv.Atoi(matches[1]); err == nil {
			species.Generation = gen
		}
	}

	// 获取进化链URL
	evolutionChainURL := speciesResult.Get("evolution_chain.url").String()
	species.EvolutionChain = evolutionChainURL

	// 获取所有varieties（不同形态）
	varieties := speciesResult.Get("varieties")
	if !varieties.Exists() {
		return nil, fmt.Errorf("no varieties found for species %d", speciesID)
	}

	var pokemonForms []Pokemon
	var allVarieties []VarietyData

	// 收集所有形态的基础信息
	varieties.ForEach(func(key, value gjson.Result) bool {
		pokemonName := value.Get("pokemon.name").String()
		pokemonURL := value.Get("pokemon.url").String()
		isDefault := value.Get("is_default").Bool()

		allVarieties = append(allVarieties, VarietyData{
			Name:      pokemonName,
			URL:       pokemonURL,
			IsDefault: isDefault,
		})
		return true
	})

	// 检查是否有特殊形态
	hasMegaEvolution := false
	hasGigantamax := false
	hasRegionalForm := false

	for _, variety := range allVarieties {
		if strings.Contains(variety.Name, "-mega") {
			hasMegaEvolution = true
		}
		if strings.Contains(variety.Name, "-gmax") {
			hasGigantamax = true
		}
		if strings.Contains(variety.Name, "-alola") || strings.Contains(variety.Name, "-galar") ||
			strings.Contains(variety.Name, "-hisui") || strings.Contains(variety.Name, "-paldea") {
			hasRegionalForm = true
		}
	}

	// 获取每个形态的详细信息
	var formDetails []PokemonFormData
	for _, variety := range allVarieties {
		// 跳过mega、gmax、partner、starter形态
		if strings.Contains(variety.Name, "-mega") || strings.Contains(variety.Name, "-gmax") ||
			strings.Contains(variety.Name, "-partner") || strings.Contains(variety.Name, "-starter") {
			continue
		}
		// 跳过特殊宝可梦形态
		if variety.Name == "greninja-ash" || variety.Name == "greninja-battle-bond" ||
			variety.Name == "kyogre-primal" || variety.Name == "groudon-primal" ||
			variety.Name == "zygarde-10-power-construct" || variety.Name == "zygarde-50-power-construct" ||
			variety.Name == "rockruff-own-tempo" ||
			variety.Name == "eternatus-eternamax" ||
			variety.Name == "squawkabilly-blue-plumage" || variety.Name == "squawkabilly-yellow-plumage" || variety.Name == "squawkabilly-white-plumage" ||
			variety.Name == "gimmighoul-roaming" ||
			variety.Name == "koraidon-limited-build" || variety.Name == "koraidon-sprinting-build" || variety.Name == "koraidon-swimming-build" || variety.Name == "koraidon-gliding-build" ||
			variety.Name == "miraidon-low-power-mode" || variety.Name == "miraidon-drive-mode" || variety.Name == "miraidon-aquatic-mode" || variety.Name == "miraidon-glide-mode" {
			fmt.Println("已跳过: " + variety.Name)
			continue
		}
		detail, err := fetchPokemonFormDetails(variety.URL, variety.Name, species)
		if err != nil {
			return nil, fmt.Errorf("获取形态详情失败 %s: %w", variety.Name, err)
		}
		detail.SpeciesName = species.Name
		formDetails = append(formDetails, detail)
	}
	if len(formDetails) == 0 {
		return nil, fmt.Errorf("种族 %d 没有可用形态", speciesID)
	}

	// 比较形态，决定是否要分开存储
	uniqueForms := filterUniqueFormsBy(formDetails)

	// 生成最终的Pokemon数据
	for _, form := range uniqueForms {
		// 确定宝可梦名称：对于仅外观差异的形态，使用species的基础名称
		pokemonName := form.DisplayName
		if len(uniqueForms) == 1 {
			pokemonName = form.SpeciesName
		}

		// 特殊宝可梦进化处理
		evolutionStage, evolutionMethod, evolutionMethodDetail := specialPokemonEvoInfo(pokemonName, form.EvolutionStage, form.EvolutionMethod, form.EvolutionMethodDetail)

		// 生成标签
		var tags []string

		// 使用API获取的传说/幻之信息
		if species.IsLegendary {
			tags = append(tags, "legendary")
		}
		if species.IsMythical {
			tags = append(tags, "mythical")
		}

		// 预定义的标签
		if starterPokemon[species.ID] {
			tags = append(tags, "starter")
		}
		if fossilPokemon[species.ID] {
			tags = append(tags, "fossil")
		}
		if latePokemon[species.ID] {
			tags = append(tags, "late")
		}
		if ultraBeastPokemon[species.ID] {
			tags = append(tags, "ultra")
		}
		if paradoxPokemon[species.ID] {
			tags = append(tags, "paradox")
		}

		// 特殊形态标签（从API检测）
		if hasRegionalForm {
			tags = append(tags, "regional")
		}
		// 地区形态宝可梦目前为止没有mega进化和超极巨化
		if !strings.Contains(pokemonName, "-alola") && !strings.Contains(pokemonName, "-galar") &&
			!strings.Contains(pokemonName, "-hisui") && !strings.Contains(pokemonName, "-paldea") {
			if hasMegaEvolution {
				tags = append(tags, "has-mega")
			}
			if hasGigantamax {
				tags = append(tags, "has-gmax")
			}
		}

		// 确定地区形态宝可梦世代
		generation := species.Generation
		if strings.Contains(pokemonName, "-alola") {
			generation = 7
		} else if strings.Contains(pokemonName, "-galar") {
			generation = 8
		} else if strings.Contains(pokemonName, "-hisui") {
			generation = 8
		} else if strings.Contains(pokemonName, "-paldea") {
			generation = 9
		} else if pokemonName == "ursaluna-bloodmoon" {
			generation = 9
		} else if pokemonName == "basculin-white-striped" {
			generation = 8
		}

		pokemon := Pokemon{
			PokedexIDNational:     species.ID,
			Name:                  pokemonName,
			Profile:               form.Profile,
			Generation:            generation,
			Types:                 form.Types,
			Abilities:             form.Abilities,
			BaseStatsTotal:        form.BaseStatsTotal,
			BaseStats:             form.BaseStats,
			EvolutionStage:        evolutionStage,
			EvolutionMethod:       evolutionMethod,
			EvolutionMethodDetail: evolutionMethodDetail,
			Tags:                  tags,
		}

		pokemonForms = append(pokemonForms, pokemon)
	}

	return pokemonForms, nil
}

// 获取单个形态的详细信息
func fetchPokemonFormDetails(pokemonURL string, pokemonName string, species SpeciesData) (PokemonFormData, error) {
	data, err := fetchURL(pokemonURL)
	if err != nil {
		return PokemonFormData{}, err
	}

	result := gjson.Parse(string(data))

	// 获取属性
	var types []string
	result.Get("types").ForEach(func(key, value gjson.Result) bool {
		types = append(types, value.Get("type.name").String())
		return true
	})

	// 获取特性
	var abilities []string
	result.Get("abilities").ForEach(func(key, value gjson.Result) bool {
		abilities = append(abilities, value.Get("ability.name").String())
		return true
	})
	// 特殊宝可梦形态处理
	if pokemonName == "zygarde-10" || pokemonName == "zygarde-50" {
		abilities = append(abilities, "power-construct")
	}
	if pokemonName == "rockruff" {
		abilities = append(abilities, "own-tempo")
	}
	if pokemonName == "squawkabilly-green-plumage" {
		abilities = append(abilities, "sheer-force")
	}
	// 去重
	slices.Sort(abilities)
	abilities = slices.Compact(abilities)

	// 获取种族值
	baseStats := make(map[string]int)
	var totalStats int
	result.Get("stats").ForEach(func(key, value gjson.Result) bool {
		statName := value.Get("stat.name").String()
		statValue := int(value.Get("base_stat").Int())

		switch statName {
		case "hp":
			baseStats["hp"] = statValue
		case "attack":
			baseStats["attack"] = statValue
		case "defense":
			baseStats["defense"] = statValue
		case "special-attack":
			baseStats["sp_attack"] = statValue
		case "special-defense":
			baseStats["sp_defense"] = statValue
		case "speed":
			baseStats["speed"] = statValue
		}
		totalStats += statValue
		return true
	})

	// 获取进化信息
	var evolutionStage int
	var evolutionMethod, evolutionMethodDetail string

	if species.EvolutionChain != "" {
		chainData, err := fetchEvolutionChain(species.EvolutionChain)
		if err != nil {
			return PokemonFormData{}, fmt.Errorf("获取 %s 进化链失败: %w", species.Name, err)
		}
		if speciesData, exists := chainData[species.Name]; exists {
			if data, ok := speciesData.(map[string]any); ok {
				evolutionStage = int(data["stage"].(int))
				if details, ok := data["evolution_details"].([]map[string]any); ok {
					evolutionMethod, evolutionMethodDetail = analyzeEvolutionMethod(details)
				}
			}
		} else {
			return PokemonFormData{}, fmt.Errorf("进化链缺少种族 %s", species.Name)
		}
	}

	// 获取图片
	// sprite := result.Get("sprites.front_default").String()
	artworkURLPrefix := "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"
	artworkSprite := artworkURLPrefix + result.Get("id").String() + ".png"

	return PokemonFormData{
		DisplayName:           pokemonName,
		Profile:               artworkSprite,
		EvolutionStage:        evolutionStage,
		EvolutionMethod:       evolutionMethod,
		EvolutionMethodDetail: evolutionMethodDetail,
		Types:                 types,
		Abilities:             abilities,
		BaseStatsTotal:        totalStats,
		BaseStats:             baseStats,
	}, nil
}

// 获取进化链信息
func fetchEvolutionChain(chainURL string) (map[string]any, error) {
	data, err := fetchURL(chainURL)
	if err != nil {
		return nil, err
	}

	result := gjson.Parse(string(data))
	chainData := make(map[string]any)
	if result.Get("chain.species.name").String() == "" {
		return nil, fmt.Errorf("进化链缺少根种族: %s", chainURL)
	}

	// 解析进化链
	parseEvolution(result.Get("chain"), chainData, 1)

	return chainData, nil
}

// 递归解析进化链
func parseEvolution(evolution gjson.Result, chainData map[string]any, stage int) {
	speciesName := evolution.Get("species.name").String()

	chainData[speciesName] = map[string]any{
		"stage":             stage,
		"evolution_details": []map[string]any{},
	}
	// 处理进化详情
	evolutionDetails := evolution.Get("evolution_details")
	if evolutionDetails.Exists() && evolutionDetails.IsArray() {
		var details []map[string]any
		evolutionDetails.ForEach(func(key, value gjson.Result) bool {
			detail := map[string]any{
				"trigger":                 value.Get("trigger.name").String(),
				"min_level":               value.Get("min_level").Int(),
				"item":                    value.Get("item.name").String(),
				"held_item":               value.Get("held_item.name").String(),
				"known_move":              value.Get("known_move.name").String(),
				"known_move_type":         value.Get("known_move_type.name").String(),
				"location":                value.Get("location.name").String(),
				"min_happiness":           value.Get("min_happiness").Int(),
				"min_beauty":              value.Get("min_beauty").Int(),
				"min_affection":           value.Get("min_affection").Int(),
				"needs_overworld_rain":    value.Get("needs_overworld_rain").Bool(),
				"party_species":           value.Get("party_species.name").String(),
				"party_type":              value.Get("party_type.name").String(),
				"relative_physical_stats": value.Get("relative_physical_stats").Int(),
				"time_of_day":             value.Get("time_of_day").String(),
				"trade_species":           value.Get("trade_species.name").String(),
				"turn_upside_down":        value.Get("turn_upside_down").Bool(),
				"gender":                  value.Get("gender").Int(),
			}
			details = append(details, detail)
			return true
		})
		chainData[speciesName] = map[string]any{
			"stage":             stage,
			"evolution_details": details,
		}
	}

	// 递归处理下一级进化
	evolution.Get("evolves_to").ForEach(func(key, value gjson.Result) bool {
		parseEvolution(value, chainData, stage+1)
		return true
	})
}

// 分析进化方式
func analyzeEvolutionMethod(details []map[string]any) (string, string) {
	if len(details) == 0 {
		return "", ""
	}

	detail := details[0]
	trigger := detail["trigger"].(string)

	switch trigger {
	case "level-up":
		if detail["min_happiness"].(int64) > 0 {
			return "level", "level-friendship"
		}
		if detail["known_move"].(string) != "" {
			return "level", "level-move"
		}
		if detail["location"].(string) != "" {
			return "level", "level-location"
		}
		if detail["time_of_day"].(string) != "" {
			return "level", "level-time"
		}
		if detail["held_item"].(string) != "" {
			return "level", "level-holding-item"
		}
		if detail["gender"].(int64) > 0 {
			return "level", "level-gender"
		}
		if detail["party_species"].(string) != "" || detail["party_type"].(string) != "" ||
			detail["needs_overworld_rain"].(bool) || detail["turn_upside_down"].(bool) ||
			detail["relative_physical_stats"].(int64) != 0 {
			return "level", "level-unique"
		}
		if detail["min_level"].(int64) > 0 {
			return "level", "level-normal"
		}
		return "level", "level-unique"

	case "use-item":
		item := detail["item"].(string)
		switch {
		case strings.Contains(item, "fire"):
			return "item", "item-stone-fire"
		case strings.Contains(item, "water"):
			return "item", "item-stone-water"
		case strings.Contains(item, "thunder"):
			return "item", "item-stone-thunder"
		case strings.Contains(item, "leaf"):
			return "item", "item-stone-leaf"
		case strings.Contains(item, "moon"):
			return "item", "item-stone-moon"
		case strings.Contains(item, "shiny"):
			return "item", "item-stone-shiny"
		case strings.Contains(item, "dusk"):
			return "item", "item-stone-dusk"
		case strings.Contains(item, "dawn"):
			if detail["gender"].(int64) == 2 {
				return "item", "item-stone-dawn-male"
			} else if detail["gender"].(int64) == 1 {
				return "item", "item-stone-dawn-female"
			}
			return "item", "item-stone-dawn-male"
		case strings.Contains(item, "ice"):
			return "item", "item-stone-ice"
		default:
			return "item", "item-unique"
		}

	case "trade":
		if detail["held_item"].(string) != "" {
			return "trade", "trade-item"
		}
		if detail["trade_species"].(string) != "" {
			return "trade", "trade-certain"
		}
		return "trade", "trade-normal"

	default:
		return "unique", "unique"
	}
}

// 特殊宝可梦进化处理 (PokeAPI 数据修正)
func specialPokemonEvoInfo(pokemonName string, evolutionStage int, evolutionMethod string, evolutionMethodDetail string) (int, string, string) {
	if pokemonName == "pikachu" || pokemonName == "clefairy" || pokemonName == "jigglypuff" ||
		pokemonName == "togetic" || pokemonName == "espeon" || pokemonName == "umbreon" ||
		pokemonName == "snorlax" || pokemonName == "lucario" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "chansey" || pokemonName == "weavile" || pokemonName == "gliscor" {
		return 2, "level", "level-holding-item"
	}
	if pokemonName == "magnezone" {
		return 3, "item", "item-stone-thunder"
	}
	if pokemonName == "leafeon" {
		return 2, "item", "item-stone-leaf"
	}
	if pokemonName == "glaceon" {
		return 2, "item", "item-stone-ice"
	}
	if pokemonName == "mr-mime" || pokemonName == "mr-mime-galar" || pokemonName == "sudowoodo" ||
		pokemonName == "lickilicky" || pokemonName == "tangrowth" || pokemonName == "yanmega" {
		return 2, "level", "level-move"
	}
	if pokemonName == "crobat" || pokemonName == "blissey" {
		return 3, "level", "level-friendship"
	}
	if pokemonName == "roselia" || pokemonName == "chimecho" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "milotic" {
		return 2, "trade", "trade-item"
	}
	if pokemonName == "ambipom" {
		return 2, "level", "level-move"
	}
	if pokemonName == "lopunny" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "mamoswine" {
		return 3, "level", "level-move"
	}
	if pokemonName == "swoobat" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "leavanny" {
		return 3, "level", "level-friendship"
	}
	if pokemonName == "darmanitan-galar-standard" || pokemonName == "darmanitan-galar-zen" {
		return 2, "item", "item-stone-ice"
	}
	if pokemonName == "floette-eternal" {
		return 1, "", ""
	}
	if pokemonName == "ninetales-alola" || pokemonName == "sandslash-alola" || pokemonName == "crabominable" {
		return 2, "item", "item-stone-ice"
	}
	if pokemonName == "tsareena" {
		return 3, "level", "level-move"
	}
	if pokemonName == "vikavolt" {
		return 3, "item", "item-stone-thunder"
	}
	if pokemonName == "bellossom" {
		return 3, "item", "item-stone-sun"
	}
	if pokemonName == "silvally" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "sunflora" || pokemonName == "whimsicott" || pokemonName == "lilligant" ||
		pokemonName == "lilligant-hisui" || pokemonName == "heliolisk" || pokemonName == "florges-sun" {
		return 2, "item", "item-stone-sun"
	}
	if pokemonName == "dipplin" || pokemonName == "slowbro-galar" || pokemonName == "slowking-galar" ||
		pokemonName == "urshifu-single-strike" || pokemonName == "urshifu-rapid-strike" || pokemonName == "Sinistcha" ||
		pokemonName == "archaludon" {
		return 2, "item", "item-unique"
	}
	if pokemonName == "solgaleo" || pokemonName == "lunala" {
		return 3, "level", "level-version"
	}
	if pokemonName == "naganadel" {
		return 2, "level", "level-move"
	}
	if pokemonName == "melmetal" {
		return 2, "unique", "unique"
	}
	if pokemonName == "ursaluna" {
		return 3, "item", "item-unique"
	}
	if pokemonName == "ursaluna-bloodmoon" || pokemonName == "manaphy" {
		return 1, "", ""
	}
	if pokemonName == "hydrapple" {
		return 3, "level", "level-move"
	}
	if pokemonName == "shedinja" || pokemonName == "hitmontop" {
		return 2, "level", "level-unique"
	}
	if pokemonName == "persian-alola" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "electrode-hisui" {
		return 2, "item", "item-stone-leaf"
	}
	if pokemonName == "toxtricity-low-key" || pokemonName == "toxtricity-amped" {
		return 2, "level", "level-unique"
	}
	if pokemonName == "grapploct" {
		return 2, "level", "level-move"
	}
	if pokemonName == "frosmoth" {
		return 2, "level", "level-friendship"
	}
	if pokemonName == "basculegion" {
		return 2, "level", "level-unique"
	}
	if pokemonName == "sneasler" {
		return 2, "item", "item-unique"
	}
	if pokemonName == "overqwil" {
		return 2, "level", "level-move"
	}
	if pokemonName == "pawmot" {
		return 3, "level", "level-unique"
	}
	if pokemonName == "maushold" || pokemonName == "brambleghast" || pokemonName == "rabsca" {
		return 2, "level", "level-unique"
	}
	if pokemonName == "palafin-hero" || pokemonName == "palafin-zero" || pokemonName == "gholdengo" {
		return 2, "level", "level-unique"
	}
	if pokemonName == "annihilape" || pokemonName == "kingambit" {
		return 3, "level", "level-unique"
	}
	if pokemonName == "farigiraf" || pokemonName == "dudunsparce" {
		return 2, "level", "level-move"
	}
	// 不是特殊情况，返回原值
	return evolutionStage, evolutionMethod, evolutionMethodDetail
}

// 过滤出唯一的形态
func filterUniqueFormsBy(formDetails []PokemonFormData) []PokemonFormData {
	if len(formDetails) == 0 {
		return formDetails
	}

	var uniqueForms []PokemonFormData

	for _, form := range formDetails {
		isUnique := true
		for _, existing := range uniqueForms {
			if !formsAreDifferent(form, existing) {
				// 如果不是不同的形态，跳过
				isUnique = false
				break
			}
		}
		if isUnique {
			uniqueForms = append(uniqueForms, form)
		}
	}

	return uniqueForms
}

// 比较两个形态是否在关键属性上不同
func formsAreDifferent(form1, form2 PokemonFormData) bool {
	// 比较属性
	if len(form1.Types) != len(form2.Types) {
		return true
	}
	for i, t := range form1.Types {
		if t != form2.Types[i] {
			return true
		}
	}

	// 比较特性
	if len(form1.Abilities) != len(form2.Abilities) {
		return true
	}
	slices.Sort(form1.Abilities)
	slices.Sort(form2.Abilities)
	for i, a := range form1.Abilities {
		if a != form2.Abilities[i] {
			return true
		}
	}

	// 比较种族值总和
	if form1.BaseStatsTotal != form2.BaseStatsTotal {
		return true
	}

	// 比较具体进化方式
	if form1.EvolutionMethod != form2.EvolutionMethod ||
		form1.EvolutionMethodDetail != form2.EvolutionMethodDetail {
		return true
	}

	// 如果所有关键属性都相同，则认为是同一种形态
	return false
}

// 收集所有需要翻译的项目
func collectI18nItems(option5 bool) error {
	fmt.Println("正在收集多语言翻译数据...")
	pokemonNames := make(map[string]int)
	types := make(map[string]bool)
	abilities := make(map[string]bool)
	for _, pokemon := range pokemonData {
		pokemonNames[pokemon.Name] = pokemon.PokedexIDNational
		for _, name := range pokemon.Types {
			types[name] = true
		}
		for _, name := range pokemon.Abilities {
			abilities[name] = true
		}
	}

	var tasks []func() error
	for name, speciesID := range pokemonNames {
		tasks = append(tasks, func() error {
			if err := fetchPokemonI18n(name, speciesID, option5); err != nil {
				return fmt.Errorf("获取宝可梦翻译失败 %s: %w", name, err)
			}
			return nil
		})
	}
	for name := range types {
		tasks = append(tasks, func() error {
			if err := fetchTypeI18n(name, option5); err != nil {
				return fmt.Errorf("获取属性翻译失败 %s: %w", name, err)
			}
			return nil
		})
	}
	for name := range abilities {
		tasks = append(tasks, func() error {
			if err := fetchAbilityI18n(name, option5); err != nil {
				return fmt.Errorf("获取特性翻译失败 %s: %w", name, err)
			}
			return nil
		})
	}
	return runTasks(tasks, 5)
}

func collectMoveI18n() error {
	return collectResourceI18n("move", fetchMoveI18n)
}

func collectItemI18n() error {
	return collectResourceI18n("item", fetchItemI18n)
}

func collectResourceI18n(resource string, fetch func(string, string) error) error {
	url := fmt.Sprintf("https://pokeapi.co/api/v2/%s?limit=10000", resource)
	data, err := fetchURL(url)
	if err != nil {
		return err
	}
	results := gjson.GetBytes(data, "results")
	if !results.IsArray() || len(results.Array()) == 0 {
		return fmt.Errorf("无法获取 %s 列表", resource)
	}
	var tasks []func() error
	for _, entry := range results.Array() {
		name, url := entry.Get("name").String(), entry.Get("url").String()
		tasks = append(tasks, func() error {
			if err := fetch(name, url); err != nil {
				return fmt.Errorf("获取 %s 翻译失败 %s: %w", resource, name, err)
			}
			return nil
		})
	}
	return runTasks(tasks, 5)
}

// 获取宝可梦名称翻译（改进版，支持形态后缀翻译）
func fetchPokemonI18n(pokemonName string, speciesID int, option5 bool) error {
	i18nMutex.RLock()
	if processedNames[pokemonName] {
		i18nMutex.RUnlock()
		return nil
	}
	i18nMutex.RUnlock()

	// 获取species的翻译
	speciesURL := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-species/%d", speciesID)
	data, err := fetchURL(speciesURL)
	if err != nil {
		return err
	}
	result := gjson.Parse(string(data))
	names := result.Get("names")
	if !names.IsArray() || len(names.Array()) == 0 {
		return fmt.Errorf("响应缺少名称翻译")
	}

	// 获取形态的翻译
	// 从 translation.go 获取
	if translation, exists := specialPokemonTranslations[pokemonName]; exists {
		baseTranslation := translation
		i18nMutex.Lock()
		if option5 {
			i18nSpecies[pokemonName] = baseTranslation
		} else {
			i18nData[pokemonName] = baseTranslation
		}
		i18nMutex.Unlock()
	} else {
		// 从 PokeAPI 获取形态翻译
		suffixTranslation := I18nTranslation{}
		if pokemonName != result.Get("name").String() {
			formURL := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-form/%s", pokemonName)
			formData, err := fetchURL(formURL)
			if err != nil {
				return fmt.Errorf("获取形态翻译失败 %s: %w", pokemonName, err)
			}
			formResult := gjson.Parse(string(formData))
			suffixTranslation = extractI18nNames(formResult.Get("form_names"))
		}

		baseTranslation := extractI18nNames(names)
		if suffixTranslation.En == "Hisuian Form" {
			suffixTranslation.En = hisuianTranslations["en"]
			suffixTranslation.Ja = hisuianTranslations["ja"]
			suffixTranslation.Es = hisuianTranslations["es"]
			suffixTranslation.De = hisuianTranslations["de"]
			suffixTranslation.It = hisuianTranslations["it"]
			suffixTranslation.Fr = hisuianTranslations["fr"]
			suffixTranslation.ZhHant = hisuianTranslations["zh-Hant"]
			suffixTranslation.ZhHans = hisuianTranslations["zh-Hans"]
			suffixTranslation.Ko = hisuianTranslations["ko"]
		} else if suffixTranslation.En == "Paldean Form" {
			suffixTranslation.En = paldeanTranslations["en"]
			suffixTranslation.Ja = paldeanTranslations["ja"]
			suffixTranslation.Es = paldeanTranslations["es"]
			suffixTranslation.De = paldeanTranslations["de"]
			suffixTranslation.It = paldeanTranslations["it"]
			suffixTranslation.Fr = paldeanTranslations["fr"]
			suffixTranslation.ZhHant = paldeanTranslations["zh-Hant"]
			suffixTranslation.ZhHans = paldeanTranslations["zh-Hans"]
			suffixTranslation.Ko = paldeanTranslations["ko"]
		}
		if suffixTranslation.En != "" {
			baseTranslation.En = baseTranslation.En + " (" + suffixTranslation.En + ")"
			if suffixTranslation.Es == "" {
				suffixTranslation.Es = suffixTranslation.En
			}
			if suffixTranslation.De == "" {
				suffixTranslation.De = suffixTranslation.En
			}
			if suffixTranslation.It == "" {
				suffixTranslation.It = suffixTranslation.En
			}
			if suffixTranslation.Fr == "" {
				suffixTranslation.Fr = suffixTranslation.En
			}
			if suffixTranslation.ZhHant == "" {
				suffixTranslation.ZhHant = suffixTranslation.En
			}
			if suffixTranslation.ZhHans == "" {
				suffixTranslation.ZhHans = suffixTranslation.En
			}
			if suffixTranslation.Ko == "" {
				suffixTranslation.Ko = suffixTranslation.En
			}
		}
		if suffixTranslation.Ja != "" {
			baseTranslation.Ja = baseTranslation.Ja + " (" + suffixTranslation.Ja + ")"
		}
		if suffixTranslation.Es != "" {
			baseTranslation.Es = baseTranslation.Es + " (" + suffixTranslation.Es + ")"
		}
		if suffixTranslation.De != "" {
			baseTranslation.De = baseTranslation.De + " (" + suffixTranslation.De + ")"
		}
		if suffixTranslation.It != "" {
			baseTranslation.It = baseTranslation.It + " (" + suffixTranslation.It + ")"
		}
		if suffixTranslation.Fr != "" {
			baseTranslation.Fr = baseTranslation.Fr + " (" + suffixTranslation.Fr + ")"
		}
		if suffixTranslation.ZhHant != "" {
			baseTranslation.ZhHant = baseTranslation.ZhHant + " (" + suffixTranslation.ZhHant + ")"
		}
		if suffixTranslation.ZhHans != "" {
			baseTranslation.ZhHans = baseTranslation.ZhHans + " (" + suffixTranslation.ZhHans + ")"
		}
		if suffixTranslation.Ko != "" {
			baseTranslation.Ko = baseTranslation.Ko + " (" + suffixTranslation.Ko + ")"
		}

		i18nMutex.Lock()
		if option5 {
			i18nSpecies[pokemonName] = baseTranslation
		} else {
			i18nData[pokemonName] = baseTranslation
		}
		i18nMutex.Unlock()
	}

	i18nMutex.Lock()
	processedNames[pokemonName] = true
	i18nMutex.Unlock()
	return nil
}

// 获取属性翻译
func fetchTypeI18n(typeName string, option5 bool) error {
	i18nMutex.RLock()
	if processedTypes[typeName] {
		i18nMutex.RUnlock()
		return nil
	}
	i18nMutex.RUnlock()

	typeURL := fmt.Sprintf("https://pokeapi.co/api/v2/type/%s", typeName)
	data, err := fetchURL(typeURL)
	if err != nil {
		return err
	}

	result := gjson.Parse(string(data))
	names := result.Get("names")
	if !names.IsArray() || len(names.Array()) == 0 {
		return fmt.Errorf("响应缺少名称翻译")
	}

	translation := extractI18nNames(names)
	i18nMutex.Lock()
	if option5 {
		i18nTypes[typeName] = translation
	} else {
		i18nData[typeName] = translation
	}
	i18nMutex.Unlock()

	i18nMutex.Lock()
	processedTypes[typeName] = true
	i18nMutex.Unlock()
	return nil
}

// 获取特性翻译
func fetchAbilityI18n(abilityName string, option5 bool) error {
	i18nMutex.RLock()
	if processedAbilities[abilityName] {
		i18nMutex.RUnlock()
		return nil
	}
	i18nMutex.RUnlock()

	if translation, exists := abilityTranslations[abilityName]; exists {
		trans := translation
		i18nMutex.Lock()
		if option5 {
			i18nAbilities[abilityName] = trans
		} else {
			i18nData[abilityName] = trans
		}
		i18nMutex.Unlock()
	} else {
		abilityURL := fmt.Sprintf("https://pokeapi.co/api/v2/ability/%s", abilityName)
		data, err := fetchURL(abilityURL)
		if err != nil {
			return err
		}

		result := gjson.Parse(string(data))
		names := result.Get("names")
		if !names.IsArray() || len(names.Array()) == 0 {
			return fmt.Errorf("响应缺少名称翻译")
		}

		translation := extractI18nNames(names)
		i18nMutex.Lock()
		if option5 {
			i18nAbilities[abilityName] = translation
		} else {
			i18nData[abilityName] = translation
		}
		i18nMutex.Unlock()
	}

	i18nMutex.Lock()
	processedAbilities[abilityName] = true
	i18nMutex.Unlock()
	return nil
}

// 获取 move 翻译；本地修正只覆盖非空字段，缺失语言回退到英文。
func fetchMoveI18n(moveName string, moveURL string) error {
	data, err := fetchURL(moveURL)
	if err != nil {
		return err
	}
	names := gjson.GetBytes(data, "names")
	if !names.IsArray() || len(names.Array()) == 0 {
		return fmt.Errorf("缺少招式名称: %s", moveName)
	}
	translation := extractI18nNames(names)
	override := moveTranslations[moveName]
	translation.En = cmp.Or(override.En, translation.En, moveName)
	for _, field := range []struct {
		value    *string
		override string
	}{
		{&translation.Ja, override.Ja},
		{&translation.Es, override.Es},
		{&translation.De, override.De},
		{&translation.It, override.It},
		{&translation.Fr, override.Fr},
		{&translation.ZhHant, override.ZhHant},
		{&translation.ZhHans, override.ZhHans},
		{&translation.Ko, override.Ko},
	} {
		*field.value = cmp.Or(field.override, *field.value, translation.En)
	}
	i18nMutex.Lock()
	i18nMoves[moveName] = translation
	i18nMutex.Unlock()
	return nil
}

// 获取 item 翻译
func fetchItemI18n(itemName string, itemURL string) error {
	data, err := fetchURL(itemURL)
	if err != nil {
		return err
	}
	result := gjson.Parse(string(data))
	names := result.Get("names")
	if !names.IsArray() || len(names.Array()) == 0 {
		return fmt.Errorf("响应缺少名称翻译")
	}

	translation := extractI18nNames(names)
	i18nMutex.Lock()
	i18nItems[itemName] = translation
	i18nMutex.Unlock()
	return nil
}

// 从API响应中提取多语言名称
func extractI18nNames(namesArray gjson.Result) I18nTranslation {
	translation := I18nTranslation{}

	namesArray.ForEach(func(key, value gjson.Result) bool {
		languageCode := value.Get("language.name").String()
		name := value.Get("name").String()

		if mappedLang, exists := languageMapping[languageCode]; exists {
			switch mappedLang {
			case "en":
				translation.En = name
			case "ja":
				translation.Ja = name
			case "es":
				translation.Es = name
			case "de":
				translation.De = name
			case "it":
				translation.It = name
			case "fr":
				translation.Fr = name
			case "zh-Hant":
				translation.ZhHant = name
			case "zh-Hans":
				translation.ZhHans = name
			case "ko":
				translation.Ko = name
			}
		}
		return true
	})

	return translation
}
