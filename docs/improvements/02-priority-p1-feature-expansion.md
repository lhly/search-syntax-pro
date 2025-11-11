# P1 - 功能扩展

> **优先级**: P1
> **目标**: 扩展使用场景，建立知识库基础
> **周期**: 3-4 周
> **版本**: v1.7.0

---

## 功能清单

| 功能 | 用户价值 | 技术复杂度 | 工作量 |
|------|----------|------------|--------|
| 跨引擎对比搜索 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 4-6天 |
| 搜索收藏夹 + 标签系统 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 5-7天 |
| 搜索统计分析面板 | ⭐⭐⭐ | ⭐⭐ | 3-4天 |

---

## 1. 跨引擎对比搜索

### 功能描述
允许用户同时在多个搜索引擎执行相同搜索,适用于学术研究和全面信息收集场景。

### 核心设计

```typescript
// src/types/comparison.ts
interface ComparisonSearchConfig {
  engines: SearchEngine[];
  params: SearchParams;
  openMode: 'tabs' | 'windows' | 'group';
}

interface ComparisonResult {
  id: string;
  engines: SearchEngine[];
  urls: Record<SearchEngine, string>;
  timestamp: number;
}
```

### 关键功能
- ✅ 选择 2-5 个引擎同时搜索
- ✅ 支持标签分组模式打开
- ✅ 保存对比搜索为模板
- ✅ 对比结果导出

---

## 2. 搜索收藏夹 + 标签系统

### 功能描述
组织和管理常用搜索,通过标签系统建立个人知识库。

### 核心设计

```typescript
// src/types/bookmark.ts
interface SearchBookmark {
  id: string;
  name: string;
  params: SearchParams;
  tags: string[];
  category: string;
  isFavorite: boolean;
  notes?: string;
  createdAt: number;
  usageCount: number;
}
```

### 关键功能
- ✅ 保存搜索为收藏夹
- ✅ 多级标签分类
- ✅ 智能自动标签提取
- ✅ 收藏夹搜索和过滤
- ✅ 批量导入/导出

---

## 3. 搜索统计分析面板

### 功能描述
可视化展示用户搜索行为,帮助用户了解自己的搜索习惯。

### 核心设计

```typescript
// src/types/analytics.ts
interface SearchAnalytics {
  totalSearches: number;
  engineUsage: Record<SearchEngine, number>;
  syntaxUsage: Record<SyntaxType, number>;
  searchTrends: Array<{
    date: string;
    count: number;
  }>;
  mostUsedTemplates: string[];
  avgSyntaxPerSearch: number;
}
```

### 关键功能
- ✅ 引擎使用分布(饼图)
- ✅ 语法使用频率(柱状图)
- ✅ 搜索趋势(折线图)
- ✅ 热门模板排行
- ✅ 数据导出

---

## 实施优先级

1. **Week 1-2**: 跨引擎对比搜索
2. **Week 2-3**: 收藏夹 + 标签系统
3. **Week 3-4**: 统计分析面板

## 验收标准

- [ ] 对比搜索支持至少3个引擎同时执行
- [ ] 收藏夹支持无限层级标签
- [ ] 统计面板至少包含3种图表类型
- [ ] 所有数据支持导入/导出
- [ ] 单元测试覆盖率 > 75%

---

**相关文档**: [P0核心功能](./01-priority-p0-core-features.md) | [P2技术优化](./03-priority-p2-technical-optimization.md)
