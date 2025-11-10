# Reddit 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | Reddit |
| **官方网站** | https://www.reddit.com |
| **市场定位** | 社区内容搜索平台 |
| **月活用户** | 4.3亿+ |
| **日帖子量** | 200万+ |
| **主要用户群** | 社区用户、研究者、营销人员、开发者 |
| **优先级** | **P1 (中等)** |
| **实施复杂度** | 🟡 中等 |
| **预计工期** | 2-3天 |

## 🎯 产品价值

### 用户价值
- ✅ **社区洞察**: 获取真实用户讨论和观点
- ✅ **趋势发现**: 了解热门话题和社区动态
- ✅ **专业内容**: 访问各领域专家的讨论
- ✅ **UGC搜索**: 用户生成内容的精准搜索

### 业务价值
- 📊 市场研究和用户调研工具
- 🎯 垂直搜索差异化
- 💼 营销和社交媒体分析
- 🔍 内容发现和灵感来源

## 🔍 支持的搜索语法

### 1. 基础语法

#### 1.1 关键词搜索
```
关键词
```

**示例**:
```
Python tutorial
React best practices
```

**说明**: 搜索标题和正文中包含关键词的帖子

---

#### 1.2 精确匹配 (`"..."`)
```
"完整短语"
```

**示例**:
```
"how to learn React"
"best programming languages"
```

**说明**: 搜索包含完整短语的帖子

---

#### 1.3 排除关键词 (`-` 或 `NOT`)
```
关键词 -排除词
关键词 NOT 排除词
```

**示例**:
```
Python -Django
React NOT class
```

**说明**: 排除包含指定词的结果

---

### 2. 筛选器语法

#### 2.1 Subreddit 筛选 (`subreddit:`)
```
关键词 subreddit:社区名
```

**示例**:
```
tutorial subreddit:learnprogramming
news subreddit:technology
```

**说明**: 只搜索特定subreddit中的内容

---

#### 2.2 作者筛选 (`author:`)
```
关键词 author:用户名
```

**示例**:
```
tutorial author:spez
Python author:guido
```

**说明**: 只搜索特定用户发布的帖子

---

#### 2.3 URL筛选 (`url:`)
```
url:网址关键词
```

**示例**:
```
url:github.com
url:youtube
```

**说明**: 搜索链接到特定URL的帖子

---

#### 2.4 标题搜索 (`title:`)
```
title:关键词
```

**示例**:
```
title:tutorial
title:"best practices"
```

**说明**: 只搜索标题中包含关键词的帖子

---

#### 2.5 正文搜索 (`selftext:`)
```
selftext:关键词
```

**示例**:
```
selftext:tutorial
selftext:"step by step"
```

**说明**: 只搜索正文内容（文本帖子的正文）

---

#### 2.6 帖子类型筛选 (`self:`)
```
self:yes    # 只显示文本帖子
self:no     # 只显示链接帖子
```

**示例**:
```
Python tutorial self:yes
news self:no
```

**说明**: 
- `self:yes` - 只显示自发文本帖子
- `self:no` - 只显示外部链接帖子

---

### 3. 逻辑运算符

#### 3.1 OR 逻辑
```
关键词1 OR 关键词2
```

**示例**:
```
Python OR JavaScript
React OR Vue
```

**说明**: 搜索包含任一关键词的帖子（OR必须大写）

---

#### 3.2 AND 逻辑 (默认)
```
关键词1 关键词2
```

**示例**:
```
Python tutorial beginner
```

**说明**: 默认所有关键词都必须出现

---

### 4. 时间筛选

Reddit搜索支持时间范围筛选，但主要通过UI进行：

| 时间范围 | 参数值 | 说明 |
|---------|-------|------|
| 过去1小时 | `hour` | 最近1小时的内容 |
| 过去24小时 | `day` | 今天的内容 |
| 过去1周 | `week` | 本周的内容 |
| 过去1月 | `month` | 本月的内容 |
| 过去1年 | `year` | 今年的内容 |
| 所有时间 | `all` | 不限时间 |

**URL参数**: `t=day|week|month|year|all`

---

### 5. 排序方式

| 排序方式 | 参数值 | 说明 |
|---------|-------|------|
| 相关性 | `relevance` | 默认排序 |
| 热门 | `hot` | 最热门的帖子 |
| 最新 | `new` | 最新发布的 |
| 评论数 | `comments` | 评论最多的 |
| 得分 | `top` | 得分最高的 |

**URL参数**: `sort=relevance|hot|new|comments|top`

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://www.reddit.com/search
```

**查询参数**:
```typescript
interface RedditSearchParams {
  q: string;              // 搜索查询
  sort?: string;          // 排序: relevance|hot|new|comments|top
  t?: string;            // 时间范围: hour|day|week|month|year|all
  type?: string;         // 搜索类型: link|sr (默认link)
  restrict_sr?: boolean; // 限制在当前subreddit
}
```

**完整URL示例**:
```
https://www.reddit.com/search/?q=Python+tutorial+subreddit%3Alearnprogramming&sort=relevance&t=all
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType } from '@/types'

/**
 * Reddit 搜索引擎适配器
 * 支持社区内容搜索和用户生成内容发现
 */
export class RedditAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Reddit'
  }

  getBaseUrl(): string {
    return 'https://www.reddit.com/search/'
  }

  /**
   * 构建 Reddit 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    
    const urlParams = new URLSearchParams({
      q: query,
      sort: 'relevance',
      t: 'all'
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

    // 3. Subreddit筛选 (使用site作为subreddit)
    if (params.site && params.site.trim()) {
      queryParts.push(`subreddit:${params.site.trim()}`)
    }

    // 4. 作者筛选 (使用fromUser作为author)
    if (params.fromUser && params.fromUser.trim()) {
      const author = params.fromUser.replace('@', '')
      queryParts.push(`author:${author}`)
    }

    // 5. URL筛选
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`url:${params.inUrl.trim()}`)
    }

    // 6. 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 7. 正文搜索
    if (params.inText && params.inText.trim()) {
      queryParts.push(`selftext:${params.inText.trim()}`)
    }

    // 8. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 9. OR 逻辑关键词
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
      'site',        // 映射为 subreddit:
      'exact',
      'intitle',
      'inurl',
      'intext',
      'exclude',
      'or',
      'from_user'    // 映射为 author:
    ]
    return supportedSyntax.includes(syntax)
  }

  /**
   * 获取支持的语法类型
   */
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'exact',
      'intitle',
      'inurl',
      'intext',
      'exclude',
      'or',
      'from_user'
    ]
  }

  /**
   * 获取支持的UI功能特性
   */
  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site',           // 显示为"Subreddit"
      'exact_match',
      'intitle',
      'inurl',
      'intext',
      'exclude',
      'or_keywords',
      'from_user'       // 显示为"作者"
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
      if (!params.exactMatch && !params.site && !params.fromUser) {
        errors.push('请输入搜索关键词')
      }
    }

    // 检查subreddit名称
    if (params.site && params.site.trim()) {
      const subredditPattern = /^[a-zA-Z0-9_]{3,21}$/
      if (!subredditPattern.test(params.site.trim())) {
        warnings.push('Subreddit名称格式可能不正确')
      }
    }

    // 检查用户名
    if (params.fromUser && params.fromUser.trim()) {
      const username = params.fromUser.replace('@', '')
      const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/
      if (!usernamePattern.test(username)) {
        warnings.push('用户名格式可能不正确')
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
      suggestions.push('尝试添加 subreddit: 限定搜索社区')
    }

    if (params.keyword && !params.fromUser) {
      suggestions.push('使用 author: 可以搜索特定用户的帖子')
    }

    if (!params.exactMatch) {
      suggestions.push('使用精确匹配可以找到更准确的讨论')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1)
- [ ] 创建 `src/services/adapters/reddit.ts`
- [ ] 实现 `RedditAdapter` 类
- [ ] 实现基础语法 (关键词、精确匹配)
- [ ] 单元测试

### Phase 2: 筛选器 (Day 2)
- [ ] 实现 subreddit: 筛选
- [ ] 实现 author: 筛选
- [ ] 实现 url:, title:, selftext: 筛选
- [ ] 参数验证

### Phase 3: UI集成 (Day 3)
- [ ] 字段映射配置 (site → subreddit, fromUser → author)
- [ ] 时间范围和排序UI
- [ ] 国际化翻译
- [ ] 完整测试

---

## ✅ 测试用例

```typescript
describe('RedditAdapter', () => {
  const adapter = new RedditAdapter()

  test('基础关键词搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'Python tutorial',
      engine: 'reddit'
    })
    expect(url).toContain('q=Python+tutorial')
    expect(url).toContain('sort=relevance')
  })

  test('Subreddit筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      site: 'learnprogramming',
      engine: 'reddit'
    })
    expect(url).toContain('subreddit%3Alearnprogramming')
  })

  test('作者筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'announcement',
      fromUser: 'spez',
      engine: 'reddit'
    })
    expect(url).toContain('author%3Aspez')
  })

  test('标题和正文搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'React',
      inTitle: 'tutorial',
      inText: 'beginner',
      engine: 'reddit'
    })
    expect(url).toContain('title%3Atutorial')
    expect(url).toContain('selftext%3Abeginner')
  })

  test('OR逻辑', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      orKeywords: ['Python', 'JavaScript'],
      engine: 'reddit'
    })
    expect(url).toContain('Python+OR+JavaScript')
  })

  test('组合查询', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      site: 'programming',
      fromUser: 'expert',
      excludeWords: ['beginner'],
      engine: 'reddit'
    })
    expect(url).toContain('subreddit%3Aprogramming')
    expect(url).toContain('author%3Aexpert')
    expect(url).toContain('-beginner')
  })
})
```

---

## 🌍 国际化支持

```json
{
  "engines.reddit": "Reddit",
  "engines.reddit.description": "全球最大社区内容搜索平台",
  "engines.reddit.features": {
    "subreddit": "Subreddit社区",
    "author": "作者筛选",
    "selftext": "正文搜索",
    "title": "标题搜索",
    "url": "链接筛选"
  },
  "engines.reddit.labels": {
    "site": "Subreddit",
    "fromUser": "作者 (Reddit用户名)",
    "timeRange": "时间范围",
    "sortBy": "排序方式"
  },
  "engines.reddit.tips": {
    "subreddit": "输入subreddit名称（不含r/前缀）",
    "author": "输入Reddit用户名（不含u/前缀）",
    "selftext": "搜索文本帖子的正文内容"
  }
}
```

---

## 🎨 UI特殊处理

### 字段映射

Reddit使用特殊的术语，需要在UI层进行映射：

| 通用字段 | Reddit术语 | 说明 |
|---------|-----------|------|
| `site` | `subreddit` | 社区名称 |
| `fromUser` | `author` | 用户名 |
| `inText` | `selftext` | 正文内容 |

### UI标签建议

```typescript
// UI组件中的特殊处理
const getFieldLabel = (field: string, engine: SearchEngine) => {
  if (engine === 'reddit') {
    const redditLabels = {
      site: 'Subreddit',
      fromUser: 'Reddit用户',
      inText: '帖子正文'
    }
    return redditLabels[field] || field
  }
  return field
}
```

---

## 📚 参考资源

### 官方文档
- [Reddit Search Documentation](https://www.reddit.com/wiki/search/)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)
- [Advanced Reddit Search Guide](https://upvoteshop.io/advanced-reddit-search-guide/)

### 技术文章
- [Reddit Search Operators](https://medium.com/@nammooo/reddit-advance-search-operators-and-filters-310206356be1)
- [How to Search Reddit Like a Pro](https://redditschedule.com/how-to-use-reddit-search-like-a-pro-to-find-anything-in-2025/)

---

## 💡 使用场景

### 1. 市场研究
```
产品名称 subreddit:产品类别
用户反馈 subreddit:reviews
```

### 2. 技术学习
```
教程 subreddit:learnprogramming
最佳实践 subreddit:programming
```

### 3. 趋势发现
```
热门话题 sort:hot t:week
讨论度高 sort:comments t:day
```

### 4. 专家观点
```
技术话题 author:知名专家
行业分析 subreddit:行业社区
```

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建，包含社区搜索语法 |

---

**下一步**: 查看 [GitHub 文档](./github.md) 了解代码搜索引擎的实现细节
