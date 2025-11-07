# Logo 更新指南

## 📋 更新概览

已成功将项目的 logo 从原设计更新为 `simpleLogo.svg` 设计。此更新包括:

1. ✅ **PNG 图标生成** - 为 Chrome 扩展生成了标准尺寸的 PNG 图标
2. ✅ **SVG 文件生成** - 生成了不同尺寸的 SVG 版本
3. ✅ **组件更新** - 更新了 Logo.tsx 组件以使用新设计
4. ✅ **测试通过** - 所有单元测试已更新并通过

---

## 📁 生成的文件

### PNG 图标文件 (Chrome 扩展标准尺寸)
```
public/icons/
  ├── icon16.png   (16x16)
  ├── icon32.png   (32x32)
  ├── icon48.png   (48x48)
  └── icon128.png  (128x128)
```

### SVG 文件
```
public/icons/
  ├── icon16.svg   (16x16)
  ├── icon32.svg   (32x32)
  ├── icon48.svg   (48x48)
  ├── icon128.svg  (128x128)
  ├── logo.svg     (主 logo,基于 simpleLogo.svg)
  └── simpleLogo.svg (原始设计文件)
```

### 备份文件
```
public/icons/
  └── logo.svg.backup (原始 logo 的备份)
```

---

## 🛠️ 使用的工具和脚本

### 1. SVG 到 PNG 转换脚本
**文件**: `scripts/convert-simple-logo.js`

**功能**:
- 使用 Sharp 库将 simpleLogo.svg 转换为多种尺寸的 PNG
- 支持透明背景
- 自动适配 Chrome 扩展所需的标准尺寸

**使用方法**:
```bash
node scripts/convert-simple-logo.js
```

### 2. SVG 尺寸生成脚本
**文件**: `scripts/generate-svg-sizes.js`

**功能**:
- 基于 simpleLogo.svg 生成不同尺寸的 SVG 文件
- 自动备份原有 logo.svg
- 将 simpleLogo.svg 复制为主 logo.svg

**使用方法**:
```bash
node scripts/generate-svg-sizes.js
```

---

## 💻 组件使用

### Logo 组件
```tsx
import { Logo, LogoIcon } from './components/Logo'

// 完整 Logo (带文字)
<Logo size={48} color="currentColor" showText={true} />

// 仅图标 (不带文字)
<LogoIcon size={32} color="#2563eb" />
```

### Props 说明
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| size | number | 48 | 图标尺寸 (px) |
| color | string | 'currentColor' | 主色调 |
| showText | boolean | true | 是否显示文字部分 |
| className | string | '' | 自定义类名 |

---

## 🎨 设计元素说明

simpleLogo.svg 包含以下设计元素:

1. **主要搜索图标** (#2563eb 蓝色)
   - 放大镜图形
   - 代表搜索功能

2. **内圈高亮** (#93c5fd 浅蓝色, 60% 透明度)
   - 增强视觉层次
   - 提供深度感

3. **装饰元素** (#2563eb 蓝色)
   - 语法符号
   - 品牌特征

4. **文字部分** (可选)
   - 字母 "S" 和 "P" 的图形化表示
   - 通过 `showText` prop 控制显示

---

## 🧪 测试

所有测试已更新并通过:

```bash
npm test -- Logo.test.tsx
```

**测试覆盖**:
- ✅ Logo 组件基础渲染
- ✅ LogoIcon 组件渲染
- ✅ 自定义尺寸支持
- ✅ 自定义颜色支持
- ✅ 文字显示控制
- ✅ 可访问性属性
- ✅ 自定义 className

---

## 📦 依赖

新增依赖:
- **sharp** (^0.33.x) - 用于 SVG 到 PNG 的转换

安装方式:
```bash
npm install --save-dev sharp
```

---

## 🔄 如果需要重新生成图标

如果 simpleLogo.svg 有更新,可以按以下步骤重新生成所有尺寸:

```bash
# 1. 确保 sharp 已安装
npm install

# 2. 生成 PNG 图标
node scripts/convert-simple-logo.js

# 3. 生成 SVG 文件
node scripts/generate-svg-sizes.js

# 4. 运行测试验证
npm test -- Logo.test.tsx
```

---

## 📝 注意事项

1. **ViewBox 变化**: 新 logo 使用 viewBox="650 600 1400 1550",与原始设计不同
2. **颜色系统**: 默认使用 Tailwind CSS 的蓝色色系 (#2563eb, #93c5fd)
3. **向后兼容**: 保持了原有的 Logo 组件 API,无需修改使用代码
4. **文件备份**: 原有 logo.svg 已备份为 logo.svg.backup

---

## 🎯 下一步建议

1. **更新 manifest.json**: 确保 Chrome 扩展配置文件引用了正确的图标路径
2. **检查其他使用点**: 搜索项目中其他可能使用旧 logo 的地方
3. **视觉验证**: 在实际浏览器中测试不同尺寸的图标显示效果
4. **文档更新**: 更新项目 README 中的 logo 相关说明

---

## 📞 问题反馈

如遇到任何问题,请检查:
1. Sharp 库是否正确安装
2. simpleLogo.svg 文件是否完整
3. 文件权限是否正确
4. Node.js 版本是否兼容 (建议 v16+)

---

**生成日期**: 2025-11-07
**工具版本**: Sharp ^0.33.x, Vite 5.0.0, React 18.2.0
