import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult } from '@/types'

/**
 * Twitter/X 搜索引擎适配器
 * 实现 Twitter 高级搜索语法和 URL 构建
 *
 * 支持的搜索语法：
 * - from:@user - 来自特定用户的推文
 * - to:@user - 发送给特定用户的推文
 * - since:YYYY-MM-DD - 开始日期
 * - until:YYYY-MM-DD - 结束日期
 * - filter:images/videos/links/media/replies/retweets/news - 内容过滤
 * - min_retweets:N - 最少转发数
 * - min_faves:N - 最少点赞数
 * - lang:xx - 语言筛选
 * - -word - 排除关键词
 */
export class TwitterAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'X (Twitter)'
  }

  getBaseUrl(): string {
    return 'https://twitter.com/search'
  }

  /**
   * 构建 Twitter 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)
    return `${baseUrl}?q=${encodeURIComponent(query)}&src=typed_query`
  }

  /**
   * 构建搜索查询字符串
   * 按照 Twitter 搜索语法的优先级构建查询
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

    // 3. 用户相关筛选 - 🔥 支持多用户（OR组合）
    const fromUsers = params.fromUsers?.filter(u => u.trim()) ||
                      (params.fromUser ? [params.fromUser] : [])
    if (fromUsers.length > 0) {
      const fromQuery = fromUsers
        .map(u => `from:${this.cleanUsername(u.trim())}`)
        .join(' OR ')
      queryParts.push(fromUsers.length > 1 ? `(${fromQuery})` : fromQuery)
    }

    const toUsers = params.toUsers?.filter(u => u.trim()) ||
                    (params.toUser ? [params.toUser] : [])
    if (toUsers.length > 0) {
      const toQuery = toUsers
        .map(u => `to:${this.cleanUsername(u.trim())}`)
        .join(' OR ')
      queryParts.push(toUsers.length > 1 ? `(${toQuery})` : toQuery)
    }

    // 4. 日期范围筛选
    if (params.dateRange) {
      const { from, to } = params.dateRange
      if (from) {
        queryParts.push(`since:${this.formatDate(from)}`)
      }
      if (to) {
        queryParts.push(`until:${this.formatDate(to)}`)
      }
    }

    // 5. 内容过滤器
    if (params.contentFilters && params.contentFilters.length > 0) {
      params.contentFilters.forEach(filter => {
        queryParts.push(`filter:${filter}`)
      })
    }

    // 6. 互动数据筛选
    if (params.minRetweets !== undefined && params.minRetweets > 0) {
      queryParts.push(`min_retweets:${params.minRetweets}`)
    }

    if (params.minFaves !== undefined && params.minFaves > 0) {
      queryParts.push(`min_faves:${params.minFaves}`)
    }

    // 7. 语言筛选
    if (params.language && params.language.trim()) {
      queryParts.push(`lang:${params.language.trim()}`)
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

    // 9. 排除关键词（必须放在最后）
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
    }

    return queryParts.join(' ')
  }

  /**
   * 清理用户名（移除 @ 符号）
   */
  private cleanUsername(username: string): string {
    return username.startsWith('@') ? username.substring(1) : username
  }

  /**
   * 格式化日期为 Twitter 支持的格式 (YYYY-MM-DD)
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
   * 验证 Twitter 支持的语法
   */
  validateSyntax(syntax: SyntaxType): boolean {
    return this.getSupportedSyntax().includes(syntax)
  }

  /**
   * 获取支持的语法类型
   * Twitter 支持的主要搜索语法
   */
  getSupportedSyntax(): SyntaxType[] {
    return [
      'exact',           // 精确匹配 "phrase"
      'exclude',         // 排除关键词 -word
      'or',              // OR 逻辑
      'date_range',      // 日期范围 since:YYYY-MM-DD until:YYYY-MM-DD
      'from_user',       // 来自用户 from:@user
      'to_user',         // 发送给用户 to:@user
      'min_retweets',    // 最少转发数
      'min_faves',       // 最少点赞数
      'lang',            // 语言筛选
      'filter'           // 内容过滤器
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
  validateParams(params: SearchParams): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查关键词或精确匹配
    if (!params.keyword.trim() && !params.exactMatch?.trim()) {
      // Twitter 允许纯用户搜索，但建议添加关键词
      if (!params.fromUser && !params.toUser) {
        errors.push('请输入搜索关键词或指定用户')
      } else {
        warnings.push('建议添加关键词以获得更精确的搜索结果')
      }
    }

    // 验证用户名格式
    if (params.fromUser) {
      const username = this.cleanUsername(params.fromUser.trim())
      if (username && !this.isValidUsername(username)) {
        errors.push('来源用户名格式不正确（仅支持字母、数字和下划线）')
      }
    }

    if (params.toUser) {
      const username = this.cleanUsername(params.toUser.trim())
      if (username && !this.isValidUsername(username)) {
        errors.push('目标用户名格式不正确（仅支持字母、数字和下划线）')
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

    // 验证互动数据
    if (params.minRetweets !== undefined && params.minRetweets < 0) {
      errors.push('最少转发数不能为负数')
    }

    if (params.minFaves !== undefined && params.minFaves < 0) {
      errors.push('最少点赞数不能为负数')
    }

    // 验证语言代码
    if (params.language) {
      const validLanguages = ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar']
      if (!validLanguages.includes(params.language.toLowerCase())) {
        warnings.push(`语言代码 "${params.language}" 可能不被 Twitter 支持`)
      }
    }

    // 检查内容过滤器
    if (params.contentFilters && params.contentFilters.length > 0) {
      const validFilters = ['images', 'videos', 'links', 'media', 'replies', 'retweets', 'news']
      const invalidFilters = params.contentFilters.filter(f => !validFilters.includes(f))
      if (invalidFilters.length > 0) {
        errors.push(`不支持的内容过滤器: ${invalidFilters.join(', ')}`)
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 200) {
      warnings.push('搜索查询过长，可能影响搜索结果')
    }

    // 检查语法数量
    const syntaxCount = [
      params.fromUser ? 1 : 0,
      params.toUser ? 1 : 0,
      params.dateRange ? 1 : 0,
      params.minRetweets !== undefined ? 1 : 0,
      params.minFaves !== undefined ? 1 : 0,
      params.language ? 1 : 0,
      params.contentFilters && params.contentFilters.length > 0 ? 1 : 0,
      params.excludeWords && params.excludeWords.length > 0 ? 1 : 0,
      params.orKeywords && params.orKeywords.length > 0 ? 1 : 0
    ].reduce((a, b) => a + b, 0)

    if (syntaxCount > 6) {
      warnings.push('搜索条件过多，可能导致结果过少')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证用户名格式
   * Twitter 用户名规则：1-15 个字符，仅支持字母、数字和下划线
   */
  private isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/
    return usernameRegex.test(username)
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

    // 建议添加用户筛选
    if (params.keyword && !params.fromUser && !params.toUser) {
      suggestions.push('添加用户筛选以获得更精确的结果：from:@username')
    }

    // 建议添加日期范围
    if (params.keyword && !params.dateRange) {
      suggestions.push('添加时间限制以获取最新推文：since:YYYY-MM-DD')
    }

    // 建议添加内容过滤器
    if (params.keyword && (!params.contentFilters || params.contentFilters.length === 0)) {
      suggestions.push('使用内容过滤器优化搜索：filter:images、filter:videos 等')
    }

    // 建议添加互动数据筛选
    if (params.keyword && params.minRetweets === undefined && params.minFaves === undefined) {
      suggestions.push('筛选热门推文：设置最少转发数或点赞数')
    }

    // 建议使用精确匹配
    if (params.keyword && params.keyword.split(' ').length > 2 && !params.exactMatch) {
      suggestions.push('使用精确匹配提高结果准确性："重要短语"')
    }

    return suggestions
  }

  /**
   * 语法降级处理（Twitter 不需要降级，所有语法都支持）
   */
  degradeSyntax(params: SearchParams): SearchParams {
    // Twitter 支持所有已定义的语法，不需要降级
    return params
  }

  /**
   * 🔥 获取 Twitter 支持的 UI 功能特性
   * @returns Twitter 支持的功能特性数组
   */
  getSupportedFeatures(): import('@/types').UIFeatureType[] {
    return [
      // 用户筛选 (Twitter 专属)
      'from_user',
      'to_user',

      // 互动数据 (Twitter 专属)
      'min_retweets',
      'min_faves',
      'content_filters',

      // 内容匹配
      'exact_match',

      // 逻辑运算
      'exclude',
      'or_keywords',

      // 范围筛选
      'date_range',

      // 其他特性
      'language'
    ]
  }

  /**
   * 🔥 获取 Twitter 的功能分组配置
   * @returns 分组配置，用于 UI 组织
   */
  getFeatureGroups(): import('@/types').EngineFeatureGroups {
    return {
      // 用户筛选组
      user_filters: ['from_user', 'to_user'],

      // 互动数据组
      engagement: ['min_retweets', 'min_faves', 'content_filters'],

      // 匹配精度组
      precision: ['exact_match'],

      // 逻辑运算组
      logic: ['exclude', 'or_keywords'],

      // 范围过滤组
      range: ['date_range'],

      // 特殊功能组
      special: ['language']
    }
  }

  /**
   * 🔥 获取语言字段的UI配置
   * @returns Twitter的自然语言选项配置
   */
  getLanguageOptions(): import('@/types').LanguageFieldConfig {
    return {
      label: '语言筛选 (lang:)',
      placeholder: '选择推文语言',
      options: [
        { value: 'zh', label: '中文' },
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
        { value: 'ko', label: '한국어' },
        { value: 'es', label: 'Español' },
        { value: 'fr', label: 'Français' },
        { value: 'de', label: 'Deutsch' },
        { value: 'pt', label: 'Português' },
        { value: 'it', label: 'Italiano' },
        { value: 'ru', label: 'Русский' },
        { value: 'ar', label: 'العربية' }
      ]
    }
  }
}
