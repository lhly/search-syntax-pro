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

  /**
   * 构建 360搜索 查询URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}`
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

    // 2. 限定性语法 (site, filetype) - 不支持 OR 组合
    // 360搜索 不支持多站点 OR 组合,仅使用第一个
    const sites = params.sites?.filter(s => s.trim()) ||
                  (params.site ? [params.site] : [])
    if (sites.length > 0) {
      query += ` site:${this.cleanSiteDomain(sites[0].trim())}`
    }

    // 360搜索 不支持多文件类型 OR 组合,仅使用第一个
    const fileTypes = params.fileTypes?.filter(ft => ft.trim()) ||
                      (params.fileType ? [params.fileType] : [])
    if (fileTypes.length > 0) {
      query += ` filetype:${fileTypes[0].trim()}`
    }

    // 3. 位置性语法 (仅支持 intitle)
    if (params.inTitle && params.inTitle.trim()) {
      query += ` intitle:${params.inTitle.trim()}`
    }

    // 4. 逻辑运算符 (仅支持 exclude)
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          query += ` -${word.trim()}`
        }
      })
    }

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
   * 获取支持的语法类型
   */
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
    const unsupportedFields: Array<keyof SearchParams> = [
      'orKeywords', 'dateRange', 'inUrl', 'inText', 'allInTitle',
      'numberRange', 'wildcardQuery', 'relatedSite', 'cacheSite'
    ]

    unsupportedFields.forEach(field => {
      if (params[field]) {
        (degradedParams as any)[field] = undefined
        warnings.push(`360搜索不支持${field}语法`)
      }
    })

    if (warnings.length > 0) {
      console.warn(`[360搜索] 语法降级:`, warnings.join('; '))
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
      'site', 'filetype', 'intitle',
      'exact_match', 'exclude'
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): import('@/types').EngineFeatureGroups {
    return {
      location: ['site', 'filetype', 'intitle'],
      precision: ['exact_match'],
      logic: ['exclude']
    }
  }

  /**
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword.includes('下载') && !params.site) {
      suggestions.push('添加站点限制以获得更准确的下载链接')
    }

    return suggestions
  }
}
