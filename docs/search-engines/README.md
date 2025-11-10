# 搜索引擎高级语法参考文档

> 本文档详细记录了推荐添加到 SearchSyntax Pro 的六个搜索引擎及其支持的高级搜索语法

## 📚 文档目录

| 搜索引擎 | 优先级 | 文档链接 | 实施状态 |
|---------|--------|---------|---------|
| [DuckDuckGo](#duckduckgo) | P0 (最高) | [详细文档](./duckduckgo.md) | 🔄 待实施 |
| [Brave Search](#brave-search) | P0 (最高) | [详细文档](./brave.md) | 🔄 待实施 |
| [Yandex](#yandex) | P1 (中) | [详细文档](./yandex.md) | 🔄 待实施 |
| [Reddit](#reddit) | P1 (中) | [详细文档](./reddit.md) | 🔄 待实施 |
| [GitHub](#github) | P2 (低) | [详细文档](./github.md) | 🔄 待实施 |
| [Stack Overflow](#stack-overflow) | P2 (低) | [详细文档](./stackoverflow.md) | 🔄 待实施 |

## 🎯 优先级说明

### P0 - 隐私搜索引擎（最高优先级）
- **DuckDuckGo**: 全球领先的隐私搜索，日活超1亿次搜索
- **Brave Search**: 新兴隐私搜索，增长最快，技术用户首选

**推荐理由**: 低实施复杂度、高用户价值、快速见效

### P1 - 国际化与垂直搜索（中等优先级）
- **Yandex**: 俄罗斯第一搜索引擎，全球份额2.5%，独特语法支持
- **Reddit**: 全球最大社区平台，月活4.3亿，社交搜索专家

**推荐理由**: 扩大用户覆盖面、提供差异化价值

### P2 - 专业开发者工具（低优先级）
- **GitHub**: 全球最大代码托管平台，1亿+开发者
- **Stack Overflow**: 最大技术问答社区，5000万+月访问

**推荐理由**: 专业工具定位、高价值用户群、增强竞争力

## 📖 快速对比

### 语法支持矩阵

| 语法类型 | DuckDuckGo | Brave | Yandex | Reddit | GitHub | Stack Overflow |
|---------|------------|-------|--------|--------|--------|----------------|
| `site:` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `filetype:` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `intitle:` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `inurl:` | ✅ | ❌ | ❌ | ✅ (url:) | ❌ | ❌ |
| `"精确匹配"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `-排除` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `OR` 逻辑 | ✅ | ✅ | ✅ (\|) | ✅ | ✅ | ✅ |
| 日期范围 | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 用户筛选 | ❌ | ❌ | ❌ | ✅ (author:) | ✅ (user:) | ✅ (user:) |
| 地理位置 | ❌ | ✅ (loc:) | ❌ | ❌ | ❌ | ❌ |
| 语言筛选 | ❌ | ✅ (lang:) | ❌ | ❌ | ✅ (language:) | ❌ |

### 技术实施复杂度

| 搜索引擎 | URL构建 | 特殊语法 | 认证需求 | 总体复杂度 |
|---------|---------|---------|---------|-----------|
| DuckDuckGo | 简单 | 标准 | 无 | 🟢 低 |
| Brave Search | 简单 | 标准 | 无 | 🟢 低 |
| Yandex | 中等 | 独特 (rhost:, mime:) | 无 | 🟡 中 |
| Reddit | 中等 | 标准 | 无 | 🟡 中 |
| GitHub | 复杂 | 特殊 (repo:, stars:) | OAuth (可选) | 🔴 高 |
| Stack Overflow | 中等 | 标签系统 | API Key (可选) | 🔴 高 |

## 🔧 实施顺序建议

### Phase 1: 隐私搜索引擎（第1周）
```
Week 1:
├── Day 1-2: DuckDuckGo 适配器开发
├── Day 3-4: Brave Search 适配器开发
└── Day 5: UI更新、测试、发布
```

### Phase 2: 国际化与社区（第2-3周）
```
Week 2-3:
├── Day 1-3: Yandex 适配器开发
├── Day 4-6: Reddit 适配器开发
└── Day 7: 国际化支持、测试
```

### Phase 3: 专业工具（第4-7周）
```
Week 4-7:
├── Week 4: GitHub 适配器开发
├── Week 5-6: Stack Overflow 适配器开发
└── Week 7: 完整测试、文档更新
```

## 📋 使用指南

### 对于产品经理
- 查看 [优先级说明](#-优先级说明) 了解各引擎的价值定位
- 参考 [语法支持矩阵](#语法支持矩阵) 评估功能覆盖度
- 查看各引擎详细文档了解具体用户场景

### 对于开发者
- 查看各引擎的详细文档了解具体实施细节
- 参考 [技术实施复杂度](#技术实施复杂度) 评估开发工作量
- 查看 [实施顺序建议](#-实施顺序建议) 规划开发计划

### 对于测试工程师
- 使用各文档中的示例查询进行测试
- 验证每个语法操作符的正确性
- 确保URL构建符合各引擎的规范

## 🔗 相关资源

### 官方文档链接
- [DuckDuckGo Search Syntax](https://duckduckgo.com/duckduckgo-help-pages/results/syntax/)
- [Brave Search Operators](https://search.brave.com/help/operators)
- [Yandex Query Language](https://yandex.com/support/search/en/query-language/)
- [Reddit Search Documentation](https://www.reddit.com/wiki/search/)
- [GitHub Code Search](https://docs.github.com/en/search-github/searching-on-github)
- [Stack Overflow Search](https://stackoverflow.com/help/searching)

### 技术规范
- [项目适配器接口](../../src/types/index.ts#L156)
- [搜索引擎类型定义](../../src/types/index.ts#L2)
- [适配器工厂实现](../../src/services/adapters/factory.ts)

## 📝 更新日志

| 日期 | 版本 | 更新内容 | 作者 |
|------|------|---------|------|
| 2025-11-09 | v1.0 | 初始文档创建，包含6个搜索引擎的完整语法参考 | AI Assistant |

## 💡 贡献指南

如需更新本文档：

1. 确认语法变更来自官方文档
2. 更新对应引擎的详细文档
3. 更新语法支持矩阵
4. 添加更新日志记录
5. 提交PR并标注文档更新

---

**下一步**: 查看各搜索引擎的详细文档，了解具体语法和实施细节。
