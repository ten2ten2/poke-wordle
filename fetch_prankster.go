package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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

func fetchPranksterImages() {
	fmt.Println("Prankster 图片获取程序启动...")
	// Fetch Prankster ability data
	abilityURL := "https://pokeapi.co/api/v2/ability/prankster"

	fmt.Println("Fetching Prankster ability data...")
	resp, err := http.Get(abilityURL)
	if err != nil {
		fmt.Printf("Error fetching ability data: %v\n", err)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response body: %v\n", err)
		return
	}

	var abilityData AbilityResponse
	err = json.Unmarshal(body, &abilityData)
	if err != nil {
		fmt.Printf("Error parsing ability JSON: %v\n", err)
		return
	}

	fmt.Printf("Found %d Pokemon with Prankster ability\n", len(abilityData.Pokemon))

	var showdownSprites []string

	// Fetch each Pokemon's showdown sprite
	for i, pokemonEntry := range abilityData.Pokemon {
		fmt.Printf("[%d/%d] Processing %s...\n", i+1, len(abilityData.Pokemon), pokemonEntry.Pokemon.Name)
		// Skip Pokemon with ID 10222
		if strings.Contains(pokemonEntry.Pokemon.URL, "/10222/") {
			fmt.Printf("  Skipping ID 10222...\n")
			continue
		}

		// Fetch Pokemon details
		pokemonResp, err := http.Get(pokemonEntry.Pokemon.URL)
		if err != nil {
			fmt.Printf("  Error fetching %s: %v\n", pokemonEntry.Pokemon.Name, err)
			continue
		}

		pokemonBody, err := io.ReadAll(pokemonResp.Body)
		pokemonResp.Body.Close()
		if err != nil {
			fmt.Printf("  Error reading %s response: %v\n", pokemonEntry.Pokemon.Name, err)
			continue
		}

		var pokemonData PokemonResponse
		err = json.Unmarshal(pokemonBody, &pokemonData)
		if err != nil {
			fmt.Printf("  Error parsing %s JSON: %v\n", pokemonEntry.Pokemon.Name, err)
			continue
		}

		// Add showdown sprite URL to array (only if not empty)
		spriteURL := pokemonData.Sprites.Other.Showdown.FrontDefault
		if spriteURL != "" {
			showdownSprites = append(showdownSprites, spriteURL)
			fmt.Printf("  Added: %s\n", spriteURL)
		} else {
			fmt.Printf("  No showdown sprite available\n")
		}

		// Add a small delay to be respectful to the API
		time.Sleep(100 * time.Millisecond)
	}

	// Save results to JSON file
	outputFile := "output/prankster_profile.json"
	jsonData, err := json.MarshalIndent(showdownSprites, "", "  ")
	if err != nil {
		fmt.Printf("Error marshaling results to JSON: %v\n", err)
		return
	}

	err = os.WriteFile(outputFile, jsonData, 0644)
	if err != nil {
		fmt.Printf("Error writing to file: %v\n", err)
		return
	}

	fmt.Printf("\nFinished processing!\n")
	fmt.Printf("Results saved to %s\n", outputFile)
	fmt.Printf("Total showdown sprites found: %d\n", len(showdownSprites))
}
