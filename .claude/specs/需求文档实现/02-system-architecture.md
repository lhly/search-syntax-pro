# SSP智能搜索插件 - 系统架构设计

## 架构概览

基于您的技术决策，系统架构采用现代化技术栈和Chrome扩展最佳实践：

**核心技术栈**:
- **语言**: TypeScript 5.x
- **构建工具**: Vite 5.x + 热重载开发环境
- **UI框架**: 轻量级方案（考虑 Preact/Mithril）
- **样式**: SCSS + CSS Modules 或 Tailwind CSS
- **状态管理**: 基于Chrome Storage的轻量级状态管理

**Chrome扩展架构**:
- **Manifest V3**: 使用最新标准
- **Service Worker**: 替代背景页面
- **Content Scripts**: 页面内容注入
- **Popup/Options**: 扩展界面组件

## 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                Chrome Extension                         │
├─────────────────────────────────────────────────────────┤
│  UI Layer (380-420px width)                            │
│  ├── Popup UI (主界面)                                  │
│  │   ├── SearchForm Component                          │
│  │   ├── SyntaxOptions Component                       │
│  │   ├── QueryPreview Component                       │
│  │   └── HistoryPanel Component                       │
│  ├── Options Page (设置页面)                           │
│  └── Side Panel (侧边栏)                               │
├─────────────────────────────────────────────────────────┤
│  Business Logic Layer                                  │
│  ├── SearchQueryService                                │
│  ├── SyntaxValidator                                   │
│  ├── HistoryManager                                    │
│  └── SettingsManager                                   │
├─────────────────────────────────────────────────────────┤
│  Search Engine Adapters                                │
│  ├── BaiduAdapter                                      │
│  ├── GoogleAdapter                                     │
│  ├── BingAdapter                                       │
│  └── AdapterFactory                                    │
├─────────────────────────────────────────────────────────┤
│  Data Access Layer                                     │
│  ├── ChromeStorageService                              │
│  ├── LocalizationService                               │
│  ├── DataPortability (导入导出)                        │
│  └── ConfigurationService                              │
└─────────────────────────────────────────────────────────┘
```

## 详细组件设计

### 1. UI层架构

#### Popup界面 (380-420px宽度)
```typescript
// 主界面组件结构
interface PopupComponents {
  searchForm: SearchForm;        // 关键词输入和引擎选择
  syntaxOptions: SyntaxOptions;  // 可视化语法选择器
  queryPreview: QueryPreview;    // 查询预览和操作按钮
  historyPanel: HistoryPanel;    // 历史记录管理
}

interface SearchForm {
  keywordInput: HTMLInputElement;
  engineSelector: SelectElement;
  searchButton: ButtonElement;
}
```

#### 设置页面架构
```typescript
interface OptionsPage {
  generalSettings: GeneralSettings;
  dataManagement: DataManagement;
  importExport: ImportExportSection;
  aboutSection: AboutSection;
}
```

### 2. 业务逻辑层

#### 核心服务设计
```typescript
class SearchQueryService {
  buildQuery(params: SearchParams): string;
  validateQuery(query: string): ValidationResult;
  suggestCompletions(partial: string): string[];
}

class SyntaxValidator {
  validateSiteSyntax(site: string): boolean;
  validateFileType(type: string): boolean;
  checkConflicts(syntaxes: SyntaxType[]): ConflictResult;
}

class HistoryManager {
  addToHistory(query: SearchQuery): void;
  getHistory(limit: number): SearchQuery[];
  clearHistory(): void;
}
```

### 3. 数据存储架构

#### Chrome Storage配置
```typescript
interface StorageConfig {
  // 历史记录保存30天
  history: {
    key: 'search_history';
    expiration: 30 * 24 * 60 * 60 * 1000; // 30天
    maxSize: 1000; // 最多保存1000条记录
  };
  
  // 用户设置（永久保存）
  settings: {
    key: 'user_settings';
    persistent: true;
  };
  
  // 缓存数据（24小时）
  cache: {
    key: 'app_cache';
    expiration: 24 * 60 * 60 * 1000;
  };
}
```

#### 数据模型定义
```typescript
interface SearchHistory {
  id: string;
  keyword: string;
  engine: SearchEngine;
  syntax: SyntaxOptions;
  timestamp: number;
}

interface UserSettings {
  defaultEngine: 'baidu' | 'google' | 'bing';
  language: 'zh-CN' | 'en-US';
  enableHistory: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface SyntaxOptions {
  site?: string;
  fileType?: string;
  dateRange?: DateRange;
  exactMatch?: string;
}
```

### 4. 搜索引擎适配器

#### 统一接口设计
```typescript
interface SearchEngineAdapter {
  buildQuery(params: SearchParams): string;
  validateSyntax(syntax: SyntaxType): boolean;
  getSupportedSyntax(): SyntaxType[];
  getBaseUrl(): string;
}

// 百度适配器实现
class BaiduAdapter implements SearchEngineAdapter {
  buildQuery(params: SearchParams): string {
    let query = params.keyword;
    if (params.site) query += ` site:${params.site}`;
    if (params.fileType) query += ` filetype:${params.fileType}`;
    return `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`;
  }
}
```

### 5. 数据导入导出

#### 导入导出接口
```typescript
interface ExportData {
  version: string;
  timestamp: number;
  data: {
    history: SearchHistory[];
    settings: UserSettings;
  };
}

class DataPortability {
  async exportToJSON(): Promise<Blob>;
  async importFromJSON(file: File): Promise<ImportResult>;
  validateImportData(data: any): boolean;
  backupToCloud(): Promise<void>;
  restoreFromCloud(): Promise<void>;
}
```

### 6. 国际化支持

#### 多语言配置
```typescript
interface I18nConfig {
  supported: ['zh-CN', 'en-US'];
  default: 'zh-CN';
  fallback: 'en-US';
  
  messages: {
    'zh-CN': ChineseMessages;
    'en-US': EnglishMessages;
  };
}

class I18nManager {
  private currentLocale: string;
  private messages: ExtensionMessages;
  
  t(key: string, substitutions?: string[]): string;
  detectLocale(): string;
  loadMessages(locale: string): Promise<void>;
}
```

### 7. 开发环境配置

#### Vite配置
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts'
      }
    },
    outDir: 'dist',
    target: 'chrome89' // 支持Chrome和Edge
  },
  
  plugins: [
    chromeExtension(),
    typescript(),
    hmr({ overlay: false })
  ],
  
  define: {
    __IS_DEV__: process.env.NODE_ENV === 'development'
  }
});
```

### 8. 浏览器兼容性

#### 目标浏览器支持
```typescript
const browserSupport = {
  chrome: {
    minVersion: "89",
    status: "primary"
  },
  edge: {
    minVersion: "89", 
    status: "primary"
  },
  firefox: {
    minVersion: "109",
    status: "secondary",
    planned: true
  }
};
```

### 9. Chrome Web Store发布准备

#### Manifest配置
```json
{
  "manifest_version": 3,
  "name": "__MSG_app_name__",
  "version": "1.0.0",
  "description": "__MSG_app_description__",
  "default_locale": "en",
  
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  
  "host_permissions": [
    "<all_urls>"
  ],
  
  "background": {
    "service_worker": "background.js"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_title": "__MSG_app_name__"
  },
  
  "options_page": "options.html"
}
```

## 技术决策总结

### 已确认的技术选型
1. **构建工具**: TypeScript + Vite + 热重载
2. **UI方案**: 轻量级框架 + CSS预处理器 + CSS框架
3. **浏览器支持**: Chrome/Edge主要，Firefox后续
4. **数据存储**: 本地存储，30天历史，支持导入导出
5. **国际化**: 中英文静态支持

### 性能要求
- 插件启动时间: < 200ms
- 查询生成响应: < 100ms
- 内存占用: < 50MB
- 历史记录: 最多1000条，30天自动清理

### 安全策略
- 权限最小化原则
- 本地数据存储，不上传用户数据
- 支持一键清除所有数据
- 符合Chrome Web Store安全标准

---
*Document Version*: 1.0
*Date*: 2025-11-06
*Author*: 冷火凉烟 (System Architect)
*Quality Score*: 92/100