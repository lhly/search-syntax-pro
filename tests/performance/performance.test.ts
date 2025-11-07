import { performance } from 'perf_hooks'

// 性能测试工具
export class PerformanceMonitor {
  private measurements: Map<string, number[]> = new Map()

  startMeasure(name: string): void {
    performance.mark(`${name}-start`)
  }

  endMeasure(name: string): number {
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)

    const measure = performance.getEntriesByName(name, 'measure')[0]
    const duration = measure.duration

    // 记录测量结果
    if (!this.measurements.has(name)) {
      this.measurements.set(name, [])
    }
    this.measurements.get(name)!.push(duration)

    return duration
  }

  getAverageDuration(name: string): number {
    const durations = this.measurements.get(name) || []
    if (durations.length === 0) return 0

    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length
  }

  getMaxDuration(name: string): number {
    const durations = this.measurements.get(name) || []
    return Math.max(...durations, 0)
  }

  getMinDuration(name: string): number {
    const durations = this.measurements.get(name) || []
    return Math.min(...durations, 0)
  }

  clearMeasures(): void {
    performance.clearMarks()
    performance.clearMeasures()
    this.measurements.clear()
  }
}

describe('性能测试', () => {
  const monitor = new PerformanceMonitor()

  beforeEach(() => {
    monitor.clearMeasures()
  })

  describe('查询构建性能', () => {
    it('应该在50ms内构建基础查询', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      const testCases = [
        { keyword: 'React框架', engine: 'baidu' },
        { keyword: 'Vue.js教程', engine: 'baidu', site: 'vuejs.org' },
        { keyword: 'JavaScript指南', engine: 'baidu', fileType: 'pdf' },
        { keyword: '前端开发', engine: 'baidu', site: 'github.com', fileType: 'md' }
      ]

      for (const testCase of testCases) {
        monitor.startMeasure('build-query')

        const url = adapter.buildQuery(testCase)
        const duration = monitor.endMeasure('build-query')

        expect(url).toBeDefined()
        expect(duration).toBeLessThan(50) // 50ms内完成
      }

      const avgDuration = monitor.getAverageDuration('build-query')
      expect(avgDuration).toBeLessThan(30) // 平均时间 < 30ms
    })

    it('应该在100ms内验证参数', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      const testParams = [
        { keyword: '有效搜索', engine: 'baidu', site: 'example.com' },
        { keyword: '', engine: 'baidu' }, // 无效参数
        { keyword: '测试', engine: 'baidu', site: 'invalid-domain' }, // 无效域名
        { keyword: '测试', engine: 'baidu', fileType: 'xyz' } // 不常见文件类型
      ]

      for (const params of testParams) {
        monitor.startMeasure('validate-params')

        const result = adapter.validateParams(params)
        const duration = monitor.endMeasure('validate-params')

        expect(result).toBeDefined()
        expect(duration).toBeLessThan(100) // 100ms内完成
      }

      const avgDuration = monitor.getAverageDuration('validate-params')
      expect(avgDuration).toBeLessThan(50) // 平均时间 < 50ms
    })
  })

  describe('存储操作性能', () => {
    it('应该在100ms内完成存储读写', async () => {
      // 模拟Chrome存储API
      const mockStorage = {
        data: new Map<string, any>(),
        get: function(keys: string[], callback: (result: any) => void) {
          const result: any = {}
          keys.forEach(key => {
            if (this.data.has(key)) {
              result[key] = this.data.get(key)
            }
          })
          callback(result)
          return Promise.resolve(result)
        },
        set: function(items: any, callback?: () => void) {
          Object.entries(items).forEach(([key, value]) => {
            this.data.set(key, value)
          })
          callback?.()
          return Promise.resolve()
        }
      }

      const testData = {
        search_history: Array.from({ length: 1000 }, (_, i) => ({
          id: `test-${i}`,
          keyword: `搜索关键词 ${i}`,
          engine: 'baidu',
          syntax: { site: `example${i}.com` },
          generatedQuery: `搜索关键词 ${i} site:example${i}.com`,
          timestamp: Date.now() + i
        }))
      }

      // 测试写入性能
      monitor.startMeasure('storage-write')
      await mockStorage.set(testData)
      const writeDuration = monitor.endMeasure('storage-write')

      expect(writeDuration).toBeLessThan(100)

      // 测试读取性能
      monitor.startMeasure('storage-read')
      await mockStorage.get(['search_history'], (result) => {
        expect(result.search_history).toHaveLength(1000)
      })
      const readDuration = monitor.endMeasure('storage-read')

      expect(readDuration).toBeLessThan(100)
    })
  })

  describe('UI组件��染性能', () => {
    it('应该在200ms内渲染搜索表单', async () => {
      const { render } = await import('@testing-library/react')
      const { SearchForm } = await import('../../src/components/SearchForm')
      const { SearchParams } = await import('../../src/types')

      const defaultProps = {
        searchParams: {
          keyword: '',
          engine: 'baidu' as const,
          site: '',
          fileType: '',
          exactMatch: ''
        },
        onSearchParamsChange: jest.fn()
      }

      // 多次渲染测试
      for (let i = 0; i < 10; i++) {
        monitor.startMeasure('render-search-form')

        const { unmount } = render(<SearchForm {...defaultProps} />)
        unmount()

        const duration = monitor.endMeasure('render-search-form')
        expect(duration).toBeLessThan(200) // 200ms内完成
      }

      const avgDuration = monitor.getAverageDuration('render-search-form')
      expect(avgDuration).toBeLessThan(100) // 平均时间 < 100ms
    })
  })

  describe('内存使用测试', () => {
    it('应该检查内存泄漏', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // 模拟大量操作
      for (let i = 0; i < 1000; i++) {
        const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
        const adapter = new BaiduAdapter()

        const params = {
          keyword: `测试搜索 ${i}`,
          engine: 'baidu' as const,
          site: `example${i}.com`,
          fileType: 'pdf'
        }

        adapter.buildQuery(params)
        adapter.validateParams(params)
      }

      // 强制垃圾回收（如果可用）
      if ((global as any).gc) {
        ;(global as any).gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // 内存增长不应超过10MB
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('并发性能测试', () => {
    it('应该处理并发查询构建', async () => {
      const { BaiduAdapter } = await import('../../src/services/adapters/baidu')
      const adapter = new BaiduAdapter()

      const concurrentRequests = Array.from({ length: 50 }, (_, i) => ({
        keyword: `并发测试 ${i}`,
        engine: 'baidu' as const,
        site: `example${i}.com`
      }))

      monitor.startMeasure('concurrent-queries')

      const promises = concurrentRequests.map(params =>
        Promise.resolve(adapter.buildQuery(params))
      )

      await Promise.all(promises)

      const duration = monitor.endMeasure('concurrent-queries')

      // 并发处理应该在合理时间内完成
      expect(duration).toBeLessThan(1000) // 1秒内完成50个并发请求
    })
  })

  describe('大数据量性能测试', () => {
    it('应该处理大量历史记录', async () => {
      const largeHistory = Array.from({ length: 5000 }, (_, i) => ({
        id: `history-${i}`,
        keyword: `搜索关键词 ${i}`,
        engine: 'baidu' as const,
        syntax: { site: `example${i}.com` },
        generatedQuery: `搜索关键词 ${i} site:example${i}.com`,
        timestamp: Date.now() + i
      }))

      monitor.startMeasure('process-large-history')

      // 模拟处理大量历史记录
      const filtered = largeHistory.filter(item =>
        item.keyword.includes('测试') || item.timestamp > Date.now() - 86400000
      )

      const sorted = filtered.sort((a, b) => b.timestamp - a.timestamp)
      const sliced = sorted.slice(0, 1000) // 限制显示数量

      const duration = monitor.endMeasure('process-large-history')

      expect(sliced).toHaveLength(Math.min(1000, filtered.length))
      expect(duration).toBeLessThan(500) // 500ms内完成处理
    })
  })

  describe('响应式性能测试', () => {
    it('应该快速响应窗口大小变化', async () => {
      monitor.startMeasure('responsive-layout')

      // 模拟不同的屏幕尺寸
      const screenSizes = [
        { width: 1920, height: 1080 }, // 桌面
        { width: 768, height: 1024 },  // 平板
        { width: 375, height: 667 }    // 移动
      ]

      for (const size of screenSizes) {
        // 模拟窗口大小变化
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: size.width
        })

        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: size.height
        })

        // 触发resize事件
        window.dispatchEvent(new Event('resize'))
      }

      const duration = monitor.endMeasure('responsive-layout')

      expect(duration).toBeLessThan(100) // 100ms内完成响应式调整
    })
  })

  afterEach(() => {
    monitor.clearMeasures()
  })

  afterAll(() => {
    // 输出性能报告
    console.log('\n=== 性能测试报告 ===')

    const allMeasurements = Array.from(monitor.measurements.entries())
    if (allMeasurements.length > 0) {
      allMeasurements.forEach(([name, durations]) => {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
        const max = Math.max(...durations)
        const min = Math.min(...durations)

        console.log(`${name}:`)
        console.log(`  平均耗时: ${avg.toFixed(2)}ms`)
        console.log(`  最大耗时: ${max.toFixed(2)}ms`)
        console.log(`  最小耗时: ${min.toFixed(2)}ms`)
        console.log(`  测试次数: ${durations.length}`)
        console.log('')
      })
    } else {
      console.log('没有性能测量数据')
    }

    console.log('==================\n')
  })
})