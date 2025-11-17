import { useState, useEffect } from 'react'
import { ThemeProvider } from '@/hooks/useTheme'
import { useStorage } from '@/hooks/useStorage'
import { Logo } from '@/components/Logo'
import { HistoryManager } from '@/components/HistoryManager'
import { ShortcutSettings } from '@/components/ShortcutSettings'
import { EngineManager } from '@/components/EngineManager'
import type { UserSettings, Language, SearchHistory } from '@/types'
import { EnginePreferenceService } from '@/services/engine-preference'
import { autoMigrateStorage } from '@/utils/migration'
import { TranslationProvider, useTranslation, translate } from '@/i18n'
import { useExtensionVersion } from '@/utils/version'

// 设置页面组件
function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; key: string; params?: Record<string, string> } | null>(null)
  const [history, setHistory] = useState<SearchHistory[]>([])
  // 🔥 移除 'engines' tab
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'shortcuts'>('settings')
  const version = useExtensionVersion()

  // 从存储中加载设置和历史记录
  const { data: storedSettings, save: saveSettings } = useStorage<UserSettings>('user_settings')
  const { data: storedHistory } = useStorage<SearchHistory[]>('search_history')

  // 🔥 自动迁移旧版本数据
  useEffect(() => {
    autoMigrateStorage().catch(console.error)
  }, [])

  useEffect(() => {
    setSettings(storedSettings || EnginePreferenceService.getDefaultUserSettings())
    setLoading(false)
  }, [storedSettings])

  useEffect(() => {
    if (storedHistory) {
      setHistory(storedHistory)
    }
  }, [storedHistory])

  const language = settings?.language ?? 'zh-CN'

  // 清除历史记录
  const handleClearHistory = () => {
    if (confirm(translate(language, 'options.confirm.clearHistory'))) {
      setHistory([])
      chrome.storage.local.remove('search_history')
    }
  }

  // 保存设置
  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      // 检查是否需要清理历史记录
      const currentHistoryData = await chrome.storage.local.get('search_history')
      const currentHistory: SearchHistory[] = currentHistoryData.search_history || []
      const willDelete = currentHistory.length - settings.historyLimit

      // 如果当前记录超过新限制，需要用户确认
      if (willDelete > 0) {
        const confirmed = confirm(
          translate(language, 'options.confirm.trimHistory', {
            current: currentHistory.length.toString(),
            limit: settings.historyLimit.toString(),
            willDelete: willDelete.toString()
          })
        )

        if (!confirmed) {
          // 用户取消，不保存设置
          setSaving(false)
          setMessage({ type: 'error', key: 'options.messages.saveCancelled' })
          setTimeout(() => setMessage(null), 3000)
          return
        }

        // 用户确认，立即清理超出的记录（保留最新的N条）
        const trimmedHistory = currentHistory.slice(0, settings.historyLimit)
        await chrome.storage.local.set({ search_history: trimmedHistory })

        // 更新本地状态
        setHistory(trimmedHistory)
      }

      // 保存设置
      const success = await saveSettings(settings)
      if (success) {
        if (willDelete > 0) {
          setMessage({
            type: 'success',
            key: 'options.messages.saveSuccessWithTrim',
            params: { removed: willDelete.toString() }
          })
        } else {
          setMessage({ type: 'success', key: 'options.messages.saveSuccess' })
        }
      } else {
        setMessage({ type: 'error', key: 'options.messages.saveFailure' })
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      setMessage({ type: 'error', key: 'options.messages.saveFailure' })
    } finally {
      setSaving(false)
    }

    // 3秒后清除消息
    setTimeout(() => setMessage(null), 3000)
  }

  // 重置设置
  const handleResetSettings = async () => {
    if (confirm(translate(language, 'options.confirm.reset'))) {
      const defaultSettings = EnginePreferenceService.getDefaultUserSettings()
      setSettings(defaultSettings)

      // 自动保存重置后的设置
      setSaving(true)
      setMessage(null)

      try {
        const success = await saveSettings(defaultSettings)
        if (success) {
          setMessage({ type: 'success', key: 'options.messages.resetSuccess' })
        } else {
          setMessage({ type: 'error', key: 'options.messages.resetFailure' })
        }
      } catch (error) {
        setMessage({ type: 'error', key: 'options.messages.resetFailure' })
      } finally {
        setSaving(false)
      }

      // 3秒后清除消息
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleExportData = () => {
    chrome.storage.local.get(null, (data) => {
      const exportData = {
        version: version,
        timestamp: Date.now(),
        data: data
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ssp-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target?.result as string)
          
          // 验证数据格式
          if (!importData.version || !importData.data) {
            throw new Error(translate(language, 'options.alert.importInvalid'))
          }
          
          // 导入数据
          chrome.storage.local.clear(() => {
            chrome.storage.local.set(importData.data, () => {
              alert(translate(language, 'options.alert.importSuccess'))
              window.location.reload()
            })
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : translate(language, 'options.alert.unknownError')
          alert(translate(language, 'options.alert.importFailure', { error: errorMessage }))
        }
      }
      
      reader.readAsText(file)
    }
    
    input.click()
  }

  const handleClearAllData = () => {
    if (confirm(translate(language, 'options.confirm.clearAll'))) {
      if (confirm(translate(language, 'options.confirm.clearAllSecond'))) {
        chrome.storage.local.clear(() => {
          alert(translate(language, 'options.alert.clearSuccess'))
          window.location.reload()
        })
      }
    }
  }

  const updateSettings = (updater: (prev: UserSettings) => UserSettings) => {
    setSettings((prev) => (prev ? updater(prev) : prev))
  }

  return (
    <ThemeProvider>
      <TranslationProvider language={language}>
        <OptionsContent
          loading={loading}
          settings={settings}
          updateSettings={updateSettings}
          message={message}
          saving={saving}
          history={history}
          activeTab={activeTab}
          version={version}
          onTabChange={setActiveTab}
          onReset={handleResetSettings}
          onSave={handleSaveSettings}
          onExport={handleExportData}
          onImport={handleImportData}
          onClearAll={handleClearAllData}
          onClearHistory={handleClearHistory}
        />
      </TranslationProvider>
    </ThemeProvider>
  )
}

export default App
interface OptionsContentProps {
  loading: boolean
  settings: UserSettings | null
  updateSettings: (updater: (prev: UserSettings) => UserSettings) => void
  message: { type: 'success' | 'error'; key: string; params?: Record<string, string> } | null
  saving: boolean
  history: SearchHistory[]
  // 🔥 移除 'engines' tab
  activeTab: 'settings' | 'history' | 'shortcuts'
  version: string
  onTabChange: (tab: 'settings' | 'history' | 'shortcuts') => void
  onReset: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  onClearAll: () => void
  onClearHistory: () => void
}

function OptionsContent({
  loading,
  settings,
  updateSettings,
  message,
  saving,
  history,
  activeTab,
  version,
  onTabChange,
  onReset,
  onSave,
  onExport,
  onImport,
  onClearAll,
  onClearHistory
}: OptionsContentProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{t('options.status.loadError')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Logo size={40} color="#3B82F6" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {t('options.header.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{t('options.header.subtitle')}</p>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex space-x-2">
            <button
              onClick={() => onTabChange('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ⚙️ {t('options.tabs.settings')}
            </button>
            <button
              onClick={() => onTabChange('shortcuts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'shortcuts'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ⌨️ {t('options.tabs.shortcuts')}
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              📜 {t('options.tabs.history')} {history.length > 0 && `(${history.length})`}
            </button>
          </div>
        </div>
      </header>

      {/* 消息提示 */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {t(message.key, message.params)}
        </div>
      )}

      {/* Tab 内容 */}
      {activeTab === 'shortcuts' ? (
        <ShortcutSettings />
      ) : activeTab === 'history' ? (
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('options.sections.historyManagement')}
          </h2>
          <HistoryManager history={history} onClear={onClearHistory} />
        </section>
      ) : (
        <>
          {/* 🔥 设置内容 */}

      {/* 🔥 搜索引擎管理 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {/* 引擎排序管理 - 标题已移至EngineManager组件内部 */}
        <EngineManager
          preferences={settings.enginePreferences}
          onChange={(newPreferences) => {
            updateSettings((prev) => ({
              ...prev,
              enginePreferences: newPreferences
            }))
          }}
        />
      </section>

      {/* 基本设置 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('options.sections.basic')}
        </h2>

        <div className="space-y-4">
          {/* 界面语言 */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('options.fields.language.label')}
            </label>
            <select
              id="language"
              value={settings.language}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  language: e.target.value as UserSettings['language']
                }))
              }
              className="input"
            >
              {(['zh-CN', 'en-US'] as Language[]).map((lang) => (
                <option key={lang} value={lang}>
                  {t(`common.languages.${lang}`)}
                </option>
              ))}
            </select>
          </div>

          {/* 主题设置 */}
          <div>
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('options.fields.theme.label')}
            </label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  theme: e.target.value as UserSettings['theme']
                }))
              }
              className="input"
            >
              <option value="auto">{t('options.fields.theme.auto')}</option>
              <option value="light">{t('options.fields.theme.light')}</option>
              <option value="dark">{t('options.fields.theme.dark')}</option>
            </select>
          </div>
        </div>
      </section>

      {/* 功能设置 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('options.sections.features')}
        </h2>
        
        <div className="space-y-4">
          {/* 启用搜索历史 */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enableHistory" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('options.fields.enableHistory.label')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('options.fields.enableHistory.description')}
              </p>
            </div>
            <input
              id="enableHistory"
              type="checkbox"
              checked={settings.enableHistory}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  enableHistory: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          {/* 自动在新标签页打开 */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="autoOpenInNewTab" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('options.fields.autoOpen.label')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('options.fields.autoOpen.description')}
              </p>
            </div>
            <input
              id="autoOpenInNewTab"
              type="checkbox"
              checked={settings.autoOpenInNewTab}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  autoOpenInNewTab: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          {/* 🔥 启用右键菜单 */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="enableContextMenu" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('options.fields.enableContextMenu.label')}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('options.fields.enableContextMenu.description')}
              </p>
            </div>
            <input
              id="enableContextMenu"
              type="checkbox"
              checked={settings.enableContextMenu}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  enableContextMenu: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>

          {/* 悬浮按钮功能（开发中） */}
          <div className="flex items-center justify-between opacity-50">
            <div>
              <label htmlFor="enableFloatingButton" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用悬浮按钮 (开发中)
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                此功能正在开发中，将在未来版本启用
              </p>
            </div>
            <input
              id="enableFloatingButton"
              type="checkbox"
              checked={false}
              disabled
              className="h-4 w-4 text-gray-400 border-gray-300 rounded cursor-not-allowed"
            />
          </div>

          {/* 历史记录限制 */}
          <div>
            <label htmlFor="historyLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('options.fields.historyLimit.label')}
            </label>
            <input
              id="historyLimit"
              type="number"
              min="10"
              max="5000"
              value={settings.historyLimit}
              onChange={(e) => {
                const parsed = parseInt(e.target.value)
                updateSettings((prev) => ({
                  ...prev,
                  historyLimit: Number.isNaN(parsed) ? prev.historyLimit : parsed
                }))
              }}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('options.fields.historyLimit.description')}
            </p>
          </div>
        </div>
      </section>

      {/* 数据管理 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('options.sections.data')}
        </h2>
        
        <div className="flex flex-col gap-5">
          <button
            onClick={onExport}
            className="btn btn-secondary"
          >
            {t('options.actions.export')}
          </button>

          <button
            onClick={onImport}
            className="btn btn-secondary"
          >
            {t('options.actions.import')}
          </button>

          <button
            onClick={onClearAll}
            className="btn btn-danger"
          >
            {t('options.actions.clearAll')}
          </button>
        </div>
      </section>

      {/* 操作按钮 */}
      <section className="flex justify-between items-center">
        <button
          onClick={onReset}
          className="btn btn-ghost"
        >
          {t('options.actions.reset')}
        </button>
        
        <div className="space-x-3">
          <button
            onClick={() => window.close()}
            className="btn btn-ghost"
          >
            {t('options.actions.cancel')}
          </button>
          
          <button
            onClick={onSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? t('options.actions.saving') : t('options.actions.save')}
          </button>
        </div>
      </section>

      {/* 关于信息 - 仅在设置页面显示 */}
      {activeTab === 'settings' && (
        <footer className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {t('options.footer.title')}
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>{t('options.footer.version', { version: version })}</p>
            <p>{t('options.footer.author', { author: '冷火凉烟' })}</p>
            <p>
              <a
                href="https://github.com/lhly/search-syntax-pro"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700"
              >
                {t('options.footer.homepage')}
              </a>
            </p>
          </div>
        </footer>
      )}
        </>
      )}
    </div>
  )
}
