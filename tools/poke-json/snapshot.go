package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"sync"
	"time"
)

// A replay is read-only: an absent or damaged response is an error, never a live request.
type responseCache struct {
	dir     string
	offline bool
	locks   sync.Map
}
type cachedResponse struct {
	URL       string          `json:"url"`
	FetchedAt string          `json:"fetched_at"`
	SHA256    string          `json:"sha256"`
	Body      json.RawMessage `json:"body"`
}

var activeCache *responseCache
var stableIDs map[string]int
var translationEvents []map[string]string
var eventMutex sync.Mutex

func digest(data []byte) string { sum := sha256.Sum256(data); return hex.EncodeToString(sum[:]) }

func (c *responseCache) fetch(rawURL string) ([]byte, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, err
	}
	if u.Scheme != "https" || u.Host != "pokeapi.co" {
		return nil, fmt.Errorf("不支持的来源: %s", rawURL)
	}
	u.Path = strings.TrimRight(u.Path, "/") + "/"
	key := u.String()
	lock, _ := c.locks.LoadOrStore(key, &sync.Mutex{})
	mu := lock.(*sync.Mutex)
	mu.Lock()
	defer mu.Unlock()
	file := filepath.Join(c.dir, digest([]byte(key))+".json")
	if data, err := os.ReadFile(file); err == nil {
		var entry cachedResponse
		if err := json.Unmarshal(data, &entry); err != nil {
			return nil, err
		}
		if entry.URL != key || entry.FetchedAt == "" || digest(entry.Body) != entry.SHA256 {
			return nil, fmt.Errorf("缓存校验失败: %s", key)
		}
		return entry.Body, nil
	} else if !os.IsNotExist(err) {
		return nil, err
	}
	if c.offline {
		return nil, fmt.Errorf("离线缓存缺失: %s", key)
	}
	var body []byte
	for attempt := range 3 {
		body, err = fetchUncached(key)
		if err == nil {
			break
		}
		if attempt < 2 {
			time.Sleep(time.Duration(attempt+1) * time.Second)
		}
	}
	if err != nil {
		return nil, fmt.Errorf("%s: %w", key, err)
	}
	// Compact the response before hashing so the stored RawMessage has identical bytes.
	var compact json.RawMessage
	if err := json.Unmarshal(body, &compact); err != nil {
		return nil, err
	}
	encoded, err := json.Marshal(compact)
	if err != nil {
		return nil, err
	}
	entry := cachedResponse{key, time.Now().UTC().Format(time.RFC3339), digest(encoded), encoded}
	data, err := json.Marshal(entry)
	if err != nil {
		return nil, err
	}
	if err := os.WriteFile(file, data, 0644); err != nil {
		return nil, err
	}
	return encoded, nil
}

func assignStableIDs(rows []Pokemon) error {
	if stableIDs == nil { // Legacy, non-publication export and unit fixtures.
		for i := range rows {
			rows[i].ID = i + 1
		}
		return nil
	}
	used := map[int]bool{}
	maximum := 0
	for name, id := range stableIDs {
		if name == "" || id < 1 || used[id] {
			return fmt.Errorf("无效的 ID 注册表: %s=%d", name, id)
		}
		used[id] = true
		maximum = max(maximum, id)
	}
	seen := map[string]bool{}
	for i := range rows {
		name := rows[i].Name
		if name == "" || seen[name] {
			return fmt.Errorf("重复或空名称: %s", name)
		}
		seen[name] = true
		id, exists := stableIDs[name]
		if !exists {
			maximum++
			id = maximum
			stableIDs[name] = id
		}
		rows[i].ID = id
	}
	return nil
}

func recordTranslation(event map[string]string) {
	eventMutex.Lock()
	defer eventMutex.Unlock()
	translationEvents = append(translationEvents, event)
}
func translationFallback(name, locale, value string) string {
	recordTranslation(map[string]string{"kind": "english-form-fallback", "entity": "pokemon:" + name, "locale": locale, "value": value})
	return value
}
func mergeTranslation(entity string, base, override I18nTranslation) I18nTranslation {
	for _, field := range []struct {
		locale   string
		base     *string
		override string
	}{
		{"en", &base.En, override.En}, {"ja", &base.Ja, override.Ja}, {"es", &base.Es, override.Es},
		{"de", &base.De, override.De}, {"it", &base.It, override.It}, {"fr", &base.Fr, override.Fr},
		{"zh-hant", &base.ZhHant, override.ZhHant}, {"zh-hans", &base.ZhHans, override.ZhHans}, {"ko", &base.Ko, override.Ko},
	} {
		value := strings.TrimSpace(field.override)
		if value != "" && value != *field.base {
			recordTranslation(map[string]string{"kind": "override", "entity": entity, "locale": field.locale, "upstream": *field.base, "value": value})
			*field.base = value
		}
	}
	return base
}

func snapshotCommand(args []string) error {
	if len(args) != 5 || args[0] != "snapshot" || (args[4] != "online" && args[4] != "offline") {
		return fmt.Errorf("使用 mise run data:generate；内部接口: snapshot <run-dir> <cache-dir> <registry> <online|offline>")
	}
	runDir, err := filepath.Abs(args[1])
	if err != nil {
		return err
	}
	cacheDir, err := filepath.Abs(args[2])
	if err != nil {
		return err
	}
	registry, err := os.ReadFile(args[3])
	if err != nil {
		return err
	}
	if err := json.Unmarshal(registry, &stableIDs); err != nil {
		return err
	}
	if len(stableIDs) == 0 {
		return fmt.Errorf("ID 注册表为空")
	}
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return err
	}
	activeCache = &responseCache{dir: cacheDir, offline: args[4] == "offline"}
	if err := os.Chdir(runDir); err != nil {
		return err
	}
	if err := generatePokemonData(false); err != nil {
		return err
	}
	if err := fetchPranksterImages(); err != nil {
		return err
	}
	slices.SortFunc(translationEvents, func(a, b map[string]string) int {
		left, _ := json.Marshal(a)
		right, _ := json.Marshal(b)
		return strings.Compare(string(left), string(right))
	})
	for name, value := range map[string]any{"id-registry.json": stableIDs, "translation-events.json": translationEvents} {
		data, err := json.MarshalIndent(value, "", "  ")
		if err != nil {
			return err
		}
		if err := os.WriteFile(name, append(data, '\n'), 0644); err != nil {
			return err
		}
	}
	return nil
}
