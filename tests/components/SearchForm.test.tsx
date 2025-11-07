import { render, screen, fireEvent } from '@testing-library/react'
import { SearchForm } from '@/components/SearchForm'
import type { SearchParams } from '@/types'

// Mock Chrome APIs
const mockChrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  }
}

Object.defineProperty(global, 'chrome', {
  value: mockChrome,
  writable: true
})

describe('SearchForm', () => {
  const mockOnChange = jest.fn()
  const defaultProps = {
    searchParams: {
      keyword: '',
      engine: 'baidu' as const,
      site: '',
      fileType: '',
      exactMatch: ''
    },
    onSearchParamsChange: mockOnChange
  }

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('应该渲染搜索表单', () => {
    render(<SearchForm {...defaultProps} />)

    expect(screen.getByLabelText('搜索关键词')).toBeInTheDocument()
    expect(screen.getByLabelText('搜索引擎')).toBeInTheDocument()
    expect(screen.getByText('高级搜索选项')).toBeInTheDocument()
  })

  it('应该更新关键词输入', () => {
    render(<SearchForm {...defaultProps} />)

    const keywordInput = screen.getByLabelText('搜索关键词')
    fireEvent.change(keywordInput, { target: { value: 'Vue.js' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultProps.searchParams,
      keyword: 'Vue.js'
    })
  })

  it('应该更新搜索引擎选择', () => {
    render(<SearchForm {...defaultProps} />)

    const engineSelect = screen.getByLabelText('搜索引擎')
    fireEvent.change(engineSelect, { target: { value: 'google' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultProps.searchParams,
      engine: 'google'
    })
  })

  it('应该展开和折叠高级选项', () => {
    render(<SearchForm {...defaultProps} />)

    const toggleButton = screen.getByText('高级搜索选项')

    // 初始状态应该不显示高级选项
    expect(screen.queryByLabelText('���站内搜索')).not.toBeInTheDocument()

    // 点击展开
    fireEvent.click(toggleButton)
    expect(screen.getByLabelText('网站内搜索')).toBeInTheDocument()
    expect(screen.getByLabelText('文件类型搜索')).toBeInTheDocument()
    expect(screen.getByLabelText('精确匹配')).toBeInTheDocument()

    // 再次点击折叠
    fireEvent.click(toggleButton)
    expect(screen.queryByLabelText('网站内搜索')).not.toBeInTheDocument()
  })

  it('应该更新网站内搜索', () => {
    render(<SearchForm {...defaultProps} />)

    // 先展开高级选项
    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    const siteInput = screen.getByLabelText('网站内搜索 (site:)')
    fireEvent.change(siteInput, { target: { value: 'github.com' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultProps.searchParams,
      site: 'github.com'
    })
  })

  it('应该更新文件类型选择', () => {
    render(<SearchForm {...defaultProps} />)

    // 先展开高级选项
    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    const fileTypeSelect = screen.getByLabelText('文件类型 (filetype:)')
    fireEvent.change(fileTypeSelect, { target: { value: 'pdf' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultProps.searchParams,
      fileType: 'pdf'
    })
  })

  it('应该更新精确匹配输入', () => {
    render(<SearchForm {...defaultProps} />)

    // 先展开高级选项
    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    const exactMatchInput = screen.getByLabelText('精确匹配 (" ")')
    fireEvent.change(exactMatchInput, { target: { value: 'React框架' } })

    expect(mockOnChange).toHaveBeenCalledWith({
      ...defaultProps.searchParams,
      exactMatch: 'React框架'
    })
  })

  it('应该显示所有常见文件类型选项', () => {
    render(<SearchForm {...defaultProps} />)

    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    // 检查常见文件类型选项
    expect(screen.getByText('PDF文档')).toBeInTheDocument()
    expect(screen.getAllByText('Word文档')).toHaveLength(2)  // doc 和 docx
    expect(screen.getAllByText('Excel表格')).toHaveLength(2)  // xls 和 xlsx
    expect(screen.getAllByText('PPT演示文稿')).toHaveLength(2)  // ppt 和 pptx
  })

  it('应该保留现有搜索参数', () => {
    const existingParams: SearchParams = {
      keyword: 'React',
      engine: 'google',
      site: 'reactjs.org',
      fileType: 'pdf',
      exactMatch: 'Hooks'
    }

    render(<SearchForm searchParams={existingParams} onSearchParamsChange={mockOnChange} />)

    expect(screen.getByDisplayValue('React')).toBeInTheDocument()
    expect(screen.getByDisplayValue('谷歌')).toBeInTheDocument()

    // 展开高级选项检查其他字段
    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    expect(screen.getByDisplayValue('reactjs.org')).toBeInTheDocument()
    expect(screen.getByDisplayValue('PDF文档')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hooks')).toBeInTheDocument()
  })

  it('应该有正确的占位符文本', () => {
    render(<SearchForm {...defaultProps} />)

    const keywordInput = screen.getByPlaceholderText('输入要搜索的关键词...')
    expect(keywordInput).toBeInTheDocument()
  })

  it('应该显示帮助文本', () => {
    render(<SearchForm {...defaultProps} />)

    const toggleButton = screen.getByText('高级搜索选项')
    fireEvent.click(toggleButton)

    expect(screen.getByText('在指定网站内搜索内容')).toBeInTheDocument()
    expect(screen.getByText('搜索特定格式的文件')).toBeInTheDocument()
    expect(screen.getByText('完全匹配输入的短语')).toBeInTheDocument()
  })
})