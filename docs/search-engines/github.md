# GitHub 搜索引擎适配器文档

## 📋 基本信息

| 属性 | 值 |
|------|-----|
| **引擎名称** | GitHub Code Search |
| **官方网站** | https://github.com/search |
| **市场定位** | 代码搜索与开发者协作平台 |
| **注册用户** | 1亿+ 开发者 |
| **仓库数量** | 4亿+ 公开仓库 |
| **主要用户群** | 开发者、技术研究者、学习者 |
| **优先级** | **P2 (低)** |
| **实施复杂度** | 🔴 高 |
| **预计工期** | 3-4天 |

## 🎯 产品价值

### 用户价值
- ✅ **代码搜索**: 在海量开源代码中精准搜索
- ✅ **技术学习**: 查看优秀项目的实现方式
- ✅ **问题解决**: 找到相似问题的解决方案
- ✅ **开源发现**: 发现优质开源项目和库

### 业务价值
- 👨‍💻 吸引开发者用户群
- 🎯 专业工具定位
- 💡 差异化技术搜索
- 🏆 提升产品专业性

## 🔍 支持的搜索语法

### 1. 代码搜索

#### 1.1 基础代码搜索
```
关键词
```

**示例**:
```
useState
async function
class Component
```

**说明**: 搜索代码中的函数、类、变量等

---

#### 1.2 精确匹配 (`"..."`)
```
"完整代码片段"
```

**示例**:
```
"import React from 'react'"
"function useState"
```

---

#### 1.3 语言筛选 (`language:`)
```
关键词 language:语言
```

**示例**:
```
useState language:typescript
authentication language:python
API language:go
```

**常用语言**:
- `javascript`, `typescript`
- `python`, `java`, `go`
- `rust`, `c`, `cpp`
- `ruby`, `php`, `swift`

---

#### 1.4 文件路径筛选 (`path:`)
```
关键词 path:路径
```

**示例**:
```
useState path:src/hooks
config path:**/test/**
API path:api/
```

**说明**: 
- 支持通配符 `*` 和 `**`
- `**` 匹配任意层级目录

---

#### 1.5 文件名筛选 (`filename:`)
```
关键词 filename:文件名
```

**示例**:
```
useState filename:useAuth
config filename:package.json
API filename:*.test.ts
```

---

### 2. 仓库筛选

#### 2.1 仓库搜索 (`repo:`)
```
关键词 repo:用户/仓库
```

**示例**:
```
useState repo:facebook/react
config repo:vercel/next.js
```

**说明**: 限定在特定仓库内搜索

---

#### 2.2 组织筛选 (`org:`)
```
关键词 org:组织名
```

**示例**:
```
authentication org:google
framework org:facebook
```

**说明**: 搜索特定组织的所有仓库

---

#### 2.3 用户筛选 (`user:`)
```
关键词 user:用户名
```

**示例**:
```
tutorial user:torvalds
project user:gvanrossum
```

**说明**: 搜索特定用户的仓库

---

### 3. 仓库属性筛选

#### 3.1 Star数筛选 (`stars:`)
```
关键词 stars:>数量
关键词 stars:范围
```

**示例**:
```
React stars:>10000
Vue stars:1000..5000
framework stars:>=1000
```

**支持的运算符**:
- `>`, `>=` - 大于/大于等于
- `<`, `<=` - 小于/小于等于
- `..` - 范围

---

#### 3.2 Fork数筛选 (`forks:`)
```
关键词 forks:>数量
```

**示例**:
```
framework forks:>100
library forks:50..200
```

---

#### 3.3 仓库大小筛选 (`size:`)
```
关键词 size:>大小
```

**示例**:
```
project size:<1000
library size:>5000
```

**说明**: 单位为KB

---

### 4. 时间筛选

#### 4.1 创建时间 (`created:`)
```
关键词 created:>日期
```

**示例**:
```
framework created:>2024-01-01
project created:2023-01-01..2024-01-01
```

---

#### 4.2 推送时间 (`pushed:`)
```
关键词 pushed:>日期
```

**示例**:
```
active project pushed:>2024-11-01
library pushed:<2023-01-01
```

**说明**: 筛选最近活跃的项目

---

### 5. 布尔运算符

#### 5.1 AND (默认)
```
关键词1 关键词2
```

**示例**:
```
React TypeScript hooks
```

---

#### 5.2 OR
```
关键词1 OR 关键词2
```

**示例**:
```
React OR Vue
Python OR JavaScript
```

---

#### 5.3 NOT (`-`)
```
关键词 -排除词
```

**示例**:
```
React -class
JavaScript -jQuery
```

---

### 6. 特殊功能

#### 6.1 符号搜索
```
symbol:符号名
```

**示例**:
```
symbol:useState
symbol:Component
```

**说明**: 搜索函数、类等符号定义

---

#### 6.2 扩展名筛选 (`extension:`)
```
关键词 extension:扩展名
```

**示例**:
```
config extension:json
API extension:ts
```

---

## 🔧 技术实现

### URL 构建格式

**基础URL**:
```
https://github.com/search
```

**查询参数**:
```typescript
interface GitHubSearchParams {
  q: string;              // 搜索查询
  type: 'code' | 'repositories' | 'issues' | 'users';
  l?: string;            // 语言
  s?: string;            // 排序
  o?: 'desc' | 'asc';    // 排序方向
}
```

**完整URL示例**:
```
https://github.com/search?q=useState+language%3Atypescript&type=code
```

### 适配器实现模板

```typescript
import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType } from '@/types'

/**
 * GitHub 搜索引擎适配器
 * 支持代码搜索和仓库发现
 */
export class GitHubAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'GitHub'
  }

  getBaseUrl(): string {
    return 'https://github.com/search'
  }

  /**
   * 构建 GitHub 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    
    const urlParams = new URLSearchParams({
      q: query,
      type: 'code'  // 默认搜索代码
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

    // 3. 仓库筛选 (使用site字段作为repo)
    if (params.site && params.site.trim()) {
      // 格式: user/repo 或 org/repo
      queryParts.push(`repo:${params.site.trim()}`)
    }

    // 4. 语言筛选
    if (params.language && params.language.trim()) {
      queryParts.push(`language:${params.language.trim()}`)
    }

    // 5. 文件路径筛选
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`path:${params.inUrl.trim()}`)
    }

    // 6. 文件类型筛选
    if (params.fileType && params.fileType.trim()) {
      queryParts.push(`extension:${params.fileType.trim()}`)
    }

    // 7. 用户筛选
    if (params.fromUser && params.fromUser.trim()) {
      const user = params.fromUser.replace('@', '')
      queryParts.push(`user:${user}`)
    }

    // 8. 日期范围 (使用pushed:)
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && to) {
        queryParts.push(`pushed:${from}..${to}`)
      } else if (from) {
        queryParts.push(`pushed:>${from}`)
      } else if (to) {
        queryParts.push(`pushed:<${to}`)
      }
    }

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
      'site',        // 映射为 repo:
      'exact',
      'inurl',       // 映射为 path:
      'filetype',    // 映射为 extension:
      'exclude',
      'or',
      'from_user',   // 映射为 user:
      'lang',        // 映射为 language:
      'date_range'   // 映射为 pushed:
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
      'inurl',
      'filetype',
      'exclude',
      'or',
      'from_user',
      'lang',
      'date_range'
    ]
  }

  /**
   * 获取支持的UI功能特性
   */
  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site',           // 显示为"仓库"
      'exact_match',
      'inurl',          // 显示为"文件路径"
      'filetype',       // 显示为"文件扩展名"
      'exclude',
      'or_keywords',
      'from_user',      // 显示为"用户/组织"
      'language',       // 显示为"编程语言"
      'date_range'      // 显示为"最后推送时间"
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

    // 检查仓库格式
    if (params.site && params.site.trim()) {
      const repoPattern = /^[\w-]+\/[\w.-]+$/
      if (!repoPattern.test(params.site.trim())) {
        warnings.push('仓库格式应为: user/repo 或 org/repo')
      }
    }

    // 检查语言
    if (params.language && params.language.trim()) {
      const validLangs = [
        'javascript', 'typescript', 'python', 'java', 'go', 
        'rust', 'c', 'cpp', 'ruby', 'php', 'swift', 'kotlin'
      ]
      if (!validLangs.includes(params.language.toLowerCase())) {
        warnings.push(`语言 "${params.language}" 可能不被识别`)
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
      suggestions.push('添加 language: 可以筛选特定编程语言')
    }

    if (params.keyword && !params.site) {
      suggestions.push('使用 repo: 可以在特定仓库内搜索')
    }

    if (params.keyword && !params.inUrl) {
      suggestions.push('使用 path: 可以限定文件路径')
    }

    return suggestions
  }
}
```

---

## 📝 实施清单

### Phase 1: 核心功能 (Day 1-2)
- [ ] 创建 `src/services/adapters/github.ts`
- [ ] 实现 `GitHubAdapter` 类
- [ ] 实现基础代码搜索
- [ ] 实现语言和仓库筛选
- [ ] 单元测试

### Phase 2: 高级功能 (Day 2-3)
- [ ] 实现路径和扩展名筛选
- [ ] 实现用户/组织筛选
- [ ] 实现日期范围筛选
- [ ] 实现布尔运算符
- [ ] 参数验证

### Phase 3: UI集成 (Day 3-4)
- [ ] 字段映射配置
- [ ] 专用UI组件（编程语言选择器）
- [ ] 国际化翻译
- [ ] OAuth集成（可选，用于高级功能）
- [ ] 完整测试

---

## ✅ 测试用例

```typescript
describe('GitHubAdapter', () => {
  const adapter = new GitHubAdapter()

  test('基础代码搜索', () => {
    const url = adapter.buildQuery({
      keyword: 'useState',
      engine: 'github'
    })
    expect(url).toContain('q=useState')
    expect(url).toContain('type=code')
  })

  test('语言筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'useState',
      language: 'typescript',
      engine: 'github'
    })
    expect(url).toContain('language%3Atypescript')
  })

  test('仓库筛选', () => {
    const url = adapter.buildQuery({
      keyword: 'hooks',
      site: 'facebook/react',
      engine: 'github'
    })
    expect(url).toContain('repo%3Afacebook%2Freact')
  })

  test('路径和扩展名', () => {
    const url = adapter.buildQuery({
      keyword: 'config',
      inUrl: 'src/',
      fileType: 'ts',
      engine: 'github'
    })
    expect(url).toContain('path%3Asrc%2F')
    expect(url).toContain('extension%3Ats')
  })

  test('组合查询', () => {
    const url = adapter.buildQuery({
      keyword: 'authentication',
      language: 'python',
      site: 'django/django',
      excludeWords: ['deprecated'],
      engine: 'github'
    })
    expect(url).toContain('language%3Apython')
    expect(url).toContain('repo%3Adjango%2Fdjango')
    expect(url).toContain('-deprecated')
  })
})
```

---

## 🌍 国际化支持

```json
{
  "engines.github": "GitHub",
  "engines.github.description": "全球最大的代码托管和搜索平台",
  "engines.github.features": {
    "repo": "仓库筛选",
    "language": "编程语言",
    "path": "文件路径",
    "extension": "文件扩展名",
    "user": "用户/组织",
    "pushed": "最后推送时间"
  },
  "engines.github.labels": {
    "site": "仓库 (user/repo)",
    "language": "编程语言",
    "inUrl": "文件路径",
    "fileType": "文件扩展名",
    "fromUser": "用户/组织",
    "dateRange": "最后推送时间"
  },
  "engines.github.placeholders": {
    "site": "例如: facebook/react",
    "language": "例如: typescript",
    "inUrl": "例如: src/hooks/",
    "fromUser": "例如: torvalds"
  }
}
```

---

## 🎨 UI特殊处理

### 编程语言选择器

```typescript
const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' }
]
```

### 字段映射

| 通用字段 | GitHub语法 | UI标签 |
|---------|-----------|--------|
| `site` | `repo:` | 仓库 |
| `language` | `language:` | 编程语言 |
| `inUrl` | `path:` | 文件路径 |
| `fileType` | `extension:` | 文件扩展名 |
| `fromUser` | `user:` 或 `org:` | 用户/组织 |

---

## 📚 参考资源

### 官方文档
- [GitHub Code Search](https://docs.github.com/en/search-github/searching-on-github)
- [GitHub Search Syntax](https://docs.github.com/en/search-github/getting-started-with-searching-on-github/understanding-the-search-syntax)
- [GitHub Advanced Search](https://github.com/search/advanced)

---

## ⚠️ 注意事项

### API限制
- 未认证用户: 10次/分钟
- 认证用户: 30次/分钟
- 建议: 添加OAuth认证提升限额

### OAuth集成（可选）

```typescript
// 可选的OAuth认证
interface GitHubOAuthConfig {
  clientId: string
  scope: 'repo' | 'public_repo'
}

// 认证后可以访问私有仓库
async function authenticateGitHub() {
  // OAuth flow implementation
}
```

---

## 🔄 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|---------|
| 2025-11-09 | v1.0 | 初始文档创建，包含代码搜索语法 |

---

**下一步**: 查看 [Stack Overflow 文档](./stackoverflow.md) 了解技术问答搜索引擎的实现细节
