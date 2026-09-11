package main

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"
)

// Ability API response structure
type AbilityResponse struct {
	Pokemon []struct {
		Pokemon struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		} `json:"pokemon"`
	} `json:"pokemon"`
}

// Pokemon API response structure
type PokemonResponse struct {
	Sprites struct {
		Other struct {
			Showdown struct {
				FrontDefault string `json:"front_default"`
			} `json:"showdown"`
		} `json:"other"`
	} `json:"sprites"`
}

func fetchPranksterImages() error {
	body, err := fetchURL("https://pokeapi.co/api/v2/ability/prankster")
	if err != nil {
		return err
	}
	var ability AbilityResponse
	if err := json.Unmarshal(body, &ability); err != nil {
		return err
	}
	sprites := make([]string, 0, len(ability.Pokemon))
	for _, entry := range ability.Pokemon {
		if strings.Contains(entry.Pokemon.URL, "/10222/") {
			continue
		}
		body, err := fetchURL(entry.Pokemon.URL)
		if err != nil {
			return fmt.Errorf("%s: %w", entry.Pokemon.Name, err)
		}
		var pokemon PokemonResponse
		if err := json.Unmarshal(body, &pokemon); err != nil {
			return err
		}
		if sprite := pokemon.Sprites.Other.Showdown.FrontDefault; sprite != "" {
			sprites = append(sprites, sprite)
		}
		time.Sleep(100 * time.Millisecond)
	}
	if err := os.MkdirAll("output", 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(sprites, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile("output/prankster_profile.json", data, 0644)
}
