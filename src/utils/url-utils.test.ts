import { safeDecodeURIComponent, extractAndDecodeQuery } from './url-utils'

describe('url-utils', () => {
  describe('safeDecodeURIComponent', () => {
    // 保存原始 console.warn
    let originalConsoleWarn: typeof console.warn
    let consoleWarnSpy: jest.SpyInstance

    beforeEach(() => {
      originalConsoleWarn = console.warn
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
    })

    afterEach(() => {
      console.warn = originalConsoleWarn
      consoleWarnSpy.mockRestore()
    })

    describe('正常解码场景', () => {
      it('应该正确解码标准 URL 编码字符串', () => {
        const input = 'test%20site%3Aexample.com'
        const expected = 'test site:example.com'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该正确解码包含中文的字符串', () => {
        const input = '%E6%B5%8B%E8%AF%95'
        const expected = '测试'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该正确解码包含特殊字符的字符串', () => {
        const input = 'test%22exact%20match%22'
        const expected = 'test"exact match"'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该正确解码复杂的 GitHub 搜索查询', () => {
        const input = 'language%3Atypescript%20stars%3A%3E100'
        const expected = 'language:typescript stars:>100'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })
    })

    describe('已解码字符串场景', () => {
      it('应该保持已解码字符串不变', () => {
        const input = 'test site:example.com'
        expect(safeDecodeURIComponent(input)).toBe(input)
      })

      it('应该保持包含特殊字符的已解码字符串不变', () => {
        const input = 'test "exact match" -exclude'
        expect(safeDecodeURIComponent(input)).toBe(input)
      })

      it('应该保持空字符串不变', () => {
        expect(safeDecodeURIComponent('')).toBe('')
      })
    })

    describe('错误处理场景', () => {
      it('应该处理格式错误的编码字符串', () => {
        const input = 'test%2'  // 不完整的编码
        expect(safeDecodeURIComponent(input)).toBe(input)
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '[URL Utils] Failed to decode URI component:',
          expect.objectContaining({
            input: 'test%2',
            error: expect.any(String)
          })
        )
      })

      it('应该处理包含单个 % 的字符串', () => {
        const input = 'test%'
        expect(safeDecodeURIComponent(input)).toBe(input)
        expect(consoleWarnSpy).toHaveBeenCalled()
      })

      it('应该处理包含多个格式错误编码的字符串', () => {
        const input = 'test%2%3'
        expect(safeDecodeURIComponent(input)).toBe(input)
        expect(consoleWarnSpy).toHaveBeenCalled()
      })

      it('应该处理极端的错误编码', () => {
        const input = '%%%'
        expect(safeDecodeURIComponent(input)).toBe(input)
        expect(consoleWarnSpy).toHaveBeenCalled()
      })
    })

    describe('边缘情况', () => {
      it('应该处理只包含 % 的字符串', () => {
        const input = '%'
        expect(safeDecodeURIComponent(input)).toBe(input)
      })

      it('应该处理混合正确和错误编码的字符串', () => {
        // 真正的错误情况是不完整的编码
        const input2 = 'test%20valid%2'
        expect(safeDecodeURIComponent(input2)).toBe(input2)
      })

      it('应该处理非常长的字符串', () => {
        const longString = 'test%20'.repeat(1000) + 'end'
        const decoded = safeDecodeURIComponent(longString)
        expect(decoded).toContain('test ')
        expect(decoded).toContain('end')
      })
    })
  })

  describe('extractAndDecodeQuery', () => {
    describe('百度搜索 URL', () => {
      it('应该从百度 URL 中提取并解码查询', () => {
        const url = 'https://www.baidu.com/s?wd=test%20site%3Aexample.com'
        const expected = 'test site:example.com'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })

      it('应该处理包含多个参数的百度 URL', () => {
        const url = 'https://www.baidu.com/s?wd=test%20query&ie=utf-8&tn=baidu'
        const expected = 'test query'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })
    })

    describe('Google 搜索 URL', () => {
      it('应该从 Google URL 中提取并解码查询', () => {
        const url = 'https://www.google.com/search?q=test%20site%3Aexample.com'
        const expected = 'test site:example.com'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })

      it('应该处理包含多个参数的 Google URL', () => {
        const url = 'https://www.google.com/search?q=test%20query&hl=en&source=hp'
        const expected = 'test query'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })
    })

    describe('Bing 搜索 URL', () => {
      it('应该从 Bing URL 中提取并解码查询', () => {
        const url = 'https://www.bing.com/search?q=test%20site%3Aexample.com'
        const expected = 'test site:example.com'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })
    })

    describe('错误处理', () => {
      it('应该处理格式错误的 URL', () => {
        const url = 'https://www.baidu.com/s?wd=test%2'
        // 应该返回未解码的原始字符串(去除 URL 前缀)
        expect(extractAndDecodeQuery(url)).toBe('test%2')
      })

      it('应该处理没有查询参数的 URL', () => {
        const url = 'https://www.baidu.com/s'
        expect(extractAndDecodeQuery(url)).toBe('https://www.baidu.com/s')
      })

      it('应该处理空查询字符串', () => {
        const url = 'https://www.baidu.com/s?wd='
        expect(extractAndDecodeQuery(url)).toBe('')
      })
    })

    describe('复杂查询场景', () => {
      it('应该处理包含中文的查询', () => {
        const url = 'https://www.baidu.com/s?wd=%E6%B5%8B%E8%AF%95'
        const expected = '测试'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })

      it('应该处理 GitHub 风格的高级搜索查询', () => {
        const url = 'https://github.com/search?q=language%3Atypescript%20stars%3A%3E100'
        const expected = 'language:typescript stars:>100'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })

      it('应该处理 Twitter 风格的搜索查询', () => {
        const url = 'https://twitter.com/search?q=from%3Auser%20%22exact%20phrase%22'
        const expected = 'from:user "exact phrase"'
        expect(extractAndDecodeQuery(url)).toBe(expected)
      })
    })
  })
})
