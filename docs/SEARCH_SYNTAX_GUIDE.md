# 高级搜索语法完整指南

> **SearchSyntax Pro** - 支持的所有搜索引擎高级语法文档
> 更新日期: 2025-11-08
> 版本: v1.1.0

---

## 📑 目录

1. [已实现的搜索语法](#已实现的搜索语法)
2. [计划实现的搜索语法](#计划实现的搜索语法)
3. [搜索引擎兼容性矩阵](#搜索引擎兼容性矩阵)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [技术实现参考](#技术实现参考)

---

## 已实现的搜索语法

### 1. site: - 网站内搜索 ✅

**状态**: 已实现
**优先级**: ⭐⭐⭐⭐⭐

#### 功能描述
限制搜索结果仅来自指定的网站或域名。

#### 语法格式
```
site:域名
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 实现版本 | 备注 |
|---------|---------|---------|------|
| 百度 | ✅ 完全支持 | v1.0.0 | 支持域名和子域名 |
| Google | ✅ 完全支持 | v1.0.0 | 支持域名和路径 |
| Bing | ✅ 完全支持 | v1.0.0 | 支持域名限制 |

#### 使用示例
```
搜索关键词 site:wikipedia.org
React教程 site:github.com
Python文档 site:docs.python.org
```

#### 实现细节
- **位置**: `src/services/adapters/baidu.ts:39-43`
- **位置**: `src/services/adapters/google.ts:39-43`
- **位置**: `src/services/adapters/bing.ts:39-43`
- **域名清理**: 自动移除 `https://`, `http://`, 路径和端口号
- **验证规则**: 支持标准域名格式验证 (如 `example.com`)

#### 典型应用场景
1. 在官方网站搜索产品文档
2. 限定学术网站查找论文
3. 在特定社区论坛搜索讨论
4. 查找企业内部资源

---

### 2. filetype: - 文件类型搜索 ✅

**状态**: 已实现
**优先级**: ⭐⭐⭐⭐⭐

#### 功能描述
搜索特定文件格式的文档。

#### 语法格式
```
filetype:文件扩展名
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 实现版本 | 支持的文件类型 |
|---------|---------|---------|---------------|
| 百度 | ✅ 完全支持 | v1.0.0 | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar, jpg, png, gif |
| Google | ✅ 完全支持 | v1.0.0 | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar, jpg, png, gif, svg, mp4, avi, mp3 |
| Bing | ✅ 完全支持 | v1.0.0 | pdf, doc, docx, xls, xlsx, ppt, pptx, txt, zip, rar, jpg, png, gif, bmp, tiff |

#### 使用示例
```
React教程 filetype:pdf
年度报告 filetype:xlsx
产品说明 filetype:docx
技术白皮书 filetype:pdf
```

#### 实现细节
- **位置**: `src/services/adapters/baidu.ts:45-48`
- **位置**: `src/services/adapters/google.ts:45-48`
- **位置**: `src/services/adapters/bing.ts:45-48`
- **支持类型**: `src/types/index.ts:84-98` (COMMON_FILE_TYPES)
- **验证**: 自动检查文件类型是否在支持列表中

#### 典型应用场景
1. 下载PDF格式的技术文档
2. 查找Excel数据表格
3. 获取PowerPoint演示文稿
4. 搜索特定格式的图片

---

### 3. "..." - 精确匹配 ✅

**状态**: 已实现
**优先级**: ⭐⭐⭐⭐⭐

#### 功能描述
搜索包含完整短语或精确词组的结果，忽略词序变化。

#### 语法格式
```
"精确短语"
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 实现版本 | 备注 |
|---------|---------|---------|------|
| 百度 | ✅ 完全支持 | v1.0.0 | 严格匹配引号内内容 |
| Google | ✅ 完全支持 | v1.0.0 | 严格匹配引号内内容 |
| Bing | ✅ 完全支持 | v1.0.0 | 严格匹配引号内内容 |

#### 使用示例
```
"JavaScript is a programming language"
"人工智能的发展历程"
"React hooks 使用指南"
```

#### 实现细节
- **位置**: `src/services/adapters/baidu.ts:32-37`
- **位置**: `src/services/adapters/google.ts:32-37`
- **位置**: `src/services/adapters/bing.ts:32-37`
- **优先级**: 在搜索查询中优先处理
- **组合**: 可与关键词组合使用

#### 典型应用场景
1. 查找特定引文或名言
2. 搜索完整的产品名称
3. 定位精确的错误信息
4. 查找特定的技术术语

---

### 4. dateRange - 日期范围过滤 ✅

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐

#### 功能描述
限制搜索结果的发布日期范围。

#### 语法格式
```
各搜索引擎格式不同 (见下方)
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 语法格式 | 实现版本 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | `..2024-01-01` 或 `2024-01-01..` | v1.0.0 |
| Google | ✅ 支持 | `after:2024-01-01 before:2024-12-31` | v1.0.0 |
| Bing | ✅ 支持 | `daterange:20240101-20241231` 或 `after:/before:` | v1.0.0 |

#### 使用示例
```
# 百度
技术新闻 ..2024-12-31
React更新 2024-01-01..

# Google
AI发展 after:2024-01-01 before:2024-12-31
科技新闻 after:2024-01-01

# Bing
产品发布 after:2024-01-01
最新资讯 before:2024-12-31
```

#### 实现细节
- **百度实现**: `src/services/adapters/baidu.ts:80-96`
- **Google实现**: `src/services/adapters/google.ts:80-96`
- **Bing实现**: `src/services/adapters/bing.ts:80-96`
- **日期格式**: 自动转换为ISO 8601格式 (YYYY-MM-DD)
- **验证**: 检查日期有效性和逻辑关系

#### 典型应用场景
1. 查找最新的技术文章
2. 筛选特定时间段的新闻
3. 获取最近更新的文档
4. 历史事件资料查询

---

## 计划实现的搜索语法

### 5. intitle: - 标题搜索 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐⭐ (高优先级)

#### 功能描述
搜索网页标题中包含指定关键词的结果。

#### 语法格式
```
intitle:关键词
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | [百度搜索帮助](https://www.baidu.com/search/help.html) | ✅ 已验证 |
| Google | ✅ 支持 | [Google搜索操作符](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | [Bing搜索语法](https://support.microsoft.com/bing) | ✅ 已验证 |

#### 使用示例
```
intitle:React教程
intitle:产品说明书
intitle:API文档
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  inTitle?: string;  // 新增
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // 标题搜索
  if (params.inTitle && params.inTitle.trim()) {
    query += ` intitle:${params.inTitle.trim()}`
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 查找特定主题的文章
2. 筛选官方文档页面
3. 定位产品介绍页面
4. 精准查找教程

---

### 6. inurl: - URL搜索 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐⭐ (高优先级)

#### 功能描述
搜索URL中包含指定关键词的网页。

#### 语法格式
```
inurl:关键词
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | [百度搜索帮助](https://www.baidu.com/search/help.html) | ✅ 已验证 |
| Google | ✅ 支持 | [Google搜索操作符](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | [Bing搜索语法](https://support.microsoft.com/bing) | ✅ 已验证 |

#### 使用示例
```
inurl:blog
inurl:download
inurl:tutorial
inurl:products
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  inUrl?: string;  // 新增
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // URL搜索
  if (params.inUrl && params.inUrl.trim()) {
    query += ` inurl:${params.inUrl.trim()}`
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 查找博客文章
2. 定位下载页面
3. 筛选特定分类页面
4. 查找论坛讨论

---

### 7. - (减号) 排除关键词 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐⭐ (高优先级)

#### 功能描述
从搜索结果中排除包含指定关键词的页面。

#### 语法格式
```
-关键词
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | [百度搜索帮助](https://www.baidu.com/search/help.html) | ✅ 已验证 |
| Google | ✅ 支持 | [Google搜索操作符](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | [Bing搜索语法](https://support.microsoft.com/bing) | ✅ 已验证 |

#### 使用示例
```
JavaScript教程 -广告
React -Vue
Python -培训
手机 -二手
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  excludeWords?: string[];  // 新增：排除词数组
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // 排除关键词
  if (params.excludeWords && params.excludeWords.length > 0) {
    params.excludeWords.forEach(word => {
      if (word.trim()) {
        query += ` -${word.trim()}`
      }
    })
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 过滤广告和推广内容
2. 排除不相关的搜索结果
3. 精准筛选目标内容
4. 避免同名干扰

---

### 8. OR / | - 逻辑或 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐ (高优先级)

#### 功能描述
搜索包含任一关键词的结果，扩大搜索范围。

#### 语法格式
```
关键词1 OR 关键词2
关键词1 | 关键词2
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 支持符号 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | `OR` | ✅ 已验证 |
| Google | ✅ 支持 | `OR` 和 `\|` | ✅ 已验证 |
| Bing | ✅ 支持 | `OR` | ✅ 已验证 |

#### 使用示例
```
JavaScript OR TypeScript
前端开发 OR 前端工程师
React | Vue | Angular
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  orKeywords?: string[];  // 新增：OR关键词数组
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // OR逻辑
  if (params.orKeywords && params.orKeywords.length > 0) {
    const orQuery = params.orKeywords
      .filter(word => word.trim())
      .join(' OR ')
    if (orQuery) {
      query = `${query} OR ${orQuery}`
    }
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 搜索同义词或相关概念
2. 一次查询多个选项
3. 扩大搜索覆盖面
4. 查找备选方案

---

### 9. intext: / inbody: - 正文搜索 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐ (中优先级)

#### 功能描述
搜索网页正文内容中包含指定关键词的页面。

#### 语法格式
```
intext:关键词    # 百度/Google
inbody:关键词    # Bing
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 语法 | 验证状态 |
|---------|---------|-----|---------|
| 百度 | ✅ 支持 | `intext:` | ✅ 已验证 |
| Google | ✅ 支持 | `intext:` | ✅ 已验证 |
| Bing | ✅ 支持 | `inbody:` | ✅ 已验证 |

#### 使用示例
```
intext:API文档
intext:安装步骤
inbody:使用方法  # Bing
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  inText?: string;  // 新增
}

// 适配器实现 (需根据引擎区分)
// Baidu/Google
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  if (params.inText && params.inText.trim()) {
    query += ` intext:${params.inText.trim()}`
  }

  return query
}

// Bing
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  if (params.inText && params.inText.trim()) {
    query += ` inbody:${params.inText.trim()}`  // 使用inbody
  }

  return query
}
```

#### 典型应用场景
1. 查找内容详细的文章
2. 定位包含特定信息的页面
3. 过滤标题党内容
4. 深度搜索专业内容

---

### 10. .. (数字范围) 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐⭐ (中优先级)

#### 功能描述
搜索包含指定数字范围的结果。

#### 语法格式
```
数字1..数字2
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | - | ✅ 已验证 |
| Google | ✅ 支持 | [数字范围](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | - | ✅ 已验证 |

#### 使用示例
```
手机 2000..5000元
电影 2020..2024
笔记本 i5..i9
相机 1000..3000
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  numberRange?: {
    min: number;
    max: number;
  };  // 新增
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // 数字范围
  if (params.numberRange) {
    const { min, max } = params.numberRange
    if (min !== undefined && max !== undefined) {
      query += ` ${min}..${max}`
    }
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 价格区间搜索
2. 年份范围查询
3. 型号范围筛选
4. 数量区间过滤

---

### 11. * (通配符) 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐ (中优先级)

#### 功能描述
代替未知或任意词汇，用于模糊搜索。

#### 语法格式
```
关键词1 * 关键词2
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | - | ✅ 已验证 |
| Google | ✅ 支持 | [通配符](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | - | ✅ 已验证 |

#### 使用示例
```
"React is * framework"
"* 的工作原理"
"如何 * JavaScript"
```

#### 实现建议
```typescript
// 类型定义扩展
export interface SearchParams {
  // ... 现有字段
  wildcardQuery?: string;  // 新增：包含*的完整查询
}

// 适配器实现
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // 通配符查询 (通常作为完整查询使用)
  if (params.wildcardQuery && params.wildcardQuery.includes('*')) {
    query = params.wildcardQuery
  }

  // ... 其他语法
  return query
}
```

#### 典型应用场景
1. 补全未知词汇
2. 查找固定格式的内容
3. 模糊搜索
4. 探索相关表达

---

### 12. allintitle: - 所有关键词在标题 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐ (低优先级)

#### 功能描述
搜索标题中包含所有指定关键词的网页。

#### 语法格式
```
allintitle:关键词1 关键词2 关键词3
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | - | ✅ 已验证 |
| Google | ✅ 支持 | [allintitle](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ❌ 不支持 | - | ✅ 已验证 |

#### 使用示例
```
allintitle:Python 机器学习 教程
allintitle:React Redux 最佳实践
```

#### 实现建议
```typescript
// 仅为百度和Google实现
// Bing适配器不实现此功能
```

#### 典型应用场景
1. 精准查找包含完整主题的标题
2. 组合多个关键词搜索
3. 提高搜索精准度

---

### 13. related: - 相关网站 🔜

**状态**: 计划实现
**优先级**: ⭐⭐⭐ (低优先级)

#### 功能描述
查找与指定网站相关的其他网站。

#### 语法格式
```
related:域名
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ❌ 不支持 | - | ✅ 已验证 |
| Google | ✅ 支持 | [related](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ✅ 支持 | - | ✅ 已验证 |

#### 使用示例
```
related:github.com
related:stackoverflow.com
related:reddit.com
```

#### 实现建议
```typescript
// 仅为Google和Bing实现
// 百度适配器不实现此功能
```

#### 典型应用场景
1. 发现竞品网站
2. 查找相似资源
3. 拓展搜索范围
4. 行业调研

---

### 14. cache: - 网页缓存 🔜

**状态**: 计划实现
**优先级**: ⭐⭐ (低优先级)

#### 功能描述
查看搜索引擎保存的网页快照。

#### 语法格式
```
cache:网址
```

#### 引擎支持
| 搜索引擎 | 支持状态 | 官方文档 | 验证状态 |
|---------|---------|---------|---------|
| 百度 | ✅ 支持 | - | ✅ 已验证 |
| Google | ✅ 支持 | [cache](https://support.google.com/websearch/answer/2466433) | ✅ 已验证 |
| Bing | ❌ 不支持 | - | ✅ 已验证 |

#### 使用示例
```
cache:example.com
cache:https://www.example.com/page
```

#### 实现建议
```typescript
// 仅为百度和Google实现
// Bing适配器不实现此功能
```

#### 典型应用场景
1. 访问已删除的页面
2. 查看网页历史版本
3. 绕过访问限制
4. 内容对比分析

---

## 搜索引擎兼容性矩阵

### 完整兼容性对照表

| 搜索语法 | 百度 | Google | Bing | 实现状态 | 优先级 |
|---------|------|--------|------|---------|--------|
| `site:` | ✅ | ✅ | ✅ | ✅ 已实现 | ⭐⭐⭐⭐⭐ |
| `filetype:` | ✅ | ✅ | ✅ | ✅ 已实现 | ⭐⭐⭐⭐⭐ |
| `"..."` 精确匹配 | ✅ | ✅ | ✅ | ✅ 已实现 | ⭐⭐⭐⭐⭐ |
| 日期范围 | ✅ | ✅ | ✅ | ✅ 已实现 | ⭐⭐⭐⭐ |
| `intitle:` | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐⭐⭐ |
| `inurl:` | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐⭐⭐ |
| `-` 排除 | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐⭐⭐ |
| `OR` 逻辑或 | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐⭐ |
| `intext:` | ✅ | ✅ | ❌ | 🔜 计划 | ⭐⭐⭐⭐ |
| `inbody:` | ❌ | ❌ | ✅ | 🔜 计划 | ⭐⭐⭐⭐ |
| `..` 数字范围 | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐⭐ |
| `*` 通配符 | ✅ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐ |
| `allintitle:` | ✅ | ✅ | ❌ | 🔜 计划 | ⭐⭐⭐ |
| `related:` | ❌ | ✅ | ✅ | 🔜 计划 | ⭐⭐⭐ |
| `cache:` | ✅ | ✅ | ❌ | 🔜 计划 | ⭐⭐ |

### 引擎特性总结

#### 百度搜索
- **支持语法数**: 11/15
- **特有优势**: 中文搜索优化、本地化支持
- **不支持**: `related:`, `inbody:`
- **实现注意**: 日期格式为 `..YYYY-MM-DD` 或 `YYYY-MM-DD..`

#### Google搜索
- **支持语法数**: 13/15
- **特有优势**: 语法最全面、国际化最好
- **不支持**: `inbody:` (使用 `intext:` 替代)
- **实现注意**: 日期格式为 `after:` 和 `before:`

#### Bing搜索
- **支持语法数**: 10/15
- **特有优势**: 与Microsoft生态集成
- **不支持**: `allintitle:`, `cache:`, `intext:` (使用 `inbody:` 替代)
- **实现注意**: 日期格式支持 `daterange:` 或 `after:/before:`

---

## 使用示例

### 基础组合示例

#### 示例 1: 在指定网站搜索PDF文档
```
搜索关键词: React教程
网站: github.com
文件类型: pdf

生成查询:
- 百度: React教程 site:github.com filetype:pdf
- Google: React教程 site:github.com filetype:pdf
- Bing: React教程 site:github.com filetype:pdf
```

#### 示例 2: 精确匹配 + 排除关键词
```
精确匹配: "JavaScript基础"
关键词: 教程
排除: 培训, 广告

生成查询:
- 百度: "JavaScript基础" 教程 -培训 -广告
- Google: "JavaScript基础" 教程 -培训 -广告
- Bing: "JavaScript基础" 教程 -培训 -广告
```

#### 示例 3: 标题搜索 + 日期范围
```
标题关键词: API文档
日期范围: 2024-01-01 到 2024-12-31

生成查询:
- 百度: intitle:API文档 2024-01-01..2024-12-31
- Google: intitle:API文档 after:2024-01-01 before:2024-12-31
- Bing: intitle:API文档 after:2024-01-01 before:2024-12-31
```

### 高级组合示例

#### 示例 4: 多语法复杂组合
```
关键词: Python
精确匹配: "机器学习入门"
网站: github.com
文件类型: pdf
标题关键词: tutorial
排除: tensorflow, pytorch

生成查询:
- 百度: "机器学习入门" Python site:github.com filetype:pdf intitle:tutorial -tensorflow -pytorch
- Google: "机器学习入门" Python site:github.com filetype:pdf intitle:tutorial -tensorflow -pytorch
- Bing: "机器学习入门" Python site:github.com filetype:pdf intitle:tutorial -tensorflow -pytorch
```

#### 示例 5: OR逻辑 + 价格区间
```
关键词: 手机
OR关键词: iPhone, 三星, 华为
数字范围: 2000-5000

生成查询:
- 百度: 手机 (iPhone OR 三星 OR 华为) 2000..5000
- Google: 手机 (iPhone OR 三星 OR 华为) 2000..5000
- Bing: 手机 (iPhone OR 三星 OR 华为) 2000..5000
```

---

## 最佳实践

### 语法使用原则

#### 1. 简单优先原则
- ✅ 优先使用基础语法组合
- ✅ 避免过度复杂的查询
- ❌ 不要一次使用超过4个语法

#### 2. 引擎适配原则
- ✅ 根据目标引擎选择支持的语法
- ✅ 为不同引擎提供降级方案
- ✅ 显示语法兼容性提示

#### 3. 用户友好原则
- ✅ 提供实时预览
- ✅ 智能验证输入
- ✅ 给出优化建议

### 性能优化建议

#### 1. 查询构建优化
```typescript
// ✅ 推荐: 按优先级组织语法
private buildSearchQuery(params: SearchParams): string {
  let query = params.keyword.trim()

  // 1. 精确匹配 (最高优先级)
  if (params.exactMatch) {
    query = `"${params.exactMatch}" ${query}`
  }

  // 2. 限定性语法 (site, filetype)
  if (params.site) query += ` site:${params.site}`
  if (params.fileType) query += ` filetype:${params.fileType}`

  // 3. 范围性语法 (日期, 数字)
  if (params.dateRange) query += ` ${this.buildDateFilter(params.dateRange)}`

  // 4. 辅助性语法 (intitle, inurl)
  if (params.inTitle) query += ` intitle:${params.inTitle}`

  return query
}
```

#### 2. 验证优化
```typescript
// ✅ 推荐: 早期验证，减少无效查询
validateParams(params: SearchParams): ValidationResult {
  // 基础验证
  if (!params.keyword && !params.exactMatch) {
    return { isValid: false, errors: ['请输入搜索关键词'] }
  }

  // 语法数量检查
  const syntaxCount = this.countActiveSyntax(params)
  if (syntaxCount > 4) {
    return {
      isValid: true,
      warnings: ['搜索条件过多，可能导致结果过少']
    }
  }

  return { isValid: true, errors: [], warnings: [] }
}
```

### 错误处理

#### 1. 语法不兼容处理
```typescript
// 示例: Bing不支持allintitle，需要降级
if (params.allInTitle && this.engine === 'bing') {
  // 降级为多个intitle
  const keywords = params.allInTitle.split(' ')
  keywords.forEach(keyword => {
    query += ` intitle:${keyword}`
  })
}
```

#### 2. 输入验证
```typescript
// 域名验证
private isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

// 日期验证
private isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}
```

---

## 技术实现参考

### 类型定义扩展

```typescript
// src/types/index.ts

// 扩展 SyntaxType
export type SyntaxType =
  // 已实现
  | 'site'
  | 'filetype'
  | 'exact'
  | 'date_range'
  // 计划实现
  | 'intitle'
  | 'inurl'
  | 'exclude'
  | 'or'
  | 'intext'
  | 'number_range'
  | 'wildcard'
  | 'allintitle'
  | 'related'
  | 'cache';

// 扩展 SearchParams
export interface SearchParams {
  keyword: string;
  engine: SearchEngine;

  // 已实现的字段
  site?: string;
  fileType?: string;
  exactMatch?: string;
  dateRange?: {
    from: string;
    to: string;
  };

  // 新增字段
  inTitle?: string;
  inUrl?: string;
  excludeWords?: string[];
  orKeywords?: string[];
  inText?: string;
  numberRange?: {
    min: number;
    max: number;
  };
  wildcardQuery?: string;
  allInTitle?: string;
  relatedSite?: string;
  cacheSite?: string;
}
```

### 适配器接口扩展

```typescript
// src/services/adapters/index.ts

export interface SearchEngineAdapter {
  // 基础方法
  buildQuery(params: SearchParams): string;
  validateSyntax(syntax: SyntaxType): boolean;
  getSupportedSyntax(): SyntaxType[];
  getBaseUrl(): string;
  getName(): string;

  // 扩展方法
  validateParams?(params: SearchParams): ValidationResult;
  getSearchSuggestions?(params: SearchParams): string[];

  // 新增: 语法兼容性检查
  isSyntaxSupported?(syntax: SyntaxType): boolean;

  // 新增: 语法降级处理
  degradeSyntax?(params: SearchParams): SearchParams;
}
```

### UI组件建议

```typescript
// 新增语法输入组件示例

interface AdvancedSyntaxProps {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  engine: SearchEngine;
}

export function AdvancedSyntax({ params, onChange, engine }: AdvancedSyntaxProps) {
  return (
    <div className="advanced-syntax">
      {/* 标题搜索 */}
      <div className="syntax-group">
        <label>标题包含</label>
        <input
          type="text"
          value={params.inTitle || ''}
          onChange={(e) => onChange({ ...params, inTitle: e.target.value })}
          placeholder="intitle:关键词"
        />
      </div>

      {/* URL搜索 */}
      <div className="syntax-group">
        <label>URL包含</label>
        <input
          type="text"
          value={params.inUrl || ''}
          onChange={(e) => onChange({ ...params, inUrl: e.target.value })}
          placeholder="inurl:关键词"
        />
      </div>

      {/* 排除关键词 */}
      <div className="syntax-group">
        <label>排除关键词</label>
        <TagInput
          tags={params.excludeWords || []}
          onChange={(tags) => onChange({ ...params, excludeWords: tags })}
          placeholder="-关键词"
        />
      </div>

      {/* OR逻辑 */}
      <div className="syntax-group">
        <label>任一关键词 (OR)</label>
        <TagInput
          tags={params.orKeywords || []}
          onChange={(tags) => onChange({ ...params, orKeywords: tags })}
          placeholder="关键词1 OR 关键词2"
        />
      </div>
    </div>
  )
}
```

---

## 参考资源

### 官方文档

#### 百度搜索
- [百度搜索帮助中心](https://www.baidu.com/search/help.html)
- [百度高级搜索](https://www.baidu.com/gaoji/advanced.html)

#### Google搜索
- [Google搜索操作符](https://support.google.com/websearch/answer/2466433)
- [Google高级搜索](https://www.google.com/advanced_search)
- [Search operators you can use with Google](https://support.google.com/websearch/answer/2466433)

#### Bing搜索
- [Bing搜索帮助](https://support.microsoft.com/en-us/topic/advanced-search-options-b92e25f1-0085-4271-bdf9-14aaea720930)
- [Bing高级搜索操作符](https://help.bing.microsoft.com/#apex/18/en-us/10002)

### 技术参考

#### 项目文件位置
- 类型定义: `src/types/index.ts`
- 百度适配器: `src/services/adapters/baidu.ts`
- Google适配器: `src/services/adapters/google.ts`
- Bing适配器: `src/services/adapters/bing.ts`
- 适配器工厂: `src/services/adapters/factory.ts`

#### 相关测试
- 适配器测试: `tests/adapters/*.test.ts`
- 集成测试: `tests/integration/*.test.ts`
- E2E测试: `tests/e2e/*.spec.ts`

---

## 版本历史

### v1.1.0 (计划中)
- 🔜 新增 `intitle:` 标题搜索
- 🔜 新增 `inurl:` URL搜索
- 🔜 新增 `-` 排除关键词
- 🔜 新增 `OR` 逻辑或
- 🔜 新增 `intext:/inbody:` 正文搜索
- 🔜 新增 `..` 数字范围
- 🔜 新增 `*` 通配符

### v1.0.0 (已发布 - 2025-11-06)
- ✅ 支持 `site:` 网站内搜索
- ✅ 支持 `filetype:` 文件类型搜索
- ✅ 支持 `"..."` 精确匹配
- ✅ 支持日期范围过滤
- ✅ 支持百度、Google、Bing三大搜索引擎
- ✅ 智能验证和建议系统

---

## 贡献指南

欢迎贡献新的搜索语法支持！

### 添加新语法的步骤

1. **更新类型定义** (`src/types/index.ts`)
   - 添加新的 `SyntaxType`
   - 扩展 `SearchParams` 接口

2. **更新适配器** (`src/services/adapters/*.ts`)
   - 实现 `buildQuery` 中的新语法
   - 添加到 `getSupportedSyntax` 返回值
   - 实现 `validateParams` 验证逻辑

3. **添加测试**
   - 单元测试: `tests/adapters/*.test.ts`
   - 集成测试: `tests/integration/*.test.ts`

4. **更新UI组件**
   - 添加新的输入控件
   - 更新表单验证
   - 添加实时预览

5. **更新文档**
   - 本文档: `docs/SEARCH_SYNTAX_GUIDE.md`
   - README: `README.md`
   - 变更日志: `CHANGELOG.md`

---

## 许可证

本文档是 SearchSyntax Pro 项目的一部分，遵循 MIT 许可证。

---

**最后更新**: 2025-11-08
**维护者**: SearchSyntax Pro 开发团队
**联系方式**: lhlyzh@qq.com
