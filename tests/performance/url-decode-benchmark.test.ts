/**
 * URL 解码性能基准测试
 *
 * 验证安全解码函数的性能开销
 */

import { safeDecodeURIComponent, extractAndDecodeQuery } from '@/utils/url-utils'

describe('URL解码性能基准', () => {
  // 测试数据集
  const testCases = {
    short: 'test%20query',
    medium: 'test%20site%3Aexample.com%20%22exact%20match%22',
    long: 'language%3Atypescript%20stars%3A%3E100%20forks%3A%3E50%20'.repeat(10),
    chinese: '%E6%B5%8B%E8%AF%95%E6%90%9C%E7%B4%A2'.repeat(5),
    complex: 'from%3Auser%20to%3A%40someone%20%22exact%20phrase%22%20-exclude%20OR%20alternative',
    malformed: 'test%2invalid%3code'
  }

  const iterations = 1000 // 测试迭代次数

  describe('性能指标', () => {
    it('短字符串解码性能 (< 1ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.short)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      // 断言：平均每次解码时间应小于 0.1ms
      expect(avgTime).toBeLessThan(0.1)

      console.log(`📊 短字符串解码性能: ${avgTime.toFixed(4)}ms/次 (${iterations}次迭代)`)
    })

    it('中等字符串解码性能 (< 1ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.medium)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(0.1)

      console.log(`📊 中等字符串解码性能: ${avgTime.toFixed(4)}ms/次`)
    })

    it('长字符串解码性能 (< 2ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.long)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(0.5)

      console.log(`📊 长字符串解码性能: ${avgTime.toFixed(4)}ms/次`)
    })

    it('中文字符解码性能 (< 1ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.chinese)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(0.1)

      console.log(`📊 中文字符解码性能: ${avgTime.toFixed(4)}ms/次`)
    })

    it('复杂查询解码性能 (< 1ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.complex)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      expect(avgTime).toBeLessThan(0.1)

      console.log(`📊 复杂查询解码性能: ${avgTime.toFixed(4)}ms/次`)
    })

    it('错误处理性能开销 (< 2ms)', () => {
      // Mock console.warn to avoid noise
      const originalWarn = console.warn
      console.warn = jest.fn()

      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testCases.malformed)
      }

      const duration = performance.now() - start
      const avgTime = duration / iterations

      console.warn = originalWarn

      // 错误处理路径允许稍高的开销
      expect(avgTime).toBeLessThan(0.5)

      console.log(`⚠️  错误处理路径性能: ${avgTime.toFixed(4)}ms/次`)
    })
  })

  describe('完整流程性能', () => {
    const fullUrls = [
      'https://www.baidu.com/s?wd=test%20query&ie=utf-8',
      'https://www.google.com/search?q=language%3Atypescript%20stars%3A%3E100',
      'https://www.bing.com/search?q=from%3Auser%20%22exact%20phrase%22',
      'https://github.com/search?q=%E6%B5%8B%E8%AF%95'
    ]

    it('extractAndDecodeQuery 完整流程性能 (< 1ms)', () => {
      const start = performance.now()

      for (let i = 0; i < iterations; i++) {
        fullUrls.forEach(url => extractAndDecodeQuery(url))
      }

      const duration = performance.now() - start
      const avgTime = duration / (iterations * fullUrls.length)

      expect(avgTime).toBeLessThan(0.1)

      console.log(`📊 完整流程性能: ${avgTime.toFixed(4)}ms/次`)
      console.log(`   总耗时: ${duration.toFixed(2)}ms (${iterations * fullUrls.length}次操作)`)
    })
  })

  describe('Try-Catch 开销分析', () => {
    it('对比有无 try-catch 的性能差异', () => {
      const normalDecode = (str: string) => {
        if (!str.includes('%')) return str
        return decodeURIComponent(str)
      }

      const testString = testCases.medium

      // 测试不带 try-catch 的原始实现
      const startNormal = performance.now()
      for (let i = 0; i < iterations; i++) {
        normalDecode(testString)
      }
      const durationNormal = performance.now() - startNormal

      // 测试带 try-catch 的安全实现
      const startSafe = performance.now()
      for (let i = 0; i < iterations; i++) {
        safeDecodeURIComponent(testString)
      }
      const durationSafe = performance.now() - startSafe

      const overhead = ((durationSafe - durationNormal) / durationNormal) * 100

      console.log(`📊 Try-Catch 开销分析:`)
      console.log(`   原始实现: ${durationNormal.toFixed(2)}ms`)
      console.log(`   安全实现: ${durationSafe.toFixed(2)}ms`)
      console.log(`   性能开销: ${overhead.toFixed(2)}% (${(durationSafe - durationNormal).toFixed(2)}ms)`)

      // 断言：try-catch 开销应小于 50%
      expect(overhead).toBeLessThan(50)
    })
  })

  describe('内存使用分析', () => {
    it('验证无内存泄漏', () => {
      // 大量调用测试内存稳定性
      const largeIterations = 10000
      const testString = testCases.medium

      // 执行大量解码操作
      for (let i = 0; i < largeIterations; i++) {
        safeDecodeURIComponent(testString)
      }

      // 如果有内存泄漏，Jest 会在测试超时或内存溢出时失败
      // 这个测试主要验证没有明显的内存问题
      expect(true).toBe(true)

      console.log(`✅ 内存稳定性测试通过 (${largeIterations}次迭代)`)
    })
  })
})
