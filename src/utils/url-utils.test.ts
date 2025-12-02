import {
  safeDecodeURIComponent,
  extractAndDecodeQuery,
  detectEngineFromUrl,
  SEARCH_PARAM_MAP
} from './url-utils'

describe('url-utils', () => {
  describe('SEARCH_PARAM_MAP', () => {
    it('应该包含所有搜索引擎的参数映射', () => {
      expect(SEARCH_PARAM_MAP.google).toBe('q')
      expect(SEARCH_PARAM_MAP.baidu).toBe('wd')
      expect(SEARCH_PARAM_MAP.yandex).toBe('text')
      expect(SEARCH_PARAM_MAP.yahoo).toBe('p')
      expect(SEARCH_PARAM_MAP.startpage).toBe('query')
    })

    it('应该覆盖所有17个搜索引擎', () => {
      const engines = Object.keys(SEARCH_PARAM_MAP)
      expect(engines.length).toBe(17)
    })
  })

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

    describe('加号 (+) 处理场景 (application/x-www-form-urlencoded)', () => {
      it('应该将 + 号转换为空格', () => {
        const input = 'test1+test2'
        const expected = 'test1 test2'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该处理 Yandex 悬浮面板导入场景: test1+"test2"', () => {
        const input = 'test1+%22test2%22'
        const expected = 'test1 "test2"'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该正确处理字面量加号 (C++)', () => {
        // %2B 是编码的加号,应该解码为 +
        const input = 'C%2B%2B'
        const expected = 'C++'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该处理混合空格编码 (+ 和 %20)', () => {
        const input = 'test1+test2%20test3'
        const expected = 'test1 test2 test3'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该处理复杂搜索查询中的加号', () => {
        const input = 'react+hooks+%22use+effect%22'
        const expected = 'react hooks "use effect"'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该处理多个连续加号', () => {
        const input = 'test1++test2'
        const expected = 'test1  test2'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该正确区分字面量加号和空格加号', () => {
        // C++ programming (字面量加号 + 空格加号)
        const input = 'C%2B%2B+programming'
        const expected = 'C++ programming'
        expect(safeDecodeURIComponent(input)).toBe(expected)
      })

      it('应该处理包含加号的中文查询', () => {
        const input = '%E6%B5%8B%E8%AF%95+%E6%9F%A5%E8%AF%A2'
        const expected = '测试 查询'
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
    })
  })

  describe('extractAndDecodeQuery', () => {
    describe('精确匹配模式 (使用 engine 参数)', () => {
      describe('Yandex 搜索 URL', () => {
        it('应该精确提取 Yandex text 参数', () => {
          const url = 'https://yandex.com/search/?text=React%20tutorial'
          expect(extractAndDecodeQuery(url, 'yandex')).toBe('React tutorial')
        })

        it('应该处理包含高级语法的 Yandex URL', () => {
          const url = 'https://yandex.com/search/?text=test%20site%3Agithub.com%20mime%3Apdf'
          expect(extractAndDecodeQuery(url, 'yandex')).toBe('test site:github.com mime:pdf')
        })

        it('应该处理包含多个参数的 Yandex URL', () => {
          const url = 'https://yandex.com/search/?text=JavaScript&lr=10636'
          expect(extractAndDecodeQuery(url, 'yandex')).toBe('JavaScript')
        })
      })

      describe('Google 搜索 URL', () => {
        it('应该精确提取 Google q 参数', () => {
          const url = 'https://www.google.com/search?q=test%20query&hl=en'
          expect(extractAndDecodeQuery(url, 'google')).toBe('test query')
        })
      })

      describe('Baidu 搜索 URL', () => {
        it('应该精确提取 Baidu wd 参数', () => {
          const url = 'https://www.baidu.com/s?wd=test%20query&ie=utf-8'
          expect(extractAndDecodeQuery(url, 'baidu')).toBe('test query')
        })
      })

      describe('Yahoo 搜索 URL', () => {
        it('应该精确提取 Yahoo p 参数', () => {
          const url = 'https://search.yahoo.com/search?p=test%20query'
          expect(extractAndDecodeQuery(url, 'yahoo')).toBe('test query')
        })
      })

      describe('Startpage/Naver/Sogou 搜索 URL', () => {
        it('应该精确提取 Startpage query 参数', () => {
          const url = 'https://www.startpage.com/sp/search?query=test%20query'
          expect(extractAndDecodeQuery(url, 'startpage')).toBe('test query')
        })

        it('应该精确提取 Naver query 参数', () => {
          const url = 'https://search.naver.com/search.naver?query=test%20query'
          expect(extractAndDecodeQuery(url, 'naver')).toBe('test query')
        })
      })
    })

    describe('通用匹配模式 (不使用 engine 参数 - 向后兼容)', () => {
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

      describe('Yandex 搜索 URL', () => {
        it('应该从 Yandex URL 中提取并解码查询', () => {
          const url = 'https://yandex.com/search/?text=React%20tutorial'
          const expected = 'React tutorial'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })

        it('应该处理包含高级语法的 Yandex URL', () => {
          const url = 'https://yandex.com/search/?text=test%20site%3Agithub.com%20mime%3Apdf'
          const expected = 'test site:github.com mime:pdf'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })

        it('应该处理包含多个参数的 Yandex URL', () => {
          const url = 'https://yandex.com/search/?text=JavaScript&lr=10636'
          const expected = 'JavaScript'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })
      })

      describe('Yahoo 搜索 URL', () => {
        it('应该从 Yahoo URL 中提取并解码查询', () => {
          const url = 'https://search.yahoo.com/search?p=test%20query'
          const expected = 'test query'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })
      })

      describe('Startpage/Naver/Sogou 搜索 URL', () => {
        it('应该从 Startpage URL 中提取并解码查询', () => {
          const url = 'https://www.startpage.com/sp/search?query=test%20query'
          const expected = 'test query'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })

        it('应该从 Naver URL 中提取并解码查询', () => {
          const url = 'https://search.naver.com/search.naver?query=test%20query'
          const expected = 'test query'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })

        it('应该从 Sogou URL 中提取并解码查询', () => {
          const url = 'https://www.sogou.com/web?query=test%20query'
          const expected = 'test query'
          expect(extractAndDecodeQuery(url)).toBe(expected)
        })
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
        expect(extractAndDecodeQuery(url)).toBe('')
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
        expect(extractAndDecodeQuery(url, 'github')).toBe(expected)
      })

      it('应该处理 Twitter 风格的搜索查询', () => {
        const url = 'https://twitter.com/search?q=from%3Auser%20%22exact%20phrase%22'
        const expected = 'from:user "exact phrase"'
        expect(extractAndDecodeQuery(url, 'twitter')).toBe(expected)
      })
    })
  })

  describe('detectEngineFromUrl', () => {
    it('应该正确检测 Yandex URL', () => {
      expect(detectEngineFromUrl('https://yandex.com/search/?text=test')).toBe('yandex')
    })

    it('应该正确检测 Google URL', () => {
      expect(detectEngineFromUrl('https://www.google.com/search?q=test')).toBe('google')
    })

    it('应该正确检测 Baidu URL', () => {
      expect(detectEngineFromUrl('https://www.baidu.com/s?wd=test')).toBe('baidu')
    })

    it('应该正确检测 Yahoo URL', () => {
      expect(detectEngineFromUrl('https://search.yahoo.com/search?p=test')).toBe('yahoo')
    })

    it('应该正确检测 DuckDuckGo URL', () => {
      expect(detectEngineFromUrl('https://duckduckgo.com/?q=test')).toBe('duckduckgo')
    })

    it('应该对未知域名返回 null', () => {
      expect(detectEngineFromUrl('https://unknown.com/search?q=test')).toBeNull()
    })

    it('应该处理大小写不敏感', () => {
      expect(detectEngineFromUrl('HTTPS://YANDEX.COM/SEARCH/?TEXT=TEST')).toBe('yandex')
    })
  })

  describe('性能对比测试', () => {
    const testUrl = 'https://yandex.com/search/?text=React%20tutorial%20site%3Agithub.com'

    it('精确匹配应该比通用匹配更快', () => {
      const iterations = 10000

      // 测试精确匹配性能
      const startPrecise = performance.now()
      for (let i = 0; i < iterations; i++) {
        extractAndDecodeQuery(testUrl, 'yandex')
      }
      const preciseDuration = performance.now() - startPrecise

      // 测试通用匹配性能
      const startGeneric = performance.now()
      for (let i = 0; i < iterations; i++) {
        extractAndDecodeQuery(testUrl)
      }
      const genericDuration = performance.now() - startGeneric

      console.log(`性能对比 (${iterations} 次迭代):`)
      console.log(`  精确匹配: ${preciseDuration.toFixed(2)}ms`)
      console.log(`  通用匹配: ${genericDuration.toFixed(2)}ms`)
      console.log(`  性能提升: ${((genericDuration / preciseDuration - 1) * 100).toFixed(1)}%`)

      // 精确匹配应该更快或至少相当
      expect(preciseDuration).toBeLessThanOrEqual(genericDuration * 1.5)
    })
  })
})
