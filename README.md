# Poke Wordle 🎮

> 一个基于 Pokémon 的 Wordle 风格猜谜游戏，支持多语言和自定义设置！

![项目状态](https://img.shields.io/badge/状态-生产就绪-brightgreen)
![测试覆盖](https://img.shields.io/badge/测试-253个通过-success)
![性能](https://img.shields.io/badge/性能-优秀-blue)
![SEO](https://img.shields.io/badge/SEO-完全优化-orange)

[🎯 在线试玩](https://www.pokewordle.app) | [📖 完整文档](#完整文档) | [🐛 问题反馈](https://github.com/your-username/poke-wordle/issues)

## ✨ 游戏特色

- 🎮 **交互式游戏体验**：根据类型、能力、数值等线索猜测 Pokémon
- 🌍 **多语言支持**：支持 9 种语言（EN, JA, ZH-Hans, ZH-Hant, KO, FR, DE, IT, ES）
- ⚙️ **自定义设置**：调整难度、世代范围、游戏模式
- 🎭 **恶作剧模式**：随机隐藏属性增加挑战
- 📱 **响应式设计**：完美适配桌面和移动设备
- 🔒 **隐私优先**：符合 GDPR 的 Cookie 同意机制

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装运行

```bash
# 克隆项目
git clone https://github.com/your-username/poke-wordle.git
cd poke-wordle

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 开始游戏！

### 环境变量配置

创建 `.env.local` 文件：

```env
# Google Analytics（可选）
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AdSense（可选）
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_CONTENT_SLOT=1234567891
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT=1234567892
```

## 🎯 游戏玩法

1. **开始游戏**：页面加载后自动开始新游戏
2. **输入猜测**：在搜索框中输入 Pokémon 名称
3. **查看线索**：每次猜测后会显示颜色编码的线索：
   - 🟢 **绿色**：完全匹配
   - 🟡 **黄色**：部分匹配或接近
   - ⚪ **灰色**：不匹配
4. **分析数据**：根据类型、能力、数值、世代等信息缩小范围
5. **获得胜利**：在限定次数内猜出正确答案！

## 🛠️ 技术栈

- **框架**：Next.js 15 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **UI 组件**：Headless UI + Heroicons
- **国际化**：next-intl
- **测试**：Jest + Playwright
- **部署**：Vercel

## 📊 项目状态

### 🏆 测试覆盖
- **测试套件**：12 个
- **测试总数**：253 个 
- **通过率**：100%
- **执行时间**：~8 秒

### ⚡ 性能指标
- **主包大小**：~294kB
- **首屏加载**：< 1.5s
- **Core Web Vitals**：全部达标

### 🔍 SEO 优化
- 完整的元标签和结构化数据
- 多语言 sitemap 和 hreflang
- PWA 支持
- AI 爬虫友好的 robots.txt

## 🧪 测试

```bash
# 运行单元测试
npm run test

# 运行端到端测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

## 📁 项目结构

```
poke-wordle/
├── 📁 public/                          # 静态资源
│   ├── 📁 images/                     # 图片资源 (SEO图片、图标等)
│   ├── 📄 manifest.json               # PWA 应用清单
│   ├── 📄 favicon.ico                 # 网站图标
│   └── 📄 favicon.svg                 # SVG 图标
├── 📁 src/                            # 源码目录
│   ├── 📁 app/                        # Next.js 15 App Router
│   │   ├── 📁 [locale]/              # 国际化路由
│   │   ├── 📁 api/                   # API 路由
│   │   │   └── 📁 check-guess/       # 猜测检查 API
│   │   ├── 📁 privacy-and-terms/     # 隐私政策和条款页面
│   │   ├── 📄 layout.tsx             # 根布局组件
│   │   ├── 📄 page.tsx               # 主页面
│   │   ├── 📄 sitemap.ts             # 动态站点地图
│   │   └── 📄 robots.ts              # 动态 robots.txt
│   ├── 📁 components/                 # React 组件
│   │   ├── 📁 __tests__/             # 组件测试
│   │   ├── 📄 GameInput.tsx          # 游戏输入组件
│   │   ├── 📄 GuessTable.tsx         # 猜测结果表格
│   │   ├── 📄 GameOverModal.tsx      # 游戏结束弹窗
│   │   ├── 📄 Settings.tsx           # 游戏设置
│   │   ├── 📄 Navbar.tsx             # 导航栏
│   │   ├── 📄 LanguageSwitcher.tsx   # 语言切换器
│   │   ├── 📄 CookieConsent.tsx      # Cookie 同意组件
│   │   ├── 📄 GoogleAnalytics.tsx    # GA4 集成
│   │   ├── 📄 GoogleAdSense.tsx      # AdSense 集成
│   │   └── 📄 ...                    # 其他组件
│   ├── 📁 data/                       # 数据文件
│   │   ├── 📁 __tests__/             # 数据测试
│   │   └── 📄 pokemon.ts             # Pokémon 数据和类型
│   ├── 📁 hooks/                      # 自定义 React Hooks
│   │   ├── 📁 __tests__/             # Hooks 测试
│   │   └── 📄 useGameState.ts        # 游戏状态管理
│   ├── 📁 lib/                        # 工具函数库
│   │   ├── 📁 __tests__/             # 库函数测试
│   │   ├── 📄 pokemon.ts             # Pokémon 相关工具
│   │   ├── 📄 storage.ts             # 本地存储工具
│   │   └── 📄 analytics.ts           # 分析事件追踪
│   ├── 📁 messages/                   # 国际化翻译文件
│   │   ├── 📄 en.json                # 英语翻译
│   │   ├── 📄 ja.json                # 日语翻译
│   │   ├── 📄 zh-hans.json           # 简体中文翻译
│   │   └── 📄 ...                    # 其他语言翻译
│   ├── 📁 types/                      # TypeScript 类型定义
│   │   └── 📄 pokemon.ts             # Pokémon 相关类型
│   ├── 📁 styles/                     # 样式文件
│   │   └── 📄 globals.css            # 全局样式
│   ├── 📁 utils/                      # 通用工具函数
│   ├── 📁 i18n/                       # 国际化配置
│   │   └── 📄 config.ts              # i18n 配置文件
│   └── 📄 middleware.ts               # Next.js 中间件
├── 📁 tests/                          # 测试文件
│   └── 📁 e2e/                       # 端到端测试 (Playwright)
│       └── 📄 game-flow.spec.ts      # 游戏流程测试
├── 📄 next.config.ts                  # Next.js 配置
├── 📄 tailwind.config.js              # Tailwind CSS 配置
├── 📄 tsconfig.json                   # TypeScript 配置
├── 📄 jest.config.js                  # Jest 测试配置
├── 📄 jest.setup.js                   # Jest 测试设置
├── 📄 playwright.config.ts            # Playwright 配置
├── 📄 package.json                    # 项目依赖和脚本
├── 📄 .eslintrc.json                  # ESLint 配置
├── 📄 postcss.config.js               # PostCSS 配置
└── 📄 README.md                       # 项目说明文档
```

### 🔍 关键目录说明

#### 📁 `src/app/` - Next.js 15 App Router
- **[locale]/** - 支持 9 种语言的国际化路由结构
- **api/check-guess/** - 核心游戏逻辑 API，处理 Pokémon 猜测验证
- **privacy-and-terms/** - 隐私政策和服务条款页面

#### 📁 `src/components/` - 模块化组件
- **游戏核心**：`GameInput`, `GuessTable`, `GameOverModal`, `Settings`
- **导航布局**：`Navbar`, `LanguageSwitcher`, `Footer`
- **隐私合规**：`CookieConsent`, `PrivacyAndTermsContent`
- **第三方集成**：`GoogleAnalytics`, `GoogleAdSense`

#### 📁 `src/data/` - 数据管理
- 包含所有 9 个世代的 Pokémon 数据
- 支持多语言本地化的名称和属性
- 类型定义和数据验证

#### 📁 `src/lib/` - 核心业务逻辑
- **pokemon.ts** - Pokémon 筛选、比较、随机选择算法
- **storage.ts** - 游戏状态和设置的持久化存储
- **analytics.ts** - 游戏事件追踪和统计

#### 📁 `src/messages/` - 国际化支持
支持的语言：EN, JA, ZH-Hans, ZH-Hant, KO, FR, DE, IT, ES

#### 📁 `tests/` - 测试覆盖
- **单元测试**：253 个测试用例，100% 通过率
- **E2E 测试**：完整游戏流程自动化测试
- **集成测试**：API 路由和组件交互测试

## 🚀 部署

### Vercel 部署

1. 连接你的 GitHub 仓库到 Vercel
2. 添加环境变量到 Vercel 项目设置
3. 自动部署完成！

### 其他平台

确保设置所有必需的环境变量，然后运行：

```bash
npm run build
npm start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 为新功能添加对应测试
- 确保所有测试通过
- 保持代码覆盖率
- 更新相关文档

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 🙏 致谢

- **Pokémon 数据**：来源于各种公共 API 和数据库
- **UI 组件**：[Headless UI](https://headlessui.com/) + [Heroicons](https://heroicons.com/)
- **样式框架**：[Tailwind CSS](https://tailwindcss.com/)
- **部署平台**：[Vercel](https://vercel.com/)

## 📞 联系方式

- **问题反馈**：[GitHub Issues](https://github.com/your-username/poke-wordle/issues)
- **功能建议**：[GitHub Discussions](https://github.com/your-username/poke-wordle/discussions)

---

## 📖 完整文档

详细的开发文档、API 参考和部署指南请查看以下文档：

- [环境配置详解](docs/environment-setup.md)
- [测试系统文档](docs/testing-guide.md)
- [SEO 优化指南](docs/seo-optimization.md)
- [性能优化文档](docs/performance-optimization.md)
- [响应式设计指南](docs/responsive-design.md)
- [Google Analytics 集成](docs/google-analytics.md)
- [Google AdSense 集成](docs/google-adsense.md)
- [AI 索引权限配置](docs/ai-indexing.md)
- [部署与维护](docs/deployment-maintenance.md)

**最后更新**：2024年12月  
**当前版本**：v1.0.0 