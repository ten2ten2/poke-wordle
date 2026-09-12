# 静态图片

- `og-image.png` / `twitter-image.png`：1200×630 分享预览图，与 SEO 元数据中的尺寸一致。
- `icon-192x192.png` / `icon-512x512.png` / `icon-96x96.png`：应用图标。
- `apple-touch-icon.png`：Apple 主屏幕图标。
- `screenshot-wide.png`：1280×720 桌面展示截图。
- `screenshot-narrow.png`：390×844 手机展示截图。

更新截图时，在上述尺寸的浏览器视口中打开当前页面，使用浅色模式，完成一次猜测并关闭隐私提示。等待字体和宝可梦图片加载完成后截取视口；手机图使用实际手机布局。分享图使用同一份截图，PWA 截图尺寸与 `public/manifest.json` 保持一致。

宝可梦图片来自 PokeAPI sprites，地址保存在 `src/data/pokemon_data.json` 中。
