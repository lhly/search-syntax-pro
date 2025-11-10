# DuckDuckGo 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | DuckDuckGo |
| **官方网站** | https://duckduckgo.com |
| **市场定位** | 隐私保护搜索引擎 |
| **全球市场份额** | ~2.5% (持续增长) |
| **日搜索量** | 超过1亿次 |
| **主要用户群** | 隐私保护用户、技术爱好者、欧盟用户 |
| **优先级** | **P0 (最高)** |
| **实施复杂度** | 🟢 低 |
| **预计工期** | 1-2天 |

## 🎯 产品价值

### 用户价值
- ✅ **隐私保护**: 不跟踪用户搜索历史
- ✅ **无广告干扰**: 搜索结果清晰简洁
- ✅ **无过滤气泡**: 每个用户看到相同结果
- ✅ **国际化**: GDPR合规，欧盟用户首选

### 业务价值
- 📈 扩大用户群体（隐私保护用户）
- 🏆 增强产品竞争力
- 🌍 支持国际化战略
- 💡 验证架构扩展性

## 🔍 支持的搜索语法

### 1. 基础语法

#### 1.1 网站内搜索 (`site:`)
```
关键词 site:域名
```

**示例**:
```
人工智能 site:wikipedia.org
React教程 site:github.com
```

**说明**: 限定搜索结果只来自指定网站

---

#### 1.2 文件类型搜索 (`filetype:`)
```
关键词 filetype:扩展名
```

**示例**:
```
年度报告 filetype:pdf
用户手册 filetype:docx
数据集 filetype:csv
```

**支持的文件类型**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, json, xml

---

#### 1.3 精确匹配 (`"..."`)
```
"完整短语"
```

**示例**:
```
"machine learning tutorial"
"如何使用 React Hooks"
```

**说明**: 搜索包含完整短语的结果，保持词序

---

#### 1.4 排除关键词 (`-`)
```
关键词 -排除词
```

**示例**:
```
Python教程 -Django
苹果 -iPhone -iPad
```

**说明**: 排除包含指定词的结果

---

### 2. 高级语法

#### 2.1 标题搜索 (`intitle:`)
```
intitle:关键词
```

**示例**:
```
intitle:tutorial React
intitle:"最佳实践"
```

**说明**: 只搜索标题中包含关键词的页面

---

#### 2.2 URL搜索 (`inurl:`)
```
inurl:关键词
```

**示例**:
```
inurl:github
inurl:docs API
```

**说明**: 只搜索URL中包含关键词的页面

---

#### 2.3 OR 逻辑运算
```
关键词1 OR 关键词2
```

**示例**:
```
Python OR JavaScript 教程
前端 OR 后端 开发
```

**说明**: 搜索包含任一关键词的结果（OR必须大写）

---

#### 2.4 组合语法
```
(关键词1 OR 关键词2) 关键词3
```

**示例**:
```
(React OR Vue) 组件开发
site:github.com (Python OR Go) 项目
```

**说明**: 使用括号组合复杂查询

---

### 3. 特殊功能

#### 3.1 直接跳转 (`\`)
```
\关键词
```

**示例**:
```
\Wikipedia
\GitHub
```

**说明**: 直接跳转到第一个搜索结果（I'm Feeling Ducky）

---

#### 3.2 区域搜索 (`region:`)
```
关键词 region:国家代码
```

**示例**:
```
news region:us
新闻 region:cn
```

**说明**: 限定搜索特定地区的结果

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://duckduckgo.com/
```

**查询参数**:
```typescript
interface DuckDuckGoParams {
  q: string;           // 搜索查询
  t?: string;          // 主题 (默认: 'h_')
  ia?: string;         // Instant Answer
  kl?: string;         // 地区代码 (如: 'cn-zh', 'us-en')
}
```

**完整URL示例**:
```
https://duckduckgo.com/?q=React+tutorial+site%3Agithub.com&t=h_
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType } from '@/types'

/**
 * DuckDuckGo 搜索引擎适配器
 * 支持隐私保护的搜索功能
 */
export class DuckDuckGoAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'DuckDuckGo'
  }

  getBaseUrl(): string {
    return 'https://duckduckgo.com/'
  }

  /**
   * 构建 DuckDuckGo 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}&t=h_`
  }

  /**
   * 构建搜索查询字符串
   */
  private buildSearchQuery(params: SearchParams): string {
    const queryParts: string[] = []

    // 1. 基础关键词
    if (params.keyword && params.keyword.trim()) {
      queryParts.push(params.keyword.trim())
    }

    // 2. 精确匹配
    if (params.exactMatch && params.exactMatch.trim()) {
      queryParts.push(`"${params.exactMatch.trim()}"`)
    }

    // 3. 网站内搜索
    if (params.site && params.site.trim()) {
      queryParts.push(`site:${params.site.trim()}`)
    }

    // 4. 文件类型搜索
    if (params.fileType && params.fileType.trim()) {
      queryParts.push(`filetype:${params.fileType.trim()}`)
    }

    // 5. 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`intitle:${params.inTitle.trim()}`)
    }

    // 6. URL搜索
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`inurl:${params.inUrl.trim()}`)
    }

    // 7. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 8. OR 逻辑关键词
    if (params.orKeywords && params.orKeywords.length > 0) {
      const orQuery = params.orKeywords
        .filter(word => word.trim())
        .join(' OR ')
      if (orQuery) {
        queryParts.push(`(${orQuery})`)
      }
    }

    return queryParts.join(' ')
  }

  /**
   * 验证语法类型
   */
  validateSyntax(syntax: SyntaxType): boolean {
    const supportedSyntax: SyntaxType[] = [
      'site',
      'filetype',
      'exact',
      'intitle',
      'inurl',
      'exclude',
      'or'
    ]
    return supportedSyntax.includes(syntax)
  }

  /**
   * 获取支持的语法类型
   */
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'intitle',
      'inurl',
      'exclude',
      'or'
    ]
  }

  /**
   * 获取支持的UI功能特性
   */
  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site',
      'filetype',
      'exact_match',
      'intitle',
      'inurl',
      'exclude',
      'or_keywords'
    ]
  }

  /**
   * 验证搜索参数
   */
  validateParams(params: SearchParams): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查是否有基本关键词
    if (!params.keyword || !params.keyword.trim()) {
      if (!params.exactMatch && !params.site) {
        errors.push('请输入搜索关键词')
      }
    }

    // 检查网站域名格式
    if (params.site && params.site.trim()) {
      const sitePattern = /^[a-zA-Z0-9][\w\-\.]*\.[a-zA-Z]{2,}$/
      if (!sitePattern.test(params.site.trim())) {
        warnings.push('网站域名格式可能不正确')
      }
    }

    // 检查文件类型
    if (params.fileType && params.fileType.trim()) {
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
      if (!validTypes.includes(params.fileType.toLowerCase())) {
        warnings.push(`文件类型 "${params.fileType}" 可能不被支持`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword && !params.site) {
      suggestions.push('尝试添加 site: 限定搜索范围')
    }

    if (params.keyword && !params.fileType) {
      suggestions.push('可以使用 filetype: 搜索特定文档类型')
    }

    if (params.keyword && !params.exactMatch) {
      suggestions.push('使用精确匹配获得更准确的结果')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1)
- [ ] 创建 `src/services/adapters/duckduckgo.ts`
- [ ] 实现 `DuckDuckGoAdapter` 类
- [ ] 实现基础语法支持 (site, filetype, exact)
- [ ] 单元测试编写

### Phase 2: 高级功能 (Day 2)
- [ ] 实现高级语法 (intitle, inurl, OR)
- [ ] 参数验证逻辑
- [ ] 搜索建议功能
- [ ] 集成测试

### Phase 3: UI集成 (Day 2)
- [ ] 更新 `src/types/index.ts` 添加 'duckduckgo' 类型
- [ ] 更新 `SearchAdapterFactory` 注册适配器
- [ ] 添加国际化翻译
- [ ] E2E测试

---

## ✅ 测试用例

### 基础语法测试

```typescript
describe('DuckDuckGoAdapter', () => {
  const adapter = new DuckDuckGoAdapter()

  test('基础关键词搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'React tutorial',
      engine: 'duckduckgo'
    })
    expect(url).toContain('q=React+tutorial')
  })

  test('网站内搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'JavaScript',
      site: 'github.com',
      engine: 'duckduckgo'
    })
    expect(url).toContain('JavaScript+site%3Agithub.com')
  })

  test('文件类型搜索', () => {
    const url = adapter.buildQuery({
      keyword: '年度报告',
      fileType: 'pdf',
      engine: 'duckduckgo'
    })
    expect(url).toContain('filetype%3Apdf')
  })

  test('精确匹配', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      exactMatch: 'React Hooks',
      engine: 'duckduckgo'
    })
    expect(url).toContain('%22React+Hooks%22')
  })

  test('排除关键词', () => {
    const url = adapter.buildQuery({
      keyword: 'Python',
      excludeWords: ['Django', 'Flask'],
      engine: 'duckduckgo'
    })
    expect(url).toContain('-Django')
    expect(url).toContain('-Flask')
  })

  test('OR逻辑', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      orKeywords: ['React', 'Vue'],
      engine: 'duckduckgo'
    })
    expect(url).toContain('React+OR+Vue')
  })
})
```

---

## 🌍 国际化支持

### 中文翻译键值对

```json
{
  "engines.duckduckgo": "DuckDuckGo",
  "engines.duckduckgo.description": "隐私保护搜索引擎",
  "engines.duckduckgo.privacy": "不跟踪用户搜索历史",
  "engines.duckduckgo.features": {
    "site": "网站内搜索",
    "filetype": "文件类型",
    "intitle": "标题搜索",
    "inurl": "URL搜索"
  }
}
```

---

## 📚 参考资源

### 官方文档
- [DuckDuckGo 搜索语法](https://duckduckgo.com/duckduckgo-help-pages/results/syntax/)
- [DuckDuckGo API](https://duckduckgo.com/api)
- [隐私政策](https://duckduckgo.com/privacy)

### 技术文章
- [DuckDuckGo Advanced Search Guide](https://www.ulpa.jp/post/duckduckgo-search-in-japan-a-complete-guide-for-2025)
- [Mastering DuckDuckGo Search](https://sup.ai/articles/mastering-duckduckgo-a-comprehensive-guide-to-effective-searching)

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建 |

---

**下一步**: 查看 [Brave Search 文档](./brave.md) 了解另一个隐私搜索引擎的实现细节
