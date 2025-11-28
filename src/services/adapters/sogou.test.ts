import { SogouAdapter } from './sogou'
import type { SearchParams } from '@/types'

describe('SogouAdapter', () => {
  let adapter: SogouAdapter

  beforeEach(() => {
    adapter = new SogouAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('搜狗')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://www.sogou.com/web')
    })

    test('应支持中等复杂度语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).toContain('intitle')
      expect(supportedSyntax).toContain('inurl')
      expect(supportedSyntax).toContain('exclude')
      expect(supportedSyntax).toContain('or')
      expect(supportedSyntax).toHaveLength(7)
    })
  })

  describe('URL构建', () => {
    test('应构建正确的搜索URL', () => {
      const params: SearchParams = {
        keyword: 'test query',
        engine: 'sogou'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('sogou.com/web')
      expect(url).toContain('?query=')
      expect(decodeURIComponent(url)).toContain('test query')
    })

    test('应支持site语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        site: 'example.com'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('site:example.com')
    })

    test('应支持多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        sites: ['example.com', 'test.com']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('site:example.com')
      expect(decodedUrl).toContain('OR')
      expect(decodedUrl).toContain('site:test.com')
    })

    test('应支持filetype语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        fileType: 'pdf'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('filetype:pdf')
    })

    test('应支持多文件类型OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        fileTypes: ['pdf', 'doc']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('filetype:pdf')
      expect(decodedUrl).toContain('OR')
      expect(decodedUrl).toContain('filetype:doc')
    })

    test('应支持intitle语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        inTitle: 'blog'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('intitle:blog')
    })

    test('应支持inurl语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        inUrl: 'news'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('inurl:news')
    })

    test('应支持精确匹配', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        exactMatch: 'exact phrase'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('"exact phrase"')
    })

    test('应支持排除语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        excludeWords: ['spam', 'ads']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('-spam')
      expect(decodedUrl).toContain('-ads')
    })

    test('应正确处理中文查询', () => {
      const params: SearchParams = {
        keyword: '人工智能',
        engine: 'sogou',
        site: 'baidu.com'
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('人工智能')
      expect(decodedUrl).toContain('site:baidu.com')
    })

    test('应支持OR关键词', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        orKeywords: ['javascript', 'typescript']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('javascript OR typescript')
    })
  })

  describe('语法降级', () => {
    test('应降级不支持的intext语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        inText: 'content'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inText).toBeUndefined()
    })

    test('应降级date_range语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        dateRange: { from: '2020-01-01', to: '2021-01-01' }
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.dateRange).toBeUndefined()
    })

    test('应降级cache语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        cacheSite: 'example.com'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.cacheSite).toBeUndefined()
    })

    test('应保留支持的语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'sogou',
        site: 'example.com',
        fileType: 'pdf',
        inTitle: 'blog',
        inUrl: 'news',
        exactMatch: 'exact',
        excludeWords: ['spam']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.site).toBe('example.com')
      expect(degraded.fileType).toBe('pdf')
      expect(degraded.inTitle).toBe('blog')
      expect(degraded.inUrl).toBe('news')
      expect(degraded.exactMatch).toBe('exact')
      expect(degraded.excludeWords).toEqual(['spam'])
    })
  })

  describe('语法验证', () => {
    test('应验证支持的语法', () => {
      expect(adapter.validateSyntax('site')).toBe(true)
      expect(adapter.validateSyntax('filetype')).toBe(true)
      expect(adapter.validateSyntax('exact')).toBe(true)
      expect(adapter.validateSyntax('intitle')).toBe(true)
      expect(adapter.validateSyntax('inurl')).toBe(true)
      expect(adapter.validateSyntax('exclude')).toBe(true)
      expect(adapter.validateSyntax('or')).toBe(true)
    })

    test('应拒绝不支持的语法', () => {
      expect(adapter.validateSyntax('intext')).toBe(false)
      expect(adapter.validateSyntax('date_range')).toBe(false)
      expect(adapter.validateSyntax('cache')).toBe(false)
      expect(adapter.validateSyntax('related')).toBe(false)
    })
  })
})
