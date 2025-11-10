# Yandex 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | Yandex |
| **官方网站** | https://yandex.com |
| **市场定位** | 俄罗斯领先搜索引擎 |
| **全球市场份额** | ~2.5% |
| **俄语市场份额** | ~60% (第一名) |
| **主要用户群** | 俄语用户、东欧用户、CIS国家 |
| **优先级** | **P1 (中等)** |
| **实施复杂度** | 🟡 中等 |
| **预计工期** | 2-3天 |

## 🎯 产品价值

### 用户价值
- ✅ **俄语优化**: 最佳的俄语搜索体验
- ✅ **区域覆盖**: 覆盖俄罗斯、乌克兰、白俄罗斯等
- ✅ **本地化服务**: 地图、新闻、邮件等生态系统
- ✅ **独特语法**: 支持其他引擎不支持的特殊搜索

### 业务价值
- 🌍 国际化战略支持
- 📈 扩展非英语市场
- 💡 差异化竞争优势
- 🎯 覆盖特定地域用户群

## 🔍 支持的搜索语法

### 1. 基础语法

#### 1.1 网站内搜索 (`site:`)
```
关键词 site:域名
```

**示例**:
```
поиск site:wikipedia.org
React site:github.com
```

**说明**: 限定搜索结果只来自指定网站

---

#### 1.2 主机搜索 (`host:`)
```
关键词 host:完整主机名
```

**示例**:
```
warming host:www.wikipedia.org
```

**说明**: 搜索特定主机上的内容（需要包含www等前缀）

**格式**: `www.second-level-domain.top-level-domain`

---

#### 1.3 反向主机搜索 (`rhost:`) ⭐ **独有**
```
关键词 rhost:反向域名
```

**示例**:
```
warming rhost:org.wikipedia.www
warming rhost:org.wikipedia.*
```

**说明**: 
- 使用反向域名格式：`top-level.second-level.www`
- 支持通配符 `*` 匹配所有子域名
- Yandex独有的特殊语法

**用途**: 搜索整个域名下的所有子域

---

#### 1.4 MIME类型搜索 (`mime:`) ⭐ **独有**
```
关键词 mime:类型
```

**示例**:
```
报告 mime:pdf
数据 mime:xml
图片 mime:image
```

**说明**: 
- 搜索特定MIME类型的文件
- 比 `filetype:` 更精确
- Yandex独有语法

**常用MIME类型**:
- `pdf` - PDF文档
- `doc` - Word文档
- `xls` - Excel文档
- `xml` - XML文件
- `image` - 所有图片类型

---

#### 1.5 精确匹配 (`"..."`)
```
"完整短语"
```

**示例**:
```
"machine learning tutorial"
"React best practices"
```

---

### 2. 逻辑运算符

#### 2.1 AND 运算 (`&&`)
```
关键词1 && 关键词2
```

**示例**:
```
Python && tutorial
前端 && 开发
```

**说明**: 结果必须同时包含两个关键词

---

#### 2.2 OR 运算 (`|`)
```
关键词1 | 关键词2
```

**示例**:
```
React | Vue
JavaScript | TypeScript
```

**说明**: 结果包含任一关键词即可

---

#### 2.3 必须包含 (`+`)
```
+必须包含的词 其他词
```

**示例**:
```
Python +tutorial Flask
```

**说明**: `+`后的词必须出现在结果中

---

#### 2.4 排除 (`-`)
```
关键词 -排除词
```

**示例**:
```
Python -Django
```

**说明**: 排除包含指定词的结果

---

### 3. 特殊搜索

#### 3.1 日期范围
```
关键词 date:YYYYMMDD..YYYYMMDD
```

**示例**:
```
新闻 date:20240101..20241231
```

**说明**: 搜索指定日期范围内的内容

---

#### 3.2 标题搜索 (`title:`)
```
title:关键词
```

**示例**:
```
title:tutorial React
```

**说明**: 只搜索标题中包含关键词的页面

---

#### 3.3 URL搜索 (`url:`)
```
url:关键词
```

**示例**:
```
url:github
url:docs
```

**说明**: 只搜索URL中包含关键词的页面

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://yandex.com/search/
```

**查询参数**:
```typescript
interface YandexSearchParams {
  text: string;           // 搜索查询
  lr?: number;           // 地区ID (如: 213=莫斯科, 2=圣彼得堡)
  lang?: string;         // 界面语言 (如: 'ru', 'en')
}
```

**完整URL示例**:
```
https://yandex.com/search/?text=React+tutorial+site%3Agithub.com
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType } from '@/types'

/**
 * Yandex 搜索引擎适配器
 * 支持俄语优化和独特的高级搜索语法
 */
export class YandexAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Yandex'
  }

  getBaseUrl(): string {
    return 'https://yandex.com/search/'
  }

  /**
   * 构建 Yandex 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    const urlParams = new URLSearchParams({
      text: query
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

    // 4. MIME类型搜索 (Yandex独有)
    if (params.fileType && params.fileType.trim()) {
      queryParts.push(`mime:${params.fileType.trim()}`)
    }

    // 5. 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 6. URL搜索
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`url:${params.inUrl.trim()}`)
    }

    // 7. 日期范围
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && to) {
        const fromDate = this.formatDate(from)
        const toDate = this.formatDate(to)
        queryParts.push(`date:${fromDate}..${toDate}`)
      }
    }

    // 8. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 9. OR 逻辑关键词 (使用 | 符号)
    if (params.orKeywords && params.orKeywords.length > 0) {
      const orQuery = params.orKeywords
        .filter(word => word.trim())
        .join(' | ')
      if (orQuery) {
        queryParts.push(`(${orQuery})`)
      }
    }

    return queryParts.join(' ')
  }

  /**
   * 格式化日期为 YYYYMMDD
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}${month}${day}`
  }

  /**
   * 验证语法类型
   */
  validateSyntax(syntax: SyntaxType): boolean {
    const supportedSyntax: SyntaxType[] = [
      'site',
      'filetype', // 实际使用 mime:
      'exact',
      'intitle',
      'inurl',
      'exclude',
      'or',
      'date_range'
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
      'or',
      'date_range'
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
      'or_keywords',
      'date_range'
    ]
  }

  /**
   * 验证搜索参数
   */
  validateParams(params: SearchParams): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查基本关键词
    if (!params.keyword || !params.keyword.trim()) {
      if (!params.exactMatch && !params.site) {
        errors.push('请输入搜索关键词')
      }
    }

    // 检查日期范围
    if (params.dateRange) {
      if (params.dateRange.from && params.dateRange.to) {
        const fromDate = new Date(params.dateRange.from)
        const toDate = new Date(params.dateRange.to)
        if (fromDate > toDate) {
          errors.push('开始日期不能晚于结束日期')
        }
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
      suggestions.push('使用 site: 可以在特定网站内搜索')
    }

    if (params.fileType) {
      suggestions.push('Yandex使用mime:语法进行文件类型搜索')
    }

    if (params.keyword && !params.dateRange) {
      suggestions.push('可以使用日期范围筛选最新内容')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1)
- [ ] 创建 `src/services/adapters/yandex.ts`
- [ ] 实现 `YandexAdapter` 类
- [ ] 实现基础语法 (site, mime, exact)
- [ ] 单元测试

### Phase 2: 高级功能 (Day 2)
- [ ] 实现逻辑运算符 (&&, |, +, -)
- [ ] 实现日期范围搜索
- [ ] 实现 title: 和 url: 语法
- [ ] 参数验证

### Phase 3: 特殊功能 (Day 3)
- [ ] 实现 rhost: 反向域名搜索（可选）
- [ ] 实现 host: 主机搜索（可选）
- [ ] UI集成和国际化
- [ ] 完整测试

---

## ✅ 测试用例

```typescript
describe('YandexAdapter', () => {
  const adapter = new YandexAdapter()

  test('基础关键词搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'React tutorial',
      engine: 'yandex'
    })
    expect(url).toContain('text=React+tutorial')
  })

  test('MIME类型搜索', () => {
    const url = adapter.buildQuery({
      keyword: '报告',
      fileType: 'pdf',
      engine: 'yandex'
    })
    expect(url).toContain('mime%3Apdf')
  })

  test('日期范围搜索', () => {
    const url = adapter.buildQuery({
      keyword: '新闻',
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      },
      engine: 'yandex'
    })
    expect(url).toContain('date%3A20240101..20241231')
  })

  test('OR逻辑运算', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      orKeywords: ['React', 'Vue'],
      engine: 'yandex'
    })
    expect(url).toContain('React+%7C+Vue')
  })

  test('组合查询', () => {
    const url = adapter.buildQuery({
      keyword: 'programming',
      site: 'github.com',
      inTitle: 'tutorial',
      excludeWords: ['beginner'],
      engine: 'yandex'
    })
    expect(url).toContain('site%3Agithub.com')
    expect(url).toContain('title%3Atutorial')
    expect(url).toContain('-beginner')
  })
})
```

---

## 🌍 国际化支持

```json
{
  "engines.yandex": "Yandex",
  "engines.yandex.description": "俄罗斯领先的搜索引擎",
  "engines.yandex.features": {
    "mime": "MIME类型搜索",
    "rhost": "反向域名搜索",
    "host": "主机搜索",
    "russian": "俄语优化"
  },
  "engines.yandex.tips": {
    "mime": "使用mime:而非filetype:进行文件搜索",
    "rhost": "rhost:可以搜索整个域名的所有子域",
    "operators": "支持 && (AND) 和 | (OR) 逻辑运算"
  }
}
```

---

## 📚 参考资源

### 官方文档
- [Yandex Query Language](https://yandex.com/support/search/en/query-language/)
- [Yandex Search Operators](https://yandex.com/support/search/en/query-language/qlanguage)
- [Boolean Strings on Yandex](https://booleanstrings.com/2022/01/15/a-few-words-about-yandex/)

---

## ⚠️ 特殊说明

### rhost: 语法使用示例

**搜索整个Wikipedia域名**:
```
关键词 rhost:org.wikipedia.*
```

**只搜索www.wikipedia.org**:
```
关键词 rhost:org.wikipedia.www
```

### MIME vs filetype

| Yandex (mime:) | 标准 (filetype:) |
|---------------|------------------|
| `mime:pdf` | `filetype:pdf` |
| `mime:image` | `filetype:jpg` |
| `mime:xml` | `filetype:xml` |

**建议**: UI层将 `filetype:` 转换为 `mime:` 以适配Yandex

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建，包含独特语法支持 |

---

**下一步**: 查看 [Reddit 文档](./reddit.md) 了解社区搜索引擎的实现细节
