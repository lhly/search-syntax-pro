import { So360Adapter } from './so360'
import type { SearchParams } from '@/types'

describe('So360Adapter', () => {
  let adapter: So360Adapter

  beforeEach(() => {
    adapter = new So360Adapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('360搜索')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://www.so.com/s')
    })

    test('应支持基础语法列表', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).toContain('intitle')
      expect(supportedSyntax).toContain('exclude')
      expect(supportedSyntax).toHaveLength(5)
      expect(supportedSyntax).not.toContain('or')
    })
  })

  describe('URL构建', () => {
    test('应构建正确的搜索URL', () => {
      const params: SearchParams = {
        keyword: 'test query',
        engine: 'so360'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('so.com/s')
      expect(url).toContain('?q=')
      expect(decodeURIComponent(url)).toContain('test query')
    })

    test('应支持site语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        site: 'example.com'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('site:example.com')
    })

    test('应降级多站点为单个站点', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        sites: ['example.com', 'test.com', 'another.com']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('site:example.com')
      expect(decodedUrl).not.toContain('OR')
      expect(decodedUrl).not.toContain('test.com')
    })

    test('应支持filetype语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        fileType: 'pdf'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('filetype:pdf')
    })

    test('应降级多文件类型为单个类型', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        fileTypes: ['pdf', 'doc', 'xls']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('filetype:pdf')
      expect(decodedUrl).not.toContain('OR')
      expect(decodedUrl).not.toContain('doc')
    })

    test('应支持intitle语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        inTitle: 'blog'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('intitle:blog')
    })

    test('应支持精确匹配', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        exactMatch: 'exact phrase'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('"exact phrase"')
    })

    test('应支持排除语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
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
        engine: 'so360',
        site: 'zhihu.com'
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('人工智能')
      expect(decodedUrl).toContain('site:zhihu.com')
    })
  })

  describe('语法降级', () => {
    test('应降级多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        sites: ['example.com', 'test.com']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.sites).toHaveLength(1)
      expect(degraded.sites?.[0]).toBe('example.com')
    })

    test('应降级多文件类型OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        fileTypes: ['pdf', 'doc']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.fileTypes).toHaveLength(1)
      expect(degraded.fileTypes?.[0]).toBe('pdf')
    })

    test('应降级OR关键词语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        orKeywords: ['javascript', 'typescript']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.orKeywords).toBeUndefined()
    })

    test('应降级inurl语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        inUrl: 'news'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inUrl).toBeUndefined()
    })

    test('应降级intext语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        inText: 'content'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inText).toBeUndefined()
    })

    test('应降级date_range语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        dateRange: { from: '2020-01-01', to: '2021-01-01' }
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.dateRange).toBeUndefined()
    })

    test('应保留支持的语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'so360',
        site: 'example.com',
        fileType: 'pdf',
        inTitle: 'blog',
        exactMatch: 'exact',
        excludeWords: ['spam']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.site).toBe('example.com')
      expect(degraded.fileType).toBe('pdf')
      expect(degraded.inTitle).toBe('blog')
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
      expect(adapter.validateSyntax('exclude')).toBe(true)
    })

    test('应拒绝不支持的语法', () => {
      expect(adapter.validateSyntax('or')).toBe(false)
      expect(adapter.validateSyntax('inurl')).toBe(false)
      expect(adapter.validateSyntax('intext')).toBe(false)
      expect(adapter.validateSyntax('date_range')).toBe(false)
      expect(adapter.validateSyntax('cache')).toBe(false)
    })
  })
})
