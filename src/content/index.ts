// Content Script for SearchSyntax Pro Chrome Extension

// 检查是否在搜索引擎页面
function isSearchEnginePage(): boolean {
  const searchEngines = [
    'www.baidu.com',
    'www.google.com',
    'www.bing.com',
    'www.sogou.com',
    'www.so.com'
  ]
  
  return searchEngines.some(engine => 
    window.location.hostname.includes(engine)
  )
}

// 在搜索引擎页面注入功能
function injectSearchFeatures() {
  // 创建悬浮按钮
  const floatingButton = document.createElement('div')
  floatingButton.id = 'ssp-floating-button'
  floatingButton.innerHTML = `
    <button title="打开 SearchSyntax Pro">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    </button>
  `
  
  // 添加样式
  const style = document.createElement('style')
  style.textContent = `
    #ssp-floating-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 10000;
      background: #3b82f6;
      border-radius: 50%;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    #ssp-floating-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    #ssp-floating-button button {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    #ssp-floating-button.ducked {
      transform: translateY(100px);
    }
  `
  
  document.head.appendChild(style)
  document.body.appendChild(floatingButton)
  
  // 点击事件
  floatingButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'open_popup' })
  })
  
  // 键盘快捷键 (Ctrl/Cmd + Shift + S)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      chrome.runtime.sendMessage({ action: 'open_popup' })
    }
  })
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
function init() {
  console.log('SearchSyntax Pro Content Script 已加载')
  
  if (isSearchEnginePage()) {
    console.log('检测到搜索引擎页面，注入功能')
    
    // 延迟注入，确保页面加载完成
    setTimeout(() => {
      injectSearchFeatures()
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

export {}