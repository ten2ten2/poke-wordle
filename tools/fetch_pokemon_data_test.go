package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"sync/atomic"
	"testing"

	"github.com/tidwall/gjson"
)

type mockTransport func(*http.Request) (*http.Response, error)

func (f mockTransport) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

func mockAPI(t *testing.T, respond func(*http.Request) (int, string)) {
	t.Helper()
	pokemonData = nil
	speciesMap = make(map[int]SpeciesData)
	i18nData = make(map[string]I18nTranslation)
	previous := client
	client = &http.Client{Transport: mockTransport(func(r *http.Request) (*http.Response, error) {
		status, body := respond(r)
		return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Header: make(http.Header)}, nil
	})}
	t.Cleanup(func() { client = previous })
}

// All fixture requests stay in-process; unexpected URLs fail instead of reaching the network.
func fixtureResponse(r *http.Request) (int, string) {
	resource := strings.TrimPrefix(r.URL.Path, "/api/v2/")
	id, _ := strconv.Atoi(path.Base(resource))
	switch {
	case resource == "pokemon-species":
		return 200, `{"results":[{"name":"pokemon-1","url":"https://pokeapi.co/api/v2/pokemon-species/1/"}]}`
	case strings.HasPrefix(resource, "pokemon-species/"):
		return 200, fmt.Sprintf(`{"id":%d,"name":"pokemon-%d","generation":{"url":"https://pokeapi.co/api/v2/generation/1/"},"evolution_chain":{"url":"https://pokeapi.co/api/v2/evolution-chain/%d"},"varieties":[{"is_default":true,"pokemon":{"name":"pokemon-%d","url":"https://pokeapi.co/api/v2/pokemon/%d"}}],"names":[{"language":{"name":"en"},"name":"Pokemon %d"}]}`, id, id, id, id, id, id)
	case strings.HasPrefix(resource, "pokemon/"):
		return 200, fmt.Sprintf(`{"id":%d,"types":[{"type":{"name":"normal"}}],"abilities":[{"ability":{"name":"run-away"}}],"stats":[{"base_stat":50,"stat":{"name":"hp"}},{"base_stat":50,"stat":{"name":"attack"}},{"base_stat":50,"stat":{"name":"defense"}},{"base_stat":50,"stat":{"name":"special-attack"}},{"base_stat":50,"stat":{"name":"special-defense"}},{"base_stat":50,"stat":{"name":"speed"}}]}`, id)
	case strings.HasPrefix(resource, "evolution-chain/"):
		return 200, fmt.Sprintf(`{"chain":{"species":{"name":"pokemon-%d"},"evolution_details":[],"evolves_to":[]}}`, id)
	case resource == "type/normal", resource == "ability/run-away":
		return 200, `{"names":[{"language":{"name":"en"},"name":"Fixture"}]}`
	default:
		return 404, `{}`
	}
}

func TestGenerationRejectsFailedRequests(t *testing.T) {
	for _, failure := range []string{"pokemon-species/1", "pokemon/1", "evolution-chain/1", "species-translation", "type/normal", "ability/run-away"} {
		t.Run(failure, func(t *testing.T) {
			t.Chdir(t.TempDir())
			var speciesCalls atomic.Int32
			mockAPI(t, func(r *http.Request) (int, string) {
				resource := strings.TrimPrefix(r.URL.Path, "/api/v2/")
				if resource == failure || (resource == "pokemon-species/1" && failure == "species-translation" && speciesCalls.Add(1) == 2) {
					return 503, `{}`
				}
				return fixtureResponse(r)
			})
			files := []string{"pokemon_data.json", "pokemon_i18n.json"}
			if err := os.MkdirAll("output", 0755); err != nil {
				t.Fatal(err)
			}
			for _, file := range files {
				if err := os.WriteFile(filepath.Join("output", file), []byte(`{"previous":true}`), 0644); err != nil {
					t.Fatal(err)
				}
			}
			if err := generatePokemonData(); err == nil || !strings.Contains(err.Error(), "503") {
				t.Fatalf("expected HTTP failure, got %v", err)
			}
			for _, file := range files {
				data, err := os.ReadFile(filepath.Join("output", file))
				if err != nil || string(data) != `{"previous":true}` {
					t.Fatalf("failed generation replaced %s: %q, %v", file, data, err)
				}
			}
		})
	}
}

func TestGenerationSuccess(t *testing.T) {
	t.Chdir(t.TempDir())
	mockAPI(t, fixtureResponse)
	if err := generatePokemonData(); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile("output/pokemon_data.json")
	if err != nil {
		t.Fatal(err)
	}
	var rows []Pokemon
	if err := json.Unmarshal(data, &rows); err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 || rows[0].ID != 1 || rows[0].EvolutionStage != 1 {
		t.Fatalf("invalid records: %+v", rows)
	}
	data, err = os.ReadFile("output/pokemon_i18n.json")
	if err != nil {
		t.Fatal(err)
	}
	var translations map[string]map[string]string
	if err := json.Unmarshal(data, &translations); err != nil {
		t.Fatal(err)
	}
	if len(translations) != 3 {
		t.Fatalf("expected species, type and ability translations, got %d", len(translations))
	}
	for _, key := range []string{"pokemon-1", "normal", "run-away"} {
		entry := translations[key]
		if entry["en"] == "" {
			t.Fatalf("missing translation: %s", key)
		}
		if _, ok := entry["zh-hans"]; !ok {
			t.Fatalf("missing normalized locale: %s", key)
		}
	}
}

func TestProcessAllPokemonConcurrent(t *testing.T) {
	mockAPI(t, fixtureResponse)
	for id := 1; id <= 300; id++ {
		speciesMap[id] = SpeciesData{ID: id}
	}
	for range 2 {
		if err := processAllPokemon(); err != nil {
			t.Fatal(err)
		}
		if len(pokemonData) != 300 {
			t.Fatalf("got %d records", len(pokemonData))
		}
		for i, row := range pokemonData {
			if row.ID != i+1 || row.PokedexIDNational != i+1 {
				t.Fatalf("unstable ordering: %+v", row)
			}
		}
	}
}

func TestMegaTagsRespectEligibleBaseForms(t *testing.T) {
	for _, tc := range []struct {
		species string
		id      int
		forms   []string
		want    []string
	}{
		{"floette", 670, []string{"floette", "floette-eternal"}, []string{"floette-eternal"}},
		{"zygarde", 718, []string{"zygarde-50", "zygarde-10", "zygarde-complete"}, []string{"zygarde-complete"}},
		{"slowbro", 80, []string{"slowbro", "slowbro-galar"}, []string{"slowbro"}},
		{"charizard", 6, []string{"charizard"}, []string{"charizard"}},
	} {
		for _, upstreamMega := range []bool{false, true} {
			t.Run(fmt.Sprintf("%s/mega=%t", tc.species, upstreamMega), func(t *testing.T) {
				mockAPI(t, func(r *http.Request) (int, string) {
					if strings.Contains(r.URL.Path, "/pokemon-species/") {
						var varieties []map[string]any
						forms := slices.Clone(tc.forms)
						if upstreamMega {
							forms = append(forms, tc.species+"-mega")
							if tc.species == "charizard" {
								forms[len(forms)-1] = "charizard-mega-x"
								forms = append(forms, "charizard-mega-y")
							}
						}
						for i, name := range forms {
							varieties = append(varieties, map[string]any{"is_default": i == 0, "pokemon": map[string]any{"name": name, "url": fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%d", i+1)}})
						}
						body, err := json.Marshal(map[string]any{"id": tc.id, "name": tc.species, "is_legendary": tc.species == "zygarde", "varieties": varieties})
						if err != nil {
							t.Fatal(err)
						}
						return 200, string(body)
					}
					id, _ := strconv.Atoi(path.Base(r.URL.Path))
					if id < 1 || id > len(tc.forms) {
						t.Errorf("unexpected Mega form request: %s", r.URL)
						return 404, `{}`
					}
					status, body := fixtureResponse(r)
					// Distinct base stats keep each gameplay form separate during generation.
					return status, strings.ReplaceAll(body, `"base_stat":50`, fmt.Sprintf(`"base_stat":%d`, 50+id))
				})
				rows, err := fetchPokemonDetails(tc.id)
				if err != nil {
					t.Fatal(err)
				}
				if len(rows) != len(tc.forms) {
					t.Fatalf("expected %d base forms, got %+v", len(tc.forms), rows)
				}
				for _, row := range rows {
					want := upstreamMega && slices.Contains(tc.want, row.Name)
					if got := slices.Contains(row.Tags, "has-mega"); got != want {
						t.Errorf("%s: has-mega=%t, want %t", row.Name, got, want)
					}
					if tc.species == "zygarde" && !slices.Contains(row.Tags, "legendary") {
						t.Errorf("lost legendary tag: %s", row.Name)
					}
				}
			})
		}
	}
}

func TestTranslationCollectorReturnsAllFailures(t *testing.T) {
	mockAPI(t, func(*http.Request) (int, string) { return 503, `{}` })
	pokemonData = []Pokemon{{Name: "fixture", PokedexIDNational: 1, Types: []string{"normal"}, Abilities: []string{"run-away"}}}
	err := collectI18nItems()
	if err == nil {
		t.Fatal("expected errors")
	}
	for _, name := range []string{"fixture", "normal", "run-away"} {
		if !strings.Contains(err.Error(), name) {
			t.Fatalf("missing %s error: %v", name, err)
		}
	}
}

func TestPokemonFormTranslationFailureCanBeRetried(t *testing.T) {
	fail := true
	mockAPI(t, func(r *http.Request) (int, string) {
		if strings.Contains(r.URL.Path, "pokemon-species") {
			return 200, `{"name":"vulpix","names":[{"language":{"name":"en"},"name":"Vulpix"}]}`
		}
		if fail {
			return 503, `{}`
		}
		return 200, `{"form_names":[{"language":{"name":"en"},"name":"Alolan Form"}]}`
	})
	if err := fetchPokemonI18n("vulpix-alola", 37); err == nil {
		t.Fatal("expected form error")
	}
	if len(i18nData) != 0 {
		t.Fatal("failed translation was stored")
	}
	fail = false
	if err := fetchPokemonI18n("vulpix-alola", 37); err != nil {
		t.Fatal(err)
	}
	if got := i18nData["vulpix-alola"].En; got != "Vulpix (Alolan Form)" {
		t.Fatalf("got %q", got)
	}
}

func TestCollapsedSpeciesDoesNotRequestNonexistentForm(t *testing.T) {
	mockAPI(t, func(r *http.Request) (int, string) {
		if strings.Contains(r.URL.Path, "pokemon-species") {
			return 200, `{"name":"deoxys","names":[{"language":{"name":"en"},"name":"Deoxys"}]}`
		}
		t.Errorf("unexpected request: %s", r.URL)
		return 404, `{}`
	})
	if err := fetchPokemonI18n("deoxys", 386); err != nil {
		t.Fatal(err)
	}
	if got := i18nData["deoxys"].En; got != "Deoxys" {
		t.Fatalf("got %q", got)
	}
}

func TestInvalidResponsesAreRejected(t *testing.T) {
	for _, body := range []string{`<html>upstream error</html>`, `{}`, `{"results":[]}`, `{"results":[{"name":"broken","url":"invalid"}]}`} {
		t.Run(body, func(t *testing.T) {
			mockAPI(t, func(*http.Request) (int, string) { return 200, body })
			if err := fetchAllSpecies(); err == nil {
				t.Fatal("accepted invalid species response")
			}
		})
	}
}

func TestEvolutionConditions(t *testing.T) {
	// PokeAPI genders.csv: 1=female, 2=male. Friendship evolutions have no min_level.
	for _, tt := range []struct{ name, detail, want string }{
		{"gallade", `{"trigger":{"name":"use-item"},"item":{"name":"dawn-stone"},"gender":2}`, "item-stone-dawn-male"},
		{"froslass", `{"trigger":{"name":"use-item"},"item":{"name":"dawn-stone"},"gender":1}`, "item-stone-dawn-female"},
		{"marill", `{"trigger":{"name":"level-up"},"min_level":null,"min_happiness":160}`, "level-friendship"},
		{"blissey", `{"trigger":{"name":"level-up"},"min_level":null,"min_happiness":160}`, "level-friendship"},
		{"ivysaur", `{"trigger":{"name":"level-up"},"min_level":16}`, "level-normal"},
		{"aipom-evolution", `{"trigger":{"name":"level-up"},"known_move":{"name":"double-hit"}}`, "level-move"},
		{"held-item-evolution", `{"trigger":{"name":"level-up"},"held_item":{"name":"oval-stone"}}`, "level-holding-item"},
	} {
		t.Run(tt.name, func(t *testing.T) {
			chain := make(map[string]any)
			parseEvolution(gjson.Parse(fmt.Sprintf(`{"species":{"name":%q},"evolution_details":[%s],"evolves_to":[]}`, tt.name, tt.detail)), chain, 2)
			details := chain[tt.name].(map[string]any)["evolution_details"].([]map[string]any)
			method, detail := analyzeEvolutionMethod(details, tt.name)
			if detail != tt.want {
				t.Fatalf("got %s, want %s", detail, tt.want)
			}
			_, _, detail = specialPokemonEvoInfo(tt.name, 2, method, detail)
			if detail != tt.want {
				t.Fatalf("override changed detail to %s", detail)
			}
		})
	}
}
