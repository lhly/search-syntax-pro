import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult } from '@/types'

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

    // 日期范围搜索（百度支持）
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
      const validTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar', 'jpg', 'png', 'gif']
      if (fileType && !validTypes.includes(fileType)) {
        warnings.push(`文件类型 "${fileType}" 可能不被百度支持`)
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
    if (fullQuery.length > 100) {
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
}