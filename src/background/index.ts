// Background Service Worker for SearchSyntax Pro Chrome Extension

import { autoMigrateStorage } from '@/utils/migration'
import { EnginePreferenceService } from '@/services/engine-preference'

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

// 创建右键菜单
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ssp-search-selection',
      title: '使用 SearchSyntax Pro 搜索 "%s"',
      contexts: ['selection']
    })
  })
}

// 右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId === 'ssp-search-selection' && info.selectionText) {
    // 保存选中的文本到存储
    chrome.storage.local.set({
      quick_search_text: info.selectionText
    })
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
    }
  }
})

console.log('SearchSyntax Pro Background Service Worker 已加载')
