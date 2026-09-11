package main

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/tidwall/gjson"
)

func TestStableIDsReserveDeletedNames(t *testing.T) {
	previous := stableIDs
	t.Cleanup(func() { stableIDs = previous })
	stableIDs = map[string]int{"existing": 7, "deleted": 100}
	rows := []Pokemon{{Name: "aaa-new"}, {Name: "existing"}}
	if err := assignStableIDs(rows); err != nil {
		t.Fatal(err)
	}
	if rows[0].ID != 101 || rows[1].ID != 7 || stableIDs["deleted"] != 100 {
		t.Fatalf("IDs changed: %v / %v", rows, stableIDs)
	}
	stableIDs["collision"] = 7
	if err := assignStableIDs(rows); err == nil {
		t.Fatal("accepted ID collision")
	}
}

func TestSourceCacheReplayAndIntegrity(t *testing.T) {
	var requests atomic.Int32
	mockAPI(t, func(*http.Request) (int, string) {
		requests.Add(1)
		return 200, `{"names":["<繁體>&简体"], "id":1}`
	})
	c := &responseCache{dir: t.TempDir()}
	tasks := make([]func() error, 20)
	for i := range tasks {
		tasks[i] = func() error { _, err := c.fetch("https://pokeapi.co/api/v2/pokemon/1"); return err }
	}
	if err := runTasks(tasks, 10); err != nil {
		t.Fatal(err)
	}
	if requests.Load() != 1 {
		t.Fatalf("duplicate requests: %d", requests.Load())
	}
	c.offline = true
	if _, err := c.fetch("https://pokeapi.co/api/v2/pokemon/1/"); err != nil {
		t.Fatal(err)
	}
	if _, err := c.fetch("https://pokeapi.co/api/v2/pokemon/2/"); err == nil {
		t.Fatal("replay fetched missing source")
	}
	if requests.Load() != 1 {
		t.Fatal("offline replay used network")
	}
	file := filepath.Join(c.dir, digest([]byte("https://pokeapi.co/api/v2/pokemon/1/"))+".json")
	data, _ := os.ReadFile(file)
	var entry cachedResponse
	if err := json.Unmarshal(data, &entry); err != nil {
		t.Fatal(err)
	}
	entry.Body = json.RawMessage(`{"tampered":true}`)
	data, _ = json.Marshal(entry)
	if err := os.WriteFile(file, data, 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := c.fetch("https://pokeapi.co/api/v2/pokemon/1/"); err == nil {
		t.Fatal("accepted damaged cache")
	}
}

func TestLanguageCodesAreCaseInsensitiveAndTrimmed(t *testing.T) {
	for _, code := range []string{"zh-hans", "zh-Hans", "ZH-HANS"} {
		translation := extractI18nNames(gjson.Parse(`[{"language":{"name":"` + code + `"},"name":"  妙蛙种子  "}]`))
		if translation.ZhHans != "妙蛙种子" {
			t.Fatalf("%s: %v", code, translation)
		}
	}
	translation := extractI18nNames(gjson.Parse(`[{"language":{"name":"ja-hrkt"},"name":"フシギダネ"}]`))
	if translation.Ja == "" {
		t.Fatal("lost lowercase kana locale")
	}
}

func TestTranslationCorrectionsRejectSourceDrift(t *testing.T) {
	base := I18nTranslation{En: "Minun", ZhHans: "負电拍拍", De: "Minun"}
	result, err := correctPokemonTranslation("minun", base, specialPokemonTranslations["minun"])
	if err != nil || result.En != "Minun" || result.De != "Minun" || result.ZhHans != "负电拍拍" {
		t.Fatalf("partial merge: %v, %v", result, err)
	}
	base.ZhHans = "changed upstream"
	if _, err := correctPokemonTranslation("minun", base, specialPokemonTranslations["minun"]); err == nil {
		t.Fatal("ignored obsolete correction")
	}
}

func TestEvolutionUsesUpstreamDefaultInsteadOfHistoricalFirst(t *testing.T) {
	chain := map[string]EvolutionData{}
	parseEvolution(gjson.Parse(`{"species":{"name":"probopass"},"evolution_details":[{"trigger":{"name":"level-up"},"location":{"name":"mt-coronet"},"is_default":false},{"trigger":{"name":"use-item"},"item":{"name":"thunder-stone"},"is_default":true}],"evolves_to":[]}`), chain, 2)
	method, detail := analyzeEvolutionMethod(chain["probopass"].Details, "probopass")
	if method != "item" || detail != "item-stone-thunder" {
		t.Fatalf("%s/%s", method, detail)
	}
}

func TestNewSpeciesMustBeExplicitlyReviewed(t *testing.T) {
	mockAPI(t, fixtureResponse)
	speciesMap[1026] = SpeciesData{ID: 1026}
	if err := processAllPokemon(); err == nil || !strings.Contains(err.Error(), "上游新增种族") {
		t.Fatalf("silently filtered a new species: %v", err)
	}
}
