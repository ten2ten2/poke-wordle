# JSON语义化比较工具

这是一个功能强大的Go语言JSON比较工具，支持深度语义化比较两个JSON文件或字符串。

## 功能特性

- ✅ **深度语义化比较**：递归比较JSON的所有层级
- ✅ **详细差异报告**：提供具体的差异位置和类型
- ✅ **多种比较模式**：支持文件比较和字符串比较
- ✅ **差异分类**：将差异分为新增、删除、修改、类型变更四种类型
- ✅ **筛选功能**：可根据差异类型或路径筛选结果
- ✅ **结果导出**：支持将比较结果导出为JSON文件
- ✅ **中文友好**：完整的中文注释和提示信息

## 使用方法

### 1. 比较两个JSON文件

```go
result, err := CompareJSONFiles("file1.json", "file2.json")
if err != nil {
    fmt.Printf("比较失败: %v\n", err)
    return
}

// 打印比较结果
PrintComparisonResult(result)
```

### 2. 比较两个JSON字符串

```go
json1 := `{"name": "皮卡丘", "level": 25}`
json2 := `{"name": "皮卡丘", "level": 30, "ability": "静电"}`

result, err := CompareJSONStrings(json1, json2)
if err != nil {
    fmt.Printf("比较失败: %v\n", err)
    return
}

PrintComparisonResult(result)
```

### 3. 筛选特定类型的差异

```go
// 筛选新增的差异
addedDiffs := FindDifferencesByType(result, "added")

// 筛选修改的差异
modifiedDiffs := FindDifferencesByType(result, "modified")

// 筛选删除的差异
removedDiffs := FindDifferencesByType(result, "removed")

// 筛选类型变更的差异
typeChangedDiffs := FindDifferencesByType(result, "type_changed")
```

### 4. 根据路径筛选差异

```go
// 筛选包含特定路径的差异
pathDiffs := FindDifferencesByPath(result, "pokemon")
```

### 5. 导出比较结果

```go
err := ExportComparisonResult(result, "comparison_result.json")
if err != nil {
    fmt.Printf("导出失败: %v\n", err)
}
```

## 数据结构

### ComparisonResult - 比较结果

```go
type ComparisonResult struct {
    IsEqual     bool                   `json:"is_equal"`      // 是否相等
    Differences []Difference           `json:"differences"`   // 差异列表
    Summary     ComparisonSummary      `json:"summary"`       // 差异统计
    Details     map[string]interface{} `json:"details"`       // 额外详情
}
```

### Difference - 差异信息

```go
type Difference struct {
    Path        string      `json:"path"`        // 差异路径
    Type        string      `json:"type"`        // 差异类型
    OldValue    interface{} `json:"old_value"`   // 旧值
    NewValue    interface{} `json:"new_value"`   // 新值
    Description string      `json:"description"` // 差异描述
}
```

### 差异类型说明

- `"added"` - 新增：第二个JSON中存在但第一个中不存在的字段
- `"removed"` - 删除：第一个JSON中存在但第二个中不存在的字段
- `"modified"` - 修改：两个JSON中都存在但值不同的字段
- `"type_changed"` - 类型变更：两个JSON中字段类型发生变化

## 测试示例

运行测试函数来查看工具的效果：

```go
// 运行完整的测试演示
RunJSONCompareDemo()

// 或者只运行基本测试
TestJSONCompare()
```

## 实际使用场景

1. **API响应对比**：比较不同版本API的响应结构
2. **配置文件验证**：检查配置文件的变更
3. **数据同步检查**：验证数据同步的准确性
4. **版本控制**：追踪JSON文件的历史变更
5. **测试验证**：单元测试中验证JSON输出

## 示例输出

```
=== JSON比较结果 ===
是否相等: false
总差异数: 4

=== 差异统计 ===
新增: 2
删除: 0
修改: 2
类型变更: 0

=== 详细差异 ===
1. 在路径 'level' 值从 25 变更为 30
   路径: level
   类型: modified
   旧值: 25
   新值: 30

2. 在路径 'stats' 新增键 'speed'
   路径: stats.speed
   类型: added
   新值: 90

3. 在路径 'moves[2]' 新增元素
   路径: moves[2]
   类型: added
   新值: 铁尾

4. 在路径 '' 新增键 'ability'
   路径: ability
   类型: added
   新值: 静电
```

## 注意事项

- 工具进行的是语义化比较，不受JSON键的排序影响
- 支持嵌套对象和数组的深度比较
- 数组比较按索引进行，顺序敏感
- 类型严格匹配（如字符串"123"和数字123被视为不同）

## 依赖

- Go 1.21+
- 标准库：`encoding/json`, `reflect`, `fmt`, `os`, `io`, `strings` 