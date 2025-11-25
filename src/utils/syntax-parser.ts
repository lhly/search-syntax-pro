import type { SearchParams, SearchEngine } from '@/types'

/**
 * 语法解析结果接口
 */
export interface ParsedSyntax extends Partial<SearchParams> {
  keyword: string
}

/**
 * 语法模式定义
 */
const SYNTAX_PATTERNS = {
  // 精确匹配: "phrase" 或 "phrase with spaces"
  exactMatch: /"([^"]*)"/g,

  // site: 语法 (支持多个)
  site: /site:([^\s]+)/gi,

  // filetype: 语法 (支持多个)
  filetype: /filetype:([^\s]+)/gi,

  // intitle: 语法
  intitle: /intitle:([^\s]+)/gi,

  // inurl: 语法
  inurl: /inurl:([^\s]+)/gi,

  // intext/inbody: 语法 (两种写法都支持)
  intext: /in(?:text|body):([^\s]+)/gi,

  // allintitle: 语法 (捕获连字符连接的词或单个词)
  allintitle: /allintitle:([^\s]+)/gi,

  // 排除词: -word (但不匹配数字范围如 100-200)
  exclude: /-(\w+)/g,

  // 日期范围: after:YYYY-MM-DD, before:YYYY-MM-DD
  dateAfter: /after:(\d{4}-\d{2}-\d{2})/gi,
  dateBefore: /before:(\d{4}-\d{2}-\d{2})/gi,

  // 数字范围: min..max
  numberRange: /(\d+)\.\.(\d+)/g,

  // OR 逻辑: word1 OR word2 (全局匹配所有OR)
  or: /(\w+:\S+|\w+)\s+OR\s+(\w+:\S+|\w+)/gi,

  // related: 语法
  related: /related:([^\s]+)/gi,

  // cache: 语法
  cache: /cache:([^\s]+)/gi,

  // Twitter 专属语法
  fromUser: /from:@?([^\s]+)/gi,
  toUser: /to:@?([^\s]+)/gi,
  minRetweets: /min_retweets:(\d+)/gi,
  minFaves: /min_faves:(\d+)/gi,

  // Reddit 专属语法
  subreddit: /subreddit:([^\s]+)/gi,

  // GitHub 专属语法
  language: /language:([^\s]+)/gi,

  // StackOverflow 专属语法
  tag: /\[([^\]]+)\]/g,

  // 通配符查询 (包含 * 的整个查询)
  wildcard: /\b\w*\*\w*\b/g,
} as const

/**
 * 高级搜索语法解析器
 *
 * 将用户输入的搜索查询字符串解析为结构化的 SearchParams
 *
 * @example
 * ```typescript
 * const result = SyntaxParser.parse('react intitle:hooks site:github.com')
 * // => { keyword: 'react', inTitle: 'hooks', sites: ['github.com'] }
 * ```
 */
export class SyntaxParser {
  /**
   * 主解析函数：解析搜索查询字符串
   *
   * @param query - 原始搜索查询字符串
   * @param currentEngine - 当前搜索引擎 (用于平台特定语法)
   * @returns 解析后的结构化搜索参数
   */
  static parse(query: string, currentEngine?: SearchEngine): ParsedSyntax {
    if (!query || typeof query !== 'string') {
      return { keyword: '' }
    }

    let remaining = query.trim()
    const result: ParsedSyntax = { keyword: '' }

    // Step 1: 提取精确匹配 (最高优先级，避免内部语法被误解析)
    const exactMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.exactMatch)
    if (exactMatches.length > 0) {
      result.exactMatches = exactMatches
      // 从查询中移除精确匹配部分
      remaining = remaining.replace(SYNTAX_PATTERNS.exactMatch, ' ')
    }

    // Step 2: 提取 cache: 语法 (特殊处理，因为它会覆盖整个查询)
    const cacheMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.cache)
    if (cacheMatches.length > 0) {
      result.cacheSite = cacheMatches[0]
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.cache)
    }

    // Step 3: 提取 related: 语法
    const relatedMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.related)
    if (relatedMatches.length > 0) {
      result.relatedSite = relatedMatches[0]
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.related)
    }

    // Step 4: 提取位置限定语法
    // site: 语法 (支持多个)
    const sites = this.extractMatches(remaining, SYNTAX_PATTERNS.site)
    if (sites.length > 0) {
      result.sites = sites
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.site)
    }

    // filetype: 语法 (支持多个)
    const fileTypes = this.extractMatches(remaining, SYNTAX_PATTERNS.filetype)
    if (fileTypes.length > 0) {
      result.fileTypes = fileTypes
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.filetype)
    }

    // allintitle: 语法 (必须在 intitle: 之前处理,避免被误匹配)
    const allInTitleMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.allintitle)
    if (allInTitleMatches.length > 0) {
      result.allInTitle = allInTitleMatches.join(' ').trim()
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.allintitle)
    }

    // intitle: 语法
    const inTitleMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.intitle)
    if (inTitleMatches.length > 0) {
      // 如果有多个 intitle:，合并为一个字符串
      result.inTitle = inTitleMatches.join(' ')
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.intitle)
    }

    // inurl: 语法
    const inUrlMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.inurl)
    if (inUrlMatches.length > 0) {
      result.inUrl = inUrlMatches.join(' ')
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.inurl)
    }

    // intext/inbody: 语法
    const inTextMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.intext)
    if (inTextMatches.length > 0) {
      result.inText = inTextMatches.join(' ')
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.intext)
    }

    // Step 5: 提取范围过滤语法
    // 日期范围
    const dateAfter = this.extractMatches(remaining, SYNTAX_PATTERNS.dateAfter)
    const dateBefore = this.extractMatches(remaining, SYNTAX_PATTERNS.dateBefore)
    if (dateAfter.length > 0 || dateBefore.length > 0) {
      result.dateRange = {
        from: dateAfter[0] || '',
        to: dateBefore[0] || ''
      }
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.dateAfter)
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.dateBefore)
    }

    // 数字范围
    const numberRangeMatch = SYNTAX_PATTERNS.numberRange.exec(remaining)
    if (numberRangeMatch) {
      result.numberRange = {
        min: Number(numberRangeMatch[1]),
        max: Number(numberRangeMatch[2])
      }
      remaining = remaining.replace(SYNTAX_PATTERNS.numberRange, ' ')
    }

    // Step 6: 提取逻辑运算符
    // OR 逻辑 (提取所有 OR 右侧的词,并正确处理多个 OR)
    const orKeywords: string[] = []
    // 匹配所有 "word OR word" 模式
    const orMatches = remaining.match(/(\S+)\s+OR\s+(\S+)/gi)
    if (orMatches) {
      // 提取所有 OR 右侧的词
      orMatches.forEach(match => {
        const parts = match.split(/\s+OR\s+/i)
        if (parts.length >= 2) {
          orKeywords.push(parts[1])
        }
      })
      // 移除所有 "OR word" 模式
      remaining = remaining.replace(/\s+OR\s+(\S+)/gi, ' ')
    }

    if (orKeywords.length > 0) {
      result.orKeywords = orKeywords
    }

    // 排除词 (先提取，避免被当作普通关键词)
    const excludeWords = this.extractMatches(remaining, SYNTAX_PATTERNS.exclude)
    if (excludeWords.length > 0) {
      result.excludeWords = excludeWords
      remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.exclude)
    }

    // Step 7: 提取平台特定语法
    if (currentEngine === 'twitter') {
      // from:@user
      const fromUsers = this.extractMatches(remaining, SYNTAX_PATTERNS.fromUser)
      if (fromUsers.length > 0) {
        result.fromUsers = fromUsers
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.fromUser)
      }

      // to:@user
      const toUsers = this.extractMatches(remaining, SYNTAX_PATTERNS.toUser)
      if (toUsers.length > 0) {
        result.toUsers = toUsers
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.toUser)
      }

      // min_retweets:N
      const minRetweetsMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.minRetweets)
      if (minRetweetsMatches.length > 0) {
        result.minRetweets = Number(minRetweetsMatches[0])
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.minRetweets)
      }

      // min_faves:N
      const minFavesMatches = this.extractMatches(remaining, SYNTAX_PATTERNS.minFaves)
      if (minFavesMatches.length > 0) {
        result.minFaves = Number(minFavesMatches[0])
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.minFaves)
      }
    } else if (currentEngine === 'reddit') {
      // subreddit:name
      const subreddits = this.extractMatches(remaining, SYNTAX_PATTERNS.subreddit)
      if (subreddits.length > 0) {
        result.subreddits = subreddits
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.subreddit)
      }
    } else if (currentEngine === 'github') {
      // language:js
      const languages = this.extractMatches(remaining, SYNTAX_PATTERNS.language)
      if (languages.length > 0) {
        result.languages = languages
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.language)
      }
    } else if (currentEngine === 'stackoverflow') {
      // [tag]
      const tags = this.extractMatches(remaining, SYNTAX_PATTERNS.tag)
      if (tags.length > 0) {
        result.tags = tags
        remaining = this.removeSyntax(remaining, SYNTAX_PATTERNS.tag)
      }
    }

    // Step 8: 检测通配符查询
    // 只有当包含 * 的词存在时才设置 wildcardQuery
    const wildcardPattern = /\S*\*\S*/g
    const wildcardMatches: string[] = []
    let wildcardMatch: RegExpExecArray | null

    while ((wildcardMatch = wildcardPattern.exec(remaining)) !== null) {
      wildcardMatches.push(wildcardMatch[0])
    }

    if (wildcardMatches.length > 0) {
      result.wildcardQuery = wildcardMatches.join(' ')
      // 不从 remaining 中移除，通配符是关键词的一部分
    }

    // Step 9: 剩余内容作为普通关键词
    result.keyword = remaining.replace(/\s+/g, ' ').trim()

    return result
  }

  /**
   * 提取匹配的所有值
   *
   * @param text - 待提取的文本
   * @param pattern - 正则表达式模式
   * @returns 匹配值数组
   */
  private static extractMatches(text: string, pattern: RegExp): string[] {
    const matches: string[] = []
    const regex = new RegExp(pattern.source, pattern.flags)
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      // match[1] 是捕获组的内容
      if (match[1]) {
        matches.push(match[1].trim())
      }
    }

    return matches
  }

  /**
   * 从文本中移除特定语法
   *
   * @param text - 待处理的文本
   * @param pattern - 要移除的语法模式
   * @returns 移除后的文本
   */
  private static removeSyntax(text: string, pattern: RegExp): string {
    return text.replace(pattern, ' ').replace(/\s+/g, ' ').trim()
  }

  /**
   * 合并解析结果到现有的 SearchParams
   *
   * @param currentParams - 当前的搜索参数
   * @param parsedSyntax - 解析出的语法
   * @returns 合并后的搜索参数
   */
  static mergeParams(
    currentParams: SearchParams,
    parsedSyntax: ParsedSyntax
  ): SearchParams {
    return {
      ...currentParams,
      ...parsedSyntax,
      // 保留原有的 engine (不被解析结果覆盖)
      engine: currentParams.engine
    }
  }

  /**
   * 验证解析结果是否包含有效内容
   *
   * @param parsedSyntax - 解析结果
   * @returns 是否包含有效的搜索内容
   */
  static isValidParsedSyntax(parsedSyntax: ParsedSyntax): boolean {
    // 至少要有关键词或任意一个语法字段
    return (
      !!parsedSyntax.keyword ||
      !!parsedSyntax.inTitle ||
      !!parsedSyntax.inUrl ||
      !!parsedSyntax.inText ||
      (parsedSyntax.sites && parsedSyntax.sites.length > 0) ||
      (parsedSyntax.fileTypes && parsedSyntax.fileTypes.length > 0) ||
      (parsedSyntax.exactMatches && parsedSyntax.exactMatches.length > 0) ||
      !!parsedSyntax.cacheSite ||
      !!parsedSyntax.relatedSite
    )
  }
}
