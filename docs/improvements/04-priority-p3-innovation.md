# P3 - 创新功能

> **优先级**: P3
> **目标**: 差异化竞争,生态建设
> **周期**: 4-6 周
> **版本**: v2.0.0
> **说明**: 本文档已排除 AI 相关功能

---

## 功能清单

| 功能 | 创新价值 | 实施难度 | 工作量 |
|------|----------|----------|--------|
| 社区模板库 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 10-14天 |
| 浏览器端搜索结果增强 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 6-8天 |

---

## 1. 社区模板库

### 功能描述
建立社区驱动的模板分享平台,允许用户发布、下载和评价搜索模板。

### 核心设计

```typescript
// src/types/community.ts
interface CommunityTemplate extends SearchTemplate {
  author: string;
  authorId: string;
  downloads: number;
  rating: number;
  reviews: number;
  verified: boolean;
  version: string;
  lastUpdated: number;
}

interface TemplateReview {
  id: string;
  templateId: string;
  userId: string;
  rating: number;
  comment: string;
  helpful: number;
  timestamp: number;
}
```

### 后端 API 设计

```typescript
// 模板市场 API
interface TemplateMarketplaceAPI {
  // 搜索模板
  searchTemplates(query: string, filters: {
    category?: TemplateCategory;
    minRating?: number;
    verified?: boolean;
  }): Promise<CommunityTemplate[]>;

  // 获取热门模板
  getTrendingTemplates(limit: number): Promise<CommunityTemplate[]>;

  // 发布模板
  publishTemplate(template: SearchTemplate): Promise<CommunityTemplate>;

  // 更新模板
  updateTemplate(templateId: string, updates: Partial<SearchTemplate>): Promise<void>;

  // 下载模板
  downloadTemplate(templateId: string): Promise<CommunityTemplate>;

  // 评价模板
  rateTemplate(templateId: string, rating: number, comment: string): Promise<void>;

  // 举报模板
  reportTemplate(templateId: string, reason: string): Promise<void>;
}
```

### 模板审核机制

```typescript
interface TemplateVerification {
  // 自动检查
  checkSafety(template: CommunityTemplate): boolean;
  checkQuality(template: CommunityTemplate): number;

  // 人工审核
  submitForReview(templateId: string): Promise<void>;
  approveTemplate(templateId: string): Promise<void>;
  rejectTemplate(templateId: string, reason: string): Promise<void>;
}
```

### UI 组件

```typescript
// src/components/TemplateMarketplace.tsx
function TemplateMarketplace() {
  return (
    <div className="marketplace">
      {/* 搜索栏 */}
      <SearchBar />

      {/* 分类导航 */}
      <CategoryNav />

      {/* 模板列表 */}
      <TemplateGrid>
        {templates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onDownload={handleDownload}
            onRate={handleRate}
          />
        ))}
      </TemplateGrid>

      {/* 我的模板 */}
      <MyTemplates />
    </div>
  );
}
```

### 实施阶段

#### Phase 1: 基础设施 (Week 1-2)
- [ ] 后端 API 设计和实现
- [ ] 数据库 Schema 设计
- [ ] 认证和授权系统

#### Phase 2: 核心功能 (Week 3-4)
- [ ] 模板上传和下载
- [ ] 搜索和过滤
- [ ] 评分和评论系统

#### Phase 3: 高级功能 (Week 5-6)
- [ ] 模板审核流程
- [ ] 举报和审核系统
- [ ] 统计和分析

---

## 2. 浏览器端搜索结果增强

### 功能描述
在搜索引擎结果页面注入工具栏,提供导出、保存、修改查询等功能。

### Content Script 注入

```typescript
// src/content/search-enhancer.ts
class SearchResultEnhancer {
  private toolbar: HTMLElement;

  /**
   * 注入工具栏
   */
  injectToolbar() {
    // 检测搜索引擎
    const engine = this.detectSearchEngine();
    if (!engine) return;

    // 创建工具栏
    this.toolbar = this.createToolbar(engine);

    // 注入到页面
    const insertPoint = this.getInsertPoint(engine);
    insertPoint.insertAdjacentElement('afterbegin', this.toolbar);
  }

  /**
   * 创建工具栏
   */
  private createToolbar(engine: SearchEngine): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.id = 'ssp-toolbar';
    toolbar.className = 'ssp-toolbar';

    toolbar.innerHTML = `
      <div class="ssp-toolbar-content">
        <button id="ssp-export-results">导出结果</button>
        <button id="ssp-save-search">保存搜索</button>
        <button id="ssp-modify-query">修改查询</button>
        <button id="ssp-highlight-syntax">高亮语法</button>
      </div>
    `;

    this.attachEventListeners(toolbar);
    return toolbar;
  }

  /**
   * 导出搜索结果
   */
  exportResults() {
    const results = this.extractSearchResults();
    const csv = this.convertToCSV(results);
    this.downloadFile(csv, 'search-results.csv');
  }

  /**
   * 提取搜索结果
   */
  private extractSearchResults(): SearchResult[] {
    // 根据引擎类型选择对应的选择器
    const selectors = this.getResultSelectors();

    return Array.from(document.querySelectorAll(selectors.item))
      .map(el => ({
        title: el.querySelector(selectors.title)?.textContent || '',
        url: el.querySelector(selectors.link)?.href || '',
        description: el.querySelector(selectors.description)?.textContent || ''
      }));
  }

  /**
   * 高亮搜索语法
   */
  highlightSyntax() {
    const queryElement = this.getQueryElement();
    if (!queryElement) return;

    const query = queryElement.textContent || '';
    const highlighted = this.highlightSyntaxKeywords(query);

    queryElement.innerHTML = highlighted;
  }

  /**
   * 高亮语法关键词
   */
  private highlightSyntaxKeywords(query: string): string {
    const patterns = [
      { regex: /site:(\S+)/g, color: '#0066cc' },
      { regex: /filetype:(\S+)/g, color: '#cc6600' },
      { regex: /"([^"]+)"/g, color: '#00cc66' },
      { regex: /-(\S+)/g, color: '#cc0000' }
    ];

    let highlighted = query;

    patterns.forEach(({ regex, color }) => {
      highlighted = highlighted.replace(regex, (match) => {
        return `<span style="color: ${color}; font-weight: bold;">${match}</span>`;
      });
    });

    return highlighted;
  }
}

// 初始化
const enhancer = new SearchResultEnhancer();
enhancer.injectToolbar();
```

### 搜索引擎适配

```typescript
// src/content/engine-adapters.ts
interface EngineAdapter {
  name: SearchEngine;
  patterns: string[];  // URL 匹配模式
  selectors: {
    query: string;
    results: string;
    item: string;
    title: string;
    link: string;
    description: string;
  };
  insertPoint: string;
}

const ENGINE_ADAPTERS: EngineAdapter[] = [
  {
    name: 'google',
    patterns: ['*://www.google.com/*'],
    selectors: {
      query: 'input[name="q"]',
      results: '#search',
      item: '.g',
      title: 'h3',
      link: 'a',
      description: '.VwiC3b'
    },
    insertPoint: '#search'
  },

  {
    name: 'baidu',
    patterns: ['*://www.baidu.com/*'],
    selectors: {
      query: '#kw',
      results: '#content_left',
      item: '.result',
      title: 'h3',
      link: 'a',
      description: '.c-abstract'
    },
    insertPoint: '#content_left'
  },

  // ... 其他搜索引擎适配器
];
```

### 样式注入

```css
/* src/content/styles.css */
.ssp-toolbar {
  position: sticky;
  top: 0;
  z-index: 10000;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 12px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  animation: slideDown 0.3s ease-out;
}

.ssp-toolbar-content {
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.ssp-toolbar button {
  padding: 8px 16px;
  background: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.ssp-toolbar button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

### 实施步骤

#### Week 1-2: 基础框架
- [ ] Content Script 注入系统
- [ ] 搜索引擎检测和适配
- [ ] 工具栏 UI 设计

#### Week 3-4: 核心功能
- [ ] 导出搜索结果
- [ ] 保存搜索功能
- [ ] 语法高亮

#### Week 5-6: 优化和扩展
- [ ] 更多搜索引擎适配
- [ ] 性能优化
- [ ] 用户反馈收集

---

## 验收标准

### 社区模板库
- [ ] 支持模板上传、下载、评分
- [ ] 模板审核流程完整
- [ ] 社区模板数量 ≥ 50 个
- [ ] 平均模板评分 ≥ 4.0

### 搜索结果增强
- [ ] 支持至少 5 个主流搜索引擎
- [ ] 工具栏注入成功率 ≥ 95%
- [ ] 导出功能准确率 ≥ 90%
- [ ] 性能影响 < 50ms

---

## 风险和挑战

### 社区模板库
- **技术风险**: 需要独立后端服务,增加维护成本
- **内容风险**: 需要有效的审核机制防止恶意模板
- **用户风险**: 社区活跃度需要时间培养

### 搜索结果增强
- **兼容性风险**: 搜索引擎页面结构变化需要及时适配
- **性能风险**: Content Script 可能影响页面加载速度
- **隐私风险**: 需要明确用户数据使用范围

---

**相关文档**: [P2技术优化](./03-priority-p2-technical-optimization.md) | [实施路线图](./06-implementation-roadmap.md)
