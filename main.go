package main

import (
	"fmt"
	"os"
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
		if !exists {
			continue
		}
		if err := os.Rename("output/"+file, "backup/"+file); err != nil {
			fmt.Printf("备份 %s 失败: %v\n", file, err)
			return err
		}
	}
	return nil
}

// generatePokemonData 生成宝可梦数据
func generatePokemonData() error {
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
	if err := collectI18nItems(); err != nil {
		fmt.Printf("收集多语言翻译数据失败: %v\n", err)
		return err
	}

	// Create output directory if it doesn't exist
	if err := os.MkdirAll("output", 0755); err != nil {
		fmt.Printf("创建输出目录失败: %v\n", err)
		return err
	}

	// 保存翻译数据到JSON文件
	if err := saveI18nToJSON("output/pokemon_i18n.json"); err != nil {
		fmt.Printf("保存翻译数据失败: %v\n", err)
		return err
	}
	fmt.Println("翻译数据已成功保存到 pokemon_i18n.json 文件")
	fixI18nData("output/pokemon_i18n.json")

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
	ExportComparisonResult(result, "compare_result_"+outputName+".json")
	return nil
}

// main 主函数
func main() {
	// Check if data files exist
	dataFileExists := true
	i18nFileExists := true
	pranksterFileExists := true

	if _, err := os.Stat("output/pokemon_data.json"); os.IsNotExist(err) {
		dataFileExists = false
	}

	if _, err := os.Stat("output/pokemon_i18n.json"); os.IsNotExist(err) {
		i18nFileExists = false
	}

	if _, err := os.Stat("output/prankster_profile.json"); os.IsNotExist(err) {
		pranksterFileExists = false
	}

	// 显示选项菜单
	fmt.Println("请选择操作:")
	fmt.Println("1. 生成所有文件")
	fmt.Println("2. 生成 pokemon_data.json 和 pokemon_i18n.json")
	fmt.Println("3. 生成 prankster_profile.json")
	fmt.Println("4. 比较文件")

	// 读取用户输入
	var choice int
	fmt.Print("请输入选项 (1-4): ")
	_, err := fmt.Scanf("%d", &choice)
	if err != nil || choice < 1 || choice > 4 {
		fmt.Println("无效的选项，程序退出")
		return
	}

	// 根据选项设置文件存在状态
	switch choice {
	case 1:
		backupFiles(map[string]bool{
			"pokemon_data.json":      dataFileExists,
			"pokemon_i18n.json":      i18nFileExists,
			"prankster_profile.json": pranksterFileExists,
		})
		dataFileExists = false
		i18nFileExists = false
		pranksterFileExists = false
		generatePokemonData()
		fetchPranksterImages()
		compareJson("backup/pokemon_data.json", "output/pokemon_data.json", "pokemon_data")
		compareJson("backup/pokemon_i18n.json", "output/pokemon_i18n.json", "pokemon_i18n")
		compareJson("backup/prankster_profile.json", "output/prankster_profile.json", "prankster_profile")
	case 2:
		backupFiles(map[string]bool{
			"output/pokemon_data.json": dataFileExists,
			"output/pokemon_i18n.json": i18nFileExists,
		})
		dataFileExists = false
		i18nFileExists = false
		generatePokemonData()
		compareJson("backup/pokemon_data.json", "output/pokemon_data.json", "pokemon_data")
		compareJson("backup/pokemon_i18n.json", "output/pokemon_i18n.json", "pokemon_i18n")
	case 3:
		backupFiles(map[string]bool{
			"output/prankster_profile.json": pranksterFileExists,
		})
		pranksterFileExists = false
		fetchPranksterImages()
		compareJson("backup/prankster_profile.json", "output/prankster_profile.json", "prankster_profile")
	case 4:
		compareJson("backup/pokemon_data.json", "output/pokemon_data.json", "pokemon_data")
		compareJson("backup/pokemon_i18n.json", "output/pokemon_i18n.json", "pokemon_i18n")
		compareJson("backup/prankster_profile.json", "output/prankster_profile.json", "prankster_profile")
	}
}
