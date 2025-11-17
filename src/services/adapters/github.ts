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
 * GitHub 搜索引擎适配器
 * 支持代码搜索和仓库发现
 *
 * 特点:
 * - 1亿+开发者用户
 * - 4亿+公开仓库
 * - 支持代码、仓库、用户等多维度搜索
 * - 强大的语言和路径筛选功能
 */
export class GitHubAdapter implements SearchEngineAdapter {
  getName(): string {
    return 'GitHub'
  }

  getBaseUrl(): string {
    return 'https://github.com/search'
  }

  /**
   * 构建 GitHub 搜索查询 URL
   */
  buildQuery(params: SearchParams): string {
    const baseUrl = this.getBaseUrl()
    const query = this.buildSearchQuery(params)

    const urlParams = new URLSearchParams({
      q: query,
      type: 'code'  // 默认搜索代码
    })

    return `${baseUrl}?${urlParams.toString()}`
  }

  /**
   * 构建搜索查询字符串
   * 按照 GitHub 搜索语法优先级构建查询
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

    // 3. 仓库筛选 - 🔥 支持多仓库（OR组合）
    // 格式: user/repo 或 org/repo
    const sites = params.sites?.filter(s => s.trim()) ||
                  (params.site ? [params.site] : [])
    if (sites.length > 0) {
      const repoQuery = sites
        .map(s => `repo:${s.trim()}`)
        .join(' OR ')
      queryParts.push(sites.length > 1 ? `(${repoQuery})` : repoQuery)
    }

    // 4. 语言筛选 - 🔥 支持多语言（OR组合）
    const languages = params.languages?.filter(lang => lang.trim()) ||
                      (params.language ? [params.language] : [])
    if (languages.length > 0) {
      const langQuery = languages
        .map(lang => `language:${lang.trim()}`)
        .join(' OR ')
      queryParts.push(languages.length > 1 ? `(${langQuery})` : langQuery)
    }

    // 5. 文件路径筛选 (使用inUrl作为path:)
    if (params.inUrl && params.inUrl.trim()) {
      queryParts.push(`path:${params.inUrl.trim()}`)
    }

    // 6. 文件名筛选 - 🔥 支持多文件名（OR组合）
    const fileTypes = params.fileTypes?.filter(ft => ft.trim()) ||
                      (params.fileType ? [params.fileType] : [])
    if (fileTypes.length > 0) {
      const fileQuery = fileTypes
        .map(ft => `filename:${ft.trim()}`)
        .join(' OR ')
      queryParts.push(fileTypes.length > 1 ? `(${fileQuery})` : fileQuery)
    }

    // 7. 用户筛选 - 🔥 支持多用户（OR组合）
    const fromUsers = params.fromUsers?.filter(u => u.trim()) ||
                      (params.fromUser ? [params.fromUser] : [])
    if (fromUsers.length > 0) {
      const userQuery = fromUsers
        .map(u => `user:${u.replace('@', '').trim()}`)
        .join(' OR ')
      queryParts.push(fromUsers.length > 1 ? `(${userQuery})` : userQuery)
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
      'site',        // 映射为 repo:
      'exact',
      'lang',        // language:
      'inurl',       // 映射为 path:
      'filetype',    // 映射为 filename:
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
      'site',           // 显示为"仓库"
      'exact_match',
      'language',
      'inurl',          // 显示为"路径"
      'filetype',       // 显示为"文件名"
      'from_user',      // 显示为"用户"
      'exclude',
      'or_keywords'
    ]
  }

  /**
   * 获取功能分组配置
   */
  getFeatureGroups(): EngineFeatureGroups {
    return {
      // 代码筛选组 (GitHub特有)
      location: ['site', 'inurl', 'filetype', 'language'],

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

    // 检查仓库格式 (user/repo 或 org/repo)
    if (params.site && params.site.trim()) {
      const repoPattern = /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/
      if (!repoPattern.test(params.site.trim())) {
        warnings.push(translate(language, 'adapter.validation.repoInvalid'))
      }
    }

    // 检查用户名格式
    if (params.fromUser && params.fromUser.trim()) {
      const username = params.fromUser.replace('@', '').trim()
      const usernamePattern = /^[a-zA-Z0-9_-]+$/
      if (!usernamePattern.test(username)) {
        warnings.push(translate(language, 'adapter.validation.usernameInvalid'))
      }
    }

    // 检查语言代码
    if (params.language && params.language.trim()) {
      const validLangs = [
        'javascript', 'typescript', 'python', 'java', 'go', 'rust',
        'c', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'dart'
      ]
      const lang = params.language.toLowerCase()
      if (!validLangs.includes(lang)) {
        warnings.push(translate(language, 'adapter.validation.languageUnsupported', { language: params.language }))
      }
    }

    // 检查查询复杂度
    const fullQuery = this.buildSearchQuery(params)
    if (fullQuery.length > 256) {
      warnings.push(translate(language, 'adapter.validation.queryTooLong'))
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
      suggestions.push('指定仓库可以缩小搜索范围: repo:user/repository')
    }

    if (params.keyword && !params.language) {
      suggestions.push('使用 language: 可以按编程语言筛选')
    }

    if (params.keyword && !params.inUrl) {
      suggestions.push('使用 path: 可以在特定目录中搜索')
    }

    if (params.keyword && !params.exactMatch) {
      suggestions.push('使用精确匹配可以更准确地定位代码')
    }

    return suggestions
  }

  /**
   * 语法降级处理
   */
  degradeSyntax(params: SearchParams): SearchParams {
    // GitHub 支持所有已定义的语法，不需要降级
    return params
  }

  /**
   * 🔥 获取语言字段的UI配置
   * @returns GitHub的编程语言选项配置
   */
  getLanguageOptions(): import('@/types').LanguageFieldConfig {
    // Note: Language labels are kept in English as they are programming language names
    // The label and placeholder use i18n keys which will be translated in the UI
    return {
      label: 'github.language.label',
      placeholder: 'github.language.placeholder',
      options: [
        { value: 'javascript', label: 'github.language.javascript' },
        { value: 'typescript', label: 'github.language.typescript' },
        { value: 'python', label: 'github.language.python' },
        { value: 'java', label: 'github.language.java' },
        { value: 'go', label: 'github.language.go' },
        { value: 'rust', label: 'github.language.rust' },
        { value: 'cpp', label: 'github.language.cpp' },
        { value: 'c', label: 'github.language.c' },
        { value: 'csharp', label: 'github.language.csharp' },
        { value: 'ruby', label: 'github.language.ruby' },
        { value: 'php', label: 'github.language.php' },
        { value: 'swift', label: 'github.language.swift' },
        { value: 'kotlin', label: 'github.language.kotlin' },
        { value: 'dart', label: 'github.language.dart' },
        { value: 'shell', label: 'github.language.shell' },
        { value: 'html', label: 'github.language.html' },
        { value: 'css', label: 'github.language.css' },
        { value: 'vue', label: 'github.language.vue' }
      ]
    }
  }
}
