import { useState, useEffect } from 'react'
import { SearchForm } from '@/components/SearchForm'
import { QueryPreview } from '@/components/QueryPreview'
import { SearchHistory as SearchHistoryComponent } from '@/components/SearchHistory'
import { SettingsButton } from '@/components/SettingsButton'
import { LogoIcon } from '@/components/Logo'
import { useStorage } from '@/hooks/useStorage'
import { ThemeProvider } from '@/hooks/useTheme'
import { SearchAdapterFactory } from '@/services/adapters'
import { TranslationProvider, useTranslation } from '@/i18n'
import type { SearchParams, SearchHistory as SearchHistoryType, UserSettings, ValidationResult } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'

function App() {
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
  }, [])

  // 生成搜索查询
  const generateQuery = (params: SearchParams) => {
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
        errors: ['搜索引擎适配器加载失败'],
        warnings: []
      })
    }
  }

  // 执行搜索
  const executeSearch = () => {
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
  }

  // 清除历史记录
  const clearHistory = () => {
    setHistory([])
    chrome.storage.local.remove('search_history')
  }

  // 从历史记录中恢复搜索
  const restoreFromHistory = (historyItem: SearchHistoryType) => {
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
  }

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
  clearHistory
}: PopupContentProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <header className="bg-primary-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <LogoIcon size={24} color="white" />
          <h1 className="text-lg font-semibold">{t('popup.headerTitle')}</h1>
        </div>
        <SettingsButton />
      </header>

      {/* 主体内容 */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 搜索表单 */}
        <SearchForm 
          searchParams={searchParams}
          onSearchParamsChange={generateQuery}
        />

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
          <span>SearchSyntax Pro v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}
