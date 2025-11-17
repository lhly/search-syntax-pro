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
  async validateParams(params: SearchParams): Promise<ValidationResult> {
    const language = await getCurrentLanguage()
    const errors: string[] = []
    const warnings: string[] = []

    // 检查关键词或精确匹配
    if (!params.keyword.trim() && !params.exactMatch?.trim()) {
      // Twitter 允许纯用户搜索，但建议添加关键词
      if (!params.fromUser && !params.toUser) {
        errors.push(translate(language, 'adapter.validation.userMissing'))
      } else {
        warnings.push(translate(language, 'adapter.validation.keywordRecommended'))
      }
    }

    // 验证用户名格式
    if (params.fromUser) {
      const username = this.cleanUsername(params.fromUser.trim())
      if (username && !this.isValidUsername(username)) {
        errors.push(translate(language, 'adapter.validation.usernameInvalid'))
      }
    }

    if (params.toUser) {
      const username = this.cleanUsername(params.toUser.trim())
      if (username && !this.isValidUsername(username)) {
        errors.push(translate(language, 'adapter.validation.usernameInvalid'))
      }
    }

    // 验证日期格式
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

    // 验证互动数据
    if (params.minRetweets !== undefined && params.minRetweets < 0) {
      errors.push(translate(language, 'adapter.validation.numberRangeInvalid'))
    }

    if (params.minFaves !== undefined && params.minFaves < 0) {
      errors.push(translate(language, 'adapter.validation.numberRangeInvalid'))
    }

    // 验证语言代码
    if (params.language) {
      const validLanguages = ['zh', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar']
      if (!validLanguages.includes(params.language.toLowerCase())) {
        warnings.push(translate(language, 'adapter.validation.languageUnsupported', { language: params.language }))
      }
    }

    // 检查内容过滤器
    if (params.contentFilters && params.contentFilters.length > 0) {
      const validFilters = ['images', 'videos', 'links', 'media', 'replies', 'retweets', 'news']
      const invalidFilters = params.contentFilters.filter(f => !validFilters.includes(f))
      if (invalidFilters.length > 0) {
        errors.push(translate(language, 'adapter.validation.filterInvalid', { filters: invalidFilters.join(', ') }))
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 200) {
      warnings.push(translate(language, 'adapter.validation.queryTooLong'))
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
      warnings.push(translate(language, 'adapter.validation.tooManySyntax'))
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
    // Note: Language labels use native language names for clarity
    // The label and placeholder use i18n keys which will be translated in the UI
    return {
      label: 'twitter.language.label',
      placeholder: 'twitter.language.placeholder',
      options: [
        { value: 'zh', label: 'twitter.language.zh' },
        { value: 'en', label: 'twitter.language.en' },
        { value: 'ja', label: 'twitter.language.ja' },
        { value: 'ko', label: 'twitter.language.ko' },
        { value: 'es', label: 'twitter.language.es' },
        { value: 'fr', label: 'twitter.language.fr' },
        { value: 'de', label: 'twitter.language.de' },
        { value: 'pt', label: 'twitter.language.pt' },
        { value: 'it', label: 'twitter.language.it' },
        { value: 'ru', label: 'twitter.language.ru' },
        { value: 'ar', label: 'twitter.language.ar' }
      ]
    }
  }
}
