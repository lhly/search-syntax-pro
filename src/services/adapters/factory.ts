import type { SearchEngineAdapter, SearchEngine } from '@/types'
import { BaiduAdapter } from './baidu'
import { GoogleAdapter } from './google'
import { BingAdapter } from './bing'
import { TwitterAdapter } from './twitter'

/**
 * 搜索引擎适配器工厂
 * 负责创建和管理不同的搜索引擎适配器实例
 */
export class SearchAdapterFactory {
  private static adapters: Map<SearchEngine, SearchEngineAdapter> = new Map()

  /**
   * 获取搜索引擎适配器实例（单例模式）
   */
  static getAdapter(engine: SearchEngine): SearchEngineAdapter {
    if (!this.adapters.has(engine)) {
      const adapter = this.createAdapter(engine)
      this.adapters.set(engine, adapter)
    }

    const adapter = this.adapters.get(engine)
    if (!adapter) {
      throw new Error(`无法创建搜索引擎适配器: ${engine}`)
    }
    return adapter
  }

  /**
   * 创建新的搜索引擎适配器实例
   */
  private static createAdapter(engine: SearchEngine): SearchEngineAdapter {
    switch (engine) {
      case 'baidu':
        return new BaiduAdapter()
      case 'google':
        return new GoogleAdapter()
      case 'bing':
        return new BingAdapter()
      case 'twitter':
        return new TwitterAdapter()
      default:
        throw new Error(`不支持的搜索引擎: ${engine}`)
    }
  }

  /**
   * 获取所有支持的搜索引擎
   */
  static getSupportedEngines(): SearchEngine[] {
    return ['baidu', 'google', 'bing', 'twitter']
  }

  /**
   * 获取搜索引擎的显示名称
   */
  static getEngineName(engine: SearchEngine): string {
    const adapter = this.getAdapter(engine)
    return adapter.getName()
  }

  /**
   * 检查搜索引擎是否支持特定语法
   */
  static supportsSyntax(engine: SearchEngine, syntax: string): boolean {
    try {
      const adapter = this.getAdapter(engine)
      return adapter.validateSyntax(syntax as any)
    } catch {
      return false
    }
  }

  /**
   * 获取搜索引擎支持的语法类型
   */
  static getSupportedSyntax(engine: SearchEngine) {
    const adapter = this.getAdapter(engine)
    return adapter.getSupportedSyntax()
  }

  /**
   * 构建搜索查询URL
   */
  static buildSearchUrl(engine: SearchEngine, params: any): string {
    const adapter = this.getAdapter(engine)
    return adapter.buildQuery(params)
  }

  /**
   * 验证搜索参数
   */
  static validateSearchParams(engine: SearchEngine, params: any) {
    const adapter = this.getAdapter(engine)
    return adapter.validateParams?.(params) || { isValid: true, errors: [], warnings: [] }
  }

  /**
   * 获取搜索建议
   */
  static getSearchSuggestions(engine: SearchEngine, params: any): string[] {
    const adapter = this.getAdapter(engine)
    if ('getSearchSuggestions' in adapter) {
      return (adapter as any).getSearchSuggestions(params)
    }
    return []
  }

  /**
   * 预加载所有适配器
   */
  static preloadAdapters(): void {
    this.getSupportedEngines().forEach(engine => {
      this.getAdapter(engine)
    })
  }

  /**
   * 清理适配器缓存
   */
  static clearCache(): void {
    this.adapters.clear()
  }
}

/**
 * 默认导出工厂实例
 */
export default SearchAdapterFactory