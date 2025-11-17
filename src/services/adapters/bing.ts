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
 * 必应搜索引擎适配器
 * 实现必应搜索的特殊语法和URL构建
 */
export class BingAdapter implements SearchEngineAdapter {
  getName(): string {
    return '必应'
  }

  getBaseUrl(): string {
    return 'https://www.bing.com/search'
  }

  /**
   * 构建必应搜索查询URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    let query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
  }

  /**
   * 构建搜索查询字符串
   */
  private buildSearchQuery(params: SearchParams): string {
    let query = params.keyword.trim()

    // 1. 精确匹配优先级最高 - 🔥 支持多关键词（原生并列）
    const exactMatches = params.exactMatches?.filter(m => m.trim()) ||
                         (params.exactMatch ? [params.exactMatch] : [])
    if (exactMatches.length > 0) {
      const exactQuery = exactMatches.map(m => `"${m.trim()}"`).join(' ')
      query = query ? `${exactQuery} ${query}` : exactQuery
    }

    // 2. 通配符查询（如果存在则替换主查询）
    if (params.wildcardQuery && params.wildcardQuery.includes('*')) {
      query = params.wildcardQuery
    }

    // 3. 限定性语法 (site, filetype) - 🔥 支持多关键词（OR组合）
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
    // 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      query += ` intitle:${params.inTitle.trim()}`
    }

    // URL搜索
    if (params.inUrl && params.inUrl.trim()) {
      query += ` inurl:${params.inUrl.trim()}`
    }

    // 正文搜索 (Bing使用inbody:而不是intext:)
    if (params.inText && params.inText.trim()) {
      query += ` inbody:${params.inText.trim()}`
    }

    // 注意: Bing不支持allintitle，降级为intitle
    if (params.allInTitle && params.allInTitle.trim()) {
      const keywords = params.allInTitle.trim().split(' ')
      keywords.forEach(keyword => {
        if (keyword.trim()) {
          query += ` intitle:${keyword.trim()}`
        }
      })
    }

    // 5. 范围性语法 (日期, 数字)
    // 日期范围搜索
    if (params.dateRange) {
      const dateFilter = this.buildDateFilter(params.dateRange)
      if (dateFilter) {
        query += ` ${dateFilter}`
      }
    }

    // 数字范围搜索
    if (params.numberRange) {
      const { min, max } = params.numberRange
      if (min !== undefined && max !== undefined) {
        query += ` ${min}..${max}`
      }
    }

    // 6. 逻辑运算符 (OR, exclude)
    // OR逻辑
    if (params.orKeywords && params.orKeywords.length > 0) {
      const orQuery = params.orKeywords
        .filter(word => word.trim())
        .join(' OR ')
      if (orQuery) {
        query = `${query} OR ${orQuery}`
      }
    }

    // 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          query += ` -${word.trim()}`
        }
      })
    }

    // 7. 特殊功能 (related)
    // 相关网站 (Bing支持)
    if (params.relatedSite && params.relatedSite.trim()) {
      const site = this.cleanSiteDomain(params.relatedSite.trim())
      query += ` related:${site}`
    }

    // 注意: Bing不支持cache语法

    return query
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
   * 格式化日期为必应支持的格式
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
   * 验证必应支持的语法
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
      'date_range',
      'intitle',
      'inurl',
      'exclude',
      'or',
      'intext',  // Bing使用inbody实现
      'number_range',
      'wildcard',
      'allintitle',  // 降级为多个intitle
      'related'
      // 注意: Bing不支持 'cache'
    ]
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

    // allintitle降级为多个intitle (在buildSearchQuery中处理)
    // intext使用inbody实现 (在buildSearchQuery中处理)
    // cache不支持,忽略

    if (params.cacheSite) {
      console.warn('Bing不支持cache语法,该参数将被忽略')
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

    // 检查关键词或精确匹配
    if (!params.keyword.trim() && !params.exactMatch?.trim()) {
      errors.push(t('adapter.validation.keywordRequired'))
    }

    // 验证网站域名格式
    if (params.site) {
      const site = params.site.trim()
      if (site && !this.isValidDomain(site)) {
        errors.push(t('adapter.validation.domainInvalid'))
      }
    }

    // 验证文件类型
    if (params.fileType) {
      const fileType = params.fileType.trim().toLowerCase()
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'png', 'gif', 'bmp', 'tiff']
      if (fileType && !validTypes.includes(fileType)) {
        warnings.push(t('adapter.validation.fileTypeUnsupported', { fileType, engine: this.getName() }))
      }
    }

    // 验证日期格式
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && !this.isValidDate(from)) {
        errors.push(t('adapter.validation.dateFromInvalid'))
      }
      if (to && !this.isValidDate(to)) {
        errors.push(t('adapter.validation.dateToInvalid'))
      }
      if (from && to && new Date(from) > new Date(to)) {
        errors.push(t('adapter.validation.dateRangeInvalid'))
      }
    }

    // 验证数字范围
    if (params.numberRange) {
      const { min, max } = params.numberRange
      if (min !== undefined && max !== undefined && min > max) {
        errors.push(t('adapter.validation.numberRangeInvalid'))
      }
    }

    // 验证相关站点
    if (params.relatedSite) {
      const relatedSite = params.relatedSite.trim()
      if (relatedSite && !this.isValidDomain(relatedSite)) {
        errors.push(t('adapter.validation.relatedUrlInvalid'))
      }
    }

    // Bing不支持cache语法
    if (params.cacheSite) {
      warnings.push(t('adapter.validation.cacheNotSupported', { engine: this.getName() }))
    }

    // 检查查询长度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 160) {
      warnings.push(t('adapter.validation.queryTooLong'))
    }

    // 检查语法数量
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fileType ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.dateRange ? 1 : 0,
      params.inTitle ? 1 : 0,
      params.inUrl ? 1 : 0,
      params.inText ? 1 : 0,
      params.allInTitle ? 1 : 0,
      params.numberRange ? 1 : 0,
      params.excludeWords && params.excludeWords.length > 0 ? 1 : 0,
      params.orKeywords && params.orKeywords.length > 0 ? 1 : 0,
      params.wildcardQuery ? 1 : 0,
      params.relatedSite ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    if (syntaxCount > 4) {
      warnings.push(t('adapter.validation.tooManySyntax'))
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
   * 验证日期格式
   */
  private isValidDate(dateStr: string): boolean {
    const date = new Date(dateStr)
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword.includes('Microsoft') && !params.site) {
      suggestions.push('限制搜索到微软官网：site:microsoft.com')
    }

    if (params.keyword.includes('documentation') && !params.fileType) {
      suggestions.push('添加文档类型：filetype:pdf 或 filetype:docx')
    }

    if (params.keyword.includes('news') && !params.dateRange) {
      suggestions.push('添加日期限制以获取最新新闻')
    }

    // 必应特殊建议
    if (params.keyword.includes('image') && !params.fileType) {
      suggestions.push('添加图片文件类型：filetype:jpg 或 filetype:png')
    }

    return suggestions
  }

  /**
   * 🔥 获取必应支持的 UI 功能特性
   * @returns 必应支持的功能特性数组
   */
  getSupportedFeatures(): import('@/types').UIFeatureType[] {
    return [
      // 位置限定
      'site',
      'filetype',
      'intitle',
      'inurl',
      'intext',  // Bing 使用 inbody: 但我们统一为 intext

      // 匹配精度
      'exact_match',

      // 逻辑运算
      'exclude',
      'or_keywords',

      // 范围过滤
      'date_range',

      // 特殊功能
      'related'  // Bing 支持 related: 语法
    ]
  }

  /**
   * 🔥 获取必应的功能分组配置
   * @returns 分组配置，用于 UI 组织
   */
  getFeatureGroups(): import('@/types').EngineFeatureGroups {
    return {
      // 位置限定组
      location: ['site', 'filetype', 'intitle', 'inurl', 'intext'],

      // 匹配精度组
      precision: ['exact_match'],

      // 逻辑运算组
      logic: ['exclude', 'or_keywords'],

      // 范围过滤组
      range: ['date_range'],

      // 特殊功能组
      special: ['related']
    }
  }
}