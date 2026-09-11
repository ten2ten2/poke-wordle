package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"strings"
)

type translationCorrection struct {
	Entity    string `json:"entity"`
	Locale    string `json:"locale"`
	Expected  string `json:"expected_upstream"`
	Value     string `json:"value"`
	Reason    string `json:"reason"`
	Source    string `json:"source"`
	CheckedAt string `json:"checked_at"`
}

//go:embed corrections.json
var correctionJSON []byte
var corrections []translationCorrection
var specialPokemonTranslations = loadCorrections()

func loadCorrections() map[string]I18nTranslation {
	if err := json.Unmarshal(correctionJSON, &corrections); err != nil {
		panic(err)
	}
	values := map[string]map[string]string{}
	for _, correction := range corrections {
		if correction.Entity == "" || correction.Value == "" || correction.Value != strings.TrimSpace(correction.Value) || correction.Reason == "" || correction.Source == "" || correction.CheckedAt == "" {
			panic("不完整的翻译修正")
		}
		if values[correction.Entity] == nil {
			values[correction.Entity] = map[string]string{}
		}
		if _, exists := values[correction.Entity][correction.Locale]; exists {
			panic("重复翻译修正")
		}
		values[correction.Entity][correction.Locale] = correction.Value
	}
	result := map[string]I18nTranslation{}
	for name, fields := range values {
		encoded, err := json.Marshal(fields)
		if err != nil {
			panic(err)
		}
		var translation I18nTranslation
		if err := json.Unmarshal(encoded, &translation); err != nil {
			panic(err)
		}
		result[name] = translation
	}
	return result
}

func correctPokemonTranslation(name string, upstream, override I18nTranslation) (I18nTranslation, error) {
	data, err := json.Marshal(upstream)
	if err != nil {
		return upstream, err
	}
	var fields map[string]string
	if err := json.Unmarshal(data, &fields); err != nil {
		return upstream, err
	}
	for _, correction := range corrections {
		if correction.Entity != name {
			continue
		}
		actual := fields[correction.Locale]
		if actual != correction.Expected {
			return upstream, fmt.Errorf("修正来源发生变化，请重新校对 %s/%s: %q → %q", name, correction.Locale, correction.Expected, actual)
		}
		recordTranslation(map[string]string{"kind": "correction-source", "entity": "pokemon:" + name, "locale": correction.Locale, "reason": correction.Reason, "source": correction.Source, "checked_at": correction.CheckedAt})
	}
	return mergeTranslation("pokemon:"+name, upstream, override), nil
}
