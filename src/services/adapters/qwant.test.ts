import { QwantAdapter } from './qwant'
import type { SearchParams } from '@/types'

describe('QwantAdapter', () => {
  let adapter: QwantAdapter

  beforeEach(() => {
    adapter = new QwantAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('Qwant')
    })

    test('应仅支持最小语法', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toHaveLength(3)
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).not.toContain('exclude')
    })
  })

  describe('语法降级', () => {
    test('应降级多站点为单个站点', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'qwant',
        sites: ['site1.com', 'site2.com']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.sites).toHaveLength(1)
    })

    test('应降级所有高级语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'qwant',
        excludeWords: ['word1', 'word2'],
        inTitle: 'title',
        relatedSite: 'example.com'
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.excludeWords).toBeUndefined()
      expect(degraded.inTitle).toBeUndefined()
      expect(degraded.relatedSite).toBeUndefined()
    })
  })
})
