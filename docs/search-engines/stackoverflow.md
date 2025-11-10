# Stack Overflow 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | Stack Overflow |
| **官方网站** | https://stackoverflow.com |
| **市场定位** | 技术问答社区平台 |
| **月访问量** | 5000万+ |
| **问题数量** | 2400万+ |
| **主要用户群** | 开发者、程序员、技术学习者 |
| **优先级** | **P2 (低)** |
| **实施复杂度** | 🔴 高 |
| **预计工期** | 3-4天 |

## 🎯 产品价值

### 用户价值
- ✅ **问题解决**: 快速找到技术问题的答案
- ✅ **最佳实践**: 学习社区认可的解决方案
- ✅ **代码示例**: 获取实际可用的代码片段
- ✅ **专家观点**: 访问经验丰富开发者的见解

### 业务价值
- 👨‍💻 吸引技术学习者
- 🎯 专业开发工具定位
- 💡 提升产品技术属性
- 🏆 增强用户黏性

## 🔍 支持的搜索语法

### 1. 基础搜索

#### 1.1 关键词搜索
```
关键词
```

**示例**:
```
React hooks
Python async
JavaScript promise
```

**说明**: 搜索标题、正文、标签中的关键词

---

#### 1.2 精确短语 (`"..."`)
```
"完整短语"
```

**示例**:
```
"how to use async await"
"what is closure"
```

---

### 2. 标签筛选

#### 2.1 单标签筛选 (`[tag]`)
```
[标签名]
```

**示例**:
```
[javascript]
[python]
[react]
[typescript]
```

**说明**: 只搜索带有指定标签的问题

---

#### 2.2 多标签组合
```
[标签1] [标签2]
```

**示例**:
```
[javascript] [react]
[python] [django]
[typescript] [node.js]
```

**说明**: 搜索同时包含多个标签的问题（AND关系）

---

#### 2.3 标签OR逻辑
```
[标签1] or [标签2]
```

**示例**:
```
[react] or [vue]
[python] or [javascript]
```

**说明**: 搜索包含任一标签的问题

---

### 3. 筛选器

#### 3.1 用户筛选 (`user:`)
```
user:用户ID
```

**示例**:
```
user:12345
user:me  (搜索自己的问题)
```

**说明**: 搜索特定用户提出或回答的问题

---

#### 3.2 已接受答案 (`isaccepted:` 或 `hasaccepted:`)
```
关键词 isaccepted:yes
关键词 hasaccepted:yes
```

**示例**:
```
React hooks isaccepted:yes
Python async hasaccepted:yes
```

**说明**: 只显示有已接受答案的问题

---

#### 3.3 问题状态 (`is:question` / `is:answer`)
```
is:question
is:answer
```

**示例**:
```
React is:question
async is:answer
```

**说明**: 
- `is:question` - 只搜索问题
- `is:answer` - 只搜索答案

---

#### 3.4 分数筛选 (`score:`)
```
score:>数值
score:范围
```

**示例**:
```
React score:>10
Python score:5..20
JavaScript score:>=15
```

**说明**: 筛选特定分数范围的问题或答案

---

#### 3.5 回答数筛选 (`answers:`)
```
answers:>数值
```

**示例**:
```
React answers:>5
Python answers:0  (未回答的问题)
```

---

#### 3.6 浏览量筛选 (`views:`)
```
views:>数值
```

**示例**:
```
React views:>1000
Python views:500..2000
```

---

### 4. 时间筛选

#### 4.1 创建时间 (`created:`)
```
created:日期范围
```

**示例**:
```
React created:2024-01-01..2024-12-31
Python created:>2024-01-01
JavaScript created:<2023-01-01
```

**日期格式**:
- `YYYY-MM-DD`
- `YYYY-MM-DD..YYYY-MM-DD` (范围)
- `>YYYY-MM-DD`, `<YYYY-MM-DD`

---

#### 4.2 最后活动时间 (`lastactive:`)
```
lastactive:日期范围
```

**示例**:
```
React lastactive:>2024-11-01
Python lastactive:1m  (最近1个月)
```

**时间单位**:
- `d` - 天 (days)
- `w` - 周 (weeks)
- `m` - 月 (months)
- `y` - 年 (years)

---

### 5. 内容筛选

#### 5.1 标题搜索 (`title:`)
```
title:关键词
```

**示例**:
```
title:React
title:"how to"
```

**说明**: 只搜索标题中包含关键词的问题

---

#### 5.2 正文搜索 (`body:`)
```
body:关键词
```

**示例**:
```
body:async
body:"error message"
```

**说明**: 只搜索正文中包含关键词的内容

---

#### 5.3 代码搜索 (`code:`)
```
code:代码片段
```

**示例**:
```
code:useState
code:"async function"
```

**说明**: 搜索代码块中的内容

---

### 6. 布尔运算符

#### 6.1 OR 逻辑
```
关键词1 OR 关键词2
```

**示例**:
```
React OR Vue
Python OR JavaScript
```

---

#### 6.2 NOT 逻辑 (`-`)
```
关键词 -排除词
```

**示例**:
```
React -class
Python -2.7
```

---

### 7. 特殊筛选

#### 7.1 已关闭问题 (`closed:`)
```
closed:yes
closed:no
```

**示例**:
```
React closed:yes
Python closed:no
```

---

#### 7.2 已锁定问题 (`locked:`)
```
locked:yes
```

**示例**:
```
controversial locked:yes
```

---

#### 7.3 Wiki类型 (`wiki:`)
```
wiki:yes
```

**示例**:
```
tutorial wiki:yes
```

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://stackoverflow.com/search
```

**查询参数**:
```typescript
interface StackOverflowSearchParams {
  q: string;              // 搜索查询
  tab?: string;           // relevance|newest|votes|active
  pagesize?: number;      // 每页结果数 (默认: 15)
}
```

**完整URL示例**:
```
https://stackoverflow.com/search?q=%5Breact%5D+hooks+isaccepted%3Ayes
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType } from '@/types'

/**
 * Stack Overflow 搜索引擎适配器
 * 支持技术问答搜索和标签筛选
 */
export class StackOverflowAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Stack Overflow'
  }

  getBaseUrl(): string {
    return 'https://stackoverflow.com/search'
  }

  /**
   * 构建 Stack Overflow 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    
    const urlParams = new URLSearchParams({
      q: query,
      tab: 'relevance'
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

    // 3. 标签筛选 (Stack Overflow特有)
    // 将多个标签转换为 [tag1] [tag2] 格式
    if (params.site && params.site.trim()) {
      const tags = params.site.split(',').map(tag => tag.trim())
      tags.forEach(tag => {
        if (tag) {
          queryParts.push(`[${tag}]`)
        }
      })
    }

    // 4. 用户筛选
    if (params.fromUser && params.fromUser.trim()) {
      const userId = params.fromUser.replace('@', '')
      queryParts.push(`user:${userId}`)
    }

    // 5. 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 6. 正文搜索
    if (params.inText && params.inText.trim()) {
      queryParts.push(`body:${params.inText.trim()}`)
    }

    // 7. 日期范围 (使用created:)
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && to) {
        queryParts.push(`created:${from}..${to}`)
      } else if (from) {
        queryParts.push(`created:>${from}`)
      } else if (to) {
        queryParts.push(`created:<${to}`)
      }
    }

    // 8. 已接受答案筛选 (Stack Overflow特有)
    // 可以通过自定义字段添加
    // queryParts.push('isaccepted:yes')

    // 9. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 10. OR 逻辑关键词
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
      'site',        // 映射为标签 [tag]
      'exact',
      'intitle',
      'intext',
      'exclude',
      'or',
      'from_user',
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
      'exact',
      'intitle',
      'intext',
      'exclude',
      'or',
      'from_user',
      'date_range'
    ]
  }

  /**
   * 获取支持的UI功能特性
   */
  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site',           // 显示为"标签"
      'exact_match',
      'intitle',
      'intext',
      'exclude',
      'or_keywords',
      'from_user',      // 显示为"用户ID"
      'date_range'      // 显示为"创建时间"
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
        errors.push('请输入搜索关键词或标签')
      }
    }

    // 检查标签格式
    if (params.site && params.site.trim()) {
      const tags = params.site.split(',')
      tags.forEach(tag => {
        const trimmedTag = tag.trim()
        if (trimmedTag && !/^[a-z0-9.\-#+]+$/.test(trimmedTag)) {
          warnings.push(`标签 "${trimmedTag}" 格式可能不正确`)
        }
      })
    }

    // 检查用户ID
    if (params.fromUser && params.fromUser.trim()) {
      const userId = params.fromUser.replace('@', '')
      if (isNaN(Number(userId)) && userId !== 'me') {
        warnings.push('用户ID应该是数字或"me"')
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
      suggestions.push('添加标签可以精确定位技术领域')
    }

    if (params.keyword) {
      suggestions.push('使用 isaccepted:yes 只显示有已接受答案的问题')
    }

    if (!params.dateRange) {
      suggestions.push('使用日期筛选可以找到最新的解决方案')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1-2)
- [ ] 创建 `src/services/adapters/stackoverflow.ts`
- [ ] 实现 `StackOverflowAdapter` 类
- [ ] 实现基础搜索和标签筛选
- [ ] 单元测试

### Phase 2: 高级筛选 (Day 2-3)
- [ ] 实现用户筛选
- [ ] 实现分数、回答数、浏览量筛选
- [ ] 实现时间筛选
- [ ] 实现内容筛选 (title, body, code)
- [ ] 参数验证

### Phase 3: UI集成 (Day 3-4)
- [ ] 标签输入组件
- [ ] 常用标签预设
- [ ] 高级筛选UI (isaccepted, score等)
- [ ] 国际化翻译
- [ ] 完整测试

---

## ✅ 测试用例

```typescript
describe('StackOverflowAdapter', () => {
  const adapter = new StackOverflowAdapter()

  test('基础关键词搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'React hooks',
      engine: 'stackoverflow'
    })
    expect(url).toContain('q=React+hooks')
    expect(url).toContain('tab=relevance')
  })

  test('标签筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      site: 'javascript,react',
      engine: 'stackoverflow'
    })
    expect(url).toContain('%5Bjavascript%5D')  // [javascript]
    expect(url).toContain('%5Breact%5D')       // [react]
  })

  test('用户筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'answer',
      fromUser: '12345',
      engine: 'stackoverflow'
    })
    expect(url).toContain('user%3A12345')
  })

  test('标题和正文搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'error',
      inTitle: 'async',
      inText: 'await',
      engine: 'stackoverflow'
    })
    expect(url).toContain('title%3Aasync')
    expect(url).toContain('body%3Aawait')
  })

  test('组合查询', () => {
    const url = adapter.buildQuery({
      keyword: 'tutorial',
      site: 'react',
      dateRange: {
        from: '2024-01-01',
        to: '2024-12-31'
      },
      excludeWords: ['deprecated'],
      engine: 'stackoverflow'
    })
    expect(url).toContain('%5Breact%5D')
    expect(url).toContain('created%3A2024-01-01..2024-12-31')
    expect(url).toContain('-deprecated')
  })
})
```

---

## 🌍 国际化支持

```json
{
  "engines.stackoverflow": "Stack Overflow",
  "engines.stackoverflow.description": "全球最大的技术问答社区",
  "engines.stackoverflow.features": {
    "tags": "标签筛选",
    "isaccepted": "已接受答案",
    "score": "分数筛选",
    "answers": "回答数",
    "views": "浏览量",
    "user": "用户筛选"
  },
  "engines.stackoverflow.labels": {
    "site": "标签 (逗号分隔)",
    "fromUser": "用户ID",
    "inTitle": "标题搜索",
    "inText": "正文搜索",
    "dateRange": "创建时间"
  },
  "engines.stackoverflow.placeholders": {
    "site": "例如: javascript,react,typescript",
    "fromUser": "例如: 12345 或 me",
    "keyword": "例如: how to use async await"
  },
  "engines.stackoverflow.commonTags": {
    "javascript": "JavaScript",
    "python": "Python",
    "java": "Java",
    "c#": "C#",
    "php": "PHP",
    "android": "Android",
    "html": "HTML",
    "jquery": "jQuery",
    "c++": "C++",
    "css": "CSS",
    "ios": "iOS",
    "mysql": "MySQL",
    "sql": "SQL",
    "r": "R",
    "node.js": "Node.js",
    "reactjs": "React.js",
    "arrays": "Arrays",
    "c": "C",
    "ruby-on-rails": "Ruby on Rails",
    "json": "JSON"
  }
}
```

---

## 🎨 UI特殊处理

### 常用标签快捷选择

```typescript
const POPULAR_TAGS = {
  frontend: ['javascript', 'html', 'css', 'reactjs', 'vue.js', 'angular'],
  backend: ['node.js', 'python', 'java', 'php', 'ruby-on-rails', 'asp.net'],
  mobile: ['android', 'ios', 'react-native', 'flutter', 'swift', 'kotlin'],
  database: ['mysql', 'postgresql', 'mongodb', 'sql', 'sqlite'],
  tools: ['git', 'docker', 'linux', 'bash', 'regex']
}
```

### 标签输入组件

```typescript
// TagInput.tsx - Stack Overflow专用
interface TagInputProps {
  value: string
  onChange: (tags: string) => void
  suggestions?: string[]
}

// 支持逗号分隔多个标签
// 自动提示常用标签
// 标签验证（小写字母、数字、.-#+）
```

---

## 📚 参考资源

### 官方文档
- [Stack Overflow Search](https://stackoverflow.com/help/searching)
- [Advanced Search](https://stackoverflow.com/search)
- [Stack Overflow API](https://api.stackexchange.com/)

### 技术文章
- [Advanced Search Features](https://meta.stackexchange.com/questions/78695/advanced-search-features)
- [Search Tips](https://stackoverflow.com/help/search-tips)

---

## 💡 使用场景

### 1. 问题解决
```
错误信息 [javascript] isaccepted:yes
bug描述 [react] score:>5
```

### 2. 学习最佳实践
```
"best practices" [python] score:>10
tutorial [typescript] views:>1000
```

### 3. 代码示例查找
```
code:async [javascript]
code:useState [react]
```

### 4. 技术趋势研究
```
[react] created:>2024-01-01
[typescript] lastactive:1m
```

---

## ⚠️ 注意事项

### 标签规则
- 只能包含：小写字母、数字、`.`、`-`、`#`、`+`
- 不能包含空格
- 使用连字符分隔多词标签：`node.js`, `ruby-on-rails`

### API访问限制
- 建议注册API Key提升限额
- 未认证: 300次/天
- 认证用户: 10000次/天

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建，包含完整的搜索语法和标签系统 |

---

**文档完成**: 所有六个搜索引擎的详细文档已创建完毕，请查看 [总览文档](./README.md)
