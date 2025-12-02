import type { SearchEngine } from '@/types'

/**
 * 搜索引擎 URL 参数映射表
 * 将搜索引擎类型映射到其使用的查询参数名
 *
 * @example
 * SEARCH_PARAM_MAP.yandex // => 'text'
 * SEARCH_PARAM_MAP.google // => 'q'
 */
export const SEARCH_PARAM_MAP: Record<SearchEngine, string> = {
  // q= 参数引擎 (11个)
  google: 'q',
  bing: 'q',
  duckduckgo: 'q',
  brave: 'q',
  twitter: 'q',
  reddit: 'q',
  github: 'q',
  stackoverflow: 'q',
  so360: 'q',
  qwant: 'q',
  ecosia: 'q',

  // 特殊参数引擎
  baidu: 'wd',        // 百度
  yandex: 'text',     // Yandex
  yahoo: 'p',         // Yahoo

  // query= 参数引擎 (3个)
  startpage: 'query',
  naver: 'query',
  sogou: 'query'
} as const

/**
 * 安全解码 URL 编码字符串
 *
 * @param encodedString - 可能包含 URL 编码字符的字符串
 * @returns 解码后的字符串,解码失败时返回原始字符串
 *
 * @example
 * safeDecodeURIComponent("test%20site%3Aexample.com")
 * // => "test site:example.com"
 *
 * safeDecodeURIComponent("test+site%3Aexample.com")
 * // => "test site:example.com" (+ 号转换为空格)
 *
 * safeDecodeURIComponent("test site:example.com")
 * // => "test site:example.com" (已解码,保持不变)
 *
 * safeDecodeURIComponent("test%2")
 * // => "test%2" (格式错误,返回原始字符串)
 */
export function safeDecodeURIComponent(encodedString: string): string {
  try {
    // 验证解码是否必要(优化早期返回)
    // 如果字符串不包含 % 或 + 符号,说明已经是解码状态
    if (!encodedString.includes('%') && !encodedString.includes('+')) {
      return encodedString
    }

    // 处理 application/x-www-form-urlencoded 格式:
    // 在该格式中,+ 号代表空格,需要在 decodeURIComponent 之前转换
    // 注意: %2B 会先被转换为 +,然后保持为 + (字面量加号)
    const normalizedString = encodedString.replace(/\+/g, ' ')

    // 尝试解码
    const decoded = decodeURIComponent(normalizedString)

    return decoded
  } catch (error) {
    // 捕获 URIError 或其他解码错误
    console.warn('[URL Utils] Failed to decode URI component:', {
      input: encodedString,
      error: error instanceof Error ? error.message : String(error)
    })

    // 优雅降级:返回原始字符串
    return encodedString
  }
}

/**
 * 从完整的搜索引擎 URL 中提取并解码查询字符串
 *
 * 优化方案: 配置驱动的参数提取
 * - 优先使用引擎类型进行精确匹配 (O(1) 性能)
 * - 回退到通用模式匹配 (向后兼容)
 * - 类型安全,易于维护和扩展
 *
 * @param fullUrl - 完整的搜索 URL (如 https://www.baidu.com/s?wd=test%20query)
 * @param engine - 可选的搜索引擎类型,提供时使用精确匹配
 * @returns 解码后的干净查询字符串
 *
 * @example
 * // 精确匹配模式 (推荐)
 * extractAndDecodeQuery("https://yandex.com/search/?text=React", "yandex")
 * // => "React"
 *
 * // 通用匹配模式 (向后兼容)
 * extractAndDecodeQuery("https://www.baidu.com/s?wd=test%20site%3Aexample.com")
 * // => "test site:example.com"
 *
 * @performance
 * - 精确匹配: O(1) 时间复杂度
 * - 通用匹配: O(n) 时间复杂度 (n = 参数名数量)
 */
export function extractAndDecodeQuery(
  fullUrl: string,
  engine?: SearchEngine
): string {
  try {
    // 策略1: 精确匹配 (当提供 engine 参数时)
    if (engine && SEARCH_PARAM_MAP[engine]) {
      return extractQueryByEngine(fullUrl, engine)
    }

    // 策略2: 通用匹配 (向后兼容,当未提供 engine 参数时)
    return extractQueryGeneric(fullUrl)
  } catch (error) {
    console.warn('[URL Utils] Failed to extract query:', {
      url: fullUrl,
      engine,
      error: error instanceof Error ? error.message : String(error)
    })

    // 优雅降级
    return fullUrl
  }
}

/**
 * 通过引擎类型精确提取查询参数 (优化路径)
 *
 * @param fullUrl - 完整的 URL
 * @param engine - 搜索引擎类型
 * @returns 解码后的查询字符串
 *
 * @performance O(1) - 使用配置映射表直接查找,优先正则匹配避免 URL 构造开销
 */
function extractQueryByEngine(fullUrl: string, engine: SearchEngine): string {
  const paramName = SEARCH_PARAM_MAP[engine]

  // 策略1: 正则表达式提取 (最快)
  const regex = new RegExp(`[?&]${escapeRegExp(paramName)}=([^&]*)`)
  const match = fullUrl.match(regex)

  if (match && match[1]) {
    return safeDecodeURIComponent(match[1])
  }

  // 策略2: URL API 回退 (处理边缘情况)
  try {
    const url = new URL(fullUrl)
    const queryValue = url.searchParams.get(paramName)

    if (queryValue !== null) {
      return safeDecodeURIComponent(queryValue)
    }
  } catch {
    // URL 解析失败
  }

  // 未找到参数,返回空字符串
  return ''
}

/**
 * 通用模式提取查询参数 (兼容路径)
 *
 * @param fullUrl - 完整的 URL
 * @returns 解码后的查询字符串
 *
 * @performance O(n) - n = 已知参数名数量
 */
function extractQueryGeneric(fullUrl: string): string {
  // 检查是否包含查询参数
  if (!fullUrl.includes('?')) {
    return ''
  }

  // 提取查询字符串部分
  const queryString = fullUrl.replace(/^[^?]+\?/, '')

  // 按优先级尝试移除已知的参数名
  // 顺序: 从最特殊到最通用
  let cleanQuery = queryString
    .replace(/^text=/, '')         // Yandex (特殊)
    .replace(/^wd=/, '')           // Baidu (特殊)
    .replace(/^p=/, '')            // Yahoo (特殊)
    .replace(/^query=/, '')        // Startpage/Naver/Sogou
    .replace(/^q=/, '')            // Google/Bing/等 (通用)
    .split('&')[0]                 // 只取第一个参数

  return safeDecodeURIComponent(cleanQuery)
}

/**
 * 转义正则表达式特殊字符
 *
 * @param str - 需要转义的字符串
 * @returns 转义后的字符串
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 检测 URL 所属的搜索引擎类型
 *
 * @param url - 完整的 URL
 * @returns 检测到的搜索引擎类型,未识别返回 null
 *
 * @example
 * detectEngineFromUrl("https://yandex.com/search/?text=test")
 * // => "yandex"
 */
export function detectEngineFromUrl(url: string): SearchEngine | null {
  const hostname = url.toLowerCase()

  // 引擎域名映射表
  const engineDomains: Array<[string, SearchEngine]> = [
    ['baidu.com', 'baidu'],
    ['google.com', 'google'],
    ['bing.com', 'bing'],
    ['yandex.com', 'yandex'],
    ['yahoo.com', 'yahoo'],
    ['duckduckgo.com', 'duckduckgo'],
    ['brave.com', 'brave'],
    ['twitter.com', 'twitter'],
    ['reddit.com', 'reddit'],
    ['github.com', 'github'],
    ['stackoverflow.com', 'stackoverflow'],
    ['startpage.com', 'startpage'],
    ['naver.com', 'naver'],
    ['sogou.com', 'sogou'],
    ['so.com', 'so360'],
    ['qwant.com', 'qwant'],
    ['ecosia.org', 'ecosia']
  ]

  for (const [domain, engine] of engineDomains) {
    if (hostname.includes(domain)) {
      return engine
    }
  }

  return null
}
