# 架构设计建议

> **文档版本**: v1.0
> **更新日期**: 2025-11-10

---

## 当前架构分析

### 优势

✅ **适配器模式** - 每个搜索引擎独立适配器,扩展性强
✅ **TypeScript 类型系统** - 完善的类型定义和接口
✅ **React 组件化** - UI 组件清晰,可复用性好
✅ **Vite 构建** - 快速的开发和构建体验

### 待改进

❌ **状态管理分散** - useState 分散在各组件
❌ **存储层单一** - 仅使用 Chrome Storage API
❌ **缺少插件化** - 功能硬编码,难以扩展
❌ **模块耦合** - 业务逻辑和 UI 耦合

---

## 架构升级方案

### 1. 状态管理升级

**当前方案**:
```typescript
// 分散在各组件
const [searchParams, setSearchParams] = useState<SearchParams>({...});
const [history, setHistory] = useState<SearchHistory[]>([]);
const [settings, setSettings] = useState<UserSettings | null>(null);
```

**推荐方案**: **Zustand** (轻量级状态管理)

```typescript
// src/stores/app-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppStore {
  // State
  searchParams: SearchParams;
  history: SearchHistory[];
  bookmarks: SearchBookmark[];
  templates: SearchTemplate[];
  settings: UserSettings;

  // Actions
  setSearchParams: (params: SearchParams) => void;
  addToHistory: (history: SearchHistory) => void;
  addBookmark: (bookmark: SearchBookmark) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      searchParams: {...},
      history: [],
      bookmarks: [],
      templates: [],
      settings: DEFAULT_SETTINGS,

      // Actions
      setSearchParams: (params) => set({ searchParams: params }),

      addToHistory: (history) =>
        set((state) => ({
          history: [history, ...state.history].slice(0, 1000)
        })),

      addBookmark: (bookmark) =>
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark]
        })),

      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings }
        }))
    }),
    {
      name: 'ssp-storage',
      partialize: (state) => ({
        settings: state.settings,
        bookmarks: state.bookmarks
      })
    }
  )
);
```

**优势**:
- 集中式状态管理
- 内置持久化支持
- 极小的包体积 (~1KB)
- TypeScript 友好
- 无需 Provider 包裹

---

### 2. 模块化重构

**推荐目录结构**:

```
src/
├── core/                    # 核心业务逻辑
│   ├── adapters/           # 搜索引擎适配器
│   │   ├── base.ts
│   │   ├── baidu.ts
│   │   ├── google.ts
│   │   └── factory.ts
│   ├── templates/          # 模板管理
│   │   ├── template-manager.ts
│   │   ├── builtin-templates.ts
│   │   └── template-validator.ts
│   ├── analytics/          # 统计分析
│   │   ├── analytics-service.ts
│   │   └── metrics.ts
│   └── suggestions/        # 智能推荐
│       ├── suggestion-engine.ts
│       └── pattern-rules.ts
│
├── features/               # 功能模块 (Feature-based)
│   ├── search/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── history/
│   ├── bookmarks/
│   ├── comparison/
│   └── templates/
│
├── shared/                 # 共享资源
│   ├── ui/                # UI 组件库
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   └── index.ts
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useStorage.ts
│   │   ├── useTheme.ts
│   │   └── useShortcut.ts
│   ├── utils/             # 工具函数
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   └── constants/
│       ├── config.ts
│       └── defaults.ts
│
├── infrastructure/         # 基础设施层
│   ├── storage/           # 存储抽象层
│   │   ├── chrome-storage.ts
│   │   ├── indexed-storage.ts
│   │   └── storage-adapter.ts
│   ├── i18n/              # 国际化
│   │   ├── translations/
│   │   ├── config.ts
│   │   └── provider.tsx
│   ├── analytics/         # 数据上报
│   │   └── telemetry.ts
│   └── api/               # API 客户端
│       └── template-api.ts
│
├── stores/                 # 全局状态管理
│   ├── app-store.ts
│   ├── ui-store.ts
│   └── user-store.ts
│
└── types/                  # 全局类型定义
    ├── search.ts
    ├── template.ts
    ├── analytics.ts
    └── index.ts
```

---

### 3. 存储层优化

**混合存储策略**:

```typescript
// src/infrastructure/storage/storage-adapter.ts

interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class HybridStorage implements StorageAdapter {
  private chromeStorage: ChromeStorageAdapter;
  private indexedDB: IndexedDBAdapter;

  /**
   * 智能存储选择
   * - 小数据 (<5KB): Chrome Storage
   * - 大数据 (≥5KB): IndexedDB
   */
  async set<T>(key: string, value: T): Promise<void> {
    const size = new Blob([JSON.stringify(value)]).size;

    if (size < 5 * 1024) {
      // 使用 Chrome Storage (快速,同步)
      await this.chromeStorage.set(key, value);
    } else {
      // 使用 IndexedDB (大容量,异步)
      await this.indexedDB.set(key, value);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // 先尝试 Chrome Storage
    let value = await this.chromeStorage.get<T>(key);

    // 如果不存在,尝试 IndexedDB
    if (value === null) {
      value = await this.indexedDB.get<T>(key);
    }

    return value;
  }
}
```

**数据分层存储**:

| 数据类型 | 存储方式 | 容量 | 访问速度 |
|---------|---------|------|---------|
| 用户设置 | Chrome Storage | <1KB | 极快 |
| 搜索模板 | Chrome Storage | ~10KB | 快 |
| 搜索历史 (100条) | Chrome Storage | ~50KB | 快 |
| 搜索历史 (1000+条) | IndexedDB | 无限 | 中等 |
| 收藏夹 | IndexedDB | 无限 | 中等 |
| 统计数据 | IndexedDB | 无限 | 中等 |

---

### 4. 插件化系统

**插件接口设计**:

```typescript
// src/core/plugin-system/plugin.ts

interface SearchPlugin {
  id: string;
  name: string;
  version: string;
  description: string;

  // 生命周期钩子
  activate(context: PluginContext): void | Promise<void>;
  deactivate(): void | Promise<void>;

  // 功能扩展点
  provides?: {
    adapters?: SearchEngineAdapter[];
    templates?: SearchTemplate[];
    syntaxRules?: SyntaxRule[];
    uiComponents?: React.ComponentType[];
  };
}

interface PluginContext {
  // 访问核心服务
  getService<T>(serviceName: string): T;

  // 注册功能
  registerAdapter(adapter: SearchEngineAdapter): void;
  registerTemplate(template: SearchTemplate): void;
  registerCommand(command: Command): void;

  // 事件系统
  on(event: string, handler: Function): void;
  emit(event: string, data: any): void;
}

// 插件管理器
class PluginManager {
  private plugins: Map<string, SearchPlugin> = new Map();

  async register(plugin: SearchPlugin): Promise<void> {
    // 验证插件
    this.validatePlugin(plugin);

    // 沙箱隔离
    const context = this.createSandbox(plugin);

    // 激活插件
    await plugin.activate(context);

    // 保存插件
    this.plugins.set(plugin.id, plugin);
  }

  private createSandbox(plugin: SearchPlugin): PluginContext {
    return {
      getService: (name) => this.getService(name),
      registerAdapter: (adapter) => this.registerAdapter(plugin.id, adapter),
      // ...
    };
  }
}
```

**示例插件**:

```typescript
// plugins/github-enhanced/index.ts

export const GitHubEnhancedPlugin: SearchPlugin = {
  id: 'github-enhanced',
  name: 'GitHub Enhanced Search',
  version: '1.0.0',
  description: 'Enhanced GitHub search with advanced filters',

  activate(context) {
    // 注册增强的 GitHub 适配器
    context.registerAdapter(new GitHubEnhancedAdapter());

    // 注册预设模板
    context.registerTemplate({
      id: 'github-stars-1k',
      name: 'GitHub 高星项目',
      description: '搜索 1000+ stars 的项目',
      category: 'tech',
      params: {
        engine: 'github',
        customFilters: { minStars: 1000 }
      }
    });

    // 监听搜索事件
    context.on('search:execute', (params) => {
      console.log('GitHub search:', params);
    });
  },

  deactivate() {
    console.log('GitHub Enhanced plugin deactivated');
  }
};
```

---

## 技术栈建议

### 状态管理
**推荐**: Zustand
**理由**: 轻量、简单、TypeScript 友好

### 路由管理
**推荐**: 无需路由库 (单页扩展)
**理由**: Popup 和 Options 页面独立,无需复杂路由

### UI 组件库
**推荐**: 继续使用 Tailwind CSS + 自定义组件
**理由**: 轻量、灵活、定制性强

### 图表库 (统计功能)
**推荐**: Chart.js 或 Recharts
**理由**: 轻量、易用、图表丰富

### 测试框架
**推荐**: 继续使用 Jest + Playwright
**理由**: 已有配置,生态成熟

---

## 性能优化建议

### 1. 代码分割
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'adapters': [
            './src/services/adapters/baidu.ts',
            './src/services/adapters/google.ts',
            // ...
          ]
        }
      }
    }
  }
});
```

### 2. 懒加载
```typescript
// 组件懒加载
const TemplateMarketplace = lazy(() => import('./features/templates/Marketplace'));
const AnalyticsDashboard = lazy(() => import('./features/analytics/Dashboard'));

// 适配器懒加载
const getAdapter = async (engine: SearchEngine) => {
  const module = await import(`./core/adapters/${engine}.ts`);
  return new module.default();
};
```

### 3. 虚拟滚动
```typescript
// 历史记录虚拟滚动
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={history.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <HistoryItem style={style} item={history[index]} />
  )}
</FixedSizeList>
```

---

## 安全性建议

### 1. XSS 防护
```typescript
// 用户输入清理
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);
```

### 2. CSP 配置
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline'"
  }
}
```

### 3. 权限最小化
```json
{
  "permissions": [
    "storage",
    "activeTab"
  ],
  "optional_permissions": [
    "downloads"
  ]
}
```

---

## 迁移路径

### Phase 1: 状态管理迁移
1. 安装 Zustand
2. 创建 store 定义
3. 逐个组件迁移到 Zustand
4. 移除旧的 useState

### Phase 2: 模块化重构
1. 创建新目录结构
2. 迁移核心业务逻辑
3. Feature-based 模块划分
4. 清理旧代码

### Phase 3: 存储层升级
1. 实现 HybridStorage
2. 数据迁移脚本
3. 灰度发布和验证

### Phase 4: 插件系统
1. 插件接口设计
2. PluginManager 实现
3. 示例插件开发
4. 文档和 SDK

---

**相关文档**: [实施路线图](./06-implementation-roadmap.md) | [开发规范](./dev-guidelines.md)
