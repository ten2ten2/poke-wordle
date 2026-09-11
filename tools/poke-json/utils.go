package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"
)

// HTTP客户端
var client = &http.Client{
	Timeout: 30 * time.Second,
}

// 获取HTTP响应
func fetchURL(url string) ([]byte, error) {
	if activeCache != nil {
		return activeCache.fetch(url)
	}
	return fetchUncached(url)
}

func fetchUncached(url string) ([]byte, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if !json.Valid(data) {
		return nil, fmt.Errorf("无效的 JSON 响应: %s", url)
	}
	return data, nil
}

// runTasks 限制并发数，并在所有任务结束后返回完整的错误列表。
func runTasks(tasks []func() error, workers int) error {
	jobs := make(chan int)
	errs := make([]error, len(tasks))
	var wg sync.WaitGroup
	for range min(workers, len(tasks)) {
		wg.Go(func() {
			for i := range jobs {
				errs[i] = tasks[i]()
			}
		})
	}
	for i := range tasks {
		jobs <- i
	}
	close(jobs)
	wg.Wait()
	return errors.Join(errs...)
}

// Writes include the close error; a failed candidate is never marked complete.
func writeJSONFile(filename string, value any) error {
	data, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filename, append(data, '\n'), 0644)
}
func saveI18nToJSONSeparately(filename string, data map[string]I18nTranslation) error {
	return writeJSONFile(filename, data)
}
func saveI18nToJSON(filename string) error { return writeJSONFile(filename, i18nData) }
func saveToJSON(filename string) error     { return writeJSONFile(filename, pokemonData) }
