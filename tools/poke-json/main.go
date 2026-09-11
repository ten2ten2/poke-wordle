package main

import (
	"fmt"
	"os"
	"path/filepath"
)

// backupFiles 备份文件
func backupFiles(files map[string]bool) error {
	// Create backup directory if it doesn't exist
	if err := os.MkdirAll("backup", 0755); err != nil {
		fmt.Printf("创建备份目录失败: %v\n", err)
		return err
	}

	// Backup existing files if they exist
	for file, exists := range files {
		file = filepath.Base(file)
		if !exists {
			continue
		}
		if err := os.Rename(filepath.Join("output", file), filepath.Join("backup", file)); err != nil {
			fmt.Printf("备份 %s 失败: %v\n", file, err)
			return err
		}
	}
	return nil
}

// generatePokemonData 生成宝可梦数据
func generatePokemonData(option5 bool) error {
	fmt.Println("宝可梦数据获取程序启动...")

	// 获取所有种族信息
	if err := fetchAllSpecies(); err != nil {
		fmt.Printf("获取种族列表失败: %v\n", err)
		return err
	}

	// 处理所有宝可梦
	if err := processAllPokemon(); err != nil {
		fmt.Printf("处理宝可梦数据失败: %v\n", err)
		return err
	}

	// 收集多语言翻译数据
	if err := collectI18nItems(option5); err != nil {
		fmt.Printf("收集多语言翻译数据失败: %v\n", err)
		return err
	}

	// 额外收集 moves 和 items 的翻译数据
	if option5 {
		if err := collectMoveI18n(); err != nil {
			fmt.Printf("收集 moves 翻译数据失败: %v\n", err)
			return err
		}
		if err := collectItemI18n(); err != nil {
			fmt.Printf("收集 items 翻译数据失败: %v\n", err)
			return err
		}
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll("output", 0755); err != nil {
		fmt.Printf("创建输出目录失败: %v\n", err)
		return err
	}

	if option5 {
		translations := map[string]map[string]I18nTranslation{
			"species": i18nSpecies, "type": i18nTypes, "ability": i18nAbilities,
			"move": i18nMoves, "item": i18nItems,
		}
		for category, data := range translations {
			filename := filepath.Join("output", category+"_i18n.json")
			if err := saveI18nToJSONSeparately(filename, data); err != nil {
				return fmt.Errorf("保存 %s 翻译失败: %w", category, err)
			}
		}
		return nil
	}

	// 保存翻译数据到JSON文件
	if err := saveI18nToJSON("output/pokemon_i18n.json"); err != nil {
		fmt.Printf("保存翻译数据失败: %v\n", err)
		return err
	}
	fmt.Println("翻译数据已成功保存到 pokemon_i18n.json 文件")

	// 保存数据到JSON文件
	if err := saveToJSON("output/pokemon_data.json"); err != nil {
		fmt.Printf("保存文件失败: %v\n", err)
		return err
	}
	fmt.Println("数据已成功保存到 pokemon_data.json 文件")
	return nil
}

func compareJson(json1, json2, outputName string) error {
	result, err := CompareJSONFiles(json1, json2)
	if err != nil {
		fmt.Printf("错误: %v\n", err)
		return err
	}
	return ExportComparisonResult(result, "compare_result_"+outputName+".json")
}

func run() error {
	fmt.Println("请选择操作:")
	fmt.Println("1. 生成所有文件")
	fmt.Println("2. 生成 pokemon_data.json 和 pokemon_i18n.json")
	fmt.Println("3. 生成 prankster_profile.json")
	fmt.Println("4. 比较文件")
	fmt.Println("5. 分开生成翻译文件")
	var choice int
	if _, err := fmt.Scan(&choice); err != nil {
		return err
	}
	if choice < 1 || choice > 5 {
		return fmt.Errorf("无效的选项: %d", choice)
	}

	files := []string{"pokemon_data.json", "pokemon_i18n.json"}
	switch choice {
	case 1, 4:
		files = append(files, "prankster_profile.json")
	case 3:
		files = []string{"prankster_profile.json"}
	case 5:
		files = []string{"species_i18n.json", "type_i18n.json", "ability_i18n.json", "move_i18n.json", "item_i18n.json"}
	}
	if choice != 4 {
		if err := os.MkdirAll("output", 0755); err != nil {
			return err
		}
		existing := make(map[string]bool, len(files))
		for _, name := range files {
			_, err := os.Stat(filepath.Join("output", name))
			if err != nil && !os.IsNotExist(err) {
				return err
			}
			existing[name] = err == nil
		}
		if err := backupFiles(existing); err != nil {
			return err
		}
		if choice != 3 {
			if err := generatePokemonData(choice == 5); err != nil {
				return err
			}
		}
		if choice == 1 || choice == 3 {
			if err := fetchPranksterImages(); err != nil {
				return err
			}
		}
	}
	for _, name := range files {
		backup := filepath.Join("backup", name)
		if _, err := os.Stat(backup); os.IsNotExist(err) && choice != 4 {
			continue
		}
		if err := compareJson(backup, filepath.Join("output", name), name[:len(name)-5]); err != nil {
			return err
		}
	}
	return nil
}

func main() {
	var err error
	if len(os.Args) > 1 {
		err = snapshotCommand(os.Args[1:])
	} else {
		err = run()
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
