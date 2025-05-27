# Google Analytics 设置指南

本项目已集成 Google Analytics 4 (GA4) 支持，用于跟踪网站访问和用户行为。

## 设置步骤

### 1. 获取 Google Analytics 测量 ID

1. 访问 [Google Analytics](https://analytics.google.com/)
2. 创建新的 GA4 属性或使用现有属性
3. 在"管理" > "数据流"中创建新的网络数据流
4. 复制测量 ID（格式：G-XXXXXXXXXX）

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件（如果不存在），并添加以下内容：

```bash
# Google Analytics 测量 ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**注意：** 将 `G-XXXXXXXXXX` 替换为您的实际测量 ID。

### 3. 验证设置

1. 启动开发服务器：`npm run dev`
2. 在浏览器中打开应用
3. 在 Google Analytics 实时报告中验证数据是否正在接收

## 功能特性

### 自动跟踪

- **页面浏览量**：自动跟踪所有页面访问
- **用户会话**：跟踪用户会话时长和行为
- **设备信息**：收集设备类型、浏览器、操作系统等信息

### 游戏事件跟踪

项目包含专门的游戏事件跟踪功能：

- `trackGameEvent.gameStart()`：游戏开始
- `trackGameEvent.gameComplete(attempts, success, pokemon)`：游戏完成
- `trackGameEvent.guessSubmit(attempt, pokemon)`：提交猜测
- `trackGameEvent.hintUsed(hintType)`：使用提示
- `trackGameEvent.languageChange(language)`：语言切换
- `trackGameEvent.shareResult(platform)`：分享结果

### 使用示例

在组件中使用事件跟踪：

```tsx
import { trackGameEvent, trackEvent } from '@/components/GoogleAnalytics';

// 游戏开始时
const handleGameStart = () => {
  trackGameEvent.gameStart();
};

// 游戏完成时
const handleGameComplete = (attempts: number, success: boolean, pokemon: string) => {
  trackGameEvent.gameComplete(attempts, success, pokemon);
};

// 自定义事件
const handleCustomEvent = () => {
  trackEvent('custom_action', 'custom_category', 'custom_label', 1);
};
```

## 隐私和合规性

### GDPR 合规

- 确保在收集数据前获得用户同意
- 考虑实施 Cookie 横幅或同意管理平台
- 提供数据删除和访问权限

### 数据保护

- 所有数据传输都通过 HTTPS 加密
- 不收集个人身份信息 (PII)
- 遵循 Google Analytics 的数据保留政策

## 生产环境部署

### Vercel 部署

在 Vercel 项目设置中添加环境变量：

1. 进入项目设置 > Environment Variables
2. 添加 `NEXT_PUBLIC_GA_MEASUREMENT_ID` 变量
3. 设置值为您的测量 ID
4. 重新部署项目

### 其他平台

确保在部署平台的环境变量设置中添加 `NEXT_PUBLIC_GA_MEASUREMENT_ID`。

## 故障排除

### 常见问题

1. **数据未显示在 GA 中**
   - 检查测量 ID 是否正确
   - 确认环境变量已正确设置
   - 验证网络连接和广告拦截器设置

2. **开发环境中的数据**
   - 开发环境的数据也会发送到 GA
   - 考虑使用不同的测量 ID 用于开发和生产

3. **TypeScript 错误**
   - 确保 `gtag` 类型声明已正确导入
   - 检查 `window.gtag` 的可用性

## 高级配置

### 自定义维度

可以在 Google Analytics 中设置自定义维度来跟踪特定的游戏数据：

- 用户语言偏好
- 游戏难度级别
- 设备类型
- 用户类型（新用户/回访用户）

### 转化跟踪

设置转化目标来衡量重要的用户行为：

- 完成游戏
- 分享结果
- 连续游戏天数
- 使用特定功能

## 相关资源

- [Google Analytics 4 文档](https://developers.google.com/analytics/devguides/collection/ga4)
- [Next.js Analytics 集成](https://nextjs.org/docs/basic-features/built-in-css-support)
- [GDPR 合规指南](https://support.google.com/analytics/answer/9019185) 