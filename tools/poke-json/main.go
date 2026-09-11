package main

import (
	"fmt"
	"os"
)

func generatePokemonData() error {
	if err := fetchAllSpecies(); err != nil {
		return fmt.Errorf("获取种族列表: %w", err)
	}
	if err := processAllPokemon(); err != nil {
		return fmt.Errorf("生成宝可梦数据: %w", err)
	}
	if err := collectI18nItems(); err != nil {
		return fmt.Errorf("收集翻译: %w", err)
	}
	if err := os.MkdirAll("output", 0755); err != nil {
		return err
	}
	if err := writeJSONFile("output/pokemon_i18n.json", i18nData); err != nil {
		return err
	}
	return writeJSONFile("output/pokemon_data.json", pokemonData)
}

func main() {
	if err := snapshotCommand(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
