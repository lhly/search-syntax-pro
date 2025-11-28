import type { SearchEngine, EnginePreference, UserSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { SearchAdapterFactory } from './adapters'

/**
 * 引擎偏好设置管理服务
 * 负责处理用户的搜索引擎可见性和排序偏好
 *
 * ⚠️ 代码维护警告 - Background Service Worker 存在内联副本
 *
 * 此类中的以下方法在 src/background/index.ts 中有内联副本：
 * - getDefaultPreferences()
 * - reorderEngines()
 * - ensureAtLeastOneVisible()
 * - validateAndFixPreferences()
 *
 * 维护规则（重要！）：
 * 1. 修改这些方法时，必须同步更新 src/background/index.ts 中的内联版本
 * 2. 两处逻辑必须保持完全一致
 *
 * 内联原因：Background Service Worker 需要独立运行，避免复杂的模块依赖
 */
export class EnginePreferenceService {
  /**
   * 生成默认的引擎偏好设置
   * @returns 所有支持的引擎，默认全部可见，按原始顺序排列
   */
  static getDefaultPreferences(): EnginePreference[] {
    return SearchAdapterFactory.getSupportedEngines().map((engine, index) => ({
      engine,
      visible: true,
      order: index
    }))
  }

  /**
   * 根据用户偏好获取可见的引擎列表（已排序）
   * @param preferences 用户偏好设置，如果为空则返回所有引擎
   * @returns 按order排序的可见引擎数组
   */
  static getVisibleEngines(preferences?: EnginePreference[]): SearchEngine[] {
    // 如果没有偏好设置，返回所有引擎
    if (!preferences || preferences.length === 0) {
      return SearchAdapterFactory.getSupportedEngines()
    }

    const validEngines = SearchAdapterFactory.getSupportedEngines()

    return preferences
      .filter(pref => pref.visible) // 只返回可见的引擎
      .sort((a, b) => a.order - b.order) // 按order排序
      .map(pref => pref.engine)
      .filter(engine => validEngines.includes(engine)) // 验证引擎有效性
  }

  /**
   * 验证并修复偏好设置
   * - 移除无效的引擎
   * - 补充缺失的引擎（新增的引擎）
   * - 修复重复的order值
   * @param preferences 原始偏好设置
   * @returns 修复后的偏好设置
   */
  static validateAndFixPreferences(preferences: EnginePreference[]): EnginePreference[] {
    const validEngines = SearchAdapterFactory.getSupportedEngines()
    const engineSet = new Set(validEngines)

    // 1. 移除无效引擎
    const validPreferences = preferences.filter(pref => engineSet.has(pref.engine))

    // 2. 检查缺失的引擎
    const existingEngines = new Set(validPreferences.map(p => p.engine))
    const missingEngines = validEngines.filter(engine => !existingEngines.has(engine))

    // 3. 补充缺失的引擎（添加到末尾，默认可见）
    if (missingEngines.length > 0) {
      const maxOrder = validPreferences.length > 0
        ? Math.max(...validPreferences.map(p => p.order))
        : -1

      missingEngines.forEach((engine, index) => {
        validPreferences.push({
          engine,
          visible: true,
          order: maxOrder + index + 1
        })
      })
    }

    // 4. 修复order值（确保连续且无重复）
    const sortedPreferences = validPreferences.sort((a, b) => a.order - b.order)
    return sortedPreferences.map((pref, index) => ({
      ...pref,
      order: index
    }))
  }

  /**
   * 更新引擎的可见性
   * @param preferences 当前偏好设置
   * @param engine 要更新的引擎
   * @param visible 新的可见性状态
   * @returns 更新后的偏好设置
   */
  static toggleVisibility(
    preferences: EnginePreference[],
    engine: SearchEngine,
    visible: boolean
  ): EnginePreference[] {
    // 🔥 至少保留一个可见的引擎（强制约束）
    if (!visible) {
      const visibleCount = preferences.filter(p => p.visible).length
      if (visibleCount <= 1) {
        console.warn('⚠️ 至少需要保留一个可见的搜索引擎')
        return preferences
      }
    }

    return preferences.map(pref =>
      pref.engine === engine ? { ...pref, visible } : pref
    )
  }

  /**
   * 重新排序引擎
   * @param preferences 当前偏好设置
   * @param fromIndex 原始索引
   * @param toIndex 目标索引
   * @returns 重新排序后的偏好设置
   */
  static reorderEngines(
    preferences: EnginePreference[],
    fromIndex: number,
    toIndex: number
  ): EnginePreference[] {
    if (fromIndex === toIndex) return preferences

    const result = [...preferences]
    const [removed] = result.splice(fromIndex, 1)
    result.splice(toIndex, 0, removed)

    // 更新order值
    return result.map((pref, index) => ({
      ...pref,
      order: index
    }))
  }

  /**
   * 重置为默认偏好设置
   * @returns 默认偏好设置
   */
  static resetToDefaults(): EnginePreference[] {
    return this.getDefaultPreferences()
  }

  /**
   * 获取引擎的显示名称
   * @param engine 引擎类型
   * @returns 引擎的本地化显示名称
   */
  static getEngineName(engine: SearchEngine): string {
    return SearchAdapterFactory.getEngineName(engine)
  }

  /**
   * 🔥 获取默认引擎（排序第一位的可见引擎）
   * @param preferences 用户偏好设置
   * @returns 默认搜索引擎
   */
  static getDefaultEngine(preferences: EnginePreference[]): SearchEngine {
    const visible = this.getVisibleEngines(preferences)

    // 如果没有可见引擎，返回第一个引擎（作为兜底）
    if (visible.length === 0) {
      return preferences[0]?.engine || 'google'
    }

    return visible[0]
  }

  /**
   * 🔥 确保至少有一个引擎可见
   * @param preferences 当前偏好设置
   * @returns 验证后的偏好设置
   */
  static ensureAtLeastOneVisible(preferences: EnginePreference[]): EnginePreference[] {
    const visibleCount = preferences.filter(p => p.visible).length

    if (visibleCount === 0) {
      // 自动显示第一个引擎
      return preferences.map((pref, index) =>
        index === 0 ? { ...pref, visible: true } : pref
      )
    }

    return preferences
  }

  /**
   * 🔥 生成完整的默认用户设置（包含 enginePreferences）
   * @returns 完整的默认用户设置
   */
  static getDefaultUserSettings(): UserSettings {
    return {
      ...DEFAULT_SETTINGS,
      enginePreferences: this.getDefaultPreferences()
    }
  }
}

/**
 * 默认导出服务实例
 */
export default EnginePreferenceService
