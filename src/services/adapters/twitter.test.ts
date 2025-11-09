import { TwitterAdapter } from './twitter'
import type { SearchParams } from '@/types'

describe('TwitterAdapter', () => {
  let adapter: TwitterAdapter

  beforeEach(() => {
    adapter = new TwitterAdapter()
  })

  describe('基础功能测试', () => {
    test('应该返回正确的搜索引擎名称', () => {
      expect(adapter.getName()).toBe('X (Twitter)')
    })

    test('应该返回正确的基础 URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://twitter.com/search')
    })

    test('应该返回支持的语法列表', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).toContain('from_user')
      expect(supportedSyntax).toContain('to_user')
      expect(supportedSyntax).toContain('date_range')
      expect(supportedSyntax).toContain('filter')
      expect(supportedSyntax).toContain('min_retweets')
      expect(supportedSyntax).toContain('min_faves')
    })
  })

  describe('查询构建测试', () => {
    test('应该正确构建基础关键词搜索', () => {
      const params: SearchParams = {
        keyword: 'JavaScript',
        engine: 'twitter'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('twitter.com/search')
      expect(url).toContain('q=JavaScript')
    })

    test('应该正确处理用户搜索（from:）', () => {
      const params: SearchParams = {
        keyword: 'AI',
        engine: 'twitter',
        fromUser: '@elonmusk'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('from:elonmusk')
    })

    test('应该正确处理用户搜索（to:）', () => {
      const params: SearchParams = {
        keyword: 'question',
        engine: 'twitter',
        toUser: 'support'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('to:support')
    })

    test('应该正确构建日期范围搜索', () => {
      const params: SearchParams = {
        keyword: 'news',
        engine: 'twitter',
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        }
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('since:2024-01-01')
      expect(decodedUrl).toContain('until:2024-12-31')
    })

    test('应该正确处理内容过滤器', () => {
      const params: SearchParams = {
        keyword: 'tech',
        engine: 'twitter',
        contentFilters: ['images', 'videos']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('filter:images')
      expect(decodedUrl).toContain('filter:videos')
    })

    test('应该正确处理互动数据筛选', () => {
      const params: SearchParams = {
        keyword: 'viral',
        engine: 'twitter',
        minRetweets: 100,
        minFaves: 500
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('min_retweets:100')
      expect(decodedUrl).toContain('min_faves:500')
    })

    test('应该正确处理语言筛选', () => {
      const params: SearchParams = {
        keyword: 'news',
        engine: 'twitter',
        language: 'zh'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('lang:zh')
    })

    test('应该正确处理排除关键词', () => {
      const params: SearchParams = {
        keyword: 'JavaScript',
        engine: 'twitter',
        excludeWords: ['framework', 'library']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('-framework')
      expect(decodedUrl).toContain('-library')
    })

    test('应该正确处理精确匹配', () => {
      const params: SearchParams = {
        keyword: 'AI',
        engine: 'twitter',
        exactMatch: 'machine learning'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('"machine learning"')
    })

    test('应该正确处理 OR 逻辑', () => {
      const params: SearchParams = {
        keyword: 'tech',
        engine: 'twitter',
        orKeywords: ['AI', 'ML', 'DL']
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('(AI OR ML OR DL)')
    })

    test('应该正确处理复杂查询组合', () => {
      const params: SearchParams = {
        keyword: 'TypeScript',
        engine: 'twitter',
        fromUser: '@typescript',
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        contentFilters: ['links'],
        minRetweets: 50,
        language: 'en',
        excludeWords: ['deprecated']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)

      expect(decodedUrl).toContain('TypeScript')
      expect(decodedUrl).toContain('from:typescript')
      expect(decodedUrl).toContain('since:2024-01-01')
      expect(decodedUrl).toContain('until:2024-12-31')
      expect(decodedUrl).toContain('filter:links')
      expect(decodedUrl).toContain('min_retweets:50')
      expect(decodedUrl).toContain('lang:en')
      expect(decodedUrl).toContain('-deprecated')
    })
  })

  describe('参数验证测试', () => {
    test('应该验证通过有效的基础搜索', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter'
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('应该拒绝空关键词（无用户指定）', () => {
      const params: SearchParams = {
        keyword: '',
        engine: 'twitter'
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    test('应该允许仅用户搜索（带警告）', () => {
      const params: SearchParams = {
        keyword: '',
        engine: 'twitter',
        fromUser: '@user'
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    test('应该验证用户名格式', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        fromUser: '@invalid user name'
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('用户名格式'))).toBe(true)
    })

    test('应该验证日期范围', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        dateRange: {
          from: '2024-12-31',
          to: '2024-01-01'
        }
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('开始日期不能晚于结束日期'))).toBe(true)
    })

    test('应该验证互动数据为非负数', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        minRetweets: -10
      }
      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('不能为负数'))).toBe(true)
    })

    test('应该警告过多的搜索条件', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        fromUser: '@user',
        toUser: '@other',
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
        minRetweets: 10,
        minFaves: 20,
        language: 'en',
        contentFilters: ['images'],
        excludeWords: ['spam']
      }
      const result = adapter.validateParams(params)
      expect(result.warnings.some(w => w.includes('搜索条件过多'))).toBe(true)
    })
  })

  describe('语法支持测试', () => {
    test('应该支持 Twitter 特定语法', () => {
      expect(adapter.validateSyntax('from_user')).toBe(true)
      expect(adapter.validateSyntax('to_user')).toBe(true)
      expect(adapter.validateSyntax('filter')).toBe(true)
      expect(adapter.validateSyntax('min_retweets')).toBe(true)
      expect(adapter.validateSyntax('min_faves')).toBe(true)
    })

    test('应该不支持不相关的语法', () => {
      expect(adapter.validateSyntax('site')).toBe(false)
      expect(adapter.validateSyntax('filetype')).toBe(false)
      expect(adapter.validateSyntax('cache')).toBe(false)
    })

    test('isSyntaxSupported 应该与 validateSyntax 一致', () => {
      expect(adapter.isSyntaxSupported('from_user')).toBe(true)
      expect(adapter.isSyntaxSupported('site')).toBe(false)
    })
  })

  describe('搜索建议测试', () => {
    test('应该建议添加用户筛选', () => {
      const params: SearchParams = {
        keyword: 'JavaScript',
        engine: 'twitter'
      }
      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions.some(s => s.includes('用户筛选'))).toBe(true)
    })

    test('应该建议添加日期范围', () => {
      const params: SearchParams = {
        keyword: 'news',
        engine: 'twitter'
      }
      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions.some(s => s.includes('时间限制'))).toBe(true)
    })

    test('应该建议使用内容过滤器', () => {
      const params: SearchParams = {
        keyword: 'tech',
        engine: 'twitter'
      }
      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions.some(s => s.includes('内容过滤器'))).toBe(true)
    })
  })

  describe('边界情况测试', () => {
    test('应该处理用户名带 @ 符号', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        fromUser: '@user123'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('from:user123')
      expect(decodeURIComponent(url)).not.toContain('from:@user123')
    })

    test('应该处理用户名不带 @ 符号', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        fromUser: 'user123'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('from:user123')
    })

    test('应该忽略空字符串参数', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        fromUser: '   ',
        language: ''
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).not.toContain('from:')
      expect(decodedUrl).not.toContain('lang:')
    })

    test('应该处理空数组', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        contentFilters: [],
        excludeWords: []
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('q=test')
    })

    test('应该处理互动数据为 0', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'twitter',
        minRetweets: 0,
        minFaves: 0
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).not.toContain('min_retweets')
      expect(decodedUrl).not.toContain('min_faves')
    })
  })
})
