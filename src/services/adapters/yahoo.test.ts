import { YahooAdapter } from './yahoo'
import type { SearchParams } from '@/types'

describe('YahooAdapter', () => {
  let adapter: YahooAdapter

  beforeEach(() => {
    adapter = new YahooAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('Yahoo')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://search.yahoo.com/search')
    })

    test('应支持Bing兼容语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('intitle')
      expect(supportedSyntax).toContain('inurl')
      expect(supportedSyntax).toContain('related')
      expect(supportedSyntax).not.toContain('cache')
    })
  })

  describe('URL构建', () => {
    test('应构建基础搜索URL使用?p=参数', () => {
      const params: SearchParams = {
        keyword: 'test query',
        engine: 'yahoo'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('search.yahoo.com/search')
      expect(url).toContain('?p=')
      expect(url).toContain('test%20query')
    })

    test('应支持site语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        site: 'example.com'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('site:example.com')
    })

    test('应支持多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
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
        engine: 'yahoo',
        fileType: 'pdf'
      }
      const url = adapter.buildQuery(params)
      expect(decodeURIComponent(url)).toContain('filetype:pdf')
    })

    test('应支持多文件类型OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        fileTypes: ['pdf', 'doc']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('filetype:pdf')
      expect(decodedUrl).toContain('OR')
      expect(decodedUrl).toContain('filetype:doc')
    })
  })

  describe('语法降级', () => {
    test('应降级cache语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        cacheSite: 'example.com'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.cacheSite).toBeUndefined()
    })

    test('应保留支持的语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'yahoo',
        site: 'example.com',
        fileType: 'pdf'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.site).toBe('example.com')
      expect(degraded.fileType).toBe('pdf')
    })
  })
})
