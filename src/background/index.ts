// Background Service Worker for SearchSyntax Pro Chrome Extension

import type { Language, UserSettings, EnginePreference, SearchEngine } from '@/types'

/**
 * 内联的搜索引擎支持函数
 * 避免跨文件导入导致的编译符号不匹配问题
 */
function getSupportedEngines(): SearchEngine[] {
  return ['baidu', 'google', 'bing', 'twitter', 'duckduckgo', 'brave', 'yandex', 'reddit', 'github', 'stackoverflow']
}

/**
 * 内联的引擎偏好设置服务方法
 * 避免跨文件导入导致的编译符号不匹配问题
 */
function getDefaultPreferences(): EnginePreference[] {
  return getSupportedEngines().map((engine, index) => ({
    engine,
    visible: true,
    order: index
  }))
}

function reorderEngines(
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

function ensureAtLeastOneVisible(preferences: EnginePreference[]): EnginePreference[] {
  const visibleCount = preferences.filter(p => p.visible).length

  if (visibleCount === 0) {
    // 自动显示第一个引擎
    return preferences.map((pref, index) =>
      index === 0 ? { ...pref, visible: true } : pref
    )
  }

  return preferences
}

function getDefaultUserSettings(): UserSettings {
  return {
    language: 'zh-CN',
    enableHistory: true,
    theme: 'auto',
    historyLimit: 1000,
    autoOpenInNewTab: true,
    enableContextMenu: true,
    enableFloatingButton: true,  // 🔥 默认启用悬浮按钮
    enginePreferences: getDefaultPreferences()
  }
}

/**
 * 内联的数据迁移函数
 * 避免跨文件导入导致的编译符号不匹配问题
 */
async function autoMigrateStorage(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('user_settings')
    const oldSettings = result.user_settings as any

    if (!oldSettings) {
      console.log('📭 未找到用户设置，跳过迁移')
      return false
    }

    // 检查是否需要迁移（是否存在旧的defaultEngine字段）
    if ('defaultEngine' in oldSettings) {
      console.log('🔄 开始自动迁移用户设置...')

      // 获取或创建 enginePreferences
      let preferences: EnginePreference[] =
        oldSettings.enginePreferences || getDefaultPreferences()

      // 如果存在 defaultEngine，将其移到第一位
      if (oldSettings.defaultEngine) {
        const defaultEngine = oldSettings.defaultEngine
        const defaultIndex = preferences.findIndex((p: EnginePreference) => p.engine === defaultEngine)

        if (defaultIndex > 0) {
          console.log(`📌 将默认引擎 "${defaultEngine}" 移动到排序第一位`)
          preferences = reorderEngines(preferences, defaultIndex, 0)
        }
      }

      // 确保至少一个可见
      preferences = ensureAtLeastOneVisible(preferences)

      // 移除 defaultEngine 字段，创建新格式设置
      const { defaultEngine, ...rest } = oldSettings
      const newSettings: UserSettings = {
        ...rest,
        enginePreferences: preferences
      }

      await chrome.storage.local.set({ user_settings: newSettings })

      console.log('✅ 用户设置已自动迁移到 V2 格式')
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
 * 获取翻译文本
 * 内联简化版本，避免跨文件导入问题
 */
function getTranslation(language: Language, key: string, fallback: string): string {
  // 简化实现：直接返回中英文
  const translations: Record<string, Record<string, string>> = {
    'zh-CN': {
      'contextMenu.searchSelection': '使用 SearchSyntax Pro 搜索 "%s"'
    },
    'en-US': {
      'contextMenu.searchSelection': 'Search with SearchSyntax Pro "%s"'
    }
  }

  return translations[language]?.[key] || translations['zh-CN']?.[key] || fallback
}

/**
 * 监听快捷键命令
 *
 * 注意: _execute_action 是Chrome扩展的特殊命令,会自动打开popup,无需额外处理
 * 这里仅用于日志记录和未来扩展其他自定义命令
 */
chrome.commands.onCommand.addListener((command) => {
  console.log('快捷键命令触发:', command)

  switch (command) {
    case '_execute_action':
      // 自动打开popup,无需手动处理
      // Chrome会自动执行 action.default_popup 中配置的弹窗
      console.log('全局快捷键已触发,popup将自动打开')
      break

    // 未来可以在这里添加其他自定义全局快捷键
    // 例如:
    // case 'quick_search':
    //   chrome.tabs.create({ url: 'https://www.google.com' })
    //   break

    default:
      console.warn('未知的快捷键命令:', command)
  }
})

// 扩展安装时的处理
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SearchSyntax Pro 已安装', details.reason)

  // 设置默认设置
  if (details.reason === 'install') {
    // 🔥 新安装：使用新的设置结构（无 defaultEngine）
    const defaultSettings = getDefaultUserSettings()

    await chrome.storage.local.set({
      user_settings: defaultSettings
    })

    console.log('✅ 默认设置已初始化:', defaultSettings)
  } else if (details.reason === 'update') {
    // 🔥 更新时：执行数据迁移
    console.log('[Update] 扩展已更新，执行数据迁移...')
    await autoMigrateStorage()
  }

  // 创建右键菜单
  createContextMenus()
})

// 🔥 扩展启动时也执行一次迁移检查
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Startup] 扩展启动，检查是否需要迁移数据...')
  await autoMigrateStorage()
})

// 创建右键菜单（根据用户设置）
async function createContextMenus() {
  // 🔥 读取用户设置，判断是否启用右键菜单和获取语言设置
  const { user_settings } = await chrome.storage.local.get('user_settings')
  const enableContextMenu = user_settings?.enableContextMenu ?? true // 默认启用
  const language: Language = user_settings?.language ?? 'zh-CN' // 默认中文

  // 移除所有现有菜单
  chrome.contextMenus.removeAll(() => {
    // 🔥 只在启用时创建右键菜单
    if (enableContextMenu) {
      // 🌐 使用内联函数获取当前语言的菜单文本
      const menuTitle = getTranslation(
        language,
        'contextMenu.searchSelection',
        '使用 SearchSyntax Pro 搜索 "%s"' // fallback文本
      )

      chrome.contextMenus.create({
        id: 'ssp-search-selection',
        title: menuTitle,
        contexts: ['selection']
      })
      console.log(`✅ 右键菜单已创建 (语言: ${language})`)
    } else {
      console.log('⚠️ 右键菜单已禁用（用户设置）')
    }
  })
}

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener(async (info, _tab) => {
  if (info.menuItemId === 'ssp-search-selection' && info.selectionText) {
    // 保存选中的文本到存储，并添加触发标记
    await chrome.storage.local.set({
      quick_search_text: info.selectionText,
      quick_search_trigger: Date.now() // 添加时间戳作为触发标记
    })

    console.log('✅ 右键菜单触发: 选中文本已保存', info.selectionText)

    // 尝试打开 popup
    // 注意: 在 Manifest V3 中，只有在用户操作（如点击右键菜单）的上下文中才能调用 openPopup()
    try {
      await chrome.action.openPopup()
      console.log('✅ Popup 已打开')
    } catch (error) {
      // 如果无法打开 popup（例如在某些特殊页面），则在新标签页中打开扩展
      console.warn('⚠️ 无法打开 popup，尝试其他方式:', error)

      // 备用方案：通过发送消息通知用户或在新标签页打开扩展
      // 这里我们选择静默处理，用户下次打开 popup 时会自动填充
    }
  }
})

// 处理来自popup和content script的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'get_storage_usage':
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        sendResponse({
          used: bytesInUse,
          quota: 5242880 // 5MB
        })
      })
      return true // 保持消息通道开启

    case 'cleanup_expired_data':
      cleanupExpiredData()
      sendResponse({ success: true })
      break

    case 'open_search':
      if (message.url) {
        chrome.tabs.create({ url: message.url })
        sendResponse({ success: true })
      }
      break

    default:
      break
  }
})

// 清理过期数据
function cleanupExpiredData() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)

  chrome.storage.local.get(null, (items) => {
    const updatedItems = { ...items }

    // 清理过期历史记录
    if (items.search_history && Array.isArray(items.search_history)) {
      updatedItems.search_history = items.search_history.filter(
        (item: any) => item.timestamp > thirtyDaysAgo
      )
    }

    // 清理过期缓存
    if (items.app_cache && items.app_cache.timestamp < thirtyDaysAgo) {
      delete updatedItems.app_cache
    }

    chrome.storage.local.set(updatedItems)
  })
}

// 监听存储变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    console.log('存储变化:', changes)

    // 如果设置改变，可以在这里执行相关操作
    if (changes.user_settings) {
      console.log('用户设置已更新')

      // 🔥 检查右键菜单开关或语言是否改变
      const oldSettings = changes.user_settings.oldValue
      const newSettings = changes.user_settings.newValue

      const contextMenuChanged = oldSettings?.enableContextMenu !== newSettings?.enableContextMenu
      const languageChanged = oldSettings?.language !== newSettings?.language

      if (contextMenuChanged) {
        console.log('🔄 右键菜单开关已改变，重新创建菜单')
        createContextMenus() // 重新创建/移除右键菜单
      } else if (languageChanged) {
        console.log(`🌐 界面语言已改变: ${oldSettings?.language} → ${newSettings?.language}，更新右键菜单`)
        createContextMenus() // 重新创建菜单以更新语言
      }
    }
  }
})

console.log('SearchSyntax Pro Background Service Worker 已加载')
