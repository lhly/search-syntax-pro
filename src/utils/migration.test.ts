/**
 * 数据迁移逻辑测试
 * 覆盖关键边界情况和老用户升级场景
 */

import { migrateToV2Settings, validateUserSettings } from './migration'
import { EnginePreferenceService } from '@/services/engine-preference'
import type { UserSettings, EnginePreference } from '@/types'

describe('数据迁移逻辑测试', () => {
  describe('migrateToV2Settings - 从旧版本迁移 (仅处理 defaultEngine 字段)', () => {
    test('场景1: 老用户有 defaultEngine，移除该字段并保持引擎顺序', () => {
      const oldSettings = {
        defaultEngine: 'google' as const,
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'baidu' as const, visible: true, order: 1 },
          { engine: 'bing' as const, visible: true, order: 2 },
          { engine: 'duckduckgo' as const, visible: true, order: 3 },
          { engine: 'brave' as const, visible: true, order: 4 },
          { engine: 'twitter' as const, visible: true, order: 5 },
          { engine: 'yandex' as const, visible: true, order: 6 },
          { engine: 'reddit' as const, visible: true, order: 7 },
          { engine: 'github' as const, visible: true, order: 8 },
          { engine: 'stackoverflow' as const, visible: true, order: 9 }
        ],
        language: 'zh-CN' as const,
        enableHistory: true,
        theme: 'auto' as const,
        historyLimit: 100,
        autoOpenInNewTab: false
      }

      const newSettings = migrateToV2Settings(oldSettings)

      // 验证 defaultEngine 字段已移除
      expect('defaultEngine' in newSettings).toBe(false)

      // 验证引擎数量保持不变（此函数不负责补充新引擎）
      expect(newSettings.enginePreferences.length).toBe(10)

      // 验证 google 仍在第一位（保持默认引擎）
      expect(newSettings.enginePreferences[0].engine).toBe('google')

      // 验证 order 值连续无重复
      const orders = newSettings.enginePreferences.map(p => p.order)
      expect(orders).toEqual([...Array(10).keys()]) // [0,1,2,...,9]
    })

    test('场景2: 默认引擎在中间位置，需要移到第一位', () => {
      const oldSettings = {
        defaultEngine: 'bing' as const,
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'baidu' as const, visible: true, order: 1 },
          { engine: 'bing' as const, visible: true, order: 2 }, // 默认引擎
          { engine: 'duckduckgo' as const, visible: true, order: 3 }
        ],
        language: 'zh-CN' as const,
        enableHistory: true,
        theme: 'auto' as const,
        historyLimit: 100,
        autoOpenInNewTab: false
      }

      const newSettings = migrateToV2Settings(oldSettings)

      // 验证 bing 移到了第一位
      expect(newSettings.enginePreferences[0].engine).toBe('bing')

      // 验证 google 和 baidu 的相对顺序保持
      const engines = newSettings.enginePreferences.map(p => p.engine)
      const bingIndex = engines.indexOf('bing')
      const googleIndex = engines.indexOf('google')
      const baiduIndex = engines.indexOf('baidu')

      expect(bingIndex).toBe(0)
      expect(googleIndex).toBeLessThan(baiduIndex) // 相对顺序不变
    })

    test('场景3: 已经是新格式（无 defaultEngine），直接返回', () => {
      const newFormatSettings: UserSettings = {
        enginePreferences: [
          { engine: 'google', visible: true, order: 0 },
          { engine: 'baidu', visible: true, order: 1 }
        ],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const result = migrateToV2Settings(newFormatSettings as any)

      // 应该返回原对象（或相同结构）
      expect(result).toEqual(newFormatSettings)
    })

    test('场景4: 默认引擎不存在于 enginePreferences 中', () => {
      const oldSettings = {
        defaultEngine: 'nonexistent' as any, // 故意使用无效值测试边界情况
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'baidu' as const, visible: true, order: 1 }
        ],
        language: 'zh-CN' as const,
        enableHistory: true,
        theme: 'auto' as const,
        historyLimit: 100,
        autoOpenInNewTab: false
      }

      const newSettings = migrateToV2Settings(oldSettings)

      // 应该保持原有排序（无法移动不存在的引擎）
      expect(newSettings.enginePreferences[0].engine).toBe('google')
    })

    test('场景5: 所有引擎都不可见，应该自动显示第一个', () => {
      const oldSettings = {
        defaultEngine: 'google' as const,
        enginePreferences: [
          { engine: 'google' as const, visible: false, order: 0 },
          { engine: 'baidu' as const, visible: false, order: 1 },
          { engine: 'bing' as const, visible: false, order: 2 }
        ],
        language: 'zh-CN' as const,
        enableHistory: true,
        theme: 'auto' as const,
        historyLimit: 100,
        autoOpenInNewTab: false
      }

      const newSettings = migrateToV2Settings(oldSettings)

      // 至少第一个引擎应该可见
      const visibleCount = newSettings.enginePreferences.filter(p => p.visible).length
      expect(visibleCount).toBeGreaterThan(0)
      expect(newSettings.enginePreferences[0].visible).toBe(true)
    })
  })

  describe('validateUserSettings - 验证和修复设置', () => {
    test('边界情况1: enginePreferences 为空数组', () => {
      const invalidSettings: UserSettings = {
        enginePreferences: [],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const validSettings = validateUserSettings(invalidSettings)

      // 应该使用默认配置
      expect(validSettings.enginePreferences.length).toBeGreaterThan(0)
      expect(validSettings.enginePreferences.length).toBe(17) // 当前支持的引擎数
    })

    test('边界情况2: enginePreferences 包含无效引擎', () => {
      const invalidSettings: UserSettings = {
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'invalid_engine' as any, visible: true, order: 1 }, // 故意无效值
          { engine: 'baidu' as const, visible: true, order: 2 }
        ],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const validSettings = validateUserSettings(invalidSettings)

      // 无效引擎应该被移除
      const engines = validSettings.enginePreferences.map(p => p.engine)
      expect(engines).not.toContain('invalid_engine')
      expect(engines).toContain('google')
      expect(engines).toContain('baidu')
    })

    test('边界情况3: order 值重复', () => {
      const invalidSettings: UserSettings = {
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'baidu' as const, visible: true, order: 0 }, // 重复的 order
          { engine: 'bing' as const, visible: true, order: 2 }
        ],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const validSettings = validateUserSettings(invalidSettings)

      // order 应该被修复为连续值
      const orders = validSettings.enginePreferences.map(p => p.order)
      expect(new Set(orders).size).toBe(orders.length) // 无重复
      expect(Math.max(...orders)).toBe(orders.length - 1) // 连续
    })

    test('边界情况4: 缺少新增的引擎', () => {
      const oldSettings: UserSettings = {
        enginePreferences: [
          { engine: 'google' as const, visible: true, order: 0 },
          { engine: 'baidu' as const, visible: true, order: 1 }
          // 缺少其他15个引擎
        ],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const validSettings = validateUserSettings(oldSettings)

      // 应该补充所有缺失的引擎
      expect(validSettings.enginePreferences.length).toBe(17)

      // 验证新增引擎默认可见
      const newEngines = validSettings.enginePreferences.slice(2) // 前2个是原有的
      newEngines.forEach(pref => {
        expect(pref.visible).toBe(true)
      })
    })

    test('边界情况5: 所有引擎不可见，应该强制第一个可见', () => {
      const invalidSettings: UserSettings = {
        enginePreferences: [
          { engine: 'google' as const, visible: false, order: 0 },
          { engine: 'baidu' as const, visible: false, order: 1 },
          { engine: 'bing' as const, visible: false, order: 2 }
        ],
        language: 'zh-CN',
        enableHistory: true,
        theme: 'auto',
        historyLimit: 100,
        autoOpenInNewTab: false,
        enableContextMenu: true,
        enableFloatingButton: true
      }

      const validSettings = validateUserSettings(invalidSettings)

      // 至少第一个引擎应该可见
      const visibleCount = validSettings.enginePreferences.filter(p => p.visible).length
      expect(visibleCount).toBeGreaterThan(0)
    })
  })

  describe('EnginePreferenceService - 引擎偏好服务测试', () => {
    test('getDefaultEngine - 获取排序第一位的可见引擎', () => {
      const preferences: EnginePreference[] = [
        { engine: 'google' as const, visible: true, order: 0 },
        { engine: 'baidu' as const, visible: true, order: 1 },
        { engine: 'bing' as const, visible: false, order: 2 }
      ]

      const defaultEngine = EnginePreferenceService.getDefaultEngine(preferences)
      expect(defaultEngine).toBe('google')
    })

    test('getDefaultEngine - 第一个不可见时，返回第一个可见的', () => {
      const preferences: EnginePreference[] = [
        { engine: 'google' as const, visible: false, order: 0 },
        { engine: 'baidu' as const, visible: true, order: 1 },
        { engine: 'bing' as const, visible: true, order: 2 }
      ]

      const defaultEngine = EnginePreferenceService.getDefaultEngine(preferences)
      expect(defaultEngine).toBe('baidu')
    })

    test('toggleVisibility - 不允许隐藏最后一个可见引擎', () => {
      const preferences: EnginePreference[] = [
        { engine: 'google' as const, visible: true, order: 0 }, // 唯一可见
        { engine: 'baidu' as const, visible: false, order: 1 }
      ]

      const result = EnginePreferenceService.toggleVisibility(preferences, 'google', false)

      // 应该保持原样，不允许隐藏
      expect(result[0].visible).toBe(true)
    })
  })
})
