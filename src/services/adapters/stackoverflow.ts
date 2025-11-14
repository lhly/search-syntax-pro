import type { SearchEngineAdapter, SearchParams, SyntaxType, ValidationResult, UIFeatureType, EngineFeatureGroups } from '@/types'

/**
 * Stack Overflow 搜索引擎适配器
 * 支持技术问答搜索和标签筛选
 *
 * 特点:
 * - 月访问量5000万+
 * - 问题数量2400万+
 * - 支持标签系统的精准筛选
 * - 社区认可的最佳实践和解决方案
 */
export class StackOverflowAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'Stack Overflow'
  }

  getBaseUrl(): string {
    return 'https://stackoverflow.com/search'
  }

  /**
   * 构建 Stack Overflow 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)

    const urlParams = new URLSearchParams({
      q: query
    })

    return `${baseUrl}?${urlParams.toString()}`
  }

  /**
   * 构建搜索查询字符串
   * 按照 Stack Overflow 搜索语法优先级构建查询
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

    // 3. 标签筛选 - 🔥 支持多标签（原生并列，Stack Overflow特殊语法）
    // Stack Overflow 使用 [tag] 格式，多标签直接并列
    const tags = params.tags?.filter(t => t.trim()) ||
                 (params.site ? params.site.split(',').map(t => t.trim()).filter(Boolean) : [])
    if (tags.length > 0) {
      tags.forEach(tag => {
        // 移除可能存在的方括号
        const cleanTag = tag.replace(/^\[|\]$/g, '')
        queryParts.push(`[${cleanTag}]`)
      })
    }

    // 4. 用户筛选 - 🔥 支持多用户（OR组合）
    const fromUsers = params.fromUsers?.filter(u => u.trim()) ||
                      (params.fromUser ? [params.fromUser] : [])
    if (fromUsers.length > 0) {
      const validUsers = fromUsers.filter(u => {
        const userId = u.replace(/^@/, '').trim()
        return /^\d+$/.test(userId) || userId.toLowerCase() === 'me'
      })
      if (validUsers.length > 0) {
        const userQuery = validUsers
          .map(u => {
            const userId = u.replace(/^@/, '').trim()
            return `user:${userId}`
          })
          .join(' OR ')
        queryParts.push(validUsers.length > 1 ? `(${userQuery})` : userQuery)
      }
    }

    // 5. 标题搜索 (使用inTitle作为title:)
    if (params.inTitle && params.inTitle.trim()) {
      queryParts.push(`title:${params.inTitle.trim()}`)
    }

    // 6. 正文搜索 (使用inText作为body:)
    if (params.inText && params.inText.trim()) {
      queryParts.push(`body:${params.inText.trim()}`)
    }

    // 7. 排除关键词
    if (params.excludeWords && params.excludeWords.length > 0) {
      params.excludeWords.forEach(word => {
        if (word.trim()) {
          queryParts.push(`-${word.trim()}`)
        }
      })
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
      'site',        // 映射为 [tag]
      'exact',
      'intitle',     // 映射为 title:
      'intext',      // 映射为 body:
      'from_user',   // 映射为 user:
      'exclude',
      'or'
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
      'site',           // 显示为"标签"
      'exact_match',
      'intitle',
      'intext',
      'from_user',      // 显示为"用户ID"
      'exclude',
      'or_keywords'
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): EngineFeatureGroups {
    return {
      // 内容筛选组
      location: ['site', 'intitle', 'intext'],

      // 用户筛选组
      user_filters: ['from_user'],

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
      if (!params.exactMatch && !params.site) {
        errors.push('请输入搜索关键词')
      }
    }

    // 检查标签格式
    if (params.site && params.site.trim()) {
      const tags = params.site.split(',').map(tag => tag.trim()).filter(Boolean)
      tags.forEach(tag => {
        const cleanTag = tag.replace(/^\[|\]$/g, '')
        const tagPattern = /^[a-zA-Z0-9#.+-]+$/
        if (!tagPattern.test(cleanTag)) {
          warnings.push(`标签 "${cleanTag}" 格式可能不正确`)
        }
      })

      if (tags.length > 5) {
        warnings.push('标签数量过多，建议不超过5个')
      }
    }

    // 检查用户ID格式
    if (params.fromUser && params.fromUser.trim()) {
      const userId = params.fromUser.replace('@', '').trim()
      if (userId !== 'me' && !/^\d+$/.test(userId)) {
        warnings.push('用户ID应为数字或"me"（搜索自己的问题）')
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 240) {
      warnings.push('搜索查询过长，可能影响搜索结果')
    }

    // 检查语法数量
    const syntaxCount = [
      params.site ? 1 : 0,
      params.fromUser ? 1 : 0,
      params.exactMatch ? 1 : 0,
      params.inTitle ? 1 : 0,
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
      suggestions.push('使用标签可以更精准地定位问题: [javascript] [react]')
    }

    if (params.keyword && !params.exactMatch) {
      suggestions.push('使用精确匹配可以搜索特定错误消息或代码片段')
    }

    if (params.keyword && !params.inTitle && !params.inText) {
      suggestions.push('使用 title: 或 body: 可以在特定部分搜索')
    }

    if (params.site && !params.orKeywords) {
      suggestions.push('可以使用 OR 搜索多个相关标签的问题')
    }

    return suggestions
  }

  /**
   * 语法降级处理
   */
  degradeSyntax(params: SearchParams): SearchParams {
    // Stack Overflow 支持所有已定义的语法，不需要降级
    return params
  }
}
