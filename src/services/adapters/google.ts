import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult } from '@/types'

/**
 * 谷歌搜索引擎适配器
 * 实现谷歌搜索的特殊语法和URL构建
 */
export class GoogleAdapter implements SearchEngineAdapter {
  getName(): string {
    return '谷歌'
  }

  getBaseUrl(): string {
    return 'https://www.google.com/search'
  }

  /**
   * 构建谷歌搜索查询URL
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

    // 精确匹配优先级最高
    if (params.exactMatch && params.exactMatch.trim()) {
      query = `"${params.exactMatch.trim()}"`
      if (params.keyword.trim()) {
        query = `${query} ${params.keyword.trim()}`
      }
    }

    // 网站内搜索
    if (params.site && params.site.trim()) {
      const site = this.cleanSiteDomain(params.site.trim())
      query += ` site:${site}`
    }

    // 文件类型搜索
    if (params.fileType && params.fileType.trim()) {
      query += ` filetype:${params.fileType.trim()}`
    }

    // 日期范围搜索（谷歌支持更丰富的日期语法）
    if (params.dateRange) {
      const dateFilter = this.buildDateFilter(params.dateRange)
      if (dateFilter) {
        query += ` ${dateFilter}`
      }
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
   * 构建日期过滤语法（谷歌支持更灵活的日期格式）
   */
  private buildDateFilter(dateRange: { from: string; to: string }): string {
    const { from, to } = dateRange

    if (from && to) {
      const fromDate = this.formatDate(from)
      const toDate = this.formatDate(to)
      return `after:${fromDate} before:${toDate}`
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
   * 格式化日期为谷歌支持的格式
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
   * 验证谷歌支持的语法
   */
  validateSyntax(syntax: SyntaxType): boolean {
    const supportedSyntax: SyntaxType[] = ['site', 'filetype', 'exact', 'date_range']
    return supportedSyntax.includes(syntax)
  }

  /**
   * 获取支持的语法类型
   */
  getSupportedSyntax(): SyntaxType[] {
    return ['site', 'filetype', 'exact', 'date_range']
  }

  /**
   * 验证搜索参数
   */
  validateParams(params: SearchParams): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查关键词或精确匹配
    if (!params.keyword.trim() && !params.exactMatch?.trim()) {
      errors.push('请输入搜索关键词或精确匹配内容')
    }

    // 验证网站域名格式
    if (params.site) {
      const site = params.site.trim()
      if (site && !this.isValidDomain(site)) {
        errors.push('网站域名格式不正确')
      }
    }

    // 验证文件类型
    if (params.fileType) {
      const fileType = params.fileType.trim().toLowerCase()
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'png', 'gif', 'svg', 'mp4', 'avi', 'mp3']
      if (fileType && !validTypes.includes(fileType)) {
        warnings.push(`文件类型 "${fileType}" 可能不被谷歌支持`)
      }
    }

    // 验证日期格式
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from && !this.isValidDate(from)) {
        errors.push('开始日期格式不正确')
      }
      if (to && !this.isValidDate(to)) {
        errors.push('结束日期格式不正确')
      }
      if (from && to && new Date(from) > new Date(to)) {
        errors.push('开始日期不能晚于结束日期')
      }
    }

    // 检查查询长度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 120) {
      warnings.push('搜索查询过长，可能影响搜索结果')
    }

    // 谷歌特殊检查：避免过度限制
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fileType ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.dateRange ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    if (syntaxCount > 3) {
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

    if (params.keyword.includes('research') && !params.fileType) {
      suggestions.push('添加学术文件类型：filetype:pdf')
    }

    if (params.keyword.includes('site:') && !params.site) {
      suggestions.push('使用网站搜索功能，而不是在关键词中输入site:')
    }

    if (params.keyword.includes('tutorial') && !params.dateRange) {
      suggestions.push('添加时间限制以获取最新教程')
    }

    // 谷歌特殊建议
    if (params.keyword && !params.exactMatch && params.keyword.split(' ').length > 3) {
      suggestions.push('使用精确匹配提高结果准确性：\"重要短语\"')
    }

    return suggestions
  }
}