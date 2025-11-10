import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType, EngineFeatureGroups } from '@/types'

/**
 * DuckDuckGo 搜索引擎适配器
 * 支持隐私保护的搜索功能
 *
 * 特点:
 * - 不跟踪用户搜索历史
 * - 无广告干扰
 * - 全球用户超1亿次日搜索量
 * - 支持完善的高级搜索语法
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
   * 按照 DuckDuckGo 语法优先级构建查询
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
      const site = this.cleanSiteDomain(params.site.trim())
      queryParts.push(`site:${site}`)
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
   * 清理网站域名
   */
  private cleanSiteDomain(site: string): string {
    // 移除协议前缀
    site = site.replace(/^https?:\/\//, '')

    // 移除路径部分
    site = site.split('/')[0]

    // 移除端口号
    site = site.split(':')[0]

    return site
  }

  /**
   * 验证语法类型
   */
  validateSyntax(syntax: SyntaxType): boolean {
    return this.getSupportedSyntax().includes(syntax)
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
   * 语法兼容性检查
   */
  isSyntaxSupported(syntax: SyntaxType): boolean {
    return this.validateSyntax(syntax)
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
   * 获取功能分组配置
   */
  getFeatureGroups(): EngineFeatureGroups {
    return {
      // 位置限定组
      location: ['site', 'filetype', 'intitle', 'inurl'],

      // 匹配精度组
      precision: ['exact_match'],

      // 逻辑运算组
      logic: ['exclude', 'or_keywords']
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
      const site = this.cleanSiteDomain(params.site.trim())
      if (!this.isValidDomain(site)) {
        warnings.push('网站域名格式可能不正确')
      }
    }

    // 检查文件类型
    if (params.fileType && params.fileType.trim()) {
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml']
      if (!validTypes.includes(params.fileType.toLowerCase())) {
        warnings.push(`文件类型 "${params.fileType}" 可能不被 DuckDuckGo 支持`)
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 200) {
      warnings.push('搜索查询过长，可能影响搜索结果')
    }

    // 检查语法数量
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fileType ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.inTitle ? 1 : 0,
      params.inUrl ? 1 : 0,
      params.excludeWords && params.excludeWords.length > 0 ? 1 : 0,
      params.orKeywords && params.orKeywords.length > 0 ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    if (syntaxCount > 5) {
      warnings.push('搜索条件过多，可能导致结果过少')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证域名格式
   */
  private isValidDomain(domain: string): boolean {
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return domainRegex.test(domain)
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

    if (params.keyword && !params.inTitle && !params.inUrl) {
      suggestions.push('使用 intitle: 或 inurl: 提高结果相关性')
    }

    return suggestions
  }

  /**
   * 语法降级处理
   */
  degradeSyntax(params: SearchParams): SearchParams {
    // DuckDuckGo 支持所有已定义的语法，不需要降级
    return params
  }
}
