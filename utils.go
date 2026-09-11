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

// HTTP客户端
var client = &http.Client{
	Timeout: 30 * time.Second,
}

// 获取HTTP响应
func fetchURL(url string) ([]byte, error) {
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

// 保存翻译数据到JSON文件，分开保存
func saveI18nToJSONSeparately(filename string, data map[string]I18nTranslation) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(data)
}

// 保存翻译数据到JSON文件
func saveI18nToJSON(filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(i18nData)
}

// 修正繁简中文的语言代码格式
func fixI18nData(i18nFile string) error {
	data, err := os.ReadFile(i18nFile)
	if err != nil {
		fmt.Printf("读取翻译文件失败: %v\n", err)
		return err
	}

	// 替换语言代码
	content := string(data)
	content = strings.ReplaceAll(content, "zh-Hant", "zh-hant")
	content = strings.ReplaceAll(content, "zh-Hans", "zh-hans")

	// 写回文件
	if err := os.WriteFile(i18nFile, []byte(content), 0644); err != nil {
		fmt.Printf("写入翻译文件失败: %v\n", err)
		return err
	}
	fmt.Println("已修正中文语言代码格式")
	return nil
}

// 保存数据到JSON文件
func saveToJSON(filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(pokemonData)
}
