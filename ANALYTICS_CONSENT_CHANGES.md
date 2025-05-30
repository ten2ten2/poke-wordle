# Google Analytics 同意逻辑修改

## 修改概述

将 Google Analytics 的同意逻辑从"只有用户同意才初始化"修改为"默认初始化，用户拒绝时关闭"。

## 修改前的行为

- 只有在用户明确同意 Cookie 的情况下才初始化 Google Analytics
- 如果用户没有做出选择或拒绝，GA 不会被初始化

## 修改后的行为

- Google Analytics 默认初始化（符合大多数网站的标准做法）
- 如果用户明确拒绝 Cookie，则关闭 GA 追踪
- 如果用户没有做出选择，GA 正常运行

## 修改的文件

### 1. `src/components/CookieConsent.tsx`

**新增功能:**
- 添加 `hasUserDeclinedCookies()` 函数：检查用户是否明确拒绝 Cookie
- 修改 `hasUserConsentedToCookies()` 函数：默认返回 true，只有用户明确拒绝时返回 false
- 在用户拒绝时通知 Google Analytics 关闭追踪

**关键变化:**
```typescript
// 修改前
export const hasUserConsentedToCookies = (): boolean => {
  return localStorage.getItem('cookie-consent') === 'accepted';
};

// 修改后  
export const hasUserConsentedToCookies = (): boolean => {
  if (typeof window === 'undefined') return true; // 默认同意
  const consent = localStorage.getItem('cookie-consent');
  return consent !== 'declined'; // 只有明确拒绝时才返回 false
};

// 新增
export const hasUserDeclinedCookies = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('cookie-consent') === 'declined';
};
```

### 2. `src/components/GoogleAnalytics.tsx`

**修改的逻辑:**
- 使用 `hasUserDeclinedCookies()` 替代 `hasUserConsentedToCookies()`
- 默认初始化 GA，用户拒绝时配置为关闭追踪
- 所有追踪函数（`trackPageView`, `trackEvent` 等）都改为默认启用，用户拒绝时停用

**关键变化:**
```typescript
// 修改前
if (hasUserConsentedToCookies()) {
  gtag('config', measurementId, { /* 正常配置 */ });
}

// 修改后
if (hasUserDeclinedCookies()) {
  // 用户拒绝了 Cookie，关闭 GA 追踪
  gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
} else {
  // 默认或用户同意的情况下，正常初始化 GA
  gtag('config', measurementId, {
    page_title: document.title,
    page_location: window.location.href,
  });
}
```

### 3. `src/components/GoogleAdSense.tsx`

**同步修改:**
- 为保持一致性，同样修改为默认启用，用户拒绝时禁用
- 使用 `hasUserDeclinedCookies()` 替代 `hasUserConsentedToCookies()`

## 技术细节

### 用户同意状态的处理

1. **未做选择**: GA 和 AdSense 正常运行
2. **明确同意**: GA 和 AdSense 正常运行  
3. **明确拒绝**: GA 配置为隐私模式，AdSense 不显示

### GA 隐私模式配置

当用户拒绝 Cookie 时，GA 会使用以下配置：
- `send_page_view: false` - 不发送页面浏览数据
- `anonymize_ip: true` - IP 地址匿名化
- `allow_google_signals: false` - 禁用 Google 信号
- `allow_ad_personalization_signals: false` - 禁用广告个性化信号

## 兼容性

- 保持与现有 Cookie 同意横幅的完全兼容性
- 不影响用户体验
- 符合 GDPR 等隐私法规要求

## 测试验证

- 编译测试：✅ 通过
- 开发服务器启动：✅ 正常
- 类型检查：✅ 通过

## 注意事项

这种修改符合大多数现代网站的标准做法，即默认启用分析服务，用户明确拒绝时关闭。这样可以确保获得更完整的分析数据，同时仍然尊重用户的隐私选择。 