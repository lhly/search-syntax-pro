import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType, EngineFeatureGroups, Language } from '@/types'
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
 * Yandex 搜索引擎适配器
 * 支持俄语优化和独特的高级搜索语法
 *
 * 特点:
 * - 俄罗斯第一搜索引擎
 * - 俄语市场份额60%
 * - 支持独特的 mime: 和 rhost: 语法
 * - 优化的俄语和东欧语言支持
 */
export class YandexAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Yandex'
  }

  getBaseUrl(): string {
    return 'https://yandex.com/search/'
  }

  /**
   * 构建 Yandex 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    const urlParams = new URLSearchParams({
      text: query
    })

    return `${baseUrl}?${urlParams.toString()}`
  }

  /**
   * 构建搜索查询字符串
   * 按照 Yandex 语法优先级构建查询
   */
  private buildSearchQuery(params: SearchParams): string {
    const queryParts: string[] = []

    // 1. 基础关键词
    if (params.keyword && params.keyword.trim()) {
      queryParts.push(params.keyword.trim())
    }

    // 2. 精确匹配 - 🔥 支持多关键词（原生并列）
    const exactMatches = params.exactMatches?.filter(m => m.trim()) ||
                         (params.exactMatch ? [params.exactMatch] : [])
    if (exactMatches.length > 0) {
      exactMatches.forEach(match => {
        queryParts.push(`"${match.trim()}"`)
      })
    }

    // 3. 网站内搜索 - 🔥 支持多网站（OR组合）
    const sites = params.sites?.filter(s => s.trim()) ||
                  (params.site ? [params.site] : [])
    if (sites.length > 0) {
      const siteQuery = sites
        .map(s => `site:${this.cleanSiteDomain(s.trim())}`)
        .join(' | ')  // Yandex使用 | 而非 OR
      queryParts.push(sites.length > 1 ? `(${siteQuery})` : siteQuery)
    }

    // 4. MIME类型搜索 - 🔥 支持多类型（OR组合，Yandex独有）
    const fileTypes = params.fileTypes?.filter(ft => ft.trim()) ||
                      (params.fileType ? [params.fileType] : [])
    if (fileTypes.length > 0) {
      const mimeQuery = fileTypes
        .map(ft => `mime:${ft.trim()}`)
        .join(' | ')  // Yandex使用 | 而非 OR
      queryParts.push(fileTypes.length > 1 ? `(${mimeQuery})` : mimeQuery)
    }

    // 5. 标题搜索 (Yandex使用title:而非intitle:)
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 6. URL搜索 (Yandex使用url:而非inurl:)
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`url:${params.inUrl.trim()}`)
    }

    // 7. 日期范围 (使用 date:YYYYMMDD..YYYYMMDD 格式)
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && to) {
        const fromDate = this.formatDate(from)
        const toDate = this.formatDate(to)
        queryParts.push(`date:${fromDate}..${toDate}`)
      }
    }

    // 8. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 9. OR 逻辑关键词 (Yandex使用 | 符号而非 OR)
    if (params.orKeywords && params.orKeywords.length > 0) {
      const orQuery = params.orKeywords
        .filter(word => word.trim())
        .join(' | ')
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
   * 格式化日期为 YYYYMMDD 格式
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}${month}${day}`
    } catch {
      return dateString.replace(/[-/]/g, '')
    }
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
      'filetype',   // 实际使用 mime:
      'exact',
      'intitle',    // 实际使用 title:
      'inurl',      // 实际使用 url:
      'exclude',
      'or',
      'date_range'
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
      'or_keywords',
      'date_range'
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
      logic: ['exclude', 'or_keywords'],

      // 范围过滤组
      range: ['date_range']
    }
  }

  /**
   * 验证搜索参数
   */
  async validateParams(params: SearchParams): Promise<ValidationResult> {
    const language = await getCurrentLanguage()
    const errors: string[] = []
    const warnings: string[] = []

    // 检查基本关键词
    if (!params.keyword || !params.keyword.trim()) {
      if (!params.exactMatch && !params.site) {
        errors.push(translate(language, 'adapter.validation.keywordRequired'))
      }
    }

    // 检查网站域名格式
    if (params.site && params.site.trim()) {
      const site = this.cleanSiteDomain(params.site.trim())
      if (!this.isValidDomain(site)) {
        warnings.push(translate(language, 'adapter.validation.domainInvalid'))
      }
    }

    // 检查MIME类型
    if (params.fileType && params.fileType.trim()) {
      const validMimeTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'xml', 'txt', 'image']
      if (!validMimeTypes.includes(params.fileType.toLowerCase())) {
        warnings.push(translate(language, 'adapter.validation.fileTypeUnsupported', { fileType: params.fileType, engine: 'Yandex' }))
      }
    }

    // 检查日期范围
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && !this.isValidDate(from)) {
        errors.push(translate(language, 'adapter.validation.dateFromInvalid'))
      }
      if (to && !this.isValidDate(to)) {
        errors.push(translate(language, 'adapter.validation.dateToInvalid'))
      }
      if (from && to && new Date(from) > new Date(to)) {
        errors.push(translate(language, 'adapter.validation.dateRangeInvalid'))
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 200) {
      warnings.push(translate(language, 'adapter.validation.queryTooLong'))
    }

    // 检查语法数量
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fileType ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.inTitle ? 1 : 0,
      params.inUrl ? 1 : 0,
      params.dateRange ? 1 : 0,
      params.excludeWords && params.excludeWords.length > 0 ? 1 : 0,
      params.orKeywords && params.orKeywords.length > 0 ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    if (syntaxCount > 5) {
      warnings.push(translate(language, 'adapter.validation.tooManySyntax'))
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

    if (params.keyword && !params.site) {
      suggestions.push('尝试添加 site: 限定搜索范围')
    }

    if (params.keyword && !params.dateRange) {
      suggestions.push('使用日期范围筛选最新内容')
    }

    if (params.keyword && !params.fileType) {
      suggestions.push('使用 mime: 搜索特定文件类型')
    }

    if (params.keyword && !params.exactMatch) {
      suggestions.push('使用精确匹配获得更准确的结果')
    }

    return suggestions
  }

  /**
   * 语法降级处理
   */
  degradeSyntax(params: SearchParams): SearchParams {
    // Yandex 支持所有已定义的语法，不需要降级
    return params
  }
}
