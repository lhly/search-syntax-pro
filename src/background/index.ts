// Background Service Worker for SearchSyntax Pro Chrome Extension

import { autoMigrateStorage } from '@/utils/migration'
import { EnginePreferenceService } from '@/services/engine-preference'
import { translate } from '@/i18n/translations'
import type { Language } from '@/types'

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
    const defaultSettings = EnginePreferenceService.getDefaultUserSettings()

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
      // 🌐 使用translate函数获取当前语言的菜单文本
      const menuTitle = translate(
        language,
        'contextMenu.searchSelection',
        undefined,
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
