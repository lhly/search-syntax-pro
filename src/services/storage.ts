import type { SearchHistory } from '@/types'
import { getExtensionVersion } from '@/utils/version'

// 存储服务类
export class StorageService {
  /**
   * 获取存储的数据
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get(key)
      return result[key] || null
    } catch (error) {
      console.error(`获取存储数据失败: ${key}`, error)
      return null
    }
  }

  /**
   * 设置存储数据
   */
  static async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await chrome.storage.local.set({ [key]: value })
      return true
    } catch (error) {
      console.error(`设置存储数据失败: ${key}`, error)
      return false
    }
  }

  /**
   * 删除存储数据
   */
  static async remove(key: string): Promise<boolean> {
    try {
      await chrome.storage.local.remove(key)
      return true
    } catch (error) {
      console.error(`删除存储数据失败: ${key}`, error)
      return false
    }
  }

  /**
   * 清空所有存储数据
   */
  static async clear(): Promise<boolean> {
    try {
      await chrome.storage.local.clear()
      return true
    } catch (error) {
      console.error('清空存储数据失败', error)
      return false
    }
  }

  /**
   * 获取存储使用情况
   */
  static async getUsage(): Promise<{ usedBytes: number; quotaBytes: number }> {
    try {
      return new Promise((resolve) => {
        chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
          resolve({
            usedBytes: bytesInUse,
            quotaBytes: 5242880 // 5MB (Chrome扩展本地存储默认限制)
          })
        })
      })
    } catch (error) {
      console.error('获取存储使用情况失败', error)
      return { usedBytes: 0, quotaBytes: 5242880 }
    }
  }

  /**
   * 备份数据
   */
  static async backup(): Promise<string> {
    try {
      const allData = await chrome.storage.local.get(null)
      const backup = {
        version: getExtensionVersion(),
        timestamp: Date.now(),
        data: allData
      }
      return JSON.stringify(backup, null, 2)
    } catch (error) {
      console.error('备份数据失败', error)
      throw error
    }
  }

  /**
   * 恢复数据
   */
  static async restore(backupData: string): Promise<boolean> {
    try {
      const backup = JSON.parse(backupData)
      
      // 验证备份数据格式
      if (!backup.version || !backup.data) {
        throw new Error('备份数据格式无效')
      }
      
      await chrome.storage.local.clear()
      await chrome.storage.local.set(backup.data)
      return true
    } catch (error) {
      console.error('恢复数据失败', error)
      return false
    }
  }

  /**
   * 清理过期数据
   */
  static async cleanupExpiredData(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
      
      // 清理过期历史记录
      const history = await this.get<SearchHistory[]>('search_history')
      if (history) {
        const validHistory = history.filter(item => item.timestamp > thirtyDaysAgo)
        if (validHistory.length !== history.length) {
          await this.set('search_history', validHistory)
        }
      }
      
      // 清理过期缓存
      const cache = await this.get<any>('app_cache')
      if (cache && cache.timestamp && cache.timestamp < thirtyDaysAgo) {
        await this.remove('app_cache')
      }
    } catch (error) {
      console.error('清理过期数据失败', error)
    }
  }

  /**
   * 监听存储变化
   */
  static onChanged(
    callback: (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => void
  ): void {
    chrome.storage.onChanged.addListener(callback)
  }
}

// 默认导出
export default StorageService