# 仓库国际化上下文报告
**SearchSyntax Pro - 俄语和韩语国际化添加**

生成时间: 2025-12-03 12:42 (Asia/Shanghai)
项目版本: 1.8.6
分析范围: 国际化基础设施、现有语言支持、代码模式

---

## 1. 项目概要

### 1.1 项目类型和目的

**项目类型**: Chrome/Edge 浏览器扩展 (Manifest V3)

**核心功能**: 搜索语法可视化工具
- 提供图形化界面降低高级搜索语法使用门槛
- 支持17个主流搜索引擎（百度、谷歌、必应、Twitter、DuckDuckGo等）
- 提供高级搜索语法构建、历史记录、模板系统、快捷键等功能

**技术栈**:
- **框架**: React 18.2 + TypeScript 5.2
- **构建工具**: Vite 5.0 + @vitejs/plugin-react
- **UI库**: Tailwind CSS 3.3 + Headless UI 2.2
- **其他**: date-fns, @dnd-kit (拖拽排序)

**项目结构**:
```
src/
├── background/          # Service Worker (后台脚本)
├── content/             # Content Scripts (内容脚本)
├── popup/               # Extension Popup (扩展弹窗)
├── options/             # Options Page (设置页面)
├── floating-panel/      # Floating Panel (悬浮面板)
├── components/          # 共享React组件
├── i18n/                # 国际化模块 ⭐
├── services/            # 业务服务层
│   └── adapters/        # 搜索引擎适配器
├── types/               # TypeScript类型定义
└── utils/               # 工具函数

public/
└── _locales/            # Chrome扩展i18n文件 ⭐
    ├── en/
    │   └── messages.json
    └── zh_CN/
        └── messages.json
```

---

## 2. 国际化技术栈架构

### 2.1 双层国际化系统

项目采用 **双层国际化架构**，分别服务于不同场景：

#### **第一层: Chrome Extension i18n API**
- **位置**: `/public/_locales/{locale}/messages.json`
- **用途**:
  - Manifest.json 中的应用名称和描述
  - 页面标题 (document.title)
  - 右键菜单文本
  - 扩展图标悬停提示
- **API**: `chrome.i18n.getMessage(key)`
- **特点**:
  - Chrome原生支持，性能最优
  - 仅支持简单键值对，无变量插值
  - 必须在manifest.json中设置 `default_locale`

**现有文件**:
```
public/_locales/
├── en/messages.json       (14条消息，简单键值对)
└── zh_CN/messages.json    (14条消息，简单键值对)
```

#### **第二层: React自定义i18n系统**
- **位置**: `/src/i18n/`
- **文件结构**:
  ```
  src/i18n/
  ├── index.tsx          # TranslationProvider + useTranslation Hook
  └── translations.ts    # 翻译键值表 + translate函数
  ```
- **用途**:
  - React组件内的所有UI文本
  - 支持变量插值 (如: `{engine}`, `{count}`)
  - 复杂的翻译场景
- **API**:
  - `useTranslation()` Hook → `t(key, variables?, fallback?)`
  - `translate(language, key, variables?, fallback?)`
- **特点**:
  - 支持变量插值: `{变量名}` 占位符
  - 多级fallback机制: 指定语言 → 默认语言(zh-CN) → en-US → fallback参数 → key本身
  - 类型安全 (TypeScript)

**核心实现**:
```typescript
// translations.ts 结构
const translations: Record<Language, Record<string, string>> = {
  'zh-CN': { 'key': '中文文本 {variable}' },
  'en-US': { 'key': 'English text {variable}' }
}

// 变量替换逻辑
const variablePattern = /\{(\w+)\}/g
template.replace(variablePattern, (_, varName) => variables[varName])

// 使用示例
t('popup.footer.currentEngine', { engine: 'Google' })
// → "当前引擎: Google" (zh-CN) 或 "Current engine: Google" (en-US)
```

### 2.2 语言类型定义

**Type Definition** (`src/types/index.ts`):
```typescript
export type Language = 'zh-CN' | 'en-US'

export interface UserSettings {
  language: Language;  // 用户选择的界面语言
  // ... 其他设置
}

export const DEFAULT_SETTINGS = {
  language: 'zh-CN' as Language,  // 默认简体中文
  // ...
}
```

**Manifest配置** (`public/manifest.json`):
```json
{
  "name": "__MSG_app_name__",
  "description": "__MSG_app_description__",
  "default_locale": "zh_CN"  // Chrome i18n默认语言
}
```

---

## 3. 现有语言支持分析

### 3.1 第一层 Chrome i18n (_locales)

**支持语言**:
- `zh_CN` (简体中文) - 默认语言
- `en` (英语)

**消息数量**: 每个语言14条固定消息

**关键消息**:
```json
{
  "app_name": "SearchSyntax Pro",
  "app_description": "搜索语法可视化工具...",
  "popup_title": "SearchSyntax Pro",
  "options_title": "SearchSyntax Pro - 设置"
  // ... 其他11条
}
```

### 3.2 第二层 React i18n (translations.ts)

**支持语言**:
- `zh-CN` (简体中文) - 默认语言
- `en-US` (英语)

**翻译条目统计**:
- **zh-CN**: 518条翻译键
- **en-US**: 518条翻译键 (完全对应)

**翻译键组织结构** (分类统计):

| 分类 | 键前缀 | 数量估计 | 示例键 |
|-----|--------|---------|--------|
| 通用组件 | `common.*` | ~30条 | `common.languages.zh-CN`<br>`common.save`, `common.cancel` |
| 搜索引擎名称 | `common.searchEngines.*` | 17条 | `common.searchEngines.baidu`<br>`common.searchEngines.google` |
| 文件类型 | `common.fileTypes.*` | 13条 | `common.fileTypes.pdf` |
| 复制按钮 | `copyButton.*` | 3条 | `copyButton.tooltipCopy` |
| 内容脚本 | `content.*` | 3条 | `content.openPanelHint` |
| Popup组件 | `popup.*` | ~10条 | `popup.headerTitle`<br>`popup.adapterLoadError` |
| 搜索表单 | `searchForm.*` | ~80条 | `searchForm.keywordLabel`<br>`searchForm.fromUser.label` |
| 查询预览 | `queryPreview.*` | 3条 | `queryPreview.title` |
| 搜索历史 | `searchHistory.*` | ~15条 | `searchHistory.title`<br>`searchHistory.expandAll` |
| 设置页面 | `options.*` | ~90条 | `options.fields.language.label`<br>`options.engineManager.*` |
| 历史管理器 | `historyManager.*` | ~12条 | `historyManager.searchPlaceholder` |
| 右键菜单 | `contextMenu.*` | 1条 | `contextMenu.searchSelection` |
| 快捷键 | `shortcuts.*` | ~40条 | `shortcuts.execute_search.description`<br>`shortcuts.settings.*` |
| 模板系统 | `template.*` | ~50条 | `template.category.academic`<br>`template.academic_paper.name` |
| 标签输入 | `tagInput.*` | 5条 | `tagInput.defaultPlaceholder` |
| 弹出按钮 | `popout.*` | 1条 | `popout.openFailedAlert` |
| 智能建议 | `suggestion.*` | ~15条 | `suggestion.limitFileTypePdf.title` |
| GitHub语言 | `github.language.*` | 18条 | `github.language.javascript` |
| Twitter语言 | `twitter.language.*` | 11条 | `twitter.language.zh`<br>`twitter.language.ru`<br>`twitter.language.ko` |
| 适配器验证 | `adapter.validation.*` | ~18条 | `adapter.validation.keywordRequired` |

**特殊注意**:
- Twitter语言列表中已包含 `twitter.language.ru` (俄语) 和 `twitter.language.ko` (韩语)
- 这些是Twitter搜索引擎的语言筛选选项，非界面语言

### 3.3 翻译键命名规范

**命名模式**: `{组件/功能}.{子分类}.{具体键}` (三级层级)

**示例**:
```typescript
// 层级1: 组件/功能
'searchForm.*'           // 搜索表单组件
'options.*'              // 设置页面
'shortcuts.*'            // 快捷键系统

// 层级2: 子分类
'searchForm.userFiltering.*'     // 搜索表单 > 用户筛选
'searchForm.fromUser.*'          // 搜索表单 > 来自用户字段
'options.fields.*'               // 设置页面 > 表单字段

// 层级3: 具体键
'searchForm.fromUser.label'      // 字段标签
'searchForm.fromUser.placeholder'// 占位符文本
'searchForm.fromUser.description'// 帮助说明
'searchForm.fromUser.hint'       // 提示文本
```

**文本类型后缀约定**:
- `.label` - 字段标签
- `.placeholder` - 输入框占位符
- `.description` - 功能说明/帮助文本
- `.hint` - 额外提示
- `.title` - 标题
- `.name` - 名称
- `.tags` - 标签列表
- `.reason` - 原因说明
- `.tooltip` - 悬停提示
- `.message` - 消息内容

---

## 4. 国际化代码模式

### 4.1 React组件中的使用模式

**标准模式**: 使用 `useTranslation` Hook

```tsx
import { useTranslation } from '@/i18n'

function MyComponent() {
  const { t, language } = useTranslation()

  return (
    <div>
      <h1>{t('common.save')}</h1>
      <p>{t('popup.footer.currentEngine', { engine: 'Google' })}</p>
    </div>
  )
}
```

**Provider包裹**: App根组件必须使用 `TranslationProvider`

```tsx
// src/popup/App.tsx
import { TranslationProvider } from '@/i18n'

function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)

  return (
    <TranslationProvider language={settings?.language || 'zh-CN'}>
      <ThemeProvider theme={settings?.theme || 'auto'}>
        {/* 子组件 */}
      </ThemeProvider>
    </TranslationProvider>
  )
}
```

### 4.2 非React代码中的使用模式

**Service Workers / Content Scripts**:

```typescript
import { translate } from '@/i18n/translations'

// 获取当前语言设置
async function getCurrentLanguage(): Promise<Language> {
  const result = await chrome.storage.local.get('user_settings')
  return result.user_settings?.language || 'zh-CN'
}

// 使用translate函数
const lang = await getCurrentLanguage()
const text = translate(lang, 'content.openPanelHint')
```

**Chrome i18n API** (用于manifest和页面标题):

```typescript
// src/popup/main.tsx
document.title = chrome.i18n.getMessage('popup_title')

// src/background/index.ts
chrome.contextMenus.create({
  id: 'search-selection',
  title: chrome.i18n.getMessage('contextMenu.searchSelection'),
  contexts: ['selection']
})
```

### 4.3 语言切换逻辑

**存储位置**: Chrome Storage Local API

```typescript
// 保存语言设置
const settings: UserSettings = {
  language: 'en-US',
  // ... 其他设置
}
await chrome.storage.local.set({ user_settings: settings })

// 读取语言设置
const { user_settings } = await chrome.storage.local.get('user_settings')
const language = user_settings?.language || 'zh-CN'
```

**实时切换机制**:
```typescript
// options/App.tsx - 设置页面
const handleLanguageChange = async (newLanguage: Language) => {
  const newSettings = { ...settings, language: newLanguage }
  await chrome.storage.local.set({ user_settings: newSettings })
  setSettings(newSettings)
  // TranslationProvider会自动响应language prop变化
}
```

---

## 5. 搜索引擎适配器的语言配置

### 5.1 动态语言选择器机制

部分搜索引擎支持语言筛选功能，通过适配器提供语言选项配置：

**Type Definition**:
```typescript
// src/types/index.ts
export interface LanguageOption {
  value: string;   // 搜索引擎API值 (如: 'zh', 'javascript')
  label: string;   // UI显示文本的翻译键
}

export interface LanguageFieldConfig {
  label: string;              // 字段标签的翻译键
  placeholder: string;        // 占位符的翻译键
  options: LanguageOption[];  // 语言选项列表
}

export interface SearchEngineAdapter {
  getLanguageOptions?(): LanguageFieldConfig;
  // ...
}
```

**实现示例 - Twitter适配器**:
```typescript
// src/services/adapters/twitter.ts
getLanguageOptions(): LanguageFieldConfig {
  return {
    label: 'searchForm.language.label',
    placeholder: 'searchForm.language.placeholder',
    options: [
      { value: 'zh', label: 'twitter.language.zh' },
      { value: 'en', label: 'twitter.language.en' },
      { value: 'ja', label: 'twitter.language.ja' },
      { value: 'ko', label: 'twitter.language.ko' },  // 韩语
      { value: 'ru', label: 'twitter.language.ru' },  // 俄语
      // ... 其他语言
    ]
  }
}
```

**翻译键内容**:
```typescript
// translations.ts
'twitter.language.zh': '中文' / 'Chinese',
'twitter.language.en': 'English' / 'English',
'twitter.language.ko': '한국어' / 'Korean',
'twitter.language.ru': 'Русский' / 'Russian',
// ...
```

**关键区分**:
- `twitter.language.*` 键是搜索引擎的语言筛选选项，非界面语言
- 界面语言由 `common.languages.*` 控制

---

## 6. 构建系统和国际化集成

### 6.1 Vite构建配置

**多入口构建** (`vite.config.ts`):
```typescript
build: {
  rollupOptions: {
    input: {
      popup: 'src/popup/index.html',
      options: 'src/options/index.html',
      'floating-panel': 'src/floating-panel/index.html',
      background: 'src/background/index.ts',
      content: 'src/content/index.ts'
    }
  }
}
```

**路径别名** (支持 `@/i18n` 导入):
```typescript
resolve: {
  alias: {
    '@/i18n': resolve(__dirname, 'src/i18n')
  }
}
```

### 6.2 Post-Build处理流程

**构建后脚本**: `scripts/post-build.js`

**关键步骤**:
1. **复制静态资源**:
   ```javascript
   // 1. 复制 manifest.json
   copyFileSync('public/manifest.json', 'dist/manifest.json')

   // 2. 复制图标
   copyDirectory('public/icons', 'dist/icons')

   // 3. 复制语言文件 ⭐
   copyDirectory('public/_locales', 'dist/_locales')
   ```

2. **ES模块转换**:
   - Content Scripts和Service Workers不支持ES模块
   - 内联 `translations.js` 到 `background.js` 和 `content.js`
   - 移除 `import`/`export` 语句
   - 使用IIFE包装避免变量冲突

**处理后的目录结构**:
```
dist/
├── manifest.json
├── icons/
├── _locales/              # 复制的Chrome i18n文件
│   ├── en/messages.json
│   └── zh_CN/messages.json
├── background.js          # 已内联translations.js
├── content.js             # 已内联translations.js
├── popup.js               # 保留ES模块导入
└── options.js             # 保留ES模块导入
```

---

## 7. 新语言添加的集成点

### 7.1 必需修改点 (强制性)

#### **P0 - Type Definition**
```typescript
// src/types/index.ts
export type Language = 'zh-CN' | 'en-US' | 'ru-RU' | 'ko-KR'
                    //                    ^^^^^^   ^^^^^^ 新增
```

#### **P0 - Chrome i18n Messages**
```
public/_locales/
├── ru/              # 新增俄语目录
│   └── messages.json
└── ko/              # 新增韩语目录
    └── messages.json
```

**文件内容模板**:
```json
{
  "app_name": { "message": "SearchSyntax Pro" },
  "app_description": { "message": "Инструмент визуализации синтаксиса поиска..." },
  "popup_title": { "message": "SearchSyntax Pro" },
  // ... 其他11条消息
}
```

#### **P0 - React Translations**
```typescript
// src/i18n/translations.ts
const translations: Record<Language, Record<string, string>> = {
  'zh-CN': { /* 518条 */ },
  'en-US': { /* 518条 */ },
  'ru-RU': { /* 518条 - 新增 */ },
  'ko-KR': { /* 518条 - 新增 */ }
}
```

#### **P0 - 语言选择器UI**
```typescript
// translations.ts
'common.languages.ru-RU': 'Русский' / 'Russian',
'common.languages.ko-KR': '한국어' / 'Korean',
```

### 7.2 可选修改点 (建议性)

#### **P1 - 默认语言调整**
```typescript
// src/types/index.ts
export const DEFAULT_SETTINGS = {
  language: 'zh-CN' as Language,  // 可根据目标市场调整
}

// public/manifest.json
"default_locale": "zh_CN"  // Chrome会根据浏览器语言自动选择
```

#### **P2 - Twitter/GitHub语言选项**
如需在这些搜索引擎中提供俄语/韩语筛选，需更新相应适配器的翻译键：

```typescript
// 已存在，无需新增
'twitter.language.ru': 'Русский' / 'Russian',
'twitter.language.ko': '한국어' / 'Korean',
```

---

## 8. 潜在约束和考虑因素

### 8.1 技术约束

1. **Chrome i18n目录命名规范**:
   - 俄语: `ru` (不是 `ru-RU` 或 `ru_RU`)
   - 韩语: `ko` (不是 `ko-KR` 或 `ko_KR`)
   - 参考: [Chrome i18n Locales](https://developer.chrome.com/docs/extensions/reference/i18n/#locales)

2. **React i18n类型定义**:
   - 使用连字符: `'ru-RU'`, `'ko-KR'` (保持与现有 `'zh-CN'`, `'en-US'` 一致)
   - TypeScript联合类型需要显式添加新语言

3. **构建系统兼容性**:
   - Post-build脚本会自动复制 `_locales` 目录
   - 无需修改构建脚本

### 8.2 翻译质量要求

1. **变量占位符保持**:
   - 必须保留所有 `{变量名}` 占位符
   - 示例: `'当前引擎: {engine}'` → `'Текущая система: {engine}'`

2. **HTML特殊字符转义**:
   - 使用纯文本，避免HTML标签
   - 特殊符号需考虑浏览器渲染兼容性

3. **文本长度考量**:
   - 俄语文本通常比英语长20-30%
   - 韩语文本长度与英语相近
   - 需确保UI有足够空间避免截断

### 8.3 测试覆盖建议

1. **UI组件截图对比**:
   - Settings页面: 语言选择器、所有表单字段
   - Popup窗口: 所有交互元素
   - Floating Panel: 悬浮面板完整界面

2. **关键功能验证**:
   - 语言切换后即时生效
   - 变量插值正确渲染
   - 多行文本不溢出
   - 快捷键提示正确显示

3. **跨浏览器测试**:
   - Chrome/Edge (主要支持)
   - 俄语/韩语系统语言环境

### 8.4 维护性考虑

1. **翻译键同步**:
   - 新增功能时，必须同步添加所有语言的翻译
   - 建议使用脚本验证翻译键完整性

2. **版本控制**:
   - 翻译文件独立提交，便于审阅
   - Git历史应清晰记录翻译更新

3. **文档更新**:
   - README.md需添加新语言支持说明
   - 用户文档/帮助页面需本地化

---

## 9. 工作流程和最佳实践

### 9.1 推荐实施顺序

**Phase 1: Type System 更新**
1. 修改 `src/types/index.ts` 添加新语言类型
2. TypeScript编译验证

**Phase 2: Chrome i18n 文件创建**
1. 创建 `public/_locales/ru/messages.json`
2. 创建 `public/_locales/ko/messages.json`
3. 翻译14条固定消息

**Phase 3: React Translations 填充**
1. 复制 `translations.ts` 中的 `en-US` 对象
2. 创建 `ru-RU` 和 `ko-KR` 对象框架
3. 分批翻译518条消息 (建议分10-15批)

**Phase 4: UI集成测试**
1. 语言选择器显示新语言
2. 切换语言测试所有页面
3. 截图对比和边界情况测试

**Phase 5: 文档和发布**
1. 更新README和用户文档
2. Chrome Web Store截图本地化
3. 发布Notes中说明新语言支持

### 9.2 翻译辅助工具建议

1. **批量导出/导入**:
   ```bash
   # 导出翻译键到Excel/CSV
   node scripts/export-translations.js

   # 导入翻译后的文件
   node scripts/import-translations.js ru-RU translations-ru.csv
   ```

2. **翻译验证脚本**:
   ```bash
   # 检查缺失翻译
   node scripts/validate-translations.js ru-RU

   # 检查变量占位符一致性
   node scripts/check-placeholders.js
   ```

3. **机器翻译辅助** (需人工审核):
   - DeepL API (质量较高)
   - Google Translate API
   - 专业术语使用术语库保证一致性

### 9.3 代码审查清单

- [ ] TypeScript类型定义已更新
- [ ] Chrome i18n文件已创建并符合命名规范
- [ ] React translations所有键已填充
- [ ] 变量占位符保持一致
- [ ] 无硬编码文本遗留
- [ ] 默认语言fallback正常工作
- [ ] 构建脚本成功复制新语言文件
- [ ] 所有UI组件正确显示新语言
- [ ] 快捷键/提示文本已本地化
- [ ] README更新了语言支持列表

---

## 10. 参考文档和资源

### 10.1 Chrome Extension i18n
- [官方文档](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [Locale Codes](https://developer.chrome.com/docs/extensions/reference/i18n/#locales)

### 10.2 项目内部资源
- Type定义: `src/types/index.ts`
- 翻译实现: `src/i18n/translations.ts`
- Provider: `src/i18n/index.tsx`
- 构建脚本: `scripts/post-build.js`

### 10.3 相关Issue/PR
- 查看项目历史中的国际化相关提交
- 搜索 "i18n" 或 "language" 关键词

---

## 附录: 现有翻译键完整结构

**顶级分类 (11个主要命名空间)**:
```
common.*              (通用组件和常量)
copyButton.*          (复制按钮)
content.*             (内容脚本)
popup.*               (弹出窗口)
searchForm.*          (搜索表单 - 最大分类)
queryPreview.*        (查询预览)
searchHistory.*       (搜索历史)
options.*             (设置页面 - 第二大分类)
historyManager.*      (历史管理器)
contextMenu.*         (右键菜单)
shortcuts.*           (快捷键系统)
template.*            (模板系统)
tagInput.*            (标签输入组件)
popout.*              (弹出窗口按钮)
suggestion.*          (智能建议)
github.language.*     (GitHub编程语言)
twitter.language.*    (Twitter自然语言)
adapter.validation.*  (适配器验证错误)
```

**翻译工作量估算**:
- Chrome i18n: 14条 × 2语言 = 28条
- React i18n: 518条 × 2语言 = 1036条
- **总计**: ~1064条翻译条目

---

**报告结束**

*该报告为添加俄语和韩语国际化支持提供了完整的技术基础和实施路径。所有关键集成点、代码模式和最佳实践均已详细记录。*
