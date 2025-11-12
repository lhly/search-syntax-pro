# 📐 商店资产准备指南

## 快速开始

### 1️⃣ 准备原始截图

将你的原始截图文件放到 `screenshots/` 目录：

```bash
mkdir screenshots
# 将截图文件复制到此目录
```

支持的格式：PNG, JPG, JPEG, WebP

---

### 2️⃣ 使用便捷命令处理

```bash
# 处理商店截图 (1280x800)
npm run resize:screenshots

# 处理扩展徽标 (300x300)
npm run resize:logo

# 处理小促销磁贴 (440x280)
npm run resize:promo-small

# 处理大型促销磁贴 (1400x560)
npm run resize:promo-large

# 一键处理所有尺寸
npm run resize:all
```

---

### 3️⃣ 获取处理后的文件

所有处理后的文件会保存在 `store-assets/` 目录，可以直接上传到商店。

---

## 🎨 高级用法

### 自定义背景颜色

```bash
# 白色背景（适合非透明图片）
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --background=white

# 自定义 hex 颜色
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --background=#F0F0F0
```

### 自定义对齐方式

```bash
# 顶部对齐
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --position=top

# 底部对齐
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --position=bottom

# 左对齐
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --position=left

# 右对齐
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --position=right

# 居中对齐（默认）
node scripts/resize-screenshots.js screenshot ./screenshots ./store-assets --position=center
```

---

## 📏 支持的预设尺寸

| 预设名称 | 尺寸 | 用途 | 命令 |
|---------|------|------|------|
| `screenshot` | 1280x800 | 商店截图 | `npm run resize:screenshots` |
| `screenshot-small` | 640x400 | 小尺寸截图 | 需手动指定 |
| `logo` | 300x300 | 扩展徽标 | `npm run resize:logo` |
| `small-promo` | 440x280 | 小促销磁贴 | `npm run resize:promo-small` |
| `large-promo` | 1400x560 | 大型促销磁贴 | `npm run resize:promo-large` |

---

## 💡 使用技巧

### 1. 批量处理不同类型的图片

```bash
# 将不同类型的原始文件放到不同目录
mkdir screenshots/store-screenshots
mkdir screenshots/logos
mkdir screenshots/promos

# 分别处理
node scripts/resize-screenshots.js screenshot ./screenshots/store-screenshots ./store-assets
node scripts/resize-screenshots.js logo ./screenshots/logos ./store-assets
node scripts/resize-screenshots.js small-promo ./screenshots/promos ./store-assets
```

### 2. 预览处理效果

在处理前，先用单个文件测试：

```bash
mkdir test-input test-output
cp your-screenshot.png test-input/
node scripts/resize-screenshots.js screenshot ./test-input ./test-output
# 检查 test-output/ 中的结果
```

### 3. 保持原图质量

脚本自动保持图片纵横比，只缩放到能完整显示在目标画布上的最大尺寸，不会拉伸变形。

### 4. 文件命名建议

为了便于管理，建议使用有意义的文件名：

```
screenshots/
  ├── main-interface.png          → 主界面
  ├── advanced-search.png         → 高级搜索
  ├── search-history.png          → 搜索历史
  ├── settings-page.png           → 设置页面
  ├── multi-engine-support.png    → 多引擎支持
  └── dark-theme.png              → 深色主题
```

---

## 🚨 常见问题

### Q: 图片太大，处理后文件太大怎么办？

A: 可以先用其他工具压缩图片，或者调整原图质量：

```bash
# 使用 ImageMagick 压缩
convert input.png -quality 85 -strip compressed.png

# 然后再用脚本处理
node scripts/resize-screenshots.js screenshot ./compressed ./output
```

### Q: 透明背景在某些地方显示为黑色？

A: 这通常是因为某些图片查看器不支持透明度。在浏览器或 Preview（预览）中打开可以正确显示透明背景。

### Q: 可以处理其他格式吗？

A: 支持 PNG, JPG, JPEG, WebP。输出统一为 PNG 格式（支持透明背景）。

### Q: 处理后的图片模糊？

A: 脚本只会缩小图片，不会放大。如果原图分辨率低于目标尺寸，建议使用更高分辨率的原图。

---

## 📋 Microsoft Edge 商店要求速查

### 必需资产

- [x] **扩展徽标**: 300x300 像素（最小 128x128）
- [x] **屏幕截图**: 1280x800 或 640x400（最多 6 张）
- [x] **扩展描述**: 明确详细地描述功能

### 可选资产

- [ ] **小促销磁贴**: 440x280 像素
- [ ] **大型促销磁贴**: 1400x560 像素
- [ ] **YouTube 视频**: 演示视频 URL
- [ ] **搜索词**: 最多 7 个（每个 ≤30 字符）

---

## 🎬 完整工作流示例

```bash
# 1. 创建目录结构
mkdir -p screenshots store-assets

# 2. 准备原始截图（手动截图或从其他工具导出）
# 将文件复制到 screenshots/

# 3. 批量处理
npm run resize:all

# 4. 验证结果
ls -lh store-assets/

# 5. 上传到 Microsoft Edge 商店
# 访问: https://partner.microsoft.com/zh-cn/dashboard/microsoftedge/
```

---

## 🔗 相关资源

- [Microsoft Edge 扩展开发者指南](https://docs.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/)
- [商店发布要求](https://docs.microsoft.com/zh-cn/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Sharp 文档](https://sharp.pixelplumbing.com/)

---

**提示**: 如有问题或需要帮助，请参考项目 README 或提交 Issue。
