# Brave Search 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | Brave Search |
| **官方网站** | https://search.brave.com |
| **市场定位** | 隐私保护搜索引擎 |
| **发布时间** | 2020年 (Beta), 2021年 (正式版) |
| **全球市场份额** | ~0.5% (快速增长) |
| **主要用户群** | Brave浏览器用户、技术爱好者、隐私倡导者 |
| **优先级** | **P0 (最高)** |
| **实施复杂度** | 🟢 低 |
| **预计工期** | 1-2天 |

## 🎯 产品价值

### 用户价值
- ✅ **独立索引**: 不依赖Google/Bing，真正独立的搜索引擎
- ✅ **隐私至上**: 零跟踪、零分析、零个人数据收集
- ✅ **现代化设计**: 清爽界面、快速响应
- ✅ **AI集成**: 支持AI辅助搜索（可选）

### 业务价值
- 📈 吸引年轻技术用户群体
- 🚀 增长最快的隐私搜索引擎
- 💡 技术前瞻性强
- 🏆 差异化竞争优势

## 🔍 支持的搜索语法

### 1. 基础语法

#### 1.1 网站内搜索 (`site:`)
```
关键词 site:域名
```

**示例**:
```
TypeScript site:github.com
React hooks site:reactjs.org
```

**说明**: 限定搜索结果只来自指定网站

---

#### 1.2 文件类型搜索 (`filetype:`)
```
关键词 filetype:扩展名
```

**示例**:
```
用户指南 filetype:pdf
API文档 filetype:json
技术规范 filetype:docx
```

**支持的文件类型**: pdf, doc, docx, xls, xlsx, ppt, pptx, txt, csv, xml, json

---

#### 1.3 精确匹配 (`"..."`)
```
"完整短语"
```

**示例**:
```
"best practices for React"
"如何优化性能"
```

**说明**: 搜索包含完整短语的结果，保持词序

---

#### 1.4 包含/排除关键词 (`+` / `-`)
```
+必须包含 -排除
```

**示例**:
```
Python +tutorial -Django
JavaScript +ES6 -TypeScript
```

**说明**: 
- `+` 强制包含该词
- `-` 排除包含该词的结果

---

### 2. 高级语法

#### 2.1 正文搜索 (`inbody:`)
```
inbody:关键词
```

**示例**:
```
inbody:tutorial React
inbody:"最佳实践"
```

**说明**: 只搜索正文内容中包含关键词的页面

---

#### 2.2 地理位置筛选 (`loc:`)
```
关键词 loc:国家代码
```

**示例**:
```
news loc:us
新闻 loc:cn
restaurant loc:gb
```

**说明**: 限定搜索特定地理位置的结果

**常用国家代码**:
- `us` - 美国
- `gb` - 英国
- `cn` - 中国
- `jp` - 日本
- `de` - 德国
- `fr` - 法国

---

#### 2.3 语言筛选 (`lang:`)
```
关键词 lang:语言代码
```

**示例**:
```
tutorial lang:en
教程 lang:zh
tutorial lang:ja
```

**说明**: 限定搜索特定语言的结果

**常用语言代码**:
- `en` - 英语
- `zh` - 中文
- `ja` - 日语
- `es` - 西班牙语
- `fr` - 法语
- `de` - 德语

---

#### 2.4 AND 逻辑 (默认)
```
关键词1 关键词2
```

**示例**:
```
React TypeScript tutorial
前端 性能优化
```

**说明**: 默认所有关键词都必须出现（AND关系）

---

#### 2.5 OR 逻辑
```
关键词1 OR 关键词2
```

**示例**:
```
React OR Vue
前端 OR 后端
```

**说明**: 搜索包含任一关键词的结果（OR必须大写）

---

### 3. 特殊功能

#### 3.1 安全搜索
```
关键词 safesearch:strict
```

**说明**: 启用严格安全搜索模式

---

#### 3.2 时效性筛选
```
关键词 freshness:day|week|month|year
```

**示例**:
```
AI news freshness:day
技术趋势 freshness:week
```

**说明**: 筛选特定时间范围内的新鲜内容

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://search.brave.com/search
```

**查询参数**:
```typescript
interface BraveSearchParams {
  q: string;              // 搜索查询
  source?: string;        // 来源 (默认: 'web')
  country?: string;       // 国家代码
  safesearch?: 'off' | 'moderate' | 'strict';
  freshness?: 'day' | 'week' | 'month' | 'year';
}
```

**完整URL示例**:
```
https://search.brave.com/search?q=React+tutorial+site%3Agithub.com&source=web
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType, EngineFeatureGroups } from '@/types'

/**
 * Brave Search 搜索引擎适配器
 * 支持隐私保护和现代化搜索体验
 */
export class BraveAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Brave Search'
  }

  getBaseUrl(): string {
    return 'https://search.brave.com/search'
  }

  /**
   * 构建 Brave Search 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    const urlParams = new URLSearchParams({
      q: query,
      source: 'web'
    })
    
    return `${baseUrl}?${urlParams.toString()}`
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

    // 5. 正文搜索
    if (params.inText && params.inText.trim()) {
      queryParts.push(`inbody:${params.inText.trim()}`)
    }

    // 6. 语言筛选
    if (params.language && params.language.trim()) {
      queryParts.push(`lang:${params.language.trim()}`)
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
      'intext',
      'exclude',
      'or',
      'lang'
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
      'intext',
      'exclude',
      'or',
      'lang'
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
      'intext',
      'exclude',
      'or_keywords',
      'language'
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site'],
      precision: ['exact_match', 'intext'],
      logic: ['exclude', 'or_keywords'],
      range: ['language']
    }
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

    // 检查语言代码
    if (params.language && params.language.trim()) {
      const validLangs = ['en', 'zh', 'ja', 'es', 'fr', 'de', 'ko', 'ru']
      if (!validLangs.includes(params.language.toLowerCase())) {
        warnings.push(`语言代码 "${params.language}" 可能不被支持`)
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

    if (params.keyword && !params.language) {
      suggestions.push('尝试添加 lang: 限定搜索语言')
    }

    if (params.keyword && !params.site) {
      suggestions.push('使用 site: 可以在特定网站内搜索')
    }

    if (!params.exactMatch) {
      suggestions.push('使用精确匹配获得更准确的结果')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1)
- [ ] 创建 `src/services/adapters/brave.ts`
- [ ] 实现 `BraveAdapter` 类
- [ ] 实现基础语法支持 (site, filetype, exact, inbody)
- [ ] 单元测试编写

### Phase 2: 高级功能 (Day 2)
- [ ] 实现地理位置筛选 (loc:)
- [ ] 实现语言筛选 (lang:)
- [ ] 实现逻辑运算符 (OR, -)
- [ ] 参数验证逻辑
- [ ] 搜索建议功能

### Phase 3: UI集成 (Day 2)
- [ ] 更新类型定义添加 'brave' 引擎
- [ ] 更新工厂类注册适配器
- [ ] 添加国际化翻译
- [ ] 集成测试和E2E测试

---

## ✅ 测试用例

```typescript
describe('BraveAdapter', () => {
  const adapter = new BraveAdapter()

  test('基础关键词搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'TypeScript tutorial',
      engine: 'brave'
    })
    expect(url).toContain('q=TypeScript+tutorial')
    expect(url).toContain('source=web')
  })

  test('网站内搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'React',
      site: 'github.com',
      engine: 'brave'
    })
    expect(url).toContain('React+site%3Agithub.com')
  })

  test('正文搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      inText: 'React Hooks',
      engine: 'brave'
    })
    expect(url).toContain('inbody%3AReact+Hooks')
  })

  test('语言筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      language: 'zh',
      engine: 'brave'
    })
    expect(url).toContain('lang%3Azh')
  })

  test('组合查询', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      site: 'github.com',
      fileType: 'pdf',
      language: 'en',
      excludeWords: ['beginner'],
      engine: 'brave'
    })
    expect(url).toContain('site%3Agithub.com')
    expect(url).toContain('filetype%3Apdf')
    expect(url).toContain('lang%3Aen')
    expect(url).toContain('-beginner')
  })
})
```

---

## 🌍 国际化支持

### 中文翻译

```json
{
  "engines.brave": "Brave Search",
  "engines.brave.description": "隐私至上的独立搜索引擎",
  "engines.brave.features": {
    "inbody": "正文搜索",
    "loc": "地理位置",
    "lang": "语言筛选",
    "privacy": "零跟踪保护"
  },
  "engines.brave.tips": {
    "independent": "使用独立索引，不依赖其他搜索引擎",
    "fast": "快速响应，现代化体验",
    "ai": "支持AI辅助搜索（可选）"
  }
}
```

---

## 📚 参考资源

### 官方文档
- [Brave Search Operators](https://search.brave.com/help/operators)
- [Brave Search Help Center](https://search.brave.com/help)
- [Brave Search API](https://brave.com/search/api/)

### 技术文章
- [Brave Search vs Google](https://brave.com/compare/google/)
- [Independent Index](https://brave.com/search-independence/)

---

## 🆚 与其他引擎对比

| 特性 | Brave Search | DuckDuckGo | Google |
|------|-------------|------------|--------|
| 独立索引 | ✅ 是 | ⚠️ 部分 | ✅ 是 |
| 隐私保护 | ✅ 零跟踪 | ✅ 零跟踪 | ❌ 跟踪 |
| 地理筛选 | ✅ loc: | ❌ | ✅ 高级搜索 |
| 语言筛选 | ✅ lang: | ❌ | ✅ lr= |
| AI辅助 | ✅ 可选 | ❌ | ✅ SGE |
| 广告 | ⚠️ 少量 | ❌ 无 | ✅ 大量 |

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建 |

---

**下一步**: 查看 [Yandex 文档](./yandex.md) 了解国际化搜索引擎的实现细节
