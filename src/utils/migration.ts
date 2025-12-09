/**
 * 数据迁移工具
 * 处理版本升级时的数据结构变更
 *
 * ⚠️ 代码维护警告 - Background Service Worker 存在内联副本
 *
 * 此文件中的以下函数在 src/background/index.ts 中有内联副本：
 * - ensureAllEnginesExist()
 * - autoMigrateStorage()
 *
 * 维护规则（重要！）：
 * 1. 修改这些函数时，必须同步更新 src/background/index.ts 中的内联版本
 * 2. 两处逻辑必须保持完全一致
 * 3. 测试时需要验证两个环境：popup/options 和 background
 *
 * 内联原因：Background Service Worker 需要独立运行，避免复杂的模块依赖
 */

import type { UserSettings, EnginePreference, Language } from '@/types'
import { EnginePreferenceService } from '@/services/engine-preference'

/**
 * 旧版本设置接口 (包含 defaultEngine)
 */
interface LegacyUserSettings {
  defaultEngine?: string
  enginePreferences?: EnginePreference[]
  language: Language
  enableHistory: boolean
  theme: 'light' | 'dark' | 'auto'
  historyLimit: number
  autoOpenInNewTab: boolean
}

/**
 * 🔥 迁移旧版本设置到新版本
 * 处理 defaultEngine 字段的移除
 *
 * @param oldSettings 旧版本设置
 * @returns 新版本设置
 */
export function migrateToV2Settings(oldSettings: LegacyUserSettings): UserSettings {
  // 如果已经是新格式，直接返回
  if (!('defaultEngine' in oldSettings) && oldSettings.enginePreferences) {
    return oldSettings as UserSettings
  }

  console.log('🔄 检测到旧版本设置，开始迁移...')

  // 获取或创建 enginePreferences
  let preferences: EnginePreference[] =
    oldSettings.enginePreferences ||
    EnginePreferenceService.getDefaultPreferences()

  // 如果存在 defaultEngine，将其移到第一位
  if (oldSettings.defaultEngine) {
    const defaultEngine = oldSettings.defaultEngine
    const defaultIndex = preferences.findIndex(p => p.engine === defaultEngine)

    if (defaultIndex > 0) {
      console.log(`📌 将默认引擎 "${defaultEngine}" 移动到排序第一位`)
      // 重新排序，将默认引擎移到第一位
      preferences = EnginePreferenceService.reorderEngines(
        preferences,
        defaultIndex,
        0
      )
    } else if (defaultIndex === 0) {
      console.log(`✅ 默认引擎 "${defaultEngine}" 已在第一位`)
    } else {
      console.warn(`⚠️ 未找到默认引擎 "${defaultEngine}"，保持原有排序`)
    }
  }

  // 确保至少一个可见
  preferences = EnginePreferenceService.ensureAtLeastOneVisible(preferences)

  // 移除 defaultEngine 字段，返回新格式
  const { defaultEngine, ...rest } = oldSettings as any

  const newSettings: UserSettings = {
    ...rest,
    enginePreferences: preferences
  }

  console.log('✅ 设置迁移完成')
  return newSettings
}

/**
 * 🔥 确保所有引擎存在
 * 补充新增的引擎到用户配置中
 *
 * ⚠️ 维护警告：此函数在 src/background/index.ts 中有内联副本，修改时必须同步！
 *
 * @param settings 用户设置
 * @returns 补充后的设置
 */
function ensureAllEnginesExist(settings: UserSettings): UserSettings {
  const currentPreferences = settings.enginePreferences || []

  // 使用现有的 validateAndFixPreferences 方法自动补充缺失引擎
  const fixedPreferences = EnginePreferenceService.validateAndFixPreferences(currentPreferences)

  // 检查是否有新增引擎
  const addedCount = fixedPreferences.length - currentPreferences.length
  if (addedCount > 0) {
    console.log(`🆕 检测到 ${addedCount} 个新增搜索引擎，已自动添加`)
    const addedEngines = fixedPreferences
      .slice(currentPreferences.length)
      .map(p => p.engine)
      .join(', ')
    console.log(`📝 新增引擎: ${addedEngines}`)
  }

  return {
    ...settings,
    enginePreferences: fixedPreferences
  }
}

/**
 * 🔥 自动迁移本地存储
 * 在应用启动时调用，自动检测并迁移旧版本数据
 *
 * ⚠️ 维护警告：此函数在 src/background/index.ts 中有内联副本，修改时必须同步！
 *
 * @returns Promise<boolean> 是否执行了迁移
 */
export async function autoMigrateStorage(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('user_settings')
    const oldSettings = result.user_settings as LegacyUserSettings | undefined

    if (!oldSettings) {
      console.log('📭 未找到用户设置，跳过迁移')
      return false
    }

    let needsMigration = false
    let newSettings: UserSettings

    // 检查是否需要迁移 defaultEngine 字段
    if ('defaultEngine' in oldSettings) {
      console.log('🔄 开始自动迁移用户设置...')
      newSettings = migrateToV2Settings(oldSettings)
      needsMigration = true
      console.log('✅ 用户设置已自动迁移到 V2 格式')
    } else {
      // 已经是新格式，直接使用
      newSettings = oldSettings as UserSettings
    }

    // 🔥 无论是否执行了 defaultEngine 迁移，都检查并补充新增引擎
    const beforeCount = newSettings.enginePreferences?.length || 0
    newSettings = ensureAllEnginesExist(newSettings)
    const afterCount = newSettings.enginePreferences.length

    if (afterCount > beforeCount) {
      needsMigration = true
    }

    // 如果有任何更改，保存到存储
    if (needsMigration) {
      await chrome.storage.local.set({ user_settings: newSettings })
      console.log('📊 当前默认引擎:', EnginePreferenceService.getDefaultEngine(newSettings.enginePreferences))
      console.log(`📈 引擎总数: ${afterCount}`)
      return true
    }

    console.log('✅ 设置已是最新格式，无需迁移')
    return false
  } catch (error) {
    console.error('❌ 自动迁移失败:', error)
    return false
  }
}

/**
 * 🔥 验证设置有效性
 * 确保 enginePreferences 存在且至少有一个可见引擎
 *
 * @param settings 用户设置
 * @returns 验证并修复后的设置
 */
export function validateUserSettings(settings: UserSettings): UserSettings {
  // 确保 enginePreferences 存在
  if (!settings.enginePreferences || settings.enginePreferences.length === 0) {
    console.warn('⚠️ enginePreferences 为空，使用默认配置')
    return {
      ...settings,
      enginePreferences: EnginePreferenceService.getDefaultPreferences()
    }
  }

  // 🔥 先补充缺失的引擎
  let validatedPreferences = EnginePreferenceService.validateAndFixPreferences(
    settings.enginePreferences
  )

  // 确保至少一个可见
  validatedPreferences = EnginePreferenceService.ensureAtLeastOneVisible(
    validatedPreferences
  )

  return {
    ...settings,
    enginePreferences: validatedPreferences
  }
}
