# Repository Context Analysis

## Project Overview
- **Project Name**: SearchSyntax Pro (ssp-smart-search-plugin)
- **Version**: 1.8.1
- **Type**: Chrome Extension (Browser Extension)
- **Description**: 搜索语法可视化工具 - 支持10个搜索引擎和28个高级搜索语法功能

## Technology Stack

### Core Technologies
- **Language**: TypeScript 5.x
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **Extension API**: Chrome Extension Manifest V3

### Key Dependencies
- **UI Components**: @headlessui/react, @dnd-kit (drag-and-drop)
- **Date Handling**: date-fns
- **Build**: @crxjs/vite-plugin (Chrome extension support)
- **Testing**: Jest, @testing-library/react, Playwright

### Development Tools
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Jest (unit), Playwright (E2E)

## Project Structure

```
src/
├── components/          # React组件
├── services/           # 业务逻辑服务
│   ├── adapters/       # 搜索引擎适配器 ⭐ 核心扩展点
│   └── storage.ts      # 数据存储服务
├── hooks/              # 自定义React Hooks
├── types/              # TypeScript类型定义
├── i18n/               # 国际化翻译文件
├── popup/              # 弹窗界面
├── options/            # 设置页面
├── background/         # 后台脚本
└── content/            # 内容脚本
```

## Search Engine Adapter Architecture

### Existing Adapters (10 engines)
基于文件系统扫描结果:
1. ✅ baidu.ts - 百度
2. ✅ google.ts - 谷歌
3. ✅ bing.ts - 必应
4. ✅ duckduckgo.ts - DuckDuckGo
5. ✅ brave.ts - Brave Search
6. ✅ yandex.ts - Yandex
7. ✅ twitter.ts - X (Twitter)
8. ✅ reddit.ts - Reddit
9. ✅ github.ts - GitHub
10. ✅ stackoverflow.ts - Stack Overflow

### Adapter Pattern Analysis

**接口定义**: `SearchEngineAdapter` (在 types/ 目录)
**工厂模式**: `factory.ts` - 适配器注册和创建
**核心方法**:
- `getName()`: 返回引擎名称
- `getBaseUrl()`: 返回基础搜索URL
- `buildQuery(params)`: 构建搜索查询URL
- `validateParams(params)`: 验证搜索参数
- `getSupportedSyntax()`: 返回支持的语法类型
- `getSupportedFeatures()`: 返回支持的UI功能特性
- `getFeatureGroups()`: 返回功能分组配置

### Code Patterns & Conventions

#### 1. 国际化支持模式
```typescript
async function getCurrentLanguage(): Promise<Language> {
  const result = await chrome.storage.local.get('user_settings')
  return result.user_settings?.language || 'zh-CN'
}

const t = (key: string, vars?) => translate(language, key, vars)
```

#### 2. 多关键词支持模式 (🔥 重要)
```typescript
// 支持单个或多个关键词
const sites = params.sites?.filter(s => s.trim()) ||
              (params.site ? [params.site] : [])
if (sites.length > 0) {
  const siteQuery = sites
    .map(s => `site:${this.cleanSiteDomain(s.trim())}`)
    .join(' OR ')
  query += sites.length > 1 ? ` (${siteQuery})` : ` ${siteQuery}`
}
```

#### 3. 语法降级处理
```typescript
// Bing适配器示例
degradeSyntax(params: SearchParams): SearchParams {
  const degradedParams = { ...params }
  if (params.cacheSite) {
    console.warn('Bing不支持cache语法,该参数将被忽略')
    degradedParams.cacheSite = undefined
  }
  return degradedParams
}
```

#### 4. 验证错误消息国际化
```typescript
const language = await getCurrentLanguage()
const t = (key: string, vars?) => translate(language, key, vars)

if (!params.keyword.trim() && !params.exactMatch?.trim()) {
  errors.push(t('adapter.validation.keywordRequired'))
}
```

## Internationalization (i18n) Architecture

### Translation System
- **Languages**: 中文(zh-CN) + English(en-US)
- **Translation Keys**: 1000+ 条翻译键值对
- **Structure**: 分类组织 (common, searchForm, options, shortcuts, etc.)

### Key Translation Categories
1. `common.searchEngines.*` - 搜索引擎名称
2. `adapter.validation.*` - 适配器验证消息
3. `searchForm.*` - 搜索表单UI文本
4. `options.*` - 设置页面文本

### Translation Pattern
```typescript
export function translate(
  language: Language,
  key: string,
  variables?: Record<string, string | number>,
  fallback?: string
): string {
  // 支持变量插值: {engine}, {fileType}, {count} 等
}
```

## Integration Points for New Adapters

### 1. Adapter Implementation
**Location**: `src/services/adapters/{engine}.ts`
**Required**: 实现 `SearchEngineAdapter` 接口

### 2. Factory Registration
**Location**: `src/services/adapters/factory.ts`
```typescript
case 'new-engine':
  return new NewEngineAdapter()
```

### 3. Type Definitions
**Location**: `src/types/`
- 添加新引擎到 `SearchEngine` 类型
- 更新相关接口定义

### 4. i18n Translation Keys
**Location**: `src/i18n/translations.ts`
- `common.searchEngines.{engine}` - 中英文引擎名称
- `adapter.validation.*` - 特定验证消息

### 5. UI Components
根据需要更新组件以支持新引擎的特殊语法

## Development Workflow

### Build Commands
```bash
npm run dev          # 开发模式 (热重载)
npm run build        # 生产构建
npm run type-check   # 类型检查
npm run lint         # 代码检查
npm run test         # 单元测试
npm run test:e2e     # E2E测试
```

### Quality Standards
- ✅ TypeScript类型安全
- ✅ ESLint代码规范
- ✅ 单元测试覆盖
- ✅ E2E测试验证
- ✅ 国际化完整性

## Constraints & Considerations

### 1. 浏览器兼容性
- 必须兼容 Chrome/Edge (Manifest V3)
- 使用 Chrome Storage API

### 2. 性能要求
- 适配器需快速构建查询 (<100ms)
- 验证逻辑应高效

### 3. 用户体验
- 所有文本必须国际化
- 错误消息应友好且具体
- 支持语法降级和警告

### 4. 代码组织
- 遵循现有命名约定
- 保持与现有适配器一致的结构
- 复用公共工具方法

## Testing Strategy

### Unit Tests
- 适配器查询构建逻辑
- 参数验证规则
- 语法支持检查

### E2E Tests (Playwright)
- 完整搜索流程
- 多引擎切换
- UI交互验证

## Current Feature Gaps

根据搜索网络信息，需要添加的新搜索引擎:
1. **Yahoo** - 兼容Bing语法
2. **Startpage** - 兼容Google语法，隐私友好
3. **Ecosia** - 兼容Google/Bing，环保理念
4. **Qwant** - 欧洲隐私搜索
5. **Naver** - 韩国市场
6. **Sogou (搜狗)** - 中国市场
7. **360搜索** - 中国市场
8. **Perplexity AI** - AI搜索
9. **You.com** - AI搜索，程序员友好

## Repository Best Practices

### Code Style
- 使用 4 空格缩进
- 优先使用箭头函数
- 明确的类型注解
- JSDoc注释用于公共方法

### Git Workflow
- 功能分支开发
- 详细的 commit 消息
- 发布前版本号更新

### Documentation
- README保持更新
- 代码内联注释
- 类型定义即文档
