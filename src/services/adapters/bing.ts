import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult } from '@/types'

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

    // 日期范围搜索（必应支持）
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
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'png', 'gif', 'bmp', 'tiff']
      if (fileType && !validTypes.includes(fileType)) {
        warnings.push(`文件类型 "${fileType}" 可能不被必应支持`)
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
    if (fullQuery.length > 110) {
      warnings.push('搜索查询过长，可能影响搜索结果')
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
}