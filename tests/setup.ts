// Jest测试环境设置
import '@testing-library/jest-dom'

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
      getBytesInUse: jest.fn(),
      onChanged: {
        addListener: jest.fn(),
        removeListener: jest.fn()
      }
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    openOptionsPage: jest.fn(),
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`),
    id: 'test-extension-id'
  },
  tabs: {
    create: jest.fn(),
    sendMessage: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    onUpdated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onCreated: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    removeAll: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  i18n: {
    getMessage: jest.fn((messageName: string, _substitutions?: string[]) => {
      const messages: Record<string, string> = {
        'app_name': 'SSP智能搜索插件',
        'app_description': '智能搜索语法可视化组合工具',
        'search_keyword': '搜索关键词',
        'search_button': '搜索',
        'settings': '设置'
      }
      return messages[messageName] || messageName
    }),
    getUILanguage: jest.fn(() => 'zh-CN')
  }
}

// 设置全局Chrome API mock
Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
})

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve())
  }
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// 清理函数
afterEach(() => {
  jest.clearAllMocks()
})