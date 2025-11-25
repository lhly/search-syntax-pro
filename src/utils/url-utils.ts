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
 * safeDecodeURIComponent("test site:example.com")
 * // => "test site:example.com" (已解码,保持不变)
 *
 * safeDecodeURIComponent("test%2")
 * // => "test%2" (格式错误,返回原始字符串)
 */
export function safeDecodeURIComponent(encodedString: string): string {
  try {
    // 尝试解码
    const decoded = decodeURIComponent(encodedString)

    // 验证解码是否真正改变了字符串(避免重复解码)
    // 如果字符串不包含 % 符号,说明已经是解码状态
    if (!encodedString.includes('%')) {
      return encodedString
    }

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
 * @param fullUrl - 完整的搜索 URL (如 https://www.baidu.com/s?wd=test%20query)
 * @returns 解码后的干净查询字符串
 *
 * @example
 * extractAndDecodeQuery("https://www.baidu.com/s?wd=test%20site%3Aexample.com&ie=utf-8")
 * // => "test site:example.com"
 *
 * extractAndDecodeQuery("https://www.google.com/search?q=test%20query")
 * // => "test query"
 */
export function extractAndDecodeQuery(fullUrl: string): string {
  // 提取查询字符串(移除 URL 前缀和参数名)
  const cleanQuery = fullUrl
    .replace(/^[^?]+\?/, '')       // 移除协议和域名部分
    .replace(/^wd=/, '')           // 百度参数
    .replace(/^q=/, '')            // Google/Bing 参数
    .split('&')[0]                 // 只取第一个参数

  // 使用安全解码
  return safeDecodeURIComponent(cleanQuery)
}
