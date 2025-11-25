import { useState, useEffect, useCallback } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { QueryPreview } from '@/components/QueryPreview'
import { LogoIcon } from '@/components/Logo'
import { ThemeProvider } from '@/hooks/useTheme'
import { TranslationProvider, useTranslation } from '@/i18n'
import { SearchAdapterFactory } from '@/services/adapters'
import { detectCurrentEngine } from '@/config/search-engine-selectors'
import { extractAndDecodeQuery } from '@/utils/url-utils'
import type { SearchParams, ValidationResult, FloatingPanelMessageEnvelope } from '@/types'
import './floating-panel.css'

// Inner component that uses the translation hook
function FloatingPanelContent() {
  const { t } = useTranslation()

  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '',
    engine: detectCurrentEngine(),

    // 旧字段(向后兼容)
    site: '',
    fileType: '',
    exactMatch: '',
    fromUser: '',
    toUser: '',

    // 新多值字段
    exactMatches: [],
    sites: [],
    fileTypes: [],
    fromUsers: [],
    toUsers: [],
    subreddits: [],
    languages: [],
    tags: [],

    // 其他字段
    inTitle: '',
    inUrl: '',
    excludeWords: [],
    orKeywords: [],
    inText: '',
    numberRange: undefined,
    wildcardQuery: '',
    allInTitle: '',
    relatedSite: '',
    cacheSite: '',
    dateRange: undefined
  })

  const [generatedQuery, setGeneratedQuery] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  // 浮动面板默认展开高级选项(用户打开面板就是为了构建高级搜索语法)
  const [showAdvanced, setShowAdvanced] = useState(true)

  // 🔥 监听来自 content script 的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as FloatingPanelMessageEnvelope

      if (data && data.source === 'ssp-content') {
        const message = data.message

        // 处理填充关键词和引擎信息
        if (message.type === 'FLOATING_PANEL_FILL_INPUT') {
          const payload = (message as any).payload
          setSearchParams(prev => ({
            ...prev,
            keyword: payload.keyword || '',
            // 使用父页面传递的引擎信息（修复 iframe 无法检测引擎的问题）
            engine: payload.engine || prev.engine
          }))
        }
      }
    }

    window.addEventListener('message', handleMessage)

    // 通知 content script iframe 已准备好
    const readyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: { type: 'FLOATING_PANEL_READY' },
      timestamp: Date.now()
    }
    window.parent.postMessage(readyMessage, '*')

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // 生成搜索查询
  const generateQuery = useCallback(async (params: SearchParams) => {
    try {
      const adapter = SearchAdapterFactory.getAdapter(params.engine)

      // 验证搜索参数
      const validationResult = await Promise.resolve(
        adapter.validateParams?.(params) || {
          isValid: true,
          errors: [],
          warnings: []
        }
      )
      setValidation(validationResult)

      // 构建查询
      const query = adapter.buildQuery(params)
      // 安全提取和解码查询字符串,避免在搜索框中显示 %20, %3A 等编码
      const decodedQuery = extractAndDecodeQuery(query)
      setGeneratedQuery(decodedQuery)
      setSearchParams(params)
    } catch (error) {
      console.error('[FloatingPanel] Failed to generate query:', error)
      setValidation({
        isValid: false,
        errors: [t('popup.adapterLoadError')],
        warnings: []
      })
    }
  }, [t])

  // 通用的应用逻辑,接受autoSearch参数
  const applyQuery = useCallback((autoSearch: boolean) => {
    if (!validation?.isValid) {
      console.warn('[FloatingPanel] Cannot apply invalid query')
      return
    }

    // 发送消息到 content script
    const applyMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: {
        type: 'FLOATING_PANEL_APPLY_SYNTAX',
        payload: {
          query: generatedQuery,
          autoSearch, // 使用参数而非硬编码
          searchUrl: '' // content script 会处理
        }
      },
      timestamp: Date.now()
    }

    window.parent.postMessage(applyMessage, '*')
  }, [generatedQuery, validation])

  // "应用到搜索框"按钮: 仅填充,不执行搜索
  const handleApplyToSearchBox = useCallback(() => {
    applyQuery(false)
  }, [applyQuery])

  // "执行搜索"按钮: 填充并执行搜索
  const handleExecuteSearch = useCallback(() => {
    applyQuery(true)
  }, [applyQuery])

  // 关闭面板
  const handleClose = useCallback(() => {
    const closeMessage: FloatingPanelMessageEnvelope = {
      source: 'ssp-iframe',
      message: { type: 'FLOATING_PANEL_CLOSE' },
      timestamp: Date.now()
    }

    window.parent.postMessage(closeMessage, '*')
  }, [])

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])

  return (
    <div className="floating-panel-container">
      {/* 头部 */}
      <header className="floating-panel-header">
        <div className="header-left">
          <LogoIcon size={24} color="white" />
          <h1 className="header-title">{t('popup.headerTitle')}</h1>
          <span className="engine-badge">{searchParams.engine.toUpperCase()}</span>
        </div>
        <button
          onClick={handleClose}
          className="close-button"
          title={t('common.close', undefined, 'Close (ESC)')}
        >
          ✕
        </button>
      </header>

      {/* 主体内容 */}
      <main className="floating-panel-content">
        {/* 搜索表单 - 针对 800px 优化，隐藏引擎选择器（当前页面已确定搜索引擎） */}
        <SearchForm
          searchParams={searchParams}
          onSearchParamsChange={generateQuery}
          showAdvanced={showAdvanced}
          onToggleAdvanced={setShowAdvanced}
          hideEngineSelector={true}
        />

        {/* 验证结果 */}
        {validation && (validation.errors.length > 0 || validation.warnings.length > 0) && (
          <div className="validation-section">
            {validation.errors.length > 0 && (
              <div className="alert alert-error">
                <ul className="text-sm">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="alert alert-warning">
                <ul className="text-sm">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 查询预览 */}
        {generatedQuery && (
          <div className="preview-section">
            <QueryPreview
              query={generatedQuery}
              onSearch={handleExecuteSearch}
              disabled={!validation?.isValid}
            />
          </div>
        )}
      </main>

      {/* 底部操作栏 */}
      <footer className="floating-panel-footer">
        <div className="footer-info">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('popup.footer.currentEngine', { engine: searchParams.engine.toUpperCase() })}
          </span>
        </div>
        <div className="footer-actions">
          <button
            onClick={handleClose}
            className="btn btn-ghost"
          >
            {t('common.cancel', undefined, 'Cancel')}
          </button>
          <button
            onClick={handleApplyToSearchBox}
            disabled={!validation?.isValid || !generatedQuery}
            className="btn btn-primary"
          >
            {t('common.apply', undefined, 'Apply to Search Box')}
          </button>
        </div>
      </footer>
    </div>
  )
}

// Outer component that provides the language context
function FloatingPanelApp() {
  const [language, setLanguage] = useState<'zh-CN' | 'en-US'>('zh-CN')

  // 🔥 初始化:从 storage 获取用户语言偏好
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get('user_settings')
        const userLanguage = result.user_settings?.language || 'zh-CN'
        setLanguage(userLanguage)
      } catch (error) {
        console.error('[FloatingPanel] Failed to load settings:', error)
      }
    }

    loadSettings()
  }, [])

  return (
    <ThemeProvider>
      <TranslationProvider language={language}>
        <FloatingPanelContent />
      </TranslationProvider>
    </ThemeProvider>
  )
}

export default FloatingPanelApp
