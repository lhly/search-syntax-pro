// Content Script for SearchSyntax Pro Chrome Extension

import { FloatingPanelManager } from './FloatingPanelManager'
import type { UserSettings } from '@/types'

// 全局管理器实例
let floatingPanelManager: FloatingPanelManager | null = null

// 检查是否在搜索引擎页面
// 支持所有国际域名变体
// Note: Google excluded - it has built-in advanced search tools
function isSearchEnginePage(): boolean {
  const hostname = window.location.hostname;

  // 匹配 Baidu 所有域名 (baidu.com, baidu.com.hk, baidu.jp, etc.)
  if (hostname.includes('baidu.com')) return true;

  // 匹配 Bing 所有域名 (bing.com, cn.bing.com, etc.)
  if (hostname.includes('bing.com')) return true;

  return false;
}

// 分析搜索查询
function analyzeSearchQuery() {
  const urlParams = new URLSearchParams(window.location.search)
  const searchQuery = urlParams.get('wd') || urlParams.get('q') || urlParams.get('query')
  
  if (searchQuery) {
    // 解析搜索查询中的高级语法
    const hasSiteSyntax = /site:/.test(searchQuery)
    const hasFileTypeSyntax = /filetype:/.test(searchQuery)
    const hasExactMatch = /".*?"/.test(searchQuery)
    
    if (hasSiteSyntax || hasFileTypeSyntax || hasExactMatch) {
      console.log('检测到高级搜索语法:', searchQuery)
      
      // 发送分析结果到background
      chrome.runtime.sendMessage({
        action: 'search_query_analyzed',
        data: {
          query: searchQuery,
          hasSiteSyntax,
          hasFileTypeSyntax,
          hasExactMatch,
          url: window.location.href
        }
      })
    }
  }
}

// 处理来自background的消息
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  switch (message.action) {
    case 'quick_search':
      if (message.text) {
        // 保存搜索文本并高亮显示
        chrome.storage.local.set({ quick_search_text: message.text })
        highlightSearchText(message.text)
      }
      break
      
    case 'highlight_syntax':
      // 高亮页面中的搜索语法
      highlightSearchSyntax()
      break
      
    default:
      break
  }
})

// 高亮搜索文本
function highlightSearchText(text: string) {
  // 移除之前的高亮
  document.querySelectorAll('.ssp-highlight').forEach(el => {
    el.classList.remove('ssp-highlight')
  })
  
  // 查找并高亮文本
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  )
  
  const textNodes: Text[] = []
  let node: Node | null
  
  while (node = walker.nextNode()) {
    if (node.textContent && node.textContent.includes(text)) {
      textNodes.push(node as Text)
    }
  }
  
  textNodes.forEach(textNode => {
    if (textNode.parentElement && !['script', 'style'].includes(textNode.parentElement.tagName.toLowerCase())) {
      const parent = textNode.parentElement
      const content = textNode.textContent!
      const regex = new RegExp(`(${text})`, 'gi')
      const highlightedHTML = content.replace(regex, '<mark class="ssp-highlight">$1</mark>')
      
      const wrapper = document.createElement('span')
      wrapper.innerHTML = highlightedHTML
      
      parent.replaceChild(wrapper, textNode)
    }
  })
  
  // 添加高亮样式
  if (!document.querySelector('#ssp-highlight-styles')) {
    const highlightStyle = document.createElement('style')
    highlightStyle.id = 'ssp-highlight-styles'
    highlightStyle.textContent = `
      .ssp-highlight {
        background-color: #fef08a;
        color: #854d0e;
        padding: 1px 2px;
        border-radius: 2px;
      }
    `
    document.head.appendChild(highlightStyle)
  }
}

// 高亮搜索语法
function highlightSearchSyntax() {
  const searchInput = document.querySelector('input[type="search"], input[name="wd"], input[name="q"]') as HTMLInputElement
  
  if (searchInput && searchInput.value) {
    const query = searchInput.value
    let highlightedQuery = query
    
    // 高亮site:语法
    highlightedQuery = highlightedQuery.replace(/(site:[^\s]+)/g, '<mark style="background-color: #86efac; color: #14532d;">$1</mark>')
    
    // 高亮filetype:语法
    highlightedQuery = highlightedQuery.replace(/(filetype:[^\s]+)/g, '<mark style="background-color: #fde047; color: #713f12;">$1</mark>')
    
    // 高亮精确匹配
    highlightedQuery = highlightedQuery.replace(/(".*?")/g, '<mark style="background-color: #fca5a5; color: #7f1d1d;">$1</mark>')
    
    // 如果有语法高亮，替换输入框的值（仅显示效果）
    if (highlightedQuery !== query) {
      console.log('搜索语法高亮完成:', highlightedQuery)
    }
  }
}

// 初始化content script
async function init() {
  console.log('SearchSyntax Pro Content Script 已加载')

  if (isSearchEnginePage()) {
    console.log('检测到搜索引擎页面，注入功能')

    // 延迟注入，确保页面加载完成
    setTimeout(async () => {
      // 🔥 从用户设置读取悬浮按钮开关
      try {
        const result = await chrome.storage.local.get('user_settings')
        const settings: UserSettings | undefined = result.user_settings
        const enableFloatingButton = settings?.enableFloatingButton ?? true // 默认启用

        // 根据用户设置决定是否注入悬浮按钮
        if (enableFloatingButton) {
          console.log('[SSP] 悬浮按钮功能已启用')
          floatingPanelManager = new FloatingPanelManager()
          floatingPanelManager.initialize().catch((error) => {
            console.error('[SSP] Failed to initialize floating panel:', error)
          })
        } else {
          console.log('[SSP] 悬浮按钮功能已禁用')
        }
      } catch (error) {
        console.error('[SSP] Failed to load user settings:', error)
        // 发生错误时，默认启用悬浮按钮
        floatingPanelManager = new FloatingPanelManager()
        floatingPanelManager.initialize().catch((error) => {
          console.error('[SSP] Failed to initialize floating panel:', error)
        })
      }

      analyzeSearchQuery()
    }, 1000)
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}

// 监听页面变化（单页应用）
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    setTimeout(init, 1000) // 延迟重新初始化
  }
}).observe(document, { subtree: true, childList: true })

// 清理资源
window.addEventListener('beforeunload', () => {
  floatingPanelManager?.destroy()
})

export {}