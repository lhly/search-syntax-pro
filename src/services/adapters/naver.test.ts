import { NaverAdapter } from './naver'
import type { SearchParams } from '@/types'

describe('NaverAdapter', () => {
  let adapter: NaverAdapter

  beforeEach(() => {
    adapter = new NaverAdapter()
  })

  describe('基础功能', () => {
    test('应返回正确的引擎名称', () => {
      expect(adapter.getName()).toBe('Naver')
    })

    test('应返回正确的基础URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://search.naver.com/search.naver')
    })
  })

  describe('语法降级', () => {
    test('应降级多站点OR组合为单个站点', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'naver',
        sites: ['site1.com', 'site2.com', 'site3.com']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.sites).toHaveLength(1)
      expect(degraded.sites![0]).toBe('site1.com')
    })

    test('应降级多文件类型OR组合为单个类型', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'naver',
        fileTypes: ['pdf', 'doc', 'xls']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.fileTypes).toHaveLength(1)
      expect(degraded.fileTypes![0]).toBe('pdf')
    })

    test('应降级OR关键词语法', () => {
      const params: SearchParams = {
        keyword: 'test',
        engine: 'naver',
        orKeywords: ['keyword1', 'keyword2']
      }
      const degraded = adapter.degradeSyntax(params)
      expect(degraded.orKeywords).toBeUndefined()
    })
  })
})
