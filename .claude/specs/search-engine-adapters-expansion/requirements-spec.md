# Technical Specification - Search Engine Adapters Expansion

**Project**: SearchSyntax Pro v1.8.1
**Feature**: 新增 7 个搜索引擎适配器支持
**Document Version**: 1.0
**Created**: 2025-11-26
**Status**: Ready for Implementation

---

## 1. Problem Statement

### Business Issue
SearchSyntax Pro 当前仅支持 10 个搜索引擎,缺乏对多个主流搜索引擎的支持,限制了用户在特定市场和隐私友好搜索场景下的选择。

### Current State
- 已支持引擎: Baidu, Google, Bing, DuckDuckGo, Brave, Yandex, Twitter, Reddit, GitHub, Stack Overflow
- 缺失引擎: Yahoo, Startpage, Ecosia, Qwant, Naver, Sogou, 360搜索
- 用户无法使用这些搜索引擎的高级语法功能

### Expected Outcome
添加 7 个新搜索引擎适配器,所有语法支持与官方搜索引擎能力保持一致,提供完整的中英文国际化支持。

---

## 2. Solution Overview

### Approach
采用现有适配器模式,通过复用 Google/Bing/Baidu 适配器逻辑,实现 7 个新搜索引擎的适配器。分三个阶段实施,优先兼容性引擎,再处理区域市场引擎。

### Core Changes
1. **适配器实现**: 创建 7 个新的适配器类文件
2. **类型定义**: 扩展 `SearchEngine` 类型
3. **工厂注册**: 在 factory.ts 注册新适配器
4. **国际化**: 添加引擎名称和验证消息翻译
5. **测试**: 为核心逻辑编写单元测试

### Success Criteria
- 所有 7 个引擎可正常构建查询 URL
- 语法支持与官方文档一致
- 多关键词 OR 组合在支持的引擎中正常工作
- 语法降级正确处理不支持的语法
- 所有用户可见文本有中英文翻译
- 核心逻辑单元测试通过

---

## 3. Technical Implementation

### 3.1 Database Changes
**无数据库变更** - 仅使用 Chrome Storage API

### 3.2 Code Changes

#### Phase 1: 兼容性引擎 (3个)

##### 3.2.1 Yahoo Search Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/yahoo.ts`

**实现规格**:
```typescript
/**
 * Yahoo 搜索引擎适配器
 * 基于 Bing 语法兼容性实现
 */
export class YahooAdapter implements SearchEngineAdapter {
  getName(): string {
    return '雅虎' // 将通过 i18n 翻译
  }

  getBaseUrl(): string {
    return 'https://search.yahoo.com/search'
  }

  // 查询参数格式: ?p={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?p=${encodeURIComponent(query)}`
  }

  // 支持的语法 (与 Bing 相同)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'date_range',
      'intitle',
      'inurl',
      'exclude',
      'or',
      'intext',  // Yahoo 使用 inbody:
      'number_range',
      'wildcard',
      'allintitle',  // 降级为多个 intitle
      'related'
      // 不支持 'cache'
    ]
  }

  // 多关键词支持 (与 Bing 一致)
  // - sites: 支持 OR 组合
  // - fileTypes: 支持 OR 组合
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    if (params.cacheSite) {
      console.warn('Yahoo不支持cache语法,该参数将被忽略')
      degradedParams.cacheSite = undefined
    }
    return degradedParams
  }

  // UI 功能特性
  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype', 'intitle', 'inurl', 'intext',
      'exact_match', 'exclude', 'or_keywords',
      'date_range', 'related'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle', 'inurl', 'intext'],
      precision: ['exact_match'],
      logic: ['exclude', 'or_keywords'],
      range: ['date_range'],
      special: ['related']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://search.yahoo.com/search`
- **查询参数**: `?p=` (区别于 Google 的 `?q=`)
- **语法处理**: 完全复用 BingAdapter 的 buildSearchQuery 逻辑
- **intext 映射**: 使用 `inbody:` (与 Bing 一致)
- **allintitle 降级**: 转换为多个 `intitle:` (与 Bing 一致)
- **cache 降级**: 设为 undefined 并记录警告

##### 3.2.2 Startpage Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/startpage.ts`

**实现规格**:
```typescript
/**
 * Startpage 搜索引擎适配器
 * 基于 Google 语法兼容性实现 (隐私友好)
 */
export class StartpageAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Startpage'
  }

  getBaseUrl(): string {
    return 'https://www.startpage.com/sp/search'
  }

  // 查询参数格式: ?query={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?query=${encodeURIComponent(query)}`
  }

  // 支持的语法 (Google 子集)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'date_range',  // before:/after:
      'intitle',
      'exclude',
      'or'
      // 不支持: inurl, intext, wildcard, allintitle, related, cache, number_range
    ]
  }

  // 多关键词支持 (与 Google 一致)
  // - sites: 支持 OR 组合
  // - fileTypes: 支持 OR 组合
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // Startpage 不支持的语法直接忽略
    if (params.inUrl) {
      degradedParams.inUrl = undefined
      warnings.push('Startpage不支持inurl语法')
    }
    if (params.inText) {
      degradedParams.inText = undefined
      warnings.push('Startpage不支持intext语法')
    }
    if (params.wildcardQuery) {
      degradedParams.wildcardQuery = undefined
      warnings.push('Startpage不支持通配符语法')
    }
    if (params.allInTitle) {
      degradedParams.allInTitle = undefined
      warnings.push('Startpage不支持allintitle语法')
    }
    if (params.relatedSite) {
      degradedParams.relatedSite = undefined
      warnings.push('Startpage不支持related语法')
    }
    if (params.cacheSite) {
      degradedParams.cacheSite = undefined
      warnings.push('Startpage不支持cache语法')
    }
    if (params.numberRange) {
      degradedParams.numberRange = undefined
      warnings.push('Startpage不支持数字范围语法')
    }

    if (warnings.length > 0) {
      console.warn(`[Startpage] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  // 日期格式: before:YYYY-MM-DD after:YYYY-MM-DD (与 Google 一致)
  private buildDateFilter(dateRange: { from: string; to: string }): string {
    const { from, to } = dateRange
    if (from && to) {
      return `after:${this.formatDate(from)} before:${this.formatDate(to)}`
    } else if (from) {
      return `after:${this.formatDate(from)}`
    } else if (to) {
      return `before:${this.formatDate(to)}`
    }
    return ''
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype', 'intitle',
      'exact_match', 'exclude', 'or_keywords',
      'date_range'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle'],
      precision: ['exact_match'],
      logic: ['exclude', 'or_keywords'],
      range: ['date_range']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://www.startpage.com/sp/search`
- **查询参数**: `?query=` (注意不是 `?q=`)
- **语法处理**: 复用 GoogleAdapter 核心逻辑,但过滤不支持的语法
- **日期格式**: `before:` / `after:` (与 Google 一致)
- **语法降级**: 大量不支持语法需要降级处理

##### 3.2.3 Ecosia Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/ecosia.ts`

**实现规格**:
```typescript
/**
 * Ecosia 搜索引擎适配器
 * 基于 Google/Bing 混合语法实现 (环保搜索)
 */
export class EcosiaAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Ecosia'
  }

  getBaseUrl(): string {
    return 'https://www.ecosia.org/search'
  }

  // 查询参数格式: ?q={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
  }

  // 支持的语法 (Google/Bing 基础子集)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'exclude',
      'or'
      // 官方文档仅明确支持这些基础操作符
      // 不支持: date_range, intitle, inurl, intext 等高级语法
    ]
  }

  // 多关键词支持 (与 Google/Bing 一致)
  // - sites: 支持 OR 组合
  // - fileTypes: 支持 OR 组合
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // Ecosia 仅支持基础语法
    const unsupportedFields = [
      'dateRange', 'inTitle', 'inUrl', 'inText', 'allInTitle',
      'numberRange', 'wildcardQuery', 'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field as keyof SearchParams]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`Ecosia不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[Ecosia] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype',
      'exact_match', 'exclude', 'or_keywords'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype'],
      precision: ['exact_match'],
      logic: ['exclude', 'or_keywords']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://www.ecosia.org/search`
- **查询参数**: `?q=`
- **语法处理**: 仅实现基础语法 (site, filetype, exact, exclude, OR)
- **语法降级**: 大量高级语法不支持,需要全部降级

#### Phase 2: 区域市场引擎 (3个)

##### 3.2.4 Naver Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/naver.ts`

**实现规格**:
```typescript
/**
 * Naver 搜索引擎适配器
 * 韩国市场第一大搜索引擎
 */
export class NaverAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Naver' // 不翻译为韩语,仅中英文
  }

  getBaseUrl(): string {
    return 'https://search.naver.com/search.naver'
  }

  // 查询参数格式: ?query={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?query=${encodeURIComponent(query)}`
  }

  // 支持的语法 (基础子集)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'exclude'
      // Naver 官方文档支持有限,不支持 OR, intitle, inurl 等高级语法
    ]
  }

  // 多关键词支持 (有限)
  // - sites: 不支持 OR 组合 (单个 site: 仅)
  // - fileTypes: 支持基础文件类型 (pdf, doc, xls, ppt, hwp)
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // Naver 不支持多站点 OR 组合
    if (params.sites && params.sites.length > 1) {
      degradedParams.sites = [params.sites[0]] // 仅保留第一个
      warnings.push('Naver不支持多站点OR组合,仅使用第一个站点')
    }

    // Naver 不支持多文件类型 OR 组合
    if (params.fileTypes && params.fileTypes.length > 1) {
      degradedParams.fileTypes = [params.fileTypes[0]]
      warnings.push('Naver不支持多文件类型OR组合,仅使用第一个类型')
    }

    // 不支持的高级语法
    const unsupportedFields = [
      'orKeywords', 'dateRange', 'inTitle', 'inUrl', 'inText',
      'allInTitle', 'numberRange', 'wildcardQuery', 'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field as keyof SearchParams]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`Naver不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[Naver] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  // 文件类型支持: pdf, doc, xls, ppt, hwp (韩国 Hancom 文档格式)
  private getSupportedFileTypes(): string[] {
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'hwp']
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype',
      'exact_match', 'exclude'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype'],
      precision: ['exact_match'],
      logic: ['exclude']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://search.naver.com/search.naver`
- **查询参数**: `?query=`
- **语法处理**: 仅基础语法,不支持 OR 组合
- **特殊文件类型**: 支持韩国 HWP 格式 (Hancom Office)
- **多关键词限制**: 不支持 OR 组合,降级为单个

##### 3.2.5 Sogou Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/sogou.ts`

**实现规格**:
```typescript
/**
 * Sogou 搜索引擎适配器
 * 中国第二大搜索引擎
 */
export class SogouAdapter implements SearchEngineAdapter {
  getName(): string {
    return '搜狗'
  }

  getBaseUrl(): string {
    return 'https://www.sogou.com/web'
  }

  // 查询参数格式: ?query={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?query=${encodeURIComponent(query)}`
  }

  // 支持的语法 (参考 Baidu,部分支持)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'intitle',
      'inurl',
      'exclude',
      'or'
      // 不支持: date_range, intext, allintitle, number_range, wildcard, related, cache
    ]
  }

  // 多关键词支持 (部分支持)
  // - sites: 支持 OR 组合
  // - fileTypes: 支持 OR 组合 (pdf, doc, xls, ppt, txt)
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // Sogou 不支持的语法
    const unsupportedFields = [
      'dateRange', 'inText', 'allInTitle', 'numberRange',
      'wildcardQuery', 'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field as keyof SearchParams]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`Sogou不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[Sogou] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  // 文件类型支持: pdf, doc, docx, xls, xlsx, ppt, pptx, txt
  private getSupportedFileTypes(): string[] {
    return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt']
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype', 'intitle', 'inurl',
      'exact_match', 'exclude', 'or_keywords'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle', 'inurl'],
      precision: ['exact_match'],
      logic: ['exclude', 'or_keywords']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://www.sogou.com/web`
- **查询参数**: `?query=`
- **语法处理**: 参考 BaiduAdapter,支持中等复杂度语法
- **中文优化**: 支持中文分词和拼音搜索 (引擎内部处理)
- **多关键词支持**: 支持 OR 组合

##### 3.2.6 360 Search Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/so360.ts`

**实现规格**:
```typescript
/**
 * 360搜索引擎适配器
 * 中国市场第三大搜索引擎
 */
export class So360Adapter implements SearchEngineAdapter {
  getName(): string {
    return '360搜索'
  }

  getBaseUrl(): string {
    return 'https://www.so.com/s'
  }

  // 查询参数格式: ?q={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
  }

  // 支持的语法 (基础子集)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact',
      'intitle',
      'exclude'
      // 不支持: OR, inurl, intext, date_range 等高级语法
    ]
  }

  // 多关键词支持 (有限)
  // - sites: 不支持 OR 组合
  // - fileTypes: 不支持 OR 组合
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // 360搜索 不支持多站点 OR 组合
    if (params.sites && params.sites.length > 1) {
      degradedParams.sites = [params.sites[0]]
      warnings.push('360搜索不支持多站点OR组合,仅使用第一个站点')
    }

    // 360搜索 不支持多文件类型 OR 组合
    if (params.fileTypes && params.fileTypes.length > 1) {
      degradedParams.fileTypes = [params.fileTypes[0]]
      warnings.push('360搜索不支持多文件类型OR组合,仅使用第一个类型')
    }

    // 不支持的高级语法
    const unsupportedFields = [
      'orKeywords', 'dateRange', 'inUrl', 'inText', 'allInTitle',
      'numberRange', 'wildcardQuery', 'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field as keyof SearchParams]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`360搜索不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[360搜索] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype', 'intitle',
      'exact_match', 'exclude'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle'],
      precision: ['exact_match'],
      logic: ['exclude']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://www.so.com/s`
- **查询参数**: `?q=`
- **语法处理**: 基础语法支持,类似 Naver
- **多关键词限制**: 不支持 OR 组合,降级为单个
- **中文优化**: 支持中文内容优化 (引擎内部处理)

#### Phase 3: 欧洲市场引擎 (1个)

##### 3.2.7 Qwant Adapter

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/qwant.ts`

**实现规格**:
```typescript
/**
 * Qwant 搜索引擎适配器
 * 法国隐私友好搜索引擎
 */
export class QwantAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Qwant'
  }

  getBaseUrl(): string {
    return 'https://www.qwant.com/'
  }

  // 查询参数格式: ?q={query}
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
  }

  // 支持的语法 (基础子集)
  getSupportedSyntax(): SyntaxType[] {
    return [
      'site',
      'filetype',
      'exact'
      // Qwant 官方文档显示支持极其有限
      // 不支持: exclude, OR 及所有高级语法
    ]
  }

  // 多关键词支持 (不支持)
  // - sites: 不支持 OR 组合
  // - fileTypes: 不支持 OR 组合
  // - exactMatches: 原生并列支持

  // 语法降级
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }
    const warnings: string[] = []

    // Qwant 不支持多站点 OR 组合
    if (params.sites && params.sites.length > 1) {
      degradedParams.sites = [params.sites[0]]
      warnings.push('Qwant不支持多站点OR组合,仅使用第一个站点')
    }

    // Qwant 不支持多文件类型 OR 组合
    if (params.fileTypes && params.fileTypes.length > 1) {
      degradedParams.fileTypes = [params.fileTypes[0]]
      warnings.push('Qwant不支持多文件类型OR组合,仅使用第一个类型')
    }

    // 不支持的所有高级语法
    const unsupportedFields = [
      'excludeWords', 'orKeywords', 'dateRange', 'inTitle', 'inUrl',
      'inText', 'allInTitle', 'numberRange', 'wildcardQuery',
      'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field as keyof SearchParams]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`Qwant不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[Qwant] 语法降级:`, warnings.join('; '))
    }

    return degradedParams
  }

  getSupportedFeatures(): UIFeatureType[] {
    return [
      'site', 'filetype',
      'exact_match'
    ]
  }

  getFeatureGroups(): EngineFeatureGroups {
    return {
      location: ['site', 'filetype'],
      precision: ['exact_match']
    }
  }
}
```

**关键实现细节**:
- **baseUrl**: `https://www.qwant.com/`
- **查询参数**: `?q=`
- **语法处理**: 最小语法支持 (仅 site, filetype, exact)
- **多关键词限制**: 不支持 OR 组合
- **Qwick 快捷方式**: 可选实现 (如 !w Wikipedia),暂不实现

### 3.3 Type Definitions

**文件路径**: `/Users/lhly/chromeex/ssp/src/types/index.ts`

**修改内容**:
```typescript
// 第 2 行,修改 SearchEngine 类型定义
export type SearchEngine =
  | 'baidu'
  | 'google'
  | 'bing'
  | 'twitter'
  | 'duckduckgo'
  | 'brave'
  | 'yandex'
  | 'reddit'
  | 'github'
  | 'stackoverflow'
  // 🔥 新增 7 个搜索引擎
  | 'yahoo'
  | 'startpage'
  | 'ecosia'
  | 'qwant'
  | 'naver'
  | 'sogou'
  | 'so360';
```

### 3.4 Factory Registration

**文件路径**: `/Users/lhly/chromeex/ssp/src/services/adapters/factory.ts`

**修改内容**:

1. **Import 语句** (第 1-11 行后新增):
```typescript
import { YahooAdapter } from './yahoo'
import { StartpageAdapter } from './startpage'
import { EcosiaAdapter } from './ecosia'
import { QwantAdapter } from './qwant'
import { NaverAdapter } from './naver'
import { SogouAdapter } from './sogou'
import { So360Adapter } from './so360'
```

2. **createAdapter 方法** (第 39-63 行,switch case 新增):
```typescript
private static createAdapter(engine: SearchEngine): SearchEngineAdapter {
  switch (engine) {
    // 现有引擎 ...
    case 'stackoverflow':
      return new StackOverflowAdapter()

    // 🔥 新增 7 个引擎适配器
    case 'yahoo':
      return new YahooAdapter()
    case 'startpage':
      return new StartpageAdapter()
    case 'ecosia':
      return new EcosiaAdapter()
    case 'qwant':
      return new QwantAdapter()
    case 'naver':
      return new NaverAdapter()
    case 'sogou':
      return new SogouAdapter()
    case 'so360':
      return new So360Adapter()

    default:
      throw new Error(`不支持的搜索引擎: ${engine}`)
  }
}
```

3. **getSupportedEngines 方法** (第 69-71 行,数组新增):
```typescript
static getSupportedEngines(): SearchEngine[] {
  return [
    'baidu', 'google', 'bing', 'twitter', 'duckduckgo',
    'brave', 'yandex', 'reddit', 'github', 'stackoverflow',
    // 🔥 新增 7 个引擎
    'yahoo', 'startpage', 'ecosia', 'qwant',
    'naver', 'sogou', 'so360'
  ]
}
```

### 3.5 Internationalization (i18n)

**文件路径**: `/Users/lhly/chromeex/ssp/src/i18n/translations.ts`

**修改内容** (在第 16 行后新增):

#### 3.5.1 引擎名称翻译

```typescript
const translations: Record<Language, Record<string, string>> = {
  'zh-CN': {
    // 现有引擎 ...
    'common.searchEngines.stackoverflow': 'Stack Overflow',

    // 🔥 新增 7 个引擎名称 (中文)
    'common.searchEngines.yahoo': 'Yahoo搜索',
    'common.searchEngines.startpage': 'Startpage',
    'common.searchEngines.ecosia': 'Ecosia',
    'common.searchEngines.qwant': 'Qwant',
    'common.searchEngines.naver': 'Naver',
    'common.searchEngines.sogou': '搜狗',
    'common.searchEngines.so360': '360搜索',

    // 其余翻译 ...
  },
  'en-US': {
    // 现有引擎 ...
    'common.searchEngines.stackoverflow': 'Stack Overflow',

    // 🔥 新增 7 个引擎名称 (英文)
    'common.searchEngines.yahoo': 'Yahoo Search',
    'common.searchEngines.startpage': 'Startpage',
    'common.searchEngines.ecosia': 'Ecosia',
    'common.searchEngines.qwant': 'Qwant',
    'common.searchEngines.naver': 'Naver',
    'common.searchEngines.sogou': 'Sogou',
    'common.searchEngines.so360': '360 Search',

    // 其余翻译 ...
  }
}
```

#### 3.5.2 验证消息翻译

**新增翻译键** (在适当位置添加):

```typescript
'zh-CN': {
  // ... 现有翻译 ...

  // 🔥 新增适配器验证消息
  'adapter.validation.unsupportedSyntax': '{engine}不支持{syntax}语法,该参数将被忽略',
  'adapter.validation.unsupportedMultiKeyword': '{engine}不支持多关键词OR组合,仅使用第一个',
  'adapter.validation.syntaxDegraded': '{engine}不支持部分高级语法,已自动降级',
  'adapter.validation.queryLengthExceeded': '查询长度超过{engine}的限制({max}字符)',

  // ... 其余翻译 ...
},
'en-US': {
  // ... 现有翻译 ...

  // 🔥 新增适配器验证消息
  'adapter.validation.unsupportedSyntax': '{engine} does not support {syntax} syntax, parameter ignored',
  'adapter.validation.unsupportedMultiKeyword': '{engine} does not support multi-keyword OR combination, using first one only',
  'adapter.validation.syntaxDegraded': '{engine} does not support some advanced syntax, automatically degraded',
  'adapter.validation.queryLengthExceeded': 'Query length exceeds {engine} limit ({max} characters)',

  // ... 其余翻译 ...
}
```

### 3.6 Configuration Changes

**无需配置文件修改** - 所有配置通过代码硬编码

### 3.7 Query Length Limits

**统一查询长度限制** (在各适配器的 validateParams 方法中):

```typescript
// 所有引擎统一使用 180 字符限制 (最保守策略)
const MAX_QUERY_LENGTH = 180

async validateParams(params: SearchParams): Promise<ValidationResult> {
  const warnings: string[] = []
  const language = await getCurrentLanguage()
  const t = (key: string, vars?) => translate(language, key, vars)

  const fullQuery = this.buildSearchQuery(params)
  if (fullQuery.length > MAX_QUERY_LENGTH) {
    warnings.push(
      t('adapter.validation.queryLengthExceeded', {
        engine: this.getName(),
        max: MAX_QUERY_LENGTH.toString()
      })
    )
  }

  return { isValid: true, warnings }
}
```

---

## 4. Implementation Sequence

### Phase 1: 兼容性引擎 (预计 2-3 小时)

#### Step 1.1: Yahoo Adapter 实现
- [ ] 创建 `/src/services/adapters/yahoo.ts`
- [ ] 复用 BingAdapter 核心逻辑
- [ ] 修改 baseUrl 为 `https://search.yahoo.com/search`
- [ ] 修改查询参数为 `?p=`
- [ ] 实现 degradeSyntax (处理 cache)
- [ ] 创建 `/src/services/adapters/yahoo.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 1.2: Startpage Adapter 实现
- [ ] 创建 `/src/services/adapters/startpage.ts`
- [ ] 复用 GoogleAdapter 核心逻辑
- [ ] 修改 baseUrl 为 `https://www.startpage.com/sp/search`
- [ ] 修改查询参数为 `?query=`
- [ ] 实现 degradeSyntax (处理多个不支持语法)
- [ ] 创建 `/src/services/adapters/startpage.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 1.3: Ecosia Adapter 实现
- [ ] 创建 `/src/services/adapters/ecosia.ts`
- [ ] 实现基础语法支持 (site, filetype, exact, exclude, OR)
- [ ] 修改 baseUrl 为 `https://www.ecosia.org/search`
- [ ] 实现 degradeSyntax (处理所有高级语法)
- [ ] 创建 `/src/services/adapters/ecosia.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 1.4: Phase 1 集成
- [ ] 更新 `src/types/index.ts` (添加 yahoo, startpage, ecosia)
- [ ] 更新 `src/services/adapters/factory.ts` (注册 3 个适配器)
- [ ] 更新 `src/i18n/translations.ts` (添加引擎名称翻译)
- [ ] 手动测试 3 个引擎的搜索功能
- [ ] 验证语法降级警告正确显示

### Phase 2: 区域市场引擎 (预计 3-4 小时)

#### Step 2.1: Naver Adapter 实现
- [ ] 创建 `/src/services/adapters/naver.ts`
- [ ] 实现基础语法 (site, filetype, exact, exclude)
- [ ] 修改 baseUrl 为 `https://search.naver.com/search.naver`
- [ ] 实现 degradeSyntax (禁用 OR 组合,处理高级语法)
- [ ] 添加 HWP 文件类型支持
- [ ] 创建 `/src/services/adapters/naver.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 2.2: Sogou Adapter 实现
- [ ] 创建 `/src/services/adapters/sogou.ts`
- [ ] 参考 BaiduAdapter,实现中等复杂度语法
- [ ] 修改 baseUrl 为 `https://www.sogou.com/web`
- [ ] 修改查询参数为 `?query=`
- [ ] 实现 degradeSyntax (处理不支持的高级语法)
- [ ] 创建 `/src/services/adapters/sogou.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 2.3: 360 Search Adapter 实现
- [ ] 创建 `/src/services/adapters/so360.ts`
- [ ] 实现基础语法 (site, filetype, exact, intitle, exclude)
- [ ] 修改 baseUrl 为 `https://www.so.com/s`
- [ ] 实现 degradeSyntax (禁用 OR 组合,处理高级语法)
- [ ] 创建 `/src/services/adapters/so360.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 2.4: Phase 2 集成
- [ ] 更新 `src/types/index.ts` (添加 naver, sogou, so360)
- [ ] 更新 `src/services/adapters/factory.ts` (注册 3 个适配器)
- [ ] 更新 `src/i18n/translations.ts` (添加引擎名称翻译)
- [ ] 手动测试 3 个引擎的搜索功能
- [ ] 验证中文内容搜索正常工作

### Phase 3: 欧洲市场引擎 (预计 1-2 小时)

#### Step 3.1: Qwant Adapter 实现
- [ ] 创建 `/src/services/adapters/qwant.ts`
- [ ] 实现最小语法支持 (site, filetype, exact)
- [ ] 修改 baseUrl 为 `https://www.qwant.com/`
- [ ] 实现 degradeSyntax (处理所有高级语法)
- [ ] 创建 `/src/services/adapters/qwant.test.ts`
- [ ] 编写核心逻辑单元测试

#### Step 3.2: Phase 3 集成
- [ ] 更新 `src/types/index.ts` (添加 qwant)
- [ ] 更新 `src/services/adapters/factory.ts` (注册 qwant)
- [ ] 更新 `src/i18n/translations.ts` (添加引擎名称翻译)
- [ ] 手动测试 Qwant 搜索功能

### Final Integration (预计 1 小时)

#### Step 4.1: 完整性验证
- [ ] 运行所有单元测试 (`npm run test`)
- [ ] 运行类型检查 (`npm run type-check`)
- [ ] 运行 ESLint (`npm run lint`)
- [ ] 手动测试所有 17 个引擎 (10 + 7)

#### Step 4.2: 国际化验证
- [ ] 切换到中文,验证所有引擎名称正确显示
- [ ] 切换到英文,验证所有引擎名称正确显示
- [ ] 验证语法降级警告消息的中英文显示

#### Step 4.3: 功能验证
- [ ] 测试多关键词 OR 组合 (在支持的引擎中)
- [ ] 测试语法降级 (在不支持的引擎中)
- [ ] 测试查询长度警告
- [ ] 测试引擎切换功能

#### Step 4.4: 文档更新
- [ ] 更新 `README.md` (如果需要)
- [ ] 更新版本号至 1.9.0
- [ ] 生成 CHANGELOG

---

## 5. Test Specification

### 5.1 Unit Test Structure

**测试文件命名**: `{adapter-name}.test.ts`

**测试框架**: Jest + @testing-library

### 5.2 Core Test Cases

#### 5.2.1 Yahoo Adapter Tests

**文件**: `/src/services/adapters/yahoo.test.ts`

```typescript
import { YahooAdapter } from './yahoo'
import type { SearchParams } from '@/types'

describe('YahooAdapter', () => {
  let adapter: YahooAdapter

  beforeEach(() => {
    adapter = new YahooAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('雅虎')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://search.yahoo.com/search')
    })
  })

  describe('URL构建', () => {
    test('应构建基础搜索URL', () => {
      const params: SearchParams = {
        keyword: 'test query',
        engine: 'yahoo'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('search.yahoo.com/search')
      expect(url).toContain('?p=')
      expect(url).toContain('test%20query')
    })

    test('应支持site语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        site: 'example.com'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('site%3Aexample.com')
    })

    test('应支持多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        sites: ['example.com', 'test.com']
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('site%3Aexample.com')
      expect(url).toContain('OR')
      expect(url).toContain('site%3Atest.com')
    })

    test('应支持filetype语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        fileType: 'pdf'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('filetype%3Apdf')
    })

    test('应支持多文件类型OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        fileTypes: ['pdf', 'doc']
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('filetype%3Apdf')
      expect(url).toContain('OR')
      expect(url).toContain('filetype%3Adoc')
    })
  })

  describe('语法支持', () => {
    test('应支持Bing兼容语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('intitle')
      expect(supportedSyntax).toContain('inurl')
      expect(supportedSyntax).toContain('related')
    })

    test('不应支持cache语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).not.toContain('cache')
    })
  })

  describe('语法降级', () => {
    test('应降级cache语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        cacheSite: 'example.com'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.cacheSite).toBeUndefined()
    })

    test('应保留支持的语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        site: 'example.com',
        fileType: 'pdf'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.site).toBe('example.com')
      expect(degraded.fileType).toBe('pdf')
    })
  })
})
```

#### 5.2.2 Startpage Adapter Tests

**文件**: `/src/services/adapters/startpage.test.ts`

```typescript
import { StartpageAdapter } from './startpage'

describe('StartpageAdapter', () => {
  let adapter: StartpageAdapter

  beforeEach(() => {
    adapter = new StartpageAdapter()
  })

  test('应使用query参数而不是q', () => {
    const params = {
      keyword: 'test',
      engine: 'startpage' as const
    }
    const url = adapter.buildQuery(params)
    expect(url).toContain('?query=')
    expect(url).not.toContain('?q=')
  })

  test('应降级不支持的inurl语法', () => {
    const params = {
      keyword: 'test',
      engine: 'startpage' as const,
      inUrl: 'blog'
    }
    const degraded = adapter.degradeSyntax(params)
    expect(degraded.inUrl).toBeUndefined()
  })

  test('应支持date_range语法', () => {
    const supportedSyntax = adapter.getSupportedSyntax()
    expect(supportedSyntax).toContain('date_range')
    expect(supportedSyntax).not.toContain('inurl')
  })
})
```

#### 5.2.3 Naver Adapter Tests

**文件**: `/src/services/adapters/naver.test.ts`

```typescript
import { NaverAdapter } from './naver'

describe('NaverAdapter', () => {
  let adapter: NaverAdapter

  beforeEach(() => {
    adapter = new NaverAdapter()
  })

  test('应降级多站点OR组合为单个站点', () => {
    const params = {
      keyword: 'test',
      engine: 'naver' as const,
      sites: ['site1.com', 'site2.com', 'site3.com']
    }
    const degraded = adapter.degradeSyntax(params)
    expect(degraded.sites).toHaveLength(1)
    expect(degraded.sites![0]).toBe('site1.com')
  })

  test('应降级多文件类型OR组合为单个类型', () => {
    const params = {
      keyword: 'test',
      engine: 'naver' as const,
      fileTypes: ['pdf', 'doc', 'xls']
    }
    const degraded = adapter.degradeSyntax(params)
    expect(degraded.fileTypes).toHaveLength(1)
    expect(degraded.fileTypes![0]).toBe('pdf')
  })

  test('应降级OR关键词语法', () => {
    const params = {
      keyword: 'test',
      engine: 'naver' as const,
      orKeywords: ['keyword1', 'keyword2']
    }
    const degraded = adapter.degradeSyntax(params)
    expect(degraded.orKeywords).toBeUndefined()
  })
})
```

### 5.3 Test Coverage Requirements

**必须测试的核心逻辑** (每个适配器):
1. ✅ URL 构建正确性 (baseUrl + 查询参数格式)
2. ✅ 单个语法支持 (site, filetype, exact)
3. ✅ 多关键词 OR 组合 (如果引擎支持)
4. ✅ 语法降级处理 (不支持的语法应设为 undefined)
5. ✅ getSupportedSyntax 返回正确列表

**不需要测试**:
- ❌ UI 集成测试
- ❌ E2E 测试
- ❌ 性能测试
- ❌ 国际化翻译内容测试 (手动验证即可)

---

## 6. Validation Plan

### 6.1 Unit Tests

**运行命令**: `npm run test`

**测试内容**:
- 所有适配器的 URL 构建逻辑
- 语法支持列表正确性
- 多关键词 OR 组合正确性
- 语法降级处理正确性

### 6.2 Integration Tests

**手动测试流程**:

1. **引擎切换测试**
   - 打开扩展弹窗
   - 依次切换到 17 个搜索引擎
   - 验证引擎名称正确显示 (中英文)

2. **搜索功能测试**
   - 每个引擎执行基础关键词搜索
   - 验证跳转到正确的搜索引擎页面
   - 验证 URL 参数格式正确

3. **语法支持测试**
   - 在支持 OR 的引擎中测试多站点/多文件类型
   - 在不支持 OR 的引擎中验证降级警告
   - 测试高级语法在各引擎中的行为

4. **国际化测试**
   - 切换语言到中文,验证所有引擎名称
   - 切换语言到英文,验证所有引擎名称
   - 验证警告消息的中英文显示

### 6.3 Business Logic Verification

**验收测试场景**:

| 场景 | 引擎 | 操作 | 预期结果 |
|------|------|------|---------|
| 多站点搜索 | Yahoo | 输入 2 个站点 | URL 包含 `(site:a.com OR site:b.com)` |
| 多站点降级 | Naver | 输入 2 个站点 | 仅使用第一个站点,显示警告 |
| cache 降级 | Yahoo | 输入 cache 站点 | cache 参数被忽略,显示警告 |
| 日期范围 | Startpage | 输入日期范围 | URL 包含 `before:` 和 `after:` |
| 基础语法 | Qwant | 输入 site + filetype | URL 正确构建 |
| 高级语法降级 | Qwant | 输入 intitle | intitle 被忽略,显示警告 |
| 中文搜索 | Sogou | 输入中文关键词 | 正确处理中文 URL 编码 |

---

## 7. Implementation Constraints

### 7.1 MUST Requirements

1. **Direct Implementability**: 每个适配器必须可直接编码实现,无需额外架构设计
2. **Syntax Consistency**: 语法支持必须与官方搜索引擎一致
3. **Degradation Handling**: 不支持的语法必须正确降级并发出警告
4. **i18n Completeness**: 所有用户可见文本必须有中英文翻译
5. **Test Coverage**: 核心逻辑必须有单元测试覆盖

### 7.2 MUST NOT Requirements

1. **No Over-Engineering**: 不引入复杂设计模式 (直接复用现有适配器逻辑)
2. **No Additional Languages**: 不添加中英文以外的语言支持
3. **No UI Changes**: 不修改现有 UI 组件 (使用现有下拉选择器)
4. **No Backend Services**: 不引入服务器端依赖
5. **No Breaking Changes**: 保持向后兼容,不破坏现有功能

### 7.3 Code Quality Standards

- **TypeScript**: 严格类型检查,无 any 类型
- **ESLint**: 无 linting 错误
- **Code Style**: 与现有适配器保持一致
- **Comments**: 关键逻辑添加中文注释
- **Naming**: 遵循现有命名约定

---

## 8. Risk Mitigation

### 8.1 Identified Risks

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 官方 URL 格式变化 | 中 | 高 | 使用 try-catch 包裹,允许降级处理 |
| 语法支持文档不准确 | 高 | 中 | 通过实际测试验证,保守策略 |
| 多关键词支持不确定 | 中 | 中 | 默认禁用,测试验证后启用 |
| 查询长度限制未知 | 低 | 低 | 统一使用 180 字符保守限制 |
| 国际化翻译遗漏 | 低 | 中 | 使用 checklist 逐项验证 |

### 8.2 Fallback Strategies

1. **URL 构建失败**: 返回基础 URL + 关键词,允许用户手动搜索
2. **语法不支持**: 降级处理,发出警告,允许搜索继续
3. **查询过长**: 仅警告,不阻止搜索
4. **验证失败**: 宽松验证策略,仅警告不阻止

---

## 9. Acceptance Criteria

### 9.1 Functional Acceptance

- [ ] 所有 7 个新引擎可正常搜索
- [ ] 多站点 OR 组合在 Yahoo, Startpage, Ecosia, Sogou 中工作
- [ ] 多文件类型 OR 组合在支持的引擎中工作
- [ ] 语法降级在 Naver, 360搜索, Qwant 中正确处理
- [ ] cache 语法在 Yahoo 中正确降级
- [ ] 查询长度超限时显示警告

### 9.2 i18n Acceptance

- [ ] 所有 7 个引擎名称有中文翻译
- [ ] 所有 7 个引擎名称有英文翻译
- [ ] 语法降级警告有中英文翻译
- [ ] 切换语言时所有文本正确更新
- [ ] 不包含中英文以外的语言

### 9.3 Code Quality Acceptance

- [ ] 所有单元测试通过 (`npm run test`)
- [ ] TypeScript 类型检查通过 (`npm run type-check`)
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] 代码风格与现有适配器一致
- [ ] 关键逻辑有中文注释

### 9.4 User Experience Acceptance

- [ ] 引擎选择器包含所有 17 个引擎
- [ ] 引擎切换流畅无卡顿
- [ ] 搜索结果在正确的引擎中打开
- [ ] 警告消息清晰易懂
- [ ] 不支持的语法不阻止搜索

---

## 10. Post-Implementation

### 10.1 Documentation Updates

- [ ] 更新 `README.md` 支持的引擎列表
- [ ] 生成 `CHANGELOG.md` 版本 1.9.0
- [ ] 更新 `manifest.json` 版本号

### 10.2 Version Release

**新版本号**: 1.9.0

**发布说明**:
```markdown
## v1.9.0 - 2025-11-26

### 新增功能
- ✨ 新增 7 个搜索引擎支持
  - Yahoo Search (雅虎搜索)
  - Startpage (隐私友好搜索)
  - Ecosia (环保搜索引擎)
  - Qwant (欧洲隐私搜索)
  - Naver (韩国搜索引擎)
  - Sogou (搜狗搜索)
  - 360搜索

### 改进
- 🌐 完整的中英文国际化支持
- ⚙️ 智能语法降级处理
- ✅ 完整的单元测试覆盖

### 技术细节
- 所有语法支持与官方搜索引擎保持一致
- 多关键词 OR 组合在支持的引擎中正常工作
- 不支持的语法自动降级并发出友好警告
```

### 10.3 Future Enhancements

**可选后续改进** (不在本次实施范围):
1. 添加 Perplexity AI 和 You.com 支持
2. 实现 Qwant Qwick 快捷方式
3. 优化中文搜索引擎的分词处理
4. 添加引擎特定的搜索建议

---

## 11. Reference Materials

### 11.1 Official Documentation

- **Yahoo**: Bing 语法兼容性参考
- **Startpage**: [官方 Help Center](https://support.startpage.com/)
- **Ecosia**: [官方 FAQ](https://ecosia.zendesk.com/)
- **Qwant**: [官方帮助页面](https://help.qwant.com/)
- **Naver**: [Naver Search API 文档](https://developers.naver.com/)
- **Sogou**: [搜狗帮助中心](https://help.sogou.com/)
- **360搜索**: [360 帮助页面](https://help.so.com/)

### 11.2 Existing Code References

- **Google Adapter**: `/src/services/adapters/google.ts` (最完整语法支持)
- **Bing Adapter**: `/src/services/adapters/bing.ts` (Yahoo 参考)
- **Baidu Adapter**: `/src/services/adapters/baidu.ts` (中文引擎参考)
- **Factory Pattern**: `/src/services/adapters/factory.ts`
- **Type Definitions**: `/src/types/index.ts`
- **i18n System**: `/src/i18n/translations.ts`

### 11.3 Test Examples

- **Twitter Tests**: `/src/services/adapters/twitter.test.ts` (现有测试参考)

---

## Appendix A: Complete Syntax Support Matrix

| 搜索引擎 | site | filetype | exact | intitle | inurl | intext | OR | exclude | date_range | cache | related |
|---------|------|----------|-------|---------|-------|--------|----|---------|-----------|----- --|---------|
| Yahoo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅* | ✅ | ✅ | ✅ | ❌ | ✅ |
| Startpage | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ecosia | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Qwant | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Naver | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Sogou | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 360搜索 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

**注释**:
- `*` Yahoo 使用 `inbody:` 而不是 `intext:`
- ✅ = 完整支持
- ❌ = 不支持,需要降级处理

---

## Appendix B: Multi-Keyword OR Support Matrix

| 搜索引擎 | sites OR | fileTypes OR | exactMatches 并列 |
|---------|----------|--------------|------------------|
| Yahoo | ✅ | ✅ | ✅ |
| Startpage | ✅ | ✅ | ✅ |
| Ecosia | ✅ | ✅ | ✅ |
| Qwant | ❌ | ❌ | ✅ |
| Naver | ❌ | ❌ | ✅ |
| Sogou | ✅ | ✅ | ✅ |
| 360搜索 | ❌ | ❌ | ✅ |

---

**Document Status**: ✅ Ready for Implementation
**Estimated Implementation Time**: 7-10 hours
**Last Updated**: 2025-11-26
