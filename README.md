/# SearchSyntax Pro - 搜索语法大师

一个基于浏览器扩展的搜索语法可视化工具，旨在降低普通用户使用高级搜索语法的门槛。

## 功能特点

### 🔍 智能搜索语法生成
- **网站内搜索**: 支持 `site:` 语法，轻松在指定网站内搜索
- **文件类型搜索**: 支持 `filetype:` 语法，查找特定格式的文件
- **精确匹配**: 支持 `"` 精确匹配语法
- **日期范围**: 支持按时间范围筛选搜索结果

### 🌐 多搜索引擎支持
- **百度**: 完全支持中文搜索优化
- **谷歌**: 支持谷歌高级搜索语法
- **必应**: 支持必应搜索特性

### 💡 智能验证与建议
- **实时验证**: 自动检查搜索语法的正确性
- **智能建议**: 根据搜索内容提供优化建议
- **错误提示**: 友好的错误和警告信息

### 📝 用户友好特性
- **搜索历史**: 自动保存搜索记录，支持快速重用
- **一键复制**: 快速复制生成的搜索查询
- **多语言**: 支持中英文界面切换
- **响应式设计**: 适配不同屏幕尺寸

## 技术架构

### 核心技术栈
- **TypeScript 5.x**: 类型安全的开发体验
- **React 18.x**: 现代化UI组件开发
- **Vite 5.x**: 快速构建工具
- **Tailwind CSS**: 实用优先的CSS框架

### Chrome扩展技术
- **Manifest V3**: 最新Chrome扩展标准
- **Service Worker**: 后台服务处理
- **Content Scripts**: 页面内容注入
- **Chrome Storage API**: 本地数据存储

### 搜索引擎适配器
- **适配器模式**: 可扩展的搜索引擎架构
- **统一接口**: 一致的API设计
- **专用优化**: 针对不同搜索引擎的特性优化

## 安装方法

### 开发者模式安装
1. 克隆本项目到本地
```bash
git clone https://github.com/lhly/search-syntax-pro.git
cd search-syntax-pro
```

2. 安装依赖
```bash
npm install
```

3. 构建项目
```bash
npm run build
```

4. 在Chrome中加载扩展
   - 打开Chrome浏览器
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目的 `dist` 目录

## 使用方法

### 基础搜索
1. 点击扩展图标打开搜索面板
2. 输入搜索关键词
3. 选择搜索引擎
4. 点击"执行搜索"查看结果

### 高级搜索
1. 展开"高级搜索选项"
2. **网站内搜索**: 输入网站域名（如 wikipedia.org）
3. **文件类型**: 选择特定文件格式（如 PDF、DOCX）
4. **精确匹配**: 输入要精确匹配的短语
5. 查看实时生成的搜索查询
6. 点击"执行搜索"

### 搜索历史
1. 在主界面查看最近的搜索记录
2. 点击历史记录快速恢复搜索设置
3. 使用"清除历史"清理记录

## 开发指南

### 项目结构
```
src/
├── components/          # React组件
├── services/           # 业务逻辑服务
│   ├── adapters/       # 搜索引擎适配器
│   └── storage.ts      # 数据存储服务
├── hooks/              # 自定义React Hooks
├── types/              # TypeScript类型定义
├── popup/              # 弹窗界面
├── options/            # 设置页面
├── background/         # 后台脚本
└── content/            # 内容脚本
```

### 开发命令
```bash
# 开发模式（带热重载）
npm run dev

# 构建生产版本
npm run build

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 运行测试
npm run test

# E2E测试
npm run test:e2e

# 代码检查
npm run lint
```

### 添加新搜索引擎
1. 在 `src/services/adapters/` 目录创建新的适配器文件
2. 实现 `SearchEngineAdapter` 接口
3. 在 `SearchAdapterFactory` 中注册新适配器
4. 更新类型定义中的搜索引擎类型

### 自定义UI主题
1. 修改 `tailwind.config.js` 中的主题配置
2. 在组件中使用主题变量
3. 测试深色/浅色模式切换

## 测试

### 单元测试
- 使用 Jest + React Testing Library
- 覆盖核心业务逻辑
- 测试组件渲染和交互

### E2E测试
- 使用 Playwright 进行端到端测试
- 模拟真实用户操作
- 测试Chrome扩展功能

### 运行测试
```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- SearchForm.test.tsx

# 运行E2E测试
npm run test:e2e

# 测试覆盖率
npm run test:coverage
```

## 贡献指南

### 提交代码
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 遵循 ESLint 和 Prettier 配置
- 添加适当的类型注释
- 编写单元测试
- 更新相关文档

### Issue 报告
- 使用 GitHub Issues 报告问题
- 提供详细的复现步骤
- 包含浏览器版本和系统信息

## 隐私政策

- 本扩展不收集任何用户个人信息
- 所有数据仅存储在用户本地设备
- 不会向第三方服务器传输任何数据
- 用户可以随时清除所有本地存储的数据

## 开源协议

本项目采用 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

## 更新日志

### v1.0.0 (2025-11-06)
- ✨ 初始版本发布
- 🔍 支持百度、谷歌、必应搜索引擎
- 💡 智能搜索语法生成和验证
- 📝 搜索历史管理
- 🌐 中英文界面支持
- 🎨 现代化UI设计

## 联系我们

- **项目主页**: https://github.com/lhly/search-syntax-pro
- **问题反馈**: https://github.com/lhly/search-syntax-pro/issues
- **邮箱**: lhlyzh@qq.com

---

> **SearchSyntax Pro（搜索语法大师）** - 让高级搜索变得简单易用