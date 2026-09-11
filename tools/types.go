package main

// Pokemon 宝可梦数据结构
type Pokemon struct {
	ID                    int            `json:"id"`
	PokedexIDNational     int            `json:"pokedex_id_national"`
	Name                  string         `json:"name"`
	Profile               string         `json:"profile"`
	Generation            int            `json:"generation"`
	Types                 []string       `json:"types"`
	Abilities             []string       `json:"abilities"`
	BaseStatsTotal        int            `json:"base_stats_total"`
	BaseStats             map[string]int `json:"base_stats"`
	EvolutionStage        int            `json:"evolution_stage"`
	EvolutionMethod       string         `json:"evolution_method"`
	EvolutionMethodDetail string         `json:"evolution_method_detail"`
	Tags                  []string       `json:"tags"`
}

// SpeciesData 宝可梦种族数据
type SpeciesData struct {
	ID             int    `json:"id"`
	Name           string `json:"name"`
	Generation     int    `json:"generation"`
	EvolutionChain string `json:"evolution_chain"`
	IsLegendary    bool   `json:"is_legendary"`
	IsMythical     bool   `json:"is_mythical"`
}

// VarietyData 宝可梦形态数据
type VarietyData struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	IsDefault bool   `json:"is_default"`
}

// PokemonFormData 宝可梦形态详细数据
type PokemonFormData struct {
	SpeciesName           string         `json:"species_name"`
	DisplayName           string         `json:"display_name"`
	Profile               string         `json:"profile"`
	EvolutionStage        int            `json:"evolution_stage"`
	EvolutionMethod       string         `json:"evolution_method"`
	EvolutionMethodDetail string         `json:"evolution_method_detail"`
	Types                 []string       `json:"types"`
	Abilities             []string       `json:"abilities"`
	BaseStatsTotal        int            `json:"base_stats_total"`
	BaseStats             map[string]int `json:"base_stats"`
}

// I18nTranslation 多语言翻译数据
type I18nTranslation struct {
	En     string `json:"en"`
	Ja     string `json:"ja"`
	Es     string `json:"es"`
	De     string `json:"de"`
	It     string `json:"it"`
	Fr     string `json:"fr"`
	ZhHant string `json:"zh-hant"`
	ZhHans string `json:"zh-hans"`
	Ko     string `json:"ko"`
}
