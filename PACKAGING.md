# 📦 Chrome扩展打包指南

本文档说明如何将 SearchSyntax Pro 打包为可发布到 Chrome Web Store 的 ZIP 文件。

## 🚀 快速开始

### 方式一：完整打包流程（推荐）

```bash
npm run package
```

这个命令会：
1. 执行 TypeScript 编译
2. 运行 Vite 构建
3. 复制静态资源（manifest.json、icons、国际化文件）
4. 将 dist 目录打包为 ZIP 文件

### 方式二：仅打包（快速迭代）

如果你已经运行过 `npm run build`，可以直接打包：

```bash
npm run package:only
```

## 📁 输出文件

打包后会在项目根目录生成：

```
releases/
└── ssp-v{version}.zip
```

例如：`releases/ssp-v1.0.0.zip`

版本号自动从 `package.json` 读取。

## 🔍 打包内容

ZIP 包会包含 `dist/` 目录的所有必要文件：

- ✅ `manifest.json` - Chrome 扩展配置
- ✅ `background.js` - Service Worker（后台脚本）
- ✅ `popup.js` - 弹窗界面脚本
- ✅ `options.js` - 设置页面脚本
- ✅ `content.js` - 内容脚本
- ✅ `icons/` - 所有尺寸的图标（16x16, 32x32, 48x48, 128x128）
- ✅ `_locales/` - 国际化资源文件
- ✅ 其他构建产物（CSS、资源文件等）

### 自动排除的文件

打包脚本会自动排除以下文件：
- ❌ `.DS_Store` - macOS 系统文件
- ❌ `*.backup`, `*.bak` - 备份文件
- ❌ `*.tmp` - 临时文件
- ❌ `__MACOSX/` - macOS 压缩产物
- ❌ `.git/` - Git 版本控制文件
- ❌ `node_modules/` - 依赖文件

## 📊 打包信息

打包完成后，脚本会显示：

- ✅ 文件名称和路径
- ✅ 版本号
- ✅ 文件大小（压缩后）
- ✅ 文件质量评估（<5MB优秀）

## 🌐 上传到 Chrome Web Store

### 前提条件

1. **开发者账户**：注册 Chrome Web Store 开发者账户（$5 一次性费用）
2. **准备材料**：
   - 扩展 ZIP 包（通过 `npm run package` 生成）
   - 至少 1 张截图（1280x800 或 640x400）
   - 详细描述和简短描述
   - 隐私政策 URL（如果使用权限）

### 上传步骤

1. **访问开发者控制台**
   ```
   https://chrome.google.com/webstore/devconsole
   ```

2. **创建新项**
   - 点击"新增项"
   - 上传生成的 ZIP 文件（`releases/ssp-v1.0.0.zip`）

3. **填写商店列表信息**
   - 详细描述（推荐 800-1000 字）
   - 简短描述（<132 字符）
   - 上传截图（至少 1 张，推荐 3-5 张）
   - 选择分类：生产力工具

4. **配置隐私设置**
   - 说明权限用途
   - 提供隐私政策链接
   - 说明数据处理方式

5. **提交审核**
   - 检查所有必填项
   - 点击"提交审核"
   - 等待审核结果（通常 24-48 小时）

## 🔄 版本更新流程

### 1. 更新版本号

在 `package.json` 中更新版本号：

```json
{
  "version": "1.1.0"
}
```

建议同步更新 `public/manifest.json` 的版本号（虽然打包脚本会使用 package.json 的版本）。

### 2. 构建和打包

```bash
npm run package
```

### 3. 上传新版本

- 在 Chrome Web Store 开发者控制台
- 选择现有扩展
- 上传新的 ZIP 包
- 填写更新说明
- 提交审核

## 🛠️ 故障排查

### 问题：找不到 zip 命令

**错误信息**：
```
❌ 未找到系统zip命令
```

**解决方案**：

- **macOS**：已预装 zip，无需操作
- **Linux**：
  ```bash
  sudo apt-get install zip
  ```
- **Windows**：
  - 安装 [Git for Windows](https://git-scm.com/download/win)（包含 Git Bash）
  - 或使用 [WSL (Windows Subsystem for Linux)](https://docs.microsoft.com/en-us/windows/wsl/install)

### 问题：dist 目录不存在

**错误信息**：
```
❌ dist目录不存在
请先运行构建命令：npm run build
```

**解决方案**：
```bash
npm run build
```

### 问题：文件大小过大

**警告信息**：
```
⚠️ ZIP文件超过10MB，可能影响审核速度
```

**优化建议**：
1. 检查是否包含不必要的资源文件
2. 压缩图片资源
3. 移除未使用的依赖
4. 使用 Vite 构建优化

### 问题：版本号格式无效

**错误信息**：
```
❌ 无效的版本号格式
```

**解决方案**：
确保 `package.json` 中的版本号遵循语义化版本规范（SemVer）：
- ✅ 正确：`1.0.0`, `1.2.3`, `2.0.0-beta.1`
- ❌ 错误：`v1.0`, `1.0`, `latest`

## 📝 最佳实践

### 1. 版本管理

- 遵循[语义化版本](https://semver.org/lang/zh-CN/)规范
- 主版本号（Major）：不兼容的 API 修改
- 次版本号（Minor）：向下兼容的功能新增
- 修订号（Patch）：向下兼容的问题修正

### 2. 发布前检查清单

- [ ] 运行所有测试：`npm test`
- [ ] 代码质量检查：`npm run lint`
- [ ] 类型检查：`npm run type-check`
- [ ] 本地功能测试（加载 dist 到浏览器）
- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md
- [ ] 创建 Git 标签

### 3. Git 工作流

```bash
# 1. 更新版本号
npm version patch  # 或 minor, major

# 2. 提交更改
git add .
git commit -m "chore: release v1.0.1"

# 3. 创建标签
git tag v1.0.1

# 4. 推送到远程
git push origin main --tags

# 5. 打包发布
npm run package
```

### 4. 保留历史版本

`releases/` 目录已在 `.gitignore` 中排除，但建议：
- 在本地保留最近 3-5 个版本的 ZIP 包
- 使用 GitHub Releases 存档重要版本
- 记录每个版本的发布日期和审核通过日期

## 🔗 相关资源

- [Chrome 扩展开发者文档](https://developer.chrome.com/docs/extensions/)
- [Chrome Web Store 政策](https://developer.chrome.com/docs/webstore/program_policies/)
- [发布检查清单](https://developer.chrome.com/docs/webstore/publish/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

## 💡 提示

- 首次发布审核可能需要更长时间（1-7 天）
- 后续更新通常更快（24-48 小时）
- 保持良好的代码质量和文档可以加速审核
- 及时响应审核人员的问题和反馈

---

**SearchSyntax Pro** - 让高级搜索变得简单易用
