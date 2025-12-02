# Requirements Confirmation - Search Engine Adapters Expansion

## ✅ Final Requirements (Quality Score: 92/100)

### 项目概述
为 SearchSyntax Pro Chrome 扩展添加 7 个新搜索引擎的适配器支持,确保所有高级语法与官方搜索引擎支持保持一致,并提供完整的国际化支持(中文+英文)。

---

## 1. 功能范围与优先级

### 实施范围 (基于用户回答 Q1.1=C, Q1.2=C)

#### ✅ 包含的搜索引擎(7个,分三阶段实施)

**Phase 1: 兼容性引擎** (基于现有语法模式)
1. **Yahoo Search** - 全球市场份额2-3%, Bing语法兼容
2. **Startpage** - 隐私友好, Google语法兼容
3. **Ecosia** - 环保搜索, Google/Bing混合语法

**Phase 2: 区域市场引擎** (需要独立适配)
4. **Naver** (네이버) - 韩国最大搜索引擎,市场份额60%+
5. **Sogou** (搜狗) - 中国第二大搜索引擎,市场份额约15%
6. **360搜索** (Haosou/好搜) - 中国市场份额10-15%

**Phase 3: 欧洲市场引擎**
7. **Qwant** - 法国隐私搜索引擎,基础语法支持

#### ❌ 排除的搜索引擎(2个)
- **Perplexity AI** - AI搜索引擎,暂不实施
- **You.com** - AI搜索引擎,暂不实施

### 实施策略说明
- 采用分批实施策略,降低风险并便于增量验证
- Phase 1 可复用现有适配器逻辑,快速实现
- Phase 2/3 需要独立研究和适配,预留充足时间

---

## 2. 搜索引擎语法支持矩阵 (基于官方文档研究)

### 研究方法 (基于用户回答 Q2.1=联网查询官方支持)
已通过网络搜索验证各搜索引擎的官方语法支持情况,确保实现与官方能力一致。

### 语法支持详情

| 搜索引擎 | 基础语法 | 多关键词支持 | 特殊语法 | 官方文档来源 |
|---------|---------|------------|---------|-----------|
| **Yahoo** | site:, filetype:, intitle:, inurl:, inbody: | ✅ 支持OR组合 | 与Bing相同 | Bing-compatible |
| **Startpage** | site:, filetype:, intitle:, "", before:, after: | ✅ 支持OR组合 | 与Google相似 | 官方Help Center |
| **Ecosia** | site:, filetype:, intitle:, inurl:, "" | ✅ 支持OR组合 | Google/Bing混合 | 官方FAQ |
| **Qwant** | site:, filetype:, "", 基础操作符 | ⚠️ 有限支持 | Qwick快捷方式 | 官方帮助页面 |
| **Naver** | site:, filetype:, "" | ⚠️ 有限支持 | 韩语优化搜索 | Naver API文档 |
| **Sogou** | site:, filetype:, intitle:, inurl: | ⚠️ 部分支持 | 中文分词优化 | 搜狗帮助中心 |
| **360搜索** | site:, filetype:, intitle: | ⚠️ 有限支持 | 中文优化 | 360帮助页面 |

### 具体语法支持细节

#### Yahoo Search (Bing-compatible)
```typescript
支持的语法:
- site: (单个和多个OR组合)
- filetype: (单个和多个OR组合)
- intitle:, allintitle:
- inurl:, inbody:
- "" (精确匹配)
- - (排除)
- OR (逻辑或)

不支持的语法:
- cache: (需要降级处理)
- related: (需要降级处理)

URL格式: https://search.yahoo.com/search?p={query}
```

#### Startpage (Google-compatible)
```typescript
支持的语法:
- site: (单个和多个OR组合)
- filetype: (单个和多个OR组合)
- intitle:
- "" (精确匹配)
- before:, after: (日期范围)
- OR (逻辑或)
- - (排除)

URL格式: https://www.startpage.com/sp/search?query={query}
```

#### Ecosia (Google/Bing hybrid)
```typescript
支持的语法:
- site: (官方文档确认支持)
- filetype: (官方文档确认支持)
- "" (精确匹配)
- OR (逻辑或)
- - (排除)

说明: 官方声明支持Google和Bing的搜索操作符

URL格式: https://www.ecosia.org/search?q={query}
```

#### Qwant (基础操作符)
```typescript
支持的语法:
- site: (基础支持)
- filetype: (基础支持)
- "" (精确匹配)
- Qwick快捷方式 (!w Wikipedia等)

说明: 语法支持相对有限,文档不够详细

URL格式: https://www.qwant.com/?q={query}
```

#### Naver (韩国市场)
```typescript
支持的语法:
- site: (有限支持)
- filetype: (支持pdf, doc, xls等)
- "" (精确匹配)
- 韩语分词和形态分析

特点: 针对韩语内容优化,语法文档以韩语为主

URL格式: https://search.naver.com/search.naver?query={query}
```

#### Sogou (中国市场)
```typescript
支持的语法:
- site: (官方帮助确认支持)
- filetype: (官方帮助确认支持,包括pdf, doc, xls, ppt等)
- intitle:, inurl: (基于官方帮助推断)
- "" (精确匹配)

特点: 中文分词优化,拼音搜索支持

URL格式: https://www.sogou.com/web?query={query}
```

#### 360搜索 (中国市场)
```typescript
支持的语法:
- site: (基础支持)
- filetype: (基础支持)
- intitle: (基础支持)
- "" (精确匹配)

特点: 中文优化,文档有限

URL格式: https://www.so.com/s?q={query}
```

---

## 3. 技术规格要求

### 3.1 语法降级策略 (基于用户回答 Q2.2=A)

**策略选择**: 选项A - 直接忽略并发出警告

```typescript
// 降级处理示例
degradeSyntax(params: SearchParams): SearchParams {
  const degradedParams = { ...params }
  const warnings: string[] = []

  // 如果引擎不支持某语法,设为undefined并记录警告
  if (!this.getSupportedSyntax().includes('cache') && params.cacheSite) {
    degradedParams.cacheSite = undefined
    warnings.push(
      translate(language, 'adapter.validation.unsupported_syntax', {
        syntax: 'cache:',
        engine: this.getName()
      })
    )
  }

  if (warnings.length > 0) {
    console.warn(`[${this.getName()}] 语法降级:`, warnings.join('; '))
  }

  return degradedParams
}
```

### 3.2 多关键词支持 (基于用户回答 Q2.3=联网确认官方支持)

**要求**: 确保所有多关键词功能与官方搜索引擎的支持程度保持一致

```typescript
// 仅当官方支持OR操作符时才实现多关键词组合
buildSearchQuery(params: SearchParams): string {
  let query = params.keywords || ''

  // 多域名支持 (仅当引擎支持OR时)
  if (this.supportsOR()) {
    const sites = params.sites?.filter(s => s.trim()) || []
    if (sites.length > 0) {
      const siteQuery = sites
        .map(s => `site:${this.cleanSiteDomain(s.trim())}`)
        .join(' OR ')
      query += sites.length > 1 ? ` (${siteQuery})` : ` ${siteQuery}`
    }
  }

  // 多文件类型支持 (仅当引擎支持OR时)
  if (this.supportsOR()) {
    const fileTypes = params.fileTypes?.filter(ft => ft.trim()) || []
    if (fileTypes.length > 0) {
      const ftQuery = fileTypes
        .map(ft => `filetype:${ft.trim().toLowerCase()}`)
        .join(' OR ')
      query += fileTypes.length > 1 ? ` (${ftQuery})` : ` ${ftQuery}`
    }
  }

  return query
}
```

### 3.3 适配器接口实现

所有新适配器必须实现 `SearchEngineAdapter` 接口:

```typescript
interface SearchEngineAdapter {
  getName(): string                           // 引擎名称(中文)
  getBaseUrl(): string                        // 基础URL
  buildQuery(params: SearchParams): string    // 构建搜索URL
  getSupportedSyntax(): SyntaxType[]         // 支持的语法列表
  validateParams(params: SearchParams): Promise<ValidationResult>
  degradeSyntax(params: SearchParams): SearchParams
  getSearchSuggestions?(): string[]          // 可选: 搜索建议
}
```

---

## 4. 国际化要求 (基于用户回答 Q3.1/Q3.2/Q3.3)

### 4.1 语言支持范围 (用户回答 Q3.2=仅中文与英文)

**明确要求**: 所有文本必须且仅支持项目本身存在的国际化语言配置:
- ✅ zh-CN (简体中文)
- ✅ en-US (英语)
- ❌ 不添加 ko-KR (韩语) - 即使是Naver引擎
- ❌ 不添加其他语言

### 4.2 翻译键命名规范

#### 引擎名称
```typescript
// src/i18n/translations.ts
export const translations = {
  'zh-CN': {
    common: {
      searchEngines: {
        yahoo: 'Yahoo搜索',
        startpage: 'Startpage',
        ecosia: 'Ecosia',
        qwant: 'Qwant',
        naver: 'Naver',
        sogou: '搜狗',
        so360: '360搜索'
      }
    }
  },
  'en-US': {
    common: {
      searchEngines: {
        yahoo: 'Yahoo Search',
        startpage: 'Startpage',
        ecosia: 'Ecosia',
        qwant: 'Qwant',
        naver: 'Naver',
        sogou: 'Sogou',
        so360: '360 Search'
      }
    }
  }
}
```

#### 验证消息
```typescript
// 新增验证消息翻译键
adapter: {
  validation: {
    unsupported_syntax: '{engine}不支持{syntax}语法,该参数将被忽略',
    unsupported_multi_keyword: '{engine}不支持多关键词OR组合',
    query_too_long: '查询长度超过{engine}的限制({max}字符)',
    // ... 其他验证消息
  }
}
```

#### 搜索建议国际化 (基于用户回答 Q3.3)
```typescript
// getSearchSuggestions() 返回的提示需要国际化
async getSearchSuggestions(): Promise<string[]> {
  const language = await getCurrentLanguage()
  return [
    translate(language, 'adapter.suggestions.site_search'),
    translate(language, 'adapter.suggestions.filetype_search'),
    translate(language, 'adapter.suggestions.exact_match')
  ]
}
```

### 4.3 国际化实施清单

- [ ] 添加7个新引擎的名称翻译 (zh-CN + en-US)
- [ ] 添加引擎特定的验证错误消息
- [ ] 添加语法降级警告消息
- [ ] 添加搜索建议提示文本
- [ ] 更新 `common.searchEngines` 类别
- [ ] 确保所有用户可见文本都通过 `translate()` 函数

---

## 5. 测试要求 (基于用户回答 Q4.1=B, Q4.2=B)

### 5.1 参数验证策略 (选项B: 宽松验证)

```typescript
// 仅警告,允许搜索继续
async validateParams(params: SearchParams): Promise<ValidationResult> {
  const warnings: string[] = []
  const language = await getCurrentLanguage()

  // 检查不支持的语法,但仅警告不阻止
  if (params.cacheSite && !this.getSupportedSyntax().includes('cache')) {
    warnings.push(
      translate(language, 'adapter.validation.unsupported_syntax', {
        syntax: 'cache:',
        engine: this.getName()
      })
    )
  }

  return {
    isValid: true,  // 始终返回true,不阻止搜索
    warnings: warnings.length > 0 ? warnings : undefined
  }
}
```

### 5.2 测试覆盖范围 (选项B: 仅核心逻辑需要测试)

**必须测试的核心逻辑**:
```typescript
describe('YahooAdapter', () => {
  // ✅ 必须: URL构建测试
  it('should build correct search URL', () => {
    const adapter = new YahooAdapter()
    const url = adapter.buildQuery({ keywords: 'test' })
    expect(url).toContain('search.yahoo.com')
  })

  // ✅ 必须: 多关键词组合测试 (如果支持)
  it('should combine multiple sites with OR', () => {
    const url = adapter.buildQuery({
      keywords: 'test',
      sites: ['example.com', 'test.com']
    })
    expect(url).toContain('site:example.com OR site:test.com')
  })

  // ✅ 必须: 语法降级测试
  it('should degrade unsupported syntax', () => {
    const degraded = adapter.degradeSyntax({
      keywords: 'test',
      cacheSite: 'example.com'  // Yahoo不支持cache:
    })
    expect(degraded.cacheSite).toBeUndefined()
  })

  // ❌ 不需要: UI集成测试
  // ❌ 不需要: E2E测试
  // ❌ 不需要: 性能测试
})
```

**测试文件结构**:
```
src/services/adapters/
  ├── yahoo.test.ts       ✅ 核心逻辑测试
  ├── startpage.test.ts   ✅ 核心逻辑测试
  ├── ecosia.test.ts      ✅ 核心逻辑测试
  ├── qwant.test.ts       ✅ 核心逻辑测试
  ├── naver.test.ts       ✅ 核心逻辑测试
  ├── sogou.test.ts       ✅ 核心逻辑测试
  └── so360.test.ts       ✅ 核心逻辑测试
```

---

## 6. UI/UX决策

### 6.1 引擎显示顺序 (保持现有实现)
基于现有代码分析,引擎顺序由 `factory.ts` 中的注册顺序决定,无需特殊处理。

### 6.2 引擎选择器UI (保持现有实现)
使用现有下拉选择器,无需修改UI组件。

---

## 7. 边界情况处理

### 7.1 引擎不可用处理 (保守策略)
```typescript
// 如果URL格式变化,记录错误但允许继续
buildQuery(params: SearchParams): string {
  try {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
  } catch (error) {
    console.error(`[${this.getName()}] URL构建失败:`, error)
    // 返回基础URL,允许用户尝试
    return `${this.getBaseUrl()}?q=${encodeURIComponent(params.keywords || '')}`
  }
}
```

### 7.2 查询长度限制 (统一保守策略)
```typescript
// 所有引擎统一使用180字符限制(最保守)
const MAX_QUERY_LENGTH = 180

async validateParams(params: SearchParams): Promise<ValidationResult> {
  const warnings: string[] = []
  const language = await getCurrentLanguage()

  const fullQuery = this.buildSearchQuery(params)
  if (fullQuery.length > MAX_QUERY_LENGTH) {
    warnings.push(
      translate(language, 'adapter.validation.query_too_long', {
        engine: this.getName(),
        max: MAX_QUERY_LENGTH.toString()
      })
    )
  }

  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined }
}
```

---

## 8. 实施计划

### Phase 1: 兼容性引擎 (预计2-3小时)
```yaml
Yahoo:
  - 复用 BingAdapter 逻辑
  - 修改 baseUrl 和引擎名称
  - 添加翻译键
  - 编写核心测试

Startpage:
  - 复用 GoogleAdapter 逻辑
  - 修改 baseUrl
  - 验证语法兼容性
  - 添加翻译和测试

Ecosia:
  - 混合 Google/Bing 语法
  - 实现基础操作符
  - 添加翻译和测试
```

### Phase 2: 区域市场引擎 (预计3-4小时)
```yaml
Naver:
  - 独立实现韩国市场特性
  - 仅提供中英文翻译
  - 实现基础语法支持
  - 测试韩语查询处理

Sogou:
  - 参考 Baidu 实现
  - 实现中文分词优化
  - 支持官方确认的语法
  - 添加翻译和测试

360搜索:
  - 参考 Sogou/Baidu
  - 实现基础语法
  - 中文优化
  - 添加翻译和测试
```

### Phase 3: 欧洲市场引擎 (预计1-2小时)
```yaml
Qwant:
  - 实现基础操作符
  - 支持 Qwick 快捷方式(可选)
  - 添加翻译和测试
```

### 集成和验收 (预计1小时)
```yaml
- 在 factory.ts 注册所有新适配器
- 手动测试每个引擎的搜索功能
- 验证国际化完整性
- 测试语法降级警告
- 更新 README.md
```

**总预计时间**: 7-10小时

---

## 9. 验收标准

### 功能验收
- [ ] 7个新搜索引擎全部实现并注册
- [ ] 所有引擎的语法支持与官方能力一致
- [ ] 多关键词OR组合仅在官方支持时启用
- [ ] 语法降级正确处理,发出适当警告
- [ ] 所有核心逻辑都有单元测试

### 国际化验收
- [ ] 所有引擎名称有中英文翻译
- [ ] 所有验证消息有中英文翻译
- [ ] 所有搜索建议有中英文翻译
- [ ] 切换语言时所有文本正确显示
- [ ] 不包含中英文以外的语言

### 代码质量验收
- [ ] 遵循现有适配器模式
- [ ] TypeScript类型安全
- [ ] 无ESLint错误
- [ ] 代码风格与现有代码一致
- [ ] 充分的代码注释(中文)

### 用户体验验收
- [ ] 手动测试每个引擎可正常搜索
- [ ] 不支持的语法显示警告但不阻止搜索
- [ ] 查询过长时显示警告
- [ ] 引擎选择器包含所有新引擎

---

## 10. 风险与缓解

### 风险识别
1. **官方语法文档不完整**: 中文搜索引擎(Sogou, 360)的英文文档有限
   - **缓解**: 基于中文官方帮助页面和实际测试验证

2. **URL格式可能变化**: 搜索引擎可能更新URL结构
   - **缓解**: 使用保守的错误处理,允许搜索继续

3. **多关键词支持不确定**: 部分引擎的OR支持未明确文档
   - **缓解**: 通过实际测试验证,不确定时禁用

### 假设和依赖
- 假设: 搜索引擎URL格式在可预见的未来保持稳定
- 假设: 官方文档和帮助页面的信息准确
- 依赖: 现有 `SearchEngineAdapter` 接口和工厂模式不变

---

## 11. 质量评分明细 (92/100)

### 功能清晰度 (28/30) ⬆️+13
- ✅ 明确了7个待添加的搜索引擎
- ✅ 明确了排除2个AI引擎
- ✅ 提供了每个引擎的语法支持矩阵
- ✅ 确认了多关键词支持策略(基于官方支持)
- ⚠️ 部分中文引擎的语法文档仍需实际测试验证

### 技术具体性 (23/25) ⬆️+13
- ✅ 完整的语法降级策略(选项A)
- ✅ 详细的URL格式和参数定义
- ✅ 多关键词实现模式(基于OR支持)
- ✅ 代码示例覆盖所有关键场景
- ⚠️ 部分引擎的特殊处理细节需要实施时确认

### 实现完整性 (22/25) ⬆️+12
- ✅ 完整的国际化方案(zh-CN + en-US)
- ✅ 明确的测试策略(核心逻辑测试)
- ✅ 边界情况处理(查询长度,URL失败)
- ✅ 分阶段实施计划
- ⚠️ 实际实施时可能发现额外边界情况

### 业务上下文 (19/20) ⬆️+9
- ✅ 清晰的验收标准
- ✅ 风险识别和缓解措施
- ✅ 预估工作量和时间
- ✅ 用户价值明确(扩展引擎支持)
- ✅ 优先级和阶段划分合理

---

## 12. 后续步骤

1. ✅ **需求确认完成** - 质量评分92/100
2. ⏸️ **等待用户批准** - 需要用户明确同意后才进入实施阶段
3. ⏳ **Phase 1 实施** - Yahoo, Startpage, Ecosia
4. ⏳ **Phase 2 实施** - Naver, Sogou, 360搜索
5. ⏳ **Phase 3 实施** - Qwant
6. ⏳ **集成测试和验收**

---

## 附录: 研究来源

### 官方文档和帮助页面
- Yahoo: Bing语法兼容性参考
- Startpage: 官方Help Center确认Google/Bing操作符支持
- Ecosia: 官方FAQ确认Google和Bing搜索操作符支持
- Qwant: 官方帮助页面提及基础操作符和Qwick快捷方式
- Naver: Naver Search API文档和帮助中心
- Sogou: 搜狗帮助中心确认filetype等语法支持
- 360搜索: 360帮助页面基础语法说明

### 技术参考
- 现有适配器实现: Google, Bing, Baidu等10个引擎
- SearchEngineAdapter接口定义
- 多关键词OR组合模式(已在Google/Bing中验证)
- i18n翻译系统和translate()函数

---

**文档版本**: 2.0 (最终版)
**最后更新**: 2025-11-26
**状态**: ✅ 需求确认完成,等待用户批准
