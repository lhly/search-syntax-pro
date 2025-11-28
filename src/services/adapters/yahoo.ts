import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, Language } from '@/types'
import { translate } from '@/i18n/translations'

/**
 * 获取当前语言设置
 */
async function getCurrentLanguage(): Promise<Language> {
  try {
    const result = await chrome.storage.local.get('user_settings')
    return result.user_settings?.language || 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}

/**
 * Yahoo 搜索引擎适配器
 * 基于 Bing 语法兼容性实现
 */
export class YahooAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Yahoo'
  }

  getBaseUrl(): string {
    return 'https://search.yahoo.com/search'
  }

  /**
   * 构建 Yahoo 搜索查询URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?p=${encodeURIComponent(query)}`
  }

  /**
   * 构建搜索查询字符串
   */
  private buildSearchQuery(params: SearchParams): string {
    let query = params.keyword.trim()

    // 1. 精确匹配优先级最高 - 支持多关键词（原生并列）
    const exactMatches = params.exactMatches?.filter(m => m.trim()) ||
                         (params.exactMatch ? [params.exactMatch] : [])
    if (exactMatches.length > 0) {
      const exactQuery = exactMatches.map(m => `"${m.trim()}"`).join(' ')
      query = query ? `${exactQuery} ${query}` : exactQuery
    }

    // 2. 通配符查询
    if (params.wildcardQuery && params.wildcardQuery.includes('*')) {
      query = params.wildcardQuery
    }

    // 3. 限定性语法 (site, filetype) - 支持多关键词（OR组合）
    // 网站内搜索 - OR组合多个站点
    const sites = params.sites?.filter(s => s.trim()) ||
                  (params.site ? [params.site] : [])
    if (sites.length > 0) {
      const siteQuery = sites
        .map(s => `site:${this.cleanSiteDomain(s.trim())}`)
        .join(' OR ')
      query += sites.length > 1 ? ` (${siteQuery})` : ` ${siteQuery}`
    }

    // 文件类型搜索 - OR组合多个类型
    const fileTypes = params.fileTypes?.filter(ft => ft.trim()) ||
                      (params.fileType ? [params.fileType] : [])
    if (fileTypes.length > 0) {
      const fileTypeQuery = fileTypes
        .map(ft => `filetype:${ft.trim()}`)
        .join(' OR ')
      query += fileTypes.length > 1 ? ` (${fileTypeQuery})` : ` ${fileTypeQuery}`
    }

    // 4. 位置性语法 (intitle, inurl, inbody)
    if (params.inTitle && params.inTitle.trim()) {
      query += ` intitle:${params.inTitle.trim()}`
    }

    if (params.inUrl && params.inUrl.trim()) {
      query += ` inurl:${params.inUrl.trim()}`
    }

    // Yahoo 使用 inbody: (与 Bing 一致)
    if (params.inText && params.inText.trim()) {
      query += ` inbody:${params.inText.trim()}`
    }

    // allintitle 降级为多个 intitle (与 Bing 一致)
    if (params.allInTitle && params.allInTitle.trim()) {
      const keywords = params.allInTitle.trim().split(' ')
      keywords.forEach(keyword => {
        if (keyword.trim()) {
          query += ` intitle:${keyword.trim()}`
        }
      })
    }

    // 5. 范围性语法 (日期, 数字)
    if (params.dateRange) {
      const dateFilter = this.buildDateFilter(params.dateRange)
      if (dateFilter) {
        query += ` ${dateFilter}`
      }
    }

    if (params.numberRange) {
      const { min, max } = params.numberRange
      if (min !== undefined && max !== undefined) {
        query += ` ${min}..${max}`
      }
    }

    // 6. 逻辑运算符 (OR, exclude)
    if (params.orKeywords && params.orKeywords.length > 0) {
      const orQuery = params.orKeywords
        .filter(word => word.trim())
        .join(' OR ')
      if (orQuery) {
        query = `${query} OR ${orQuery}`
      }
    }

    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          query += ` -${word.trim()}`
        }
      })
    }

    // 7. 特殊功能 (related)
    if (params.relatedSite && params.relatedSite.trim()) {
      const site = this.cleanSiteDomain(params.relatedSite.trim())
      query += ` related:${site}`
    }

    // 注意: Yahoo 不支持 cache 语法

    return query
  }

  /**
   * 清理网站域名
   */
  private cleanSiteDomain(site: string): string {
    site = site.replace(/^https?:\/\//, '')
    site = site.split('/')[0]
    site = site.split(':')[0]
    return site
  }

  /**
   * 构建日期过滤语法
   */
  private buildDateFilter(dateRange: { from: string; to: string }): string {
    const { from, to } = dateRange

    if (from && to) {
      const fromDate = this.formatDate(from)
      const toDate = this.formatDate(to)
      return `daterange:${fromDate}-${toDate}`
    } else if (from) {
      const fromDate = this.formatDate(from)
      return `after:${fromDate}`
    } else if (to) {
      const toDate = this.formatDate(to)
      return `before:${toDate}`
    }

    return ''
  }

  /**
   * 格式化日期
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      return date.toISOString().split('T')[0].replace(/-/g, '')
    } catch {
      return dateStr
    }
  }

  /**
   * 获取支持的语法类型
   */
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

  /**
   * 验证语法支持
   */
  validateSyntax(syntax: SyntaxType): boolean {
    return this.getSupportedSyntax().includes(syntax)
  }

  /**
   * 语法兼容性检查
   */
  isSyntaxSupported(syntax: SyntaxType): boolean {
    return this.validateSyntax(syntax)
  }

  /**
   * 语法降级处理
   */
  degradeSyntax(params: SearchParams): SearchParams {
    const degradedParams = { ...params }

    if (params.cacheSite) {
      console.warn('Yahoo不支持cache语法,该参数将被忽略')
      degradedParams.cacheSite = undefined
    }

    return degradedParams
  }

  /**
   * 验证搜索参数
   */
  async validateParams(params: SearchParams): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const language = await getCurrentLanguage()
    const t = (key: string, vars?: Record<string, string | number>) => translate(language, key, vars)

    if (!params.keyword.trim() && !params.exactMatch?.trim()) {
      errors.push(t('adapter.validation.keywordRequired'))
    }

    if (params.site) {
      const site = params.site.trim()
      if (site && !this.isValidDomain(site)) {
        errors.push(t('adapter.validation.domainInvalid'))
      }
    }

    if (params.cacheSite) {
      warnings.push(t('adapter.validation.cacheNotSupported', { engine: this.getName() }))
    }

    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 180) {
      warnings.push(t('adapter.validation.queryTooLong'))
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
    const cleaned = this.cleanSiteDomain(domain)
    const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return domainRegex.test(cleaned)
  }

  /**
   * 获取支持的 UI 功能特性
   */
  getSupportedFeatures(): import('@/types').UIFeatureType[] {
    return [
      'site', 'filetype', 'intitle', 'inurl', 'intext',
      'exact_match', 'exclude', 'or_keywords',
      'date_range', 'related'
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): import('@/types').EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle', 'inurl', 'intext'],
      precision: ['exact_match'],
      logic: ['exclude', 'or_keywords'],
      range: ['date_range'],
      special: ['related']
    }
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword.includes('news') && !params.dateRange) {
      suggestions.push('添加日期限制以获取最新新闻')
    }

    return suggestions
  }
}
