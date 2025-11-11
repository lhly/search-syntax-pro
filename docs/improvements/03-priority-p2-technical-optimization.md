# P2 - 技术优化

> **优先级**: P2
> **目标**: 提升系统稳定性和可维护性
> **周期**: 2-3 周
> **版本**: v1.8.0

---

## 优化清单

| 优化项 | 技术价值 | 实施难度 | 工作量 |
|--------|----------|----------|--------|
| 性能优化 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 4-5天 |
| 离线支持(PWA化) | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 3-4天 |
| 自动化测试覆盖提升 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 3-4天 |

---

## 1. 性能优化

### 虚拟滚动优化

```typescript
// src/components/VirtualHistoryList.tsx
import { FixedSizeList } from 'react-window';

function VirtualHistoryList({ items }: { items: SearchHistory[] }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <HistoryItem item={items[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

### 适配器懒加载

```typescript
// src/services/adapters/lazy-factory.ts
const adapters = {
  baidu: () => import('./baidu'),
  google: () => import('./google'),
  // ... 其他引擎
};

class LazyAdapterFactory {
  async getAdapter(engine: SearchEngine) {
    const module = await adapters[engine]();
    return new module.default();
  }
}
```

### IndexedDB 存储升级

```typescript
// src/services/indexed-storage.ts
class IndexedDBStorage {
  private db: IDBDatabase;

  async init() {
    this.db = await openDB('ssp-storage', 1, {
      upgrade(db) {
        // 创建历史记录存储
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
        // 创建收藏夹存储
        if (!db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
        }
      }
    });
  }

  async saveHistory(history: SearchHistory[]): Promise<void> {
    const tx = this.db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');

    await Promise.all(
      history.map(item => store.put(item))
    );
  }
}
```

### 性能目标

- 加载时间: 1.2s → 0.8s (-33%)
- 内存占用: 50MB → 35MB (-30%)
- 历史记录渲染: 支持10,000+条无卡顿

---

## 2. 离线支持 (PWA化)

### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'ssp-v1';
const urlsToCache = [
  '/',
  '/popup/index.html',
  '/options/index.html',
  '/assets/index.css',
  '/assets/index.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### Manifest 配置

```json
{
  "offline_enabled": true,
  "background": {
    "service_worker": "sw.js",
    "type": "module"
  }
}
```

---

## 3. 自动化测试覆盖提升

### 单元测试策略

```typescript
// tests/unit/adapters/baidu.test.ts
describe('BaiduAdapter', () => {
  let adapter: BaiduAdapter;

  beforeEach(() => {
    adapter = new BaiduAdapter();
  });

  describe('buildQuery', () => {
    it('应正确构建基础查询', () => {
      const params = {
        keyword: 'React',
        engine: 'baidu' as const
      };

      const url = adapter.buildQuery(params);
      expect(url).toContain('wd=React');
    });

    it('应正确处理 site 语法', () => {
      const params = {
        keyword: 'React',
        engine: 'baidu' as const,
        site: 'github.com'
      };

      const url = adapter.buildQuery(params);
      expect(url).toContain('site%3Agithub.com');
    });

    // ... 更多测试用例
  });
});
```

### E2E 测试场景

```typescript
// tests/e2e/search-flow.spec.ts
import { test, expect } from '@playwright/test';

test('完整搜索流程', async ({ page }) => {
  // 1. 打开扩展
  await page.goto('chrome-extension://your-id/popup/index.html');

  // 2. 输入关键词
  await page.fill('[data-testid="keyword-input"]', 'TypeScript');

  // 3. 选择引擎
  await page.selectOption('[data-testid="engine-select"]', 'google');

  // 4. 添加语法
  await page.click('[data-testid="advanced-toggle"]');
  await page.fill('[data-testid="site-input"]', 'github.com');

  // 5. 验证查询预览
  const preview = await page.textContent('[data-testid="query-preview"]');
  expect(preview).toContain('site:github.com');

  // 6. 执行搜索
  const [newPage] = await Promise.all([
    page.waitForEvent('popup'),
    page.click('[data-testid="search-button"]')
  ]);

  expect(newPage.url()).toContain('google.com');
});
```

### 测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| Adapters | 60% | 90% |
| Components | 40% | 80% |
| Services | 50% | 85% |
| Utils | 70% | 95% |
| **总计** | **45%** | **80%+** |

---

## 实施计划

### Week 1: 性能优化
- Day 1-2: 虚拟滚动实现
- Day 3-4: 懒加载和代码分割
- Day 5: IndexedDB 集成

### Week 2: 离线支持
- Day 1-2: Service Worker 开发
- Day 3-4: 离线功能测试

### Week 3: 测试提升
- Day 1-2: 单元测试补充
- Day 3-4: E2E 测试覆盖

---

## 验收标准

### 性能指标
- [ ] 首屏加载时间 < 800ms
- [ ] 内存占用 < 35MB
- [ ] 历史列表渲染 10,000 条无卡顿

### 离线功能
- [ ] 离线状态下可正常打开扩展
- [ ] 离线模式提示明确
- [ ] 缓存策略合理,不占用过多空间

### 测试质量
- [ ] 整体测试覆盖率 ≥ 80%
- [ ] 关键路径测试覆盖率 100%
- [ ] 所有 E2E 测试通过

---

**相关文档**: [P1功能扩展](./02-priority-p1-feature-expansion.md) | [P3创新功能](./04-priority-p3-innovation.md)
