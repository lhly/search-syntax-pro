import { BaiduAdapter } from '@/services/adapters/baidu'
import type { SearchParams } from '@/types'

describe('BaiduAdapter', () => {
  let adapter: BaiduAdapter

  beforeEach(() => {
    adapter = new BaiduAdapter()
  })

  describe('基础功能', () => {
    it('应该返回正确的适配器名称', () => {
      expect(adapter.getName()).toBe('百度')
    })

    it('应该返回正确的基准URL', () => {
      expect(adapter.getBaseUrl()).toBe('https://www.baidu.com/s')
    })

    it('应该支持正确的语法类型', () => {
      const supportedSyntax = adapter.getSupportedSyntax()
      expect(supportedSyntax).toContain('site')
      expect(supportedSyntax).toContain('filetype')
      expect(supportedSyntax).toContain('exact')
      expect(supportedSyntax).toContain('date_range')
    })
  })

  describe('搜索查询构建', () => {
    it('应该构建基础关键词搜索', () => {
      const params: SearchParams = {
        keyword: '测试搜索',
        engine: 'baidu'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('wd=%E6%B5%8B%E8%AF%95%E6%90%9C%E7%B4%A2')  // URL编码的"测试搜索"
      expect(url).toContain('https://www.baidu.com/s')
    })

    it('应该构建网站内搜索', () => {
      const params: SearchParams = {
        keyword: 'Vue教程',
        engine: 'baidu',
        site: 'vuejs.org'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('wd=Vue%E6%95%99%E7%A8%8B%20site%3Avuejs.org')  // URL编码
    })

    it('应该构建文件类型搜索', () => {
      const params: SearchParams = {
        keyword: 'JavaScript指南',
        engine: 'baidu',
        fileType: 'pdf'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('wd=JavaScript%E6%8C%87%E5%8D%97%20filetype%3Apdf')  // URL编码
    })

    it('应该构建精确匹配搜索', () => {
      const params: SearchParams = {
        keyword: '',
        engine: 'baidu',
        exactMatch: 'React框架'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('wd=%22React%E6%A1%86%E6%9E%B6%22')  // URL编码的"React框架"
    })

    it('应该构建复合搜索', () => {
      const params: SearchParams = {
        keyword: '前端开发',
        engine: 'baidu',
        site: 'github.com',
        fileType: 'md',
        exactMatch: 'README'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('site%3Agithub.com')  // URL编码
      expect(url).toContain('filetype%3Amd')      // URL编码
      expect(url).toContain('%22README%22')      // URL编码的"README"
    })

    it('应该处理日期范围搜索', () => {
      const params: SearchParams = {
        keyword: '技术新闻',
        engine: 'baidu',
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        }
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('..2024-12-31')
    })

    it('应该正确清理网站域名', () => {
      const params: SearchParams = {
        keyword: '测试',
        engine: 'baidu',
        site: 'https://www.example.com/path/to/page'
      }

      const url = adapter.buildQuery(params)
      expect(url).toContain('site%3Awww.example.com')  // URL编码
      // 验证site参数中不包含原始的https://（但基础URL会包含）
    const queryPart = url.split('?')[1]
    expect(queryPart).not.toContain('https://')
    expect(url).not.toContain('/path')
    })
  })

  describe('参数验证', () => {
    it('应该验证有效的搜索参数', () => {
      const params: SearchParams = {
        keyword: '有效搜索',
        engine: 'baidu',
        site: 'example.com',
        fileType: 'pdf'
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('应该检测空的搜索参数', () => {
      const params: SearchParams = {
        keyword: '',
        engine: 'baidu'
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('请输入搜索关键词或精确匹配内容')
    })

    it('应该检测无效的网站域名', () => {
      const params: SearchParams = {
        keyword: '测试',
        engine: 'baidu',
        site: 'invalid-domain'
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('网站域名格式不正确')
    })

    it('应该对不常见文件类型给出警告', () => {
      const params: SearchParams = {
        keyword: '测试',
        engine: 'baidu',
        fileType: 'xyz'
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(true)
      expect(result.warnings).toContain('文件类型 "xyz" 可能不被百度支持')
    })

    it('应该检测无效的日期格式', () => {
      const params: SearchParams = {
        keyword: '测试',
        engine: 'baidu',
        dateRange: {
          from: 'invalid-date',
          to: '2024-01-01'
        }
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('开始日期格式不正确')
    })

    it('应该检测日期范围逻辑错误', () => {
      const params: SearchParams = {
        keyword: '测试',
        engine: 'baidu',
        dateRange: {
          from: '2024-12-31',
          to: '2024-01-01'
        }
      }

      const result = adapter.validateParams(params)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('开始日期不能晚于结束日期')
    })
  })

  describe('搜索建议', () => {
    it('应该为教程搜索建议文件类型', () => {
      const params: SearchParams = {
        keyword: 'Vue.js教程',
        engine: 'baidu'
      }

      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions).toContain('添加文件类型限制：filetype:pdf')
    })

    it('应该为官网搜索建议网站限制', () => {
      const params: SearchParams = {
        keyword: 'React官网文档',
        engine: 'baidu'
      }

      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions).toContain('添加网站限制：site:官方网站域名')
    })

    it('应该为长关键词建议精确匹配', () => {
      const longKeyword = '这是一个非常长的搜索关键词用于测试精确匹配功能'
      const params: SearchParams = {
        keyword: longKeyword,
        engine: 'baidu'
      }

      const suggestions = adapter.getSearchSuggestions(params)
      expect(suggestions).toContain('使用精确匹配：\"关键词\"')
    })
  })
})