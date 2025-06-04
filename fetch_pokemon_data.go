package main

import (
	"fmt"
	"regexp"
	"slices"
	"sort"
	"strconv"
	"strings"
	"sync"

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
	if !results.Exists() {
		return fmt.Errorf("无法获取种族列表")
	}

	results.ForEach(func(key, value gjson.Result) bool {
		name := value.Get("name").String()
		url := value.Get("url").String()

		// 从URL中提取ID
		re := regexp.MustCompile(`/(\d+)/$`)
		matches := re.FindStringSubmatch(url)
		if len(matches) < 2 {
			return true
		}

		id, err := strconv.Atoi(matches[1])
		if err != nil {
			return true
		}

		speciesMap[id] = SpeciesData{
			ID:   id,
			Name: name,
		}
		return true
	})

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

	sort.Ints(speciesIDs)

	// 并发处理
	const maxWorkers = 10
	semaphore := make(chan struct{}, maxWorkers)
	var wg sync.WaitGroup

	for _, id := range speciesIDs {
		wg.Add(1)
		go func(pokemonID int) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			pokemon, err := fetchPokemonDetails(pokemonID)
			if err != nil {
				fmt.Printf("获取宝可梦详情失败 ID %d: %v\n", pokemonID, err)
				return
			}

			mutex.Lock()
			pokemonData = append(pokemonData, pokemon...)
			mutex.Unlock()

			if len(pokemonData)%50 == 0 {
				fmt.Printf("已处理 %d 个宝可梦...\n", len(pokemonData))
			}
		}(id)
	}

	wg.Wait()

	// 按照全国图鉴编号排序
	sort.Slice(pokemonData, func(i, j int) bool {
		if pokemonData[i].PokedexIDNational == pokemonData[j].PokedexIDNational {
			return pokemonData[i].Name < pokemonData[j].Name
		}
		return pokemonData[i].PokedexIDNational < pokemonData[j].PokedexIDNational
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
			fmt.Printf("获取形态详情失败 %s: %v\n", variety.Name, err)
			continue
		}
		detail.SpeciesName = species.Name
		formDetails = append(formDetails, detail)
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
			ID:                    len(pokemonData) + len(pokemonForms) + 1,
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
		if err == nil {
			if speciesData, exists := chainData[species.Name]; exists {
				if data, ok := speciesData.(map[string]interface{}); ok {
					evolutionStage = int(data["stage"].(int))
					if details, ok := data["evolution_details"].([]map[string]interface{}); ok {
						evolutionMethod, evolutionMethodDetail = analyzeEvolutionMethod(details)
					}
				}
			}
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
func fetchEvolutionChain(chainURL string) (map[string]interface{}, error) {
	data, err := fetchURL(chainURL)
	if err != nil {
		return nil, err
	}

	result := gjson.Parse(string(data))
	chainData := make(map[string]interface{})

	// 解析进化链
	parseEvolution(result.Get("chain"), chainData, 1)

	return chainData, nil
}

// 递归解析进化链
func parseEvolution(evolution gjson.Result, chainData map[string]interface{}, stage int) {
	speciesName := evolution.Get("species.name").String()

	chainData[speciesName] = map[string]interface{}{
		"stage":             stage,
		"evolution_details": []map[string]interface{}{},
	}
	// 处理进化详情
	evolutionDetails := evolution.Get("evolution_details")
	if evolutionDetails.Exists() && evolutionDetails.IsArray() {
		var details []map[string]interface{}
		evolutionDetails.ForEach(func(key, value gjson.Result) bool {
			detail := map[string]interface{}{
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
		chainData[speciesName] = map[string]interface{}{
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
func analyzeEvolutionMethod(details []map[string]interface{}) (string, string) {
	if len(details) == 0 {
		return "", ""
	}

	detail := details[0]
	trigger := detail["trigger"].(string)

	switch trigger {
	case "level-up":
		if detail["min_level"].(int64) > 0 {
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
			if detail["gender"].(int64) == 1 {
				return "item", "item-stone-dawn-male"
			} else if detail["gender"].(int64) == 2 {
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
	if pokemonName == "crobat" || pokemonName == "bilssey" {
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
	sort.Strings(form1.Abilities)
	sort.Strings(form2.Abilities)
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
func collectI18nItems() error {
	fmt.Println("正在收集多语言翻译数据...")

	const maxWorkers = 5 // 降低并发数以避免过多API请求
	semaphore := make(chan struct{}, maxWorkers)
	var wg sync.WaitGroup

	// 收集所有需要翻译的项目
	pokemonNames := make(map[string]int)
	types := make(map[string]bool)
	abilities := make(map[string]bool)

	for _, pokemon := range pokemonData {
		pokemonNames[pokemon.Name] = pokemon.PokedexIDNational

		for _, t := range pokemon.Types {
			types[t] = true
		}

		for _, a := range pokemon.Abilities {
			abilities[a] = true
		}
	}

	// 获取宝可梦名称翻译
	for name, speciesID := range pokemonNames {
		wg.Add(1)
		go func(pokemonName string, sID int) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			if err := fetchPokemonI18n(pokemonName, sID); err != nil {
				fmt.Printf("获取宝可梦翻译失败 %s: %v\n", pokemonName, err)
			}
		}(name, speciesID)
	}

	// 获取属性翻译
	for typeName := range types {
		wg.Add(1)
		go func(t string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			if err := fetchTypeI18n(t); err != nil {
				fmt.Printf("获取属性翻译失败 %s: %v\n", t, err)
			}
		}(typeName)
	}

	// 获取特性翻译
	for abilityName := range abilities {
		wg.Add(1)
		go func(a string) {
			defer wg.Done()
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			if err := fetchAbilityI18n(a); err != nil {
				fmt.Printf("获取特性翻译失败 %s: %v\n", a, err)
			}
		}(abilityName)
	}

	wg.Wait()
	fmt.Printf("完成！共收集 %d 项翻译数据\n", len(i18nData))
	return nil
}

// 获取宝可梦名称翻译（改进版，支持形态后缀翻译）
func fetchPokemonI18n(pokemonName string, speciesID int) error {
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

	if names.Exists() {
		// 获取形态的翻译
		// 从 translation.go 获取
		if translation, exists := specialPokemonTranslations[pokemonName]; exists {
			baseTranslation := I18nTranslation{
				En:     translation.En,
				Ja:     translation.Ja,
				Es:     translation.Es,
				De:     translation.De,
				It:     translation.It,
				Fr:     translation.Fr,
				ZhHant: translation.ZhHant,
				ZhHans: translation.ZhHans,
				Ko:     translation.Ko,
			}
			i18nMutex.Lock()
			i18nData[pokemonName] = baseTranslation
			i18nMutex.Unlock()
		} else {
			// 从 PokeAPI 获取形态翻译
			suffixTranslation := I18nTranslation{}
			formURL := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-form/%s", pokemonName)
			formData, err := fetchURL(formURL)
			if err != nil {
				fmt.Printf("获取形态翻译失败 %s: %v\n", pokemonName, err)
			} else {
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
			i18nData[pokemonName] = baseTranslation
			i18nMutex.Unlock()
		}
	}

	i18nMutex.Lock()
	processedNames[pokemonName] = true
	i18nMutex.Unlock()
	return nil
}

// 获取属性翻译
func fetchTypeI18n(typeName string) error {
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

	if names.Exists() {
		translation := extractI18nNames(names)
		i18nMutex.Lock()
		i18nData[typeName] = translation
		i18nMutex.Unlock()
	}

	i18nMutex.Lock()
	processedTypes[typeName] = true
	i18nMutex.Unlock()
	return nil
}

// 获取特性翻译
func fetchAbilityI18n(abilityName string) error {
	i18nMutex.RLock()
	if processedAbilities[abilityName] {
		i18nMutex.RUnlock()
		return nil
	}
	i18nMutex.RUnlock()

	if translation, exists := abilityTranslations[abilityName]; exists {
		trans := I18nTranslation{
			En:     translation.En,
			Ja:     translation.Ja,
			Es:     translation.Es,
			De:     translation.De,
			It:     translation.It,
			Fr:     translation.Fr,
			ZhHant: translation.ZhHant,
			ZhHans: translation.ZhHans,
			Ko:     translation.Ko,
		}
		i18nMutex.Lock()
		i18nData[abilityName] = trans
		i18nMutex.Unlock()
	} else {
		abilityURL := fmt.Sprintf("https://pokeapi.co/api/v2/ability/%s", abilityName)
		data, err := fetchURL(abilityURL)
		if err != nil {
			return err
		}

		result := gjson.Parse(string(data))
		names := result.Get("names")

		if names.Exists() {
			translation := extractI18nNames(names)
			i18nMutex.Lock()
			i18nData[abilityName] = translation
			i18nMutex.Unlock()
		}
	}

	i18nMutex.Lock()
	processedAbilities[abilityName] = true
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
