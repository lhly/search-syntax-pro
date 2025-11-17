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
 * 百度搜索引擎适配器
 * 实现百度搜索的特殊语法和URL构建
 */
export class BaiduAdapter implements SearchEngineAdapter {
  getName(): string {
    return '百度'
  }

  getBaseUrl(): string {
    return 'https://www.baidu.com/s'
  }

  /**
   * 构建百度搜索查询URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    let query = this.buildSearchQuery(params)
    return `${baseUrl}?wd=${encodeURIComponent(query)}`
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

    // 4. 位置性语法 (intitle, inurl, intext)
    // 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      query += ` intitle:${params.inTitle.trim()}`
    }

    // URL搜索
    if (params.inUrl && params.inUrl.trim()) {
      query += ` inurl:${params.inUrl.trim()}`
    }

    // 正文搜索 (百度使用intext:)
    if (params.inText && params.inText.trim()) {
      query += ` intext:${params.inText.trim()}`
    }

    // 所有关键词在标题
    if (params.allInTitle && params.allInTitle.trim()) {
      query += ` allintitle:${params.allInTitle.trim()}`
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

    // 7. 特殊功能 (cache)
    // 网页缓存 (百度支持)
    if (params.cacheSite && params.cacheSite.trim()) {
      query = `cache:${params.cacheSite.trim()}`
    }

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
      // 百度日期格式：..2024-01-01
      const toDate = this.formatDate(to)
      return `..${toDate}`
    } else if (from) {
      const fromDate = this.formatDate(from)
      return `${fromDate}..`
    } else if (to) {
      const toDate = this.formatDate(to)
      return `..${toDate}`
    }

    return ''
  }

  /**
   * 格式化日期为百度支持的格式
   */
  private formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr)
      return date.toISOString().split('T')[0]
    } catch {
      return dateStr
    }
  }

  /**
   * 验证百度支持的语法
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
      'intext',
      'number_range',
      'wildcard',
      'allintitle',
      'cache'
      // 注意: 百度不支持 'related'
    ]
  }

  /**
   * 语法兼容性检查
   */
  isSyntaxSupported(syntax: SyntaxType): boolean {
    return this.validateSyntax(syntax)
  }

  /**
   * 验证搜索参数
   */
  async validateParams(params: SearchParams): Promise<ValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const language = await getCurrentLanguage()
    const t = (key: string, vars?: Record<string, string | number>) => translate(language, key, vars)

    // 检查关键词或精确匹配或缓存查询
    if (!params.keyword.trim() && !params.exactMatch?.trim() && !params.cacheSite?.trim()) {
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
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'png', 'gif']
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

    // 验证缓存站点
    if (params.cacheSite) {
      const cacheSite = params.cacheSite.trim()
      if (cacheSite && !this.isValidUrl(cacheSite)) {
        errors.push(t('adapter.validation.cacheUrlInvalid'))
      }
    }

    // 检查查询长度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 150) {
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
      params.cacheSite ? 1 : 0
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
   * 验证URL格式
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword.includes('教程') && !params.fileType) {
      suggestions.push('添加文件类型限制：filetype:pdf')
    }

    if (params.keyword.includes('官网') && !params.site) {
      suggestions.push('添加网站限制：site:官方网站域名')
    }

    if (params.keyword.length > 10 && !params.exactMatch) {
      suggestions.push('使用精确匹配：\"关键词\"')
    }

    return suggestions
  }

  /**
   * 🔥 获取百度支持的 UI 功能特性
   * @returns 百度支持的功能特性数组
   */
  getSupportedFeatures(): import('@/types').UIFeatureType[] {
    return [
      // 位置限定
      'site',
      'filetype',
      'intitle',
      'inurl',

      // 匹配精度
      'exact_match',

      // 逻辑运算
      'exclude',
      'or_keywords',

      // 范围过滤
      'date_range',

      // 特殊功能
      'cache'  // 百度支持 cache: 语法
    ]
  }

  /**
   * 🔥 获取百度的功能分组配置
   * @returns 分组配置，用于 UI 组织
   */
  getFeatureGroups(): import('@/types').EngineFeatureGroups {
    return {
      // 位置限定组
      location: ['site', 'filetype', 'intitle', 'inurl'],

      // 匹配精度组
      precision: ['exact_match'],

      // 逻辑运算组
      logic: ['exclude', 'or_keywords'],

      // 范围过滤组
      range: ['date_range'],

      // 特殊功能组
      special: ['cache']
    }
  }
}