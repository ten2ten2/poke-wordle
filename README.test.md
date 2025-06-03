# Pokemon Wordle 测试指南

本项目包含了全面的测试套件，涵盖单元测试、集成测试和端到端测试。

## 测试结构

```
src/
├── lib/__tests__/          # 库函数单元测试
├── hooks/__tests__/        # React Hooks 测试
├── components/__tests__/   # 组件测试
├── app/api/__tests__/      # API 路由测试
├── data/__tests__/         # 数据完整性测试
└── test/setup.ts           # 测试环境设置

tests/
└── e2e/                    # 端到端测试
```

## 运行测试

### 安装依赖
```bash
npm install
```

### 单元测试和集成测试
```bash
# 运行所有Jest测试
npm run test

# 监视模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 端到端测试
```bash
# 运行E2E测试
npm run test:e2e

# 运行特定浏览器的E2E测试
npx playwright test --project=chromium
```

## 测试覆盖范围

### 1. 核心业务逻辑测试 (`src/lib/__tests__/`)

#### Pokemon.test.ts
- ✅ Pokemon数据筛选和过滤
- ✅ 随机Pokemon选择
- ✅ Pokemon比较逻辑
- ✅ 翻译功能
- ✅ 恶作剧模式效果

#### Storage.test.ts
- ✅ 游戏设置保存和加载
- ✅ 游戏进度保存和恢复
- ✅ localStorage错误处理
- ✅ 浏览器兼容性

### 2. React Hooks测试 (`src/hooks/__tests__/`)

#### useGameState.test.ts
- ✅ 游戏状态初始化
- ✅ 新游戏开始
- ✅ 游戏重置
- ✅ 设置更新
- ✅ 猜测添加
- ✅ 胜利条件检查
- ✅ 放弃游戏功能

### 3. API路由测试 (`src/app/api/__tests__/`)

#### checkGuess.test.ts
- ✅ 有效猜测请求处理
- ✅ 无效Pokemon名称错误处理
- ✅ 目标Pokemon不存在错误处理
- ✅ 恶作剧模式支持
- ✅ 世代箭头模式支持

### 4. 组件测试 (`src/components/__tests__/`)

#### GameInput.test.tsx
- ✅ 输入字段渲染
- ✅ 自动完成建议
- ✅ 有效/无效猜测提交
- ✅ 游戏结束状态处理
- ✅ 键盘导航

### 5. 数据完整性测试 (`src/data/__tests__/`)

#### data-integrity.test.ts
- ✅ Pokemon数据结构验证
- ✅ 翻译数据完整性
- ✅ 数据一致性检查
- ✅ 本地化覆盖率

### 6. 端到端测试 (`tests/e2e/`)

#### game-flow.spec.ts
- ✅ 完整游戏流程
- ✅ 自动完成功能
- ✅ 设置模态框
- ✅ 语言切换和持久化
- ✅ 游戏结束场景
- ✅ 响应式布局
- ✅ 游戏状态持久化
- ✅ 键盘导航

## 测试最佳实践

### 1. 单元测试
- 每个函数都有对应的测试用例
- 测试边界条件和错误情况
- 使用mock来隔离依赖
- 保持测试的独立性

### 2. 组件测试
- 测试用户交互而非实现细节
- 使用数据测试ID进行元素选择
- 测试可访问性
- 验证props传递和事件处理

### 3. 端到端测试
- 测试关键用户路径
- 包含跨浏览器测试
- 测试移动端响应式布局
- 验证数据持久化

### 4. 数据测试
- 验证数据结构完整性
- 检查翻译覆盖率
- 确保数据一致性
- 验证外部链接有效性

## 配置文件

### Jest配置 (package.json)
```json
{
  "jest": {
    "testEnvironment": "jsdom",
    "setupFilesAfterEnv": ["<rootDir>/src/test/setup.ts"],
    "moduleNameMapping": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.d.ts",
      "!src/test/**",
      "!src/data/**"
    ]
  }
}
```

### Playwright配置 (playwright.config.ts)
- 支持多浏览器测试（Chrome, Firefox, Safari）
- 移动端设备测试
- 自动启动开发服务器
- 失败时生成trace文件

## 持续集成

测试可以轻松集成到CI/CD流程中：

```yaml
# GitHub Actions 示例
- name: Run Tests
  run: |
    npm run test:coverage
    npm run test:e2e
```

## 覆盖率目标

- **单元测试覆盖率**: > 80%
- **功能测试覆盖率**: > 90%
- **关键路径E2E覆盖率**: 100%

## 调试测试

### Jest测试调试
```bash
# 调试特定测试文件
npm test -- --testNamePattern="Pokemon comparison"

# 详细输出
npm test -- --verbose
```

### Playwright测试调试
```bash
# 头部模式运行（可视化浏览器）
npx playwright test --headed

# 调试模式
npx playwright test --debug
```

## 贡献指南

在提交新功能或修复时，请确保：

1. 为新功能添加相应的测试
2. 确保所有现有测试通过
3. 保持测试覆盖率在目标范围内
4. 更新相关的测试文档

这个测试套件确保了Pokemon Wordle游戏的稳定性、可靠性和优秀的用户体验。 