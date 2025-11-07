import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from '../../src/popup/App'

// Mock Chrome API
const mockChrome = {
  storage: {
    local: {
      get: jest.fn((keys: any, callback?: any) => {
        const result = {}
        callback?.(result)
        return Promise.resolve(result)
      }),
      set: jest.fn((items: any, callback?: any) => {
        callback?.()
        return Promise.resolve()
      }),
      remove: jest.fn((keys: any, callback?: any) => {
        callback?.()
        return Promise.resolve()
      })
    }
  },
  tabs: {
    create: jest.fn(() => Promise.resolve({ id: 1 }))
  }
}

// Mock Chrome API globally
;(window as any).chrome = mockChrome

describe('简单工作流测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('应该渲染基础界面', async () => {
    render(<App />)

    // 验证基本元素存在
    expect(screen.getByText('智能搜索')).toBeInTheDocument()
    expect(screen.getByLabelText('搜索关键词')).toBeInTheDocument()
    expect(screen.getByLabelText('搜索引擎')).toBeInTheDocument()
  })

  it('应该处理关键词输入', async () => {
    render(<App />)

    const keywordInput = screen.getByLabelText('搜索关键词')
    fireEvent.change(keywordInput, { target: { value: 'React框架' } })

    // 验证输入已更新
    expect(keywordInput).toHaveValue('React框架')
  })

  it('应该展开高级选项', async () => {
    render(<App />)

    const advancedButton = screen.getByText('高级搜索选项')
    fireEvent.click(advancedButton)

    // 验证高级选项显示
    await waitFor(() => {
      expect(screen.getByLabelText('网站内搜索 (site:)')).toBeInTheDocument()
      expect(screen.getByLabelText('文件类型 (filetype:)')).toBeInTheDocument()
      expect(screen.getByLabelText('精确匹�� (" ")')).toBeInTheDocument()
    })
  })

  it('应该切换搜索引擎', async () => {
    render(<App />)

    const engineSelect = screen.getByLabelText('搜索引擎')
    fireEvent.change(engineSelect, { target: { value: 'google' } })

    // 验证选择已更新
    expect(engineSelect).toHaveValue('google')
  })
})