import { EcosiaAdapter } from './ecosia'
import type { SearchParams } from '@/types'

describe('EcosiaAdapter', () => {
  let adapter: EcosiaAdapter

  beforeEach(() => {
    adapter = new EcosiaAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('Ecosia')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://www.ecosia.org/search')
    })

    test('应支持基础语法列表', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).toContain('exclude')
      expect(supportedSyntax).toContain('or')
      expect(supportedSyntax).toHaveLength(5)
    })
  })

  describe('URL构建', () => {
    test('应构建正确的搜索URL', () => {
      const params: SearchParams = {
        keyword: 'test query',
        engine: 'ecosia'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('ecosia.org/search')
      expect(url).toContain('?q=')
      expect(decodeURIComponent(url)).toContain('test query')
    })

    test('应支持site语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        site: 'example.com'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('site:example.com')
    })

    test('应支持多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
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
        engine: 'ecosia',
        fileType: 'pdf'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('filetype:pdf')
    })

    test('应支持多文件类型OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        fileTypes: ['pdf', 'doc']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('filetype:pdf')
      expect(decodedUrl).toContain('OR')
      expect(decodedUrl).toContain('filetype:doc')
    })

    test('应支持精确匹配', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        exactMatch: 'exact phrase'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('"exact phrase"')
    })

    test('应支持排除语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        excludeWords: ['spam', 'ads']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('-spam')
      expect(decodedUrl).toContain('-ads')
    })

    test('应支持OR关键词', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        orKeywords: ['javascript', 'typescript']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('javascript OR typescript')
    })
  })

  describe('语法降级', () => {
    test('应降级intitle语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        inTitle: 'blog'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inTitle).toBeUndefined()
    })

    test('应降级inurl语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        inUrl: 'news'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inUrl).toBeUndefined()
    })

    test('应降级intext语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        inText: 'content'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inText).toBeUndefined()
    })

    test('应降级date_range语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        dateRange: { from: '2020-01-01', to: '2021-01-01' }
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.dateRange).toBeUndefined()
    })

    test('应保留支持的语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'ecosia',
        site: 'example.com',
        fileType: 'pdf',
        exactMatch: 'exact',
        excludeWords: ['spam']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.site).toBe('example.com')
      expect(degraded.fileType).toBe('pdf')
      expect(degraded.exactMatch).toBe('exact')
      expect(degraded.excludeWords).toEqual(['spam'])
    })
  })

  describe('语法验证', () => {
    test('应验证支持的语法', () => {
      expect(adapter.validateSyntax('site')).toBe(true)
      expect(adapter.validateSyntax('filetype')).toBe(true)
      expect(adapter.validateSyntax('exact')).toBe(true)
      expect(adapter.validateSyntax('exclude')).toBe(true)
      expect(adapter.validateSyntax('or')).toBe(true)
    })

    test('应拒绝不支持的语法', () => {
      expect(adapter.validateSyntax('intitle')).toBe(false)
      expect(adapter.validateSyntax('inurl')).toBe(false)
      expect(adapter.validateSyntax('intext')).toBe(false)
      expect(adapter.validateSyntax('date_range')).toBe(false)
      expect(adapter.validateSyntax('cache')).toBe(false)
    })
  })
})
