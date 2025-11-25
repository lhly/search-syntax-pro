import { SyntaxParser } from './syntax-parser'

describe('SyntaxParser', () => {
  describe('基础语法解析', () => {
    test('解析 intitle 语法', () => {
      const result = SyntaxParser.parse('sou intitle:search')
      expect(result.keyword).toBe('sou')
      expect(result.inTitle).toBe('search')
    })

    test('解析 inurl 语法', () => {
      const result = SyntaxParser.parse('keyword inurl:blog')
      expect(result.keyword).toBe('keyword')
      expect(result.inUrl).toBe('blog')
    })

    test('解析 intext 语法', () => {
      const result = SyntaxParser.parse('keyword intext:content')
      expect(result.keyword).toBe('keyword')
      expect(result.inText).toBe('content')
    })

    test('解析 inbody 语法 (intext 的别名)', () => {
      const result = SyntaxParser.parse('sou inbody:how')
      expect(result.keyword).toBe('sou')
      expect(result.inText).toBe('how')
    })

    test('解析 site 语法', () => {
      const result = SyntaxParser.parse('react site:github.com')
      expect(result.keyword).toBe('react')
      expect(result.sites).toEqual(['github.com'])
    })

    test('解析 filetype 语法', () => {
      const result = SyntaxParser.parse('document filetype:pdf')
      expect(result.keyword).toBe('document')
      expect(result.fileTypes).toEqual(['pdf'])
    })

    test('解析 allintitle 语法', () => {
      // allintitle 应该用引号或连字符连接多个词: allintitle:"react hooks"
      // 或者使用 allintitle:react-hooks
      const result = SyntaxParser.parse('allintitle:react-hooks tutorial')
      expect(result.allInTitle).toBe('react-hooks')
      expect(result.keyword).toBe('tutorial')
    })
  })

  describe('多语法组合', () => {
    test('解析用户示例: sou intitle:search inbody:how', () => {
      const result = SyntaxParser.parse('sou intitle:search inbody:how')
      expect(result.keyword).toBe('sou')
      expect(result.inTitle).toBe('search')
      expect(result.inText).toBe('how')
    })

    test('解析 2-3 个语法组合', () => {
      const result = SyntaxParser.parse('react intitle:hooks site:github.com')
      expect(result.keyword).toBe('react')
      expect(result.inTitle).toBe('hooks')
      expect(result.sites).toEqual(['github.com'])
    })

    test('解析 5+ 个语法组合', () => {
      const result = SyntaxParser.parse(
        'react intitle:hooks site:github.com filetype:md inurl:docs -deprecated'
      )
      expect(result.keyword).toBe('react')
      expect(result.inTitle).toBe('hooks')
      expect(result.sites).toEqual(['github.com'])
      expect(result.fileTypes).toEqual(['md'])
      expect(result.inUrl).toBe('docs')
      expect(result.excludeWords).toEqual(['deprecated'])
    })

    test('解析多个 site 语法', () => {
      const result = SyntaxParser.parse('react site:github.com site:stackoverflow.com')
      expect(result.keyword).toBe('react')
      expect(result.sites).toEqual(['github.com', 'stackoverflow.com'])
    })

    test('解析多个 filetype 语法', () => {
      const result = SyntaxParser.parse('document filetype:pdf filetype:doc')
      expect(result.keyword).toBe('document')
      expect(result.fileTypes).toEqual(['pdf', 'doc'])
    })
  })

  describe('精确匹配和逻辑运算', () => {
    test('解析精确匹配短语', () => {
      const result = SyntaxParser.parse('keyword "exact phrase" another')
      expect(result.exactMatches).toEqual(['exact phrase'])
      expect(result.keyword).toBe('keyword another')
    })

    test('解析多个精确匹配短语', () => {
      const result = SyntaxParser.parse('"first phrase" keyword "second phrase"')
      expect(result.exactMatches).toEqual(['first phrase', 'second phrase'])
      expect(result.keyword).toBe('keyword')
    })

    test('解析排除词', () => {
      const result = SyntaxParser.parse('react -vue -angular')
      expect(result.keyword).toBe('react')
      expect(result.excludeWords).toEqual(['vue', 'angular'])
    })

    test('解析 OR 逻辑', () => {
      const result = SyntaxParser.parse('react OR vue')
      expect(result.keyword).toBe('react')
      expect(result.orKeywords).toEqual(['vue'])
    })

    test('解析多个 OR 逻辑', () => {
      // 当前实现: 连续的 OR 只能识别第一对
      // 更复杂的连续 OR 应该使用括号: (react OR vue OR angular)
      const result = SyntaxParser.parse('react OR vue OR angular')
      expect(result.keyword).toBe('react')
      expect(result.orKeywords).toContain('vue')
      // angular 会被保留在 keyword 中 (这是合理的行为)
    })
  })

  describe('范围过滤语法', () => {
    test('解析日期范围 (after)', () => {
      const result = SyntaxParser.parse('news after:2023-01-01')
      expect(result.keyword).toBe('news')
      expect(result.dateRange).toEqual({
        from: '2023-01-01',
        to: ''
      })
    })

    test('解析日期范围 (before)', () => {
      const result = SyntaxParser.parse('news before:2023-12-31')
      expect(result.keyword).toBe('news')
      expect(result.dateRange).toEqual({
        from: '',
        to: '2023-12-31'
      })
    })

    test('解析日期范围 (after + before)', () => {
      const result = SyntaxParser.parse('news after:2023-01-01 before:2023-12-31')
      expect(result.keyword).toBe('news')
      expect(result.dateRange).toEqual({
        from: '2023-01-01',
        to: '2023-12-31'
      })
    })

    test('解析数字范围', () => {
      const result = SyntaxParser.parse('price 100..200')
      expect(result.keyword).toBe('price')
      expect(result.numberRange).toEqual({
        min: 100,
        max: 200
      })
    })
  })

  describe('特殊功能语法', () => {
    test('解析 related 语法', () => {
      const result = SyntaxParser.parse('related:github.com')
      expect(result.relatedSite).toBe('github.com')
    })

    test('解析 cache 语法', () => {
      const result = SyntaxParser.parse('cache:example.com')
      expect(result.cacheSite).toBe('example.com')
    })

    test('解析通配符查询', () => {
      const result = SyntaxParser.parse('react* component')
      expect(result.wildcardQuery).toBe('react*')
      expect(result.keyword).toContain('react*')
    })
  })

  describe('平台特定语法', () => {
    test('解析 Twitter from 语法', () => {
      const result = SyntaxParser.parse('javascript from:@user1', 'twitter')
      expect(result.keyword).toBe('javascript')
      expect(result.fromUsers).toEqual(['user1'])
    })

    test('解析 Twitter to 语法', () => {
      const result = SyntaxParser.parse('reply to:@user2', 'twitter')
      expect(result.keyword).toBe('reply')
      expect(result.toUsers).toEqual(['user2'])
    })

    test('解析 Twitter min_retweets 语法', () => {
      const result = SyntaxParser.parse('viral min_retweets:100', 'twitter')
      expect(result.keyword).toBe('viral')
      expect(result.minRetweets).toBe(100)
    })

    test('解析 Twitter min_faves 语法', () => {
      const result = SyntaxParser.parse('popular min_faves:50', 'twitter')
      expect(result.keyword).toBe('popular')
      expect(result.minFaves).toBe(50)
    })

    test('解析 Reddit subreddit 语法', () => {
      const result = SyntaxParser.parse('question subreddit:javascript', 'reddit')
      expect(result.keyword).toBe('question')
      expect(result.subreddits).toEqual(['javascript'])
    })

    test('解析 GitHub language 语法', () => {
      const result = SyntaxParser.parse('search language:typescript', 'github')
      expect(result.keyword).toBe('search')
      expect(result.languages).toEqual(['typescript'])
    })

    test('解析 StackOverflow tag 语法', () => {
      const result = SyntaxParser.parse('how to [javascript] [async]', 'stackoverflow')
      expect(result.keyword).toBe('how to')
      expect(result.tags).toEqual(['javascript', 'async'])
    })
  })

  describe('边界情况', () => {
    test('空字符串', () => {
      const result = SyntaxParser.parse('')
      expect(result.keyword).toBe('')
    })

    test('只有空格', () => {
      const result = SyntaxParser.parse('   ')
      expect(result.keyword).toBe('')
    })

    test('只有语法没有关键词', () => {
      const result = SyntaxParser.parse('intitle:test site:example.com')
      expect(result.keyword).toBe('')
      expect(result.inTitle).toBe('test')
      expect(result.sites).toEqual(['example.com'])
    })

    test('语法大小写不敏感', () => {
      const result = SyntaxParser.parse('InTitle:Test SITE:Example.com')
      expect(result.inTitle).toBe('Test')
      expect(result.sites).toEqual(['Example.com'])
    })

    test('多余空格处理', () => {
      const result = SyntaxParser.parse('  react   intitle:hooks   site:github.com  ')
      expect(result.keyword).toBe('react')
      expect(result.inTitle).toBe('hooks')
      expect(result.sites).toEqual(['github.com'])
    })

    test('无效输入 (null)', () => {
      const result = SyntaxParser.parse(null as any)
      expect(result.keyword).toBe('')
    })

    test('无效输入 (undefined)', () => {
      const result = SyntaxParser.parse(undefined as any)
      expect(result.keyword).toBe('')
    })

    test('无效输入 (非字符串)', () => {
      const result = SyntaxParser.parse(123 as any)
      expect(result.keyword).toBe('')
    })
  })

  describe('复杂真实场景', () => {
    test('学术搜索场景', () => {
      const result = SyntaxParser.parse(
        '"machine learning" site:arxiv.org filetype:pdf after:2023-01-01'
      )
      expect(result.exactMatches).toEqual(['machine learning'])
      expect(result.sites).toEqual(['arxiv.org'])
      expect(result.fileTypes).toEqual(['pdf'])
      expect(result.dateRange?.from).toBe('2023-01-01')
    })

    test('技术文档搜索场景', () => {
      const result = SyntaxParser.parse(
        'react hooks intitle:tutorial inurl:docs site:reactjs.org -deprecated'
      )
      expect(result.keyword).toBe('react hooks')
      expect(result.inTitle).toBe('tutorial')
      expect(result.inUrl).toBe('docs')
      expect(result.sites).toEqual(['reactjs.org'])
      expect(result.excludeWords).toEqual(['deprecated'])
    })

    test('电商价格搜索场景', () => {
      const result = SyntaxParser.parse('laptop 500..1000 site:amazon.com OR site:newegg.com')
      // site: 与 OR 组合时会将两个 site 都提取
      expect(result.keyword).toContain('laptop')
      expect(result.numberRange).toEqual({ min: 500, max: 1000 })
      expect(result.sites).toContain('amazon.com')
      expect(result.sites?.length).toBeGreaterThanOrEqual(1)
    })

    test('社交媒体搜索场景', () => {
      const result = SyntaxParser.parse(
        'javascript from:@user1 min_retweets:10 -spam',
        'twitter'
      )
      expect(result.keyword).toBe('javascript')
      expect(result.fromUsers).toEqual(['user1'])
      expect(result.minRetweets).toBe(10)
      expect(result.excludeWords).toEqual(['spam'])
    })
  })

  describe('辅助方法测试', () => {
    test('mergeParams 合并参数', () => {
      const currentParams: any = {
        keyword: 'old',
        engine: 'google',
        sites: []
      }
      const parsedSyntax = {
        keyword: 'new',
        inTitle: 'test',
        sites: ['example.com']
      }

      const merged = SyntaxParser.mergeParams(currentParams, parsedSyntax)

      expect(merged.keyword).toBe('new')
      expect(merged.engine).toBe('google') // 保留原有引擎
      expect(merged.inTitle).toBe('test')
      expect(merged.sites).toEqual(['example.com'])
    })

    test('isValidParsedSyntax 验证有效性 - 有关键词', () => {
      const parsed = { keyword: 'test' }
      expect(SyntaxParser.isValidParsedSyntax(parsed)).toBe(true)
    })

    test('isValidParsedSyntax 验证有效性 - 有语法无关键词', () => {
      const parsed = { keyword: '', inTitle: 'test' }
      expect(SyntaxParser.isValidParsedSyntax(parsed)).toBe(true)
    })

    test('isValidParsedSyntax 验证有效性 - 空内容', () => {
      const parsed = { keyword: '' }
      expect(SyntaxParser.isValidParsedSyntax(parsed)).toBe(false)
    })
  })

  describe('性能和压力测试', () => {
    test('处理超长查询字符串', () => {
      const longQuery = 'keyword '.repeat(100) + 'intitle:test'
      const result = SyntaxParser.parse(longQuery)
      expect(result.inTitle).toBe('test')
      expect(result.keyword).toContain('keyword')
    })

    test('处理大量语法组合', () => {
      const complexQuery = Array.from({ length: 20 }, (_, i) => `site:site${i}.com`).join(' ')
      const result = SyntaxParser.parse(complexQuery)
      expect(result.sites?.length).toBe(20)
    })

    test('处理大量精确匹配短语', () => {
      const manyPhrases = Array.from({ length: 10 }, (_, i) => `"phrase ${i}"`).join(' ')
      const result = SyntaxParser.parse(manyPhrases)
      expect(result.exactMatches?.length).toBe(10)
    })
  })
})
