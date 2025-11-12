import { useState, useEffect, useCallback } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { QueryPreview } from '@/components/QueryPreview'
import { SearchHistory as SearchHistoryComponent } from '@/components/SearchHistory'
import { SettingsButton } from '@/components/SettingsButton'
import { LogoIcon } from '@/components/Logo'
import { TemplateSelector } from '@/components/TemplateSelector'
import { SuggestionPanel } from '@/components/SuggestionPanel'
import { ShortcutHint, ShortcutHintTrigger } from '@/components/ShortcutHint'
import { useStorage } from '@/hooks/useStorage'
import { ThemeProvider } from '@/hooks/useTheme'
import { SearchAdapterFactory } from '@/services/adapters'
import { templateManager } from '@/services/template-manager'
import { shortcutManager } from '@/services/shortcut-manager'
import { TranslationProvider, useTranslation } from '@/i18n'
import { useExtensionVersion } from '@/utils/version'
import { DEFAULT_SHORTCUTS, getShortcutDisplayText } from '@/config/keyboard-shortcuts'
import type { SearchParams, SearchHistory as SearchHistoryType, UserSettings, ValidationResult, SearchEngine } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

function App() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '',
    engine: 'baidu',
    // 旧字段
    site: '',
    fileType: '',
    exactMatch: '',
    // 新增高级语法字段
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
  const [searchUrl, setSearchUrl] = useState('')
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [history, setHistory] = useState<SearchHistoryType[]>([])
  const [settings, setSettings] = useState<UserSettings | null>(null)

  // v1.6.0 新增状态
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showShortcutHint, setShowShortcutHint] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  // 修复 UI 不同步：添加状态以触发组件重新渲染
  const [shortcutConfigVersion, setShortcutConfigVersion] = useState(0)
  
  // 从存储中加载用户设置和历史记录
  const { data: storedSettings } = useStorage<UserSettings>('user_settings', DEFAULT_SETTINGS)
  const { data: storedHistory } = useStorage<SearchHistoryType[]>('search_history')

  useEffect(() => {
    const effectiveSettings = storedSettings || DEFAULT_SETTINGS
    setSettings(effectiveSettings)
    setSearchParams(prev => ({
      ...prev,
      engine: effectiveSettings.defaultEngine
    }))
  }, [storedSettings])

  useEffect(() => {
    if (storedHistory) {
      setHistory(storedHistory)
    }
  }, [storedHistory])

  // 生成搜索查询 - 使用 useCallback
  const generateQuery = useCallback((params: SearchParams) => {
    try {
      const adapter = SearchAdapterFactory.getAdapter(params.engine)

      // 验证搜索参数
      const validationResult = adapter.validateParams?.(params) || {
        isValid: true,
        errors: [],
        warnings: []
      }
      setValidation(validationResult)

      // 构建查询和URL
      const query = adapter.buildQuery(params)
      setGeneratedQuery(query.replace(/^[^?]+\?/, '').replace(/^wd=/, '').replace(/^q=/, '').split('&')[0])
      setSearchUrl(query)
      setSearchParams(params)
    } catch (error) {
      console.error('生成搜索查询失败:', error)
      setValidation({
        isValid: false,
        errors: [t('popup.adapterLoadError')],
        warnings: []
      })
    }
  }, [t])

  // 执行搜索 - 使用 useCallback
  const executeSearch = useCallback(() => {
    if (!searchUrl || !validation?.isValid) return

    // 保存到历史记录
    if (settings?.enableHistory) {
      const newHistoryItem: SearchHistoryType = {
        id: Date.now().toString(),
        keyword: searchParams.keyword,
        engine: searchParams.engine,
        syntax: {
          site: searchParams.site,
          fileType: searchParams.fileType,
          exactMatch: searchParams.exactMatch,
          // 新增高级语法字段
          inTitle: searchParams.inTitle,
          inUrl: searchParams.inUrl,
          excludeWords: searchParams.excludeWords,
          orKeywords: searchParams.orKeywords,
          inText: searchParams.inText,
          numberRange: searchParams.numberRange,
          wildcardQuery: searchParams.wildcardQuery,
          allInTitle: searchParams.allInTitle,
          relatedSite: searchParams.relatedSite,
          cacheSite: searchParams.cacheSite,
          dateRange: searchParams.dateRange
        },
        generatedQuery,
        timestamp: Date.now()
      }

      const updatedHistory = [newHistoryItem, ...history].slice(0, settings.historyLimit)
      setHistory(updatedHistory)

      // 保存到Chrome存储
      chrome.storage.local.set({
        search_history: updatedHistory
      })
    }

    // 根据用户设置选择打开方式
    if (settings?.autoOpenInNewTab) {
      // 在新标签页打开搜索结果
      chrome.tabs.create({ url: searchUrl })
    } else {
      // 在当前标签页打开搜索结果
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.update(tabs[0].id, { url: searchUrl })
        } else {
          // 如果无法获取当前标签页，回退到创建新标签页
          chrome.tabs.create({ url: searchUrl })
        }
      })
    }

    // 关闭弹窗
    window.close()
  }, [searchUrl, validation, settings, searchParams, generatedQuery, history])

  // Round 3: 使用 useCallback 避免闭包陈旧问题
  const handleExecuteSearch = useCallback(() => {
    executeSearch()
  }, [executeSearch])

  const handleCopyQuery = useCallback(async () => {
    if (generatedQuery) {
      try {
        await navigator.clipboard.writeText(generatedQuery)
        console.log('查询已复制到剪贴板:', generatedQuery)
      } catch (error) {
        console.error('复制失败:', error)
      }
    } else {
      console.warn('没有可复制的查询')
    }
  }, [generatedQuery])

  const handleSwitchEngine = useCallback((actionParam: string | number | undefined) => {
    console.log('[App] handleSwitchEngine 被调用，actionParam:', actionParam)

    const engines = SearchAdapterFactory.getSupportedEngines()
    let targetEngine: SearchEngine | undefined

    // 支持字符串（引擎名称）和数字（索引，向后兼容）两种方式
    if (typeof actionParam === 'string') {
      // 优先使用引擎名称
      if (engines.includes(actionParam as SearchEngine)) {
        targetEngine = actionParam as SearchEngine
        console.log(`[App] 使用引擎名称: ${targetEngine}`)
      } else {
        console.warn(`[App] 无效的引擎名称: "${actionParam}"`)
      }
    } else if (typeof actionParam === 'number') {
      // 向后兼容：支持引擎索引
      if (actionParam >= 0 && actionParam < engines.length) {
        targetEngine = engines[actionParam]
        console.log(`[App] 使用引擎索引 ${actionParam}: ${targetEngine}`)
      } else {
        console.warn(`[App] 引擎索引越界: ${actionParam} (有效范围: 0-${engines.length - 1})`)
      }
    }

    // 应用引擎切换
    if (targetEngine) {
      const newParams = { ...searchParams, engine: targetEngine }
      setSearchParams(newParams)
      generateQuery(newParams)
      console.log(`[App] 切换到搜索引擎: ${targetEngine}`)
    } else {
      console.warn(`[App] 无法切换引擎,使用默认引擎`)
    }
  }, [searchParams, generateQuery])

  const handleClearForm = useCallback(() => {
    setSearchParams({
      keyword: '',
      engine: settings?.defaultEngine || 'baidu',
      site: '',
      fileType: '',
      exactMatch: '',
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
    console.log('表单已清空')
  }, [settings])

  // 从历史记录中恢复搜索 - 使用 useCallback
  const restoreFromHistory = useCallback((historyItem: SearchHistoryType) => {
    const restoredParams: SearchParams = {
      keyword: historyItem.keyword,
      engine: historyItem.engine,
      site: historyItem.syntax.site || '',
      fileType: historyItem.syntax.fileType || '',
      exactMatch: historyItem.syntax.exactMatch || '',
      // 新增高级语法字段
      inTitle: historyItem.syntax.inTitle || '',
      inUrl: historyItem.syntax.inUrl || '',
      excludeWords: historyItem.syntax.excludeWords || [],
      orKeywords: historyItem.syntax.orKeywords || [],
      inText: historyItem.syntax.inText || '',
      numberRange: historyItem.syntax.numberRange,
      wildcardQuery: historyItem.syntax.wildcardQuery || '',
      allInTitle: historyItem.syntax.allInTitle || '',
      relatedSite: historyItem.syntax.relatedSite || '',
      cacheSite: historyItem.syntax.cacheSite || '',
      dateRange: historyItem.syntax.dateRange
    }
    setSearchParams(restoredParams)
    generateQuery(restoredParams)
  }, [generateQuery])

  // 清除历史记录 - 使用 useCallback
  const clearHistory = useCallback(() => {
    setHistory([])
    chrome.storage.local.remove('search_history')
  }, [])

  // v1.6.0: 应用推荐建议 - 使用 useCallback
  const handleApplySuggestion = useCallback((params: Partial<SearchParams>) => {
    const newParams = { ...searchParams, ...params }
    setSearchParams(newParams)
    generateQuery(newParams)
  }, [searchParams, generateQuery])

  // v1.6.0: 应用模板 - 使用 useCallback
  const handleApplyTemplate = useCallback((params: SearchParams) => {
    setSearchParams(params)
    generateQuery(params)
  }, [generateQuery])

  // v1.6.0: 初始化服务（只在组件挂载时初始化一次）
  // 🔥 P0修复：React Strict Mode 兼容性说明
  // 注意：React Strict Mode 会在开发环境双重调用此 effect（mount → unmount → mount）
  // 但 shortcutManager.destroy() 和重新初始化能正确处理，确保监听器只注册一次
  // 新增的并发保护机制 (initializePromise) 进一步确保即使快速多次调用也不会出现问题
  useEffect(() => {
    const initializeServices = async () => {
      try {
        await templateManager.initialize()
        await shortcutManager.initialize('popup')
      } catch (error) {
        console.error('初始化服务失败:', error)
      }
    }

    initializeServices()

    return () => {
      shortcutManager.destroy()
    }
  }, []) // 空依赖数组 - 只在组件挂载时初始化一次

  // 注册/更新快捷键处理器（handlers 变化时更新）
  useEffect(() => {
    // Round 3: 使用 useCallback 包装的处理器
    shortcutManager.register('EXECUTE_SEARCH', handleExecuteSearch)
    shortcutManager.register('COPY_QUERY', handleCopyQuery)
    shortcutManager.register('SWITCH_ENGINE', handleSwitchEngine)
    shortcutManager.register('CLEAR_FORM', handleClearForm)

    // 不依赖外部 state 的处理器保持内联
    shortcutManager.register('OPEN_TEMPLATES', () => setShowTemplateSelector(true))
    shortcutManager.register('SHOW_SHORTCUTS_HELP', () => setShowShortcutHint(true))
    shortcutManager.register('CLOSE_POPUP', () => window.close())
    shortcutManager.register('FOCUS_KEYWORD', () => {
      const keywordInput = document.getElementById('keyword') as HTMLInputElement
      if (keywordInput) keywordInput.focus()
    })
    shortcutManager.register('OPEN_HISTORY', () => {
      setShowHistory(true)
      console.log('打开历史记录面板')
    })
    shortcutManager.register('TOGGLE_ADVANCED', () => {
      setShowAdvanced(prev => !prev)
      console.log('切换高级选项显示')
    })
    shortcutManager.register('NEXT_FIELD', () => {
      const focusableElements = document.querySelectorAll<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
      )
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
      if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
        focusableElements[currentIndex + 1].focus()
      }
    })
    shortcutManager.register('PREV_FIELD', () => {
      const focusableElements = document.querySelectorAll<HTMLElement>(
        'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
      )
      const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as HTMLElement)
      if (currentIndex > 0) {
        focusableElements[currentIndex - 1].focus()
      }
    })
  }, [handleExecuteSearch, handleCopyQuery, handleSwitchEngine, handleClearForm])

  // 监听快捷键配置变化并重新注册处理器
  useEffect(() => {
    const handleShortcutConfigChange = (changes: { [key: string]: chrome.storage.StorageChange }, namespace: string) => {
      if (namespace === 'local' && changes['custom_shortcuts']) {
        console.log('[Popup] 检测到快捷键配置变化，触发 UI 刷新')
        // 修复 UI 不同步：触发依赖此状态的组件重新渲染
        setShortcutConfigVersion(prev => prev + 1)
      }
    }

    chrome.storage.onChanged.addListener(handleShortcutConfigChange)

    return () => {
      chrome.storage.onChanged.removeListener(handleShortcutConfigChange)
    }
  }, [])

  // 监听从 Options 页面传递的待恢复历史记录
  useEffect(() => {
    chrome.storage.local.get('pending_restore_history', (data) => {
      if (data.pending_restore_history) {
        const historyItem = data.pending_restore_history as SearchHistoryType
        restoreFromHistory(historyItem)
        // 清除临时状态
        chrome.storage.local.remove('pending_restore_history')
      }
    })
  }, [restoreFromHistory])

  return (
    <ThemeProvider>
      <TranslationProvider language={settings?.language ?? 'zh-CN'}>
        <PopupContent
          searchParams={searchParams}
          generateQuery={generateQuery}
          validation={validation}
          generatedQuery={generatedQuery}
          executeSearch={executeSearch}
          history={history}
          settings={settings}
          restoreFromHistory={restoreFromHistory}
          clearHistory={clearHistory}
          onApplySuggestion={handleApplySuggestion}
          onApplyTemplate={handleApplyTemplate}
          showTemplateSelector={showTemplateSelector}
          setShowTemplateSelector={setShowTemplateSelector}
          showShortcutHint={showShortcutHint}
          setShowShortcutHint={setShowShortcutHint}
          shortcutConfigVersion={shortcutConfigVersion}
          showHistory={showHistory}
          setShowHistory={setShowHistory}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
        />
      </TranslationProvider>
    </ThemeProvider>
  )
}

export default App

interface PopupContentProps {
  searchParams: SearchParams
  generateQuery: (params: SearchParams) => void
  validation: ValidationResult | null
  generatedQuery: string
  executeSearch: () => void
  history: SearchHistoryType[]
  settings: UserSettings | null
  restoreFromHistory: (historyItem: SearchHistoryType) => void
  clearHistory: () => void
  // v1.6.0 新增
  onApplySuggestion: (params: Partial<SearchParams>) => void
  onApplyTemplate: (params: SearchParams) => void
  showTemplateSelector: boolean
  setShowTemplateSelector: (show: boolean) => void
  showShortcutHint: boolean
  setShowShortcutHint: (show: boolean) => void
  shortcutConfigVersion: number
  // Round 2: 新增状态
  showHistory: boolean
  setShowHistory: (show: boolean) => void
  showAdvanced: boolean
  setShowAdvanced: (show: boolean) => void
}

function PopupContent({
  searchParams,
  generateQuery,
  validation,
  generatedQuery,
  executeSearch,
  history,
  settings,
  restoreFromHistory,
  clearHistory,
  onApplySuggestion,
  onApplyTemplate,
  showTemplateSelector,
  setShowTemplateSelector,
  showShortcutHint,
  setShowShortcutHint,
  shortcutConfigVersion,
  showHistory,
  setShowHistory,
  showAdvanced,
  setShowAdvanced
}: PopupContentProps) {
  const { t } = useTranslation()
  const version = useExtensionVersion()

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <header className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LogoIcon size={24} color="white" />
          <h1 className="text-lg font-semibold">{t('popup.headerTitle')}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <ShortcutHintTrigger onClick={() => setShowShortcutHint(true)} />
          <SettingsButton />
        </div>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* v1.6.0: 智能推荐面板 */}
        {searchParams.keyword && (
          <SuggestionPanel
            keyword={searchParams.keyword}
            currentParams={searchParams}
            history={history}
            onApplySuggestion={onApplySuggestion}
          />
        )}

        {/* 搜索表单 */}
        <SearchForm
          searchParams={searchParams}
          onSearchParamsChange={generateQuery}
          showAdvanced={showAdvanced}
          onToggleAdvanced={(show) => setShowAdvanced(show)}
        />

        {/* v1.6.0: 模板按钮 */}
        <button
          onClick={() => setShowTemplateSelector(true)}
          className="btn btn-ghost w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
        >
          <span>📋</span>
          <span>{t('popup.useTemplateButton', { shortcut: getShortcutDisplayText(DEFAULT_SHORTCUTS.open_templates.key) })}</span>
        </button>

        {/* 验证结果 */}
        {validation && (
          <div className="validation-results">
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
          <QueryPreview
            query={generatedQuery}
            onSearch={executeSearch}
            disabled={!validation?.isValid}
          />
        )}

        {/* 搜索历史 */}
        {settings?.enableHistory && history.length > 0 && (
          <SearchHistoryComponent
            history={history}
            onRestore={restoreFromHistory}
            onClear={clearHistory}
          />
        )}
      </main>

      {/* 底部 */}
      <footer className="bg-gray-100 dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{t('popup.footer.currentEngine', { engine: searchParams.engine.toUpperCase() })}</span>
          <span>SearchSyntax Pro v{version}</span>
        </div>
      </footer>

      {/* v1.6.0: 模态窗口 */}
      {showTemplateSelector && (
        <TemplateSelector
          currentParams={searchParams}
          onApplyTemplate={onApplyTemplate}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {showShortcutHint && (
        <ShortcutHint
          key={shortcutConfigVersion}
          onClose={() => setShowShortcutHint(false)}
        />
      )}

      {/* Round 2: 历史记录模态窗口 */}
      {showHistory && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('popup.historyModalTitle', { shortcut: getShortcutDisplayText(DEFAULT_SHORTCUTS.open_history.key) })}</h2>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {history.length > 0 ? (
                <SearchHistoryComponent
                  history={history}
                  onRestore={(item) => {
                    restoreFromHistory(item)
                    setShowHistory(false)
                  }}
                  onClear={() => {
                    clearHistory()
                    setShowHistory(false)
                  }}
                />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('popup.historyEmptyState')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
