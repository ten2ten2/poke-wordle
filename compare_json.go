package main

import (
	"encoding/json"
	"fmt"
	"io"
	"os"
	"reflect"
	"strings"
)

// ComparisonResult 比较结果结构
type ComparisonResult struct {
	IsEqual     bool              `json:"is_equal"`
	Differences []Difference      `json:"differences"`
	Summary     ComparisonSummary `json:"summary"`
	Details     map[string]any    `json:"details,omitempty"`
}

// Difference 差异结构
type Difference struct {
	Path        string `json:"path"`
	Type        string `json:"type"` // "added", "removed", "modified", "type_changed"
	OldValue    any    `json:"old_value,omitempty"`
	NewValue    any    `json:"new_value,omitempty"`
	Description string `json:"description"`
}

// MarshalJSON 保留显式 null；只有新增或删除时才省略不存在的一侧。
func (d Difference) MarshalJSON() ([]byte, error) {
	fields := map[string]any{
		"path": d.Path, "type": d.Type, "description": d.Description,
	}
	if d.Type != "added" {
		fields["old_value"] = d.OldValue
	}
	if d.Type != "removed" {
		fields["new_value"] = d.NewValue
	}
	return json.Marshal(fields)
}

// ComparisonSummary 比较摘要
type ComparisonSummary struct {
	TotalDifferences int `json:"total_differences"`
	Added            int `json:"added"`
	Removed          int `json:"removed"`
	Modified         int `json:"modified"`
	TypeChanged      int `json:"type_changed"`
}

// CompareJSONFiles 比较两个JSON文件
func CompareJSONFiles(file1Path, file2Path string) (*ComparisonResult, error) {
	// 读取两个文件
	data1, err := readJSONFile(file1Path)
	if err != nil {
		return nil, fmt.Errorf("读取文件 %s 失败: %v", file1Path, err)
	}

	data2, err := readJSONFile(file2Path)
	if err != nil {
		return nil, fmt.Errorf("读取文件 %s 失败: %v", file2Path, err)
	}

	// 进行语义化比较
	return CompareJSON(data1, data2), nil
}

// readJSONFile 读取并解析JSON文件
func readJSONFile(filepath string) (any, error) {
	file, err := os.Open(filepath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var data any
	err = json.Unmarshal(bytes, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

// CompareJSON 语义化比较两个JSON数据
func CompareJSON(data1, data2 any) *ComparisonResult {
	result := &ComparisonResult{
		IsEqual:     true,
		Differences: []Difference{},
		Summary:     ComparisonSummary{},
		Details:     make(map[string]any),
	}

	differences := compareValues(data1, data2, "")
	result.Differences = differences
	result.IsEqual = len(differences) == 0

	// 统计差异类型
	for _, diff := range differences {
		result.Summary.TotalDifferences++
		switch diff.Type {
		case "added":
			result.Summary.Added++
		case "removed":
			result.Summary.Removed++
		case "modified":
			result.Summary.Modified++
		case "type_changed":
			result.Summary.TypeChanged++
		}
	}

	return result
}

// compareValues 递归比较两个值
func compareValues(val1, val2 any, path string) []Difference {
	var differences []Difference

	// 处理nil值
	if val1 == nil && val2 == nil {
		return differences
	}

	// 检查类型是否相同
	type1 := reflect.TypeOf(val1)
	type2 := reflect.TypeOf(val2)

	if type1 != type2 {
		differences = append(differences, Difference{
			Path:        path,
			Type:        "type_changed",
			OldValue:    val1,
			NewValue:    val2,
			Description: fmt.Sprintf("在路径 '%s' 类型从 %v 变更为 %v", path, type1, type2),
		})
		return differences
	}

	// 根据类型进行比较
	switch v1 := val1.(type) {
	case map[string]any:
		v2 := val2.(map[string]any)
		differences = append(differences, compareObjects(v1, v2, path)...)
	case []any:
		v2 := val2.([]any)
		differences = append(differences, compareArrays(v1, v2, path)...)
	default:
		// 基本类型比较
		if !reflect.DeepEqual(val1, val2) {
			differences = append(differences, Difference{
				Path:        path,
				Type:        "modified",
				OldValue:    val1,
				NewValue:    val2,
				Description: fmt.Sprintf("在路径 '%s' 值从 %v 变更为 %v", path, val1, val2),
			})
		}
	}

	return differences
}

// compareObjects 比较两个对象
func compareObjects(obj1, obj2 map[string]any, basePath string) []Difference {
	var differences []Difference

	// 获取所有键的并集
	allKeys := make(map[string]bool)
	for key := range obj1 {
		allKeys[key] = true
	}
	for key := range obj2 {
		allKeys[key] = true
	}

	// 比较每个键
	for key := range allKeys {
		currentPath := buildPath(basePath, key)

		val1, exists1 := obj1[key]
		val2, exists2 := obj2[key]

		if !exists1 {
			// 新增的键
			differences = append(differences, Difference{
				Path:        currentPath,
				Type:        "added",
				NewValue:    val2,
				Description: fmt.Sprintf("在路径 '%s' 新增键 '%s'", basePath, key),
			})
		} else if !exists2 {
			// 删除的键
			differences = append(differences, Difference{
				Path:        currentPath,
				Type:        "removed",
				OldValue:    val1,
				Description: fmt.Sprintf("在路径 '%s' 删除键 '%s'", basePath, key),
			})
		} else {
			// 递归比较值
			differences = append(differences, compareValues(val1, val2, currentPath)...)
		}
	}

	return differences
}

// compareArrays 比较两个数组
func compareArrays(arr1, arr2 []any, basePath string) []Difference {
	var differences []Difference

	// 长度比较
	len1, len2 := len(arr1), len(arr2)
	maxLen := len1
	if len2 > maxLen {
		maxLen = len2
	}

	// 逐个比较元素
	for i := 0; i < maxLen; i++ {
		currentPath := fmt.Sprintf("%s[%d]", basePath, i)

		if i >= len1 {
			// arr1中不存在，arr2中存在
			differences = append(differences, Difference{
				Path:        currentPath,
				Type:        "added",
				NewValue:    arr2[i],
				Description: fmt.Sprintf("在数组 '%s' 索引 %d 处新增元素", basePath, i),
			})
		} else if i >= len2 {
			// arr1中存在，arr2中不存在
			differences = append(differences, Difference{
				Path:        currentPath,
				Type:        "removed",
				OldValue:    arr1[i],
				Description: fmt.Sprintf("在数组 '%s' 索引 %d 处删除元素", basePath, i),
			})
		} else {
			// 递归比较元素
			differences = append(differences, compareValues(arr1[i], arr2[i], currentPath)...)
		}
	}

	return differences
}

// CompareJSONStrings 比较两个JSON字符串
func CompareJSONStrings(json1, json2 string) (*ComparisonResult, error) {
	var data1, data2 any

	err := json.Unmarshal([]byte(json1), &data1)
	if err != nil {
		return nil, fmt.Errorf("解析第一个JSON字符串失败: %v", err)
	}

	err = json.Unmarshal([]byte(json2), &data2)
	if err != nil {
		return nil, fmt.Errorf("解析第二个JSON字符串失败: %v", err)
	}

	return CompareJSON(data1, data2), nil
}

// buildPath 构建路径字符串
func buildPath(basePath, key string) string {
	if basePath == "" {
		return key
	}
	return fmt.Sprintf("%s.%s", basePath, key)
}

// PrintComparisonResult 打印比较结果
func PrintComparisonResult(result *ComparisonResult) {
	fmt.Printf("=== JSON比较结果 ===\n")
	fmt.Printf("是否相等: %t\n", result.IsEqual)
	fmt.Printf("总差异数: %d\n", result.Summary.TotalDifferences)

	if result.Summary.TotalDifferences > 0 {
		fmt.Printf("\n=== 差异统计 ===\n")
		fmt.Printf("新增: %d\n", result.Summary.Added)
		fmt.Printf("删除: %d\n", result.Summary.Removed)
		fmt.Printf("修改: %d\n", result.Summary.Modified)
		fmt.Printf("类型变更: %d\n", result.Summary.TypeChanged)

		fmt.Printf("\n=== 详细差异 ===\n")
		for i, diff := range result.Differences {
			fmt.Printf("%d. %s\n", i+1, diff.Description)
			fmt.Printf("   路径: %s\n", diff.Path)
			fmt.Printf("   类型: %s\n", diff.Type)
			if diff.OldValue != nil {
				fmt.Printf("   旧值: %v\n", diff.OldValue)
			}
			if diff.NewValue != nil {
				fmt.Printf("   新值: %v\n", diff.NewValue)
			}
			fmt.Println()
		}
	}
}

// FindDifferencesByType 根据类型筛选差异
func FindDifferencesByType(result *ComparisonResult, diffType string) []Difference {
	var filtered []Difference
	for _, diff := range result.Differences {
		if diff.Type == diffType {
			filtered = append(filtered, diff)
		}
	}
	return filtered
}

// FindDifferencesByPath 根据路径筛选差异
func FindDifferencesByPath(result *ComparisonResult, pathPattern string) []Difference {
	var filtered []Difference
	for _, diff := range result.Differences {
		if strings.Contains(diff.Path, pathPattern) {
			filtered = append(filtered, diff)
		}
	}
	return filtered
}

// ExportComparisonResult 导出比较结果为JSON
func ExportComparisonResult(result *ComparisonResult, outputPath string) error {
	data, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		return fmt.Errorf("序列化比较结果失败: %v", err)
	}

	err = os.WriteFile(outputPath, data, 0644)
	if err != nil {
		return fmt.Errorf("写入文件失败: %v", err)
	}

	return nil
}
