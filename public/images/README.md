# 静态图片

- `og-image.png` / `twitter-image.png`：1200×630 分享预览图，与 SEO 元数据中的尺寸一致。
- `icon-192x192.png` / `icon-512x512.png` / `icon-96x96.png`：应用图标。
- `apple-touch-icon.png`：Apple 主屏幕图标。
- `screenshot-wide.png`：1280×720 桌面展示截图。
- `screenshot-narrow.png`：390×844 手机展示截图。

更新分享图时同步替换 `og-image.png` 和 `twitter-image.png`，保持两图内容、尺寸一致。PWA 截图应反映当前桌面和手机布局，尺寸与 `public/manifest.json` 一致。

游戏图片来自 PokeAPI sprites；普通图片地址保存在 `src/data/pokemon_data.json`，恶作剧图片地址保存在 `src/data/prankster_profile.json`。这些图片不存放在本目录。
