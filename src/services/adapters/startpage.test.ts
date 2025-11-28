import { StartpageAdapter } from './startpage'
import type { SearchParams } from '@/types'

describe('StartpageAdapter', () => {
  let adapter: StartpageAdapter

  beforeEach(() => {
    adapter = new StartpageAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('Startpage')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://www.startpage.com/sp/search')
    })
  })

  describe('URL构建', () => {
    test('应使用query参数而不是q', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'startpage'
      }
      const url = adapter.buildQuery(params)
      expect(url).toContain('?query=')
      expect(url).not.toContain('?q=')
    })

    test('应支持多站点OR组合', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'startpage',
        sites: ['example.com', 'test.com']
      }
      const url = adapter.buildQuery(params)
      const decodedUrl = decodeURIComponent(url)
      expect(decodedUrl).toContain('site:example.com')
      expect(decodedUrl).toContain('OR')
      expect(decodedUrl).toContain('site:test.com')
    })
  })

  describe('语法降级', () => {
    test('应降级不支持的inurl语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'startpage',
        inUrl: 'blog'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.inUrl).toBeUndefined()
    })

    test('应支持date_range语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('date_range')
      expect(supportedSyntax).not.toContain('inurl')
    })
  })
})
