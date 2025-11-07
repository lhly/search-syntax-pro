import { useState, useEffect, useCallback } from 'react'
import StorageService from '@/services/storage'

// 使用存储数据的Hook
export function useStorage<T>(key: string, defaultValue?: T) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await StorageService.get<T>(key)
      setData(result || defaultValue || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败')
      setData(defaultValue || null)
    } finally {
      setLoading(false)
    }
  }, [key, defaultValue])

  // 保存数据
  const saveData = useCallback(async (value: T) => {
    try {
      setError(null)
      const success = await StorageService.set(key, value)
      if (success) {
        setData(value)
      } else {
        setError('保存数据失败')
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存数据失败')
      return false
    }
  }, [key])

  // 删除数据
  const removeData = useCallback(async () => {
    try {
      setError(null)
      const success = await StorageService.remove(key)
      if (success) {
        setData(defaultValue || null)
      } else {
        setError('删除数据失败')
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除数据失败')
      return false
    }
  }, [key, defaultValue])

  // 初始化时加载数据
  useEffect(() => {
    loadData()
  }, [loadData])

  // 监听存储变化
  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes[key]) {
        setData(changes[key].newValue || defaultValue || null)
      }
    }

    StorageService.onChanged(handleStorageChange)

    return () => {
      // 清理监听器（Chrome扩展不需要，因为页面关闭时自动清理）
    }
  }, [key, defaultValue])

  return {
    data,
    loading,
    error,
    refetch: loadData,
    save: saveData,
    remove: removeData
  }
}

// 批量存储操作的Hook
export function useBatchStorage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const batchOperation = useCallback(async (operations: Array<{
    type: 'set' | 'remove'
    key: string
    value?: any
  }>) => {
    try {
      setLoading(true)
      setError(null)
      
      for (const operation of operations) {
        if (operation.type === 'set') {
          await StorageService.set(operation.key, operation.value)
        } else if (operation.type === 'remove') {
          await StorageService.remove(operation.key)
        }
      }
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : '批量操作失败')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    execute: batchOperation
  }
}

// 存储使用情况的Hook
export function useStorageUsage() {
  const [usage, setUsage] = useState({ usedBytes: 0, quotaBytes: 5242880 })
  const [loading, setLoading] = useState(false)

  const refreshUsage = useCallback(async () => {
    try {
      setLoading(true)
      const result = await StorageService.getUsage()
      setUsage(result)
    } catch (err) {
      console.error('获取存储使用情况失败', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUsage()
  }, [refreshUsage])

  return {
    usage,
    loading,
    refresh: refreshUsage,
    usagePercentage: Math.round((usage.usedBytes / usage.quotaBytes) * 100)
  }
}