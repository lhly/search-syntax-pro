import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType, EngineFeatureGroups } from '@/types'

/**
 * Reddit 搜索引擎适配器
 * 支持社区内容搜索和用户生成内容发现
 *
 * 特点:
 * - 月活用户4.3亿+
 * - 日帖子量200万+
 * - 支持subreddit、作者等社区专属筛选
 * - 真实用户讨论和观点搜索
 */
export class RedditAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Reddit'
  }

  getBaseUrl(): string {
    return 'https://www.reddit.com/search/'
  }

  /**
   * 构建 Reddit 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)

    const urlParams = new URLSearchParams({
      q: query,
      sort: 'relevance',
      t: 'all'
    })

    return `${baseUrl}?${urlParams.toString()}`
  }

  /**
   * 构建搜索查询字符串
   * 按照 Reddit 搜索语法优先级构建查询
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

    // 3. Subreddit筛选 - 🔥 支持多版块（OR组合）
    const subreddits = params.subreddits?.filter(s => s.trim()) ||
                       (params.site ? [params.site] : [])
    if (subreddits.length > 0) {
      const subQuery = subreddits
        .map(s => `subreddit:${s.replace(/^r\//, '').trim()}`)
        .join(' OR ')
      queryParts.push(subreddits.length > 1 ? `(${subQuery})` : subQuery)
    }

    // 4. 作者筛选 - 🔥 支持多作者（OR组合）
    const fromUsers = params.fromUsers?.filter(u => u.trim()) ||
                      (params.fromUser ? [params.fromUser] : [])
    if (fromUsers.length > 0) {
      const authorQuery = fromUsers
        .map(u => `author:${u.replace(/^u\/|^@/, '').trim()}`)
        .join(' OR ')
      queryParts.push(fromUsers.length > 1 ? `(${authorQuery})` : authorQuery)
    }

    // 5. URL筛选
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`url:${params.inUrl.trim()}`)
    }

    // 6. 标题搜索
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 7. 正文搜索 (使用selftext:)
    if (params.inText && params.inText.trim()) {
      queryParts.push(`selftext:${params.inText.trim()}`)
    }

    // 8. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    // 9. OR 逻辑关键词
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
      'site',        // 映射为 subreddit:
      'exact',
      'intitle',     // 映射为 title:
      'inurl',       // 映射为 url:
      'intext',      // 映射为 selftext:
      'exclude',
      'or',
      'from_user'    // 映射为 author:
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
      'site',           // 显示为"Subreddit"
      'exact_match',
      'intitle',
      'inurl',
      'intext',
      'exclude',
      'or_keywords',
      'from_user'       // 显示为"作者"
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): EngineFeatureGroups {
    return {
      // 社区筛选组 (Reddit特有)
      user_filters: ['from_user'],

      // 位置限定组
      location: ['site', 'intitle', 'inurl', 'intext'],

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

    // 检查基本关键词
    if (!params.keyword || !params.keyword.trim()) {
      if (!params.exactMatch && !params.site && !params.fromUser) {
        errors.push('请输入搜索关键词')
      }
    }

    // 检查subreddit名称格式
    if (params.site && params.site.trim()) {
      const subreddit = params.site.replace(/^r\//, '').trim()
      const subredditPattern = /^[a-zA-Z0-9_]{3,21}$/
      if (!subredditPattern.test(subreddit)) {
        warnings.push('Subreddit名称格式可能不正确（3-21个字符，仅字母、数字和下划线）')
      }
    }

    // 检查用户名格式
    if (params.fromUser && params.fromUser.trim()) {
      const username = params.fromUser.replace(/^u\/|^@/, '').trim()
      const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/
      if (!usernamePattern.test(username)) {
        warnings.push('用户名格式可能不正确（3-20个字符，仅字母、数字、下划线和连字符）')
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 250) {
      warnings.push('搜索查询过长，可能影响搜索结果')
    }

    // 检查语法数量
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fromUser ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.inTitle ? 1 : 0,
      params.inUrl ? 1 : 0,
      params.inText ? 1 : 0,
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
   * 获取搜索建议
   */
  getSearchSuggestions(params: SearchParams): string[] {
    const suggestions: string[] = []

    if (params.keyword && !params.site) {
      suggestions.push('指定 subreddit: 可以在特定社区内搜索')
    }

    if (params.keyword && !params.fromUser) {
      suggestions.push('使用 author: 可以搜索特定用户的帖子')
    }

    if (params.keyword && !params.inTitle && !params.inText) {
      suggestions.push('使用 title: 或 selftext: 可以更精确地定位内容')
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
    // Reddit 支持所有已定义的语法，不需要降级
    return params
  }
}
