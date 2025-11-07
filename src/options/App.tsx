import { useState, useEffect } from 'react'
// 暂时移除ThemeProvider
// import { ThemeProvider } from '@/hooks/useTheme'
import { useStorage } from '@/hooks/useStorage'
import { Logo } from '@/components/Logo'
import type { UserSettings, Language } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { TranslationProvider, useTranslation, translate } from '@/i18n'

// 设置页面组件
function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; key: string } | null>(null)

  // 从存储中加载设置
  const { data: storedSettings, save: saveSettings } = useStorage<UserSettings>('user_settings')

  useEffect(() => {
    if (storedSettings) {
      setSettings(storedSettings)
      setLoading(false)
    }
  }, [storedSettings])

  const language = settings?.language ?? 'zh-CN'

  // 保存设置
  const handleSaveSettings = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const success = await saveSettings(settings)
      if (success) {
        setMessage({ type: 'success', key: 'options.messages.saveSuccess' })
      } else {
        setMessage({ type: 'error', key: 'options.messages.saveFailure' })
      }
    } catch (error) {
      setMessage({ type: 'error', key: 'options.messages.saveFailure' })
    } finally {
      setSaving(false)
    }

    // 3秒后清除消息
    setTimeout(() => setMessage(null), 3000)
  }

  // 重置设置
  const handleResetSettings = () => {
    if (confirm(translate(language, 'options.confirm.reset'))) {
      setSettings({ ...DEFAULT_SETTINGS })
    }
  }

  const handleExportData = () => {
    chrome.storage.local.get(null, (data) => {
      const exportData = {
        version: '1.0.0',
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
    <TranslationProvider language={language}>
      <OptionsContent
        loading={loading}
        settings={settings}
        updateSettings={updateSettings}
        message={message}
        saving={saving}
        onReset={handleResetSettings}
        onSave={handleSaveSettings}
        onExport={handleExportData}
        onImport={handleImportData}
        onClearAll={handleClearAllData}
      />
    </TranslationProvider>
  )
}

export default App
interface OptionsContentProps {
  loading: boolean
  settings: UserSettings | null
  updateSettings: (updater: (prev: UserSettings) => UserSettings) => void
  message: { type: 'success' | 'error'; key: string } | null
  saving: boolean
  onReset: () => void
  onSave: () => void
  onExport: () => void
  onImport: () => void
  onClearAll: () => void
}

function OptionsContent({
  loading,
  settings,
  updateSettings,
  message,
  saving,
  onReset,
  onSave,
  onExport,
  onImport,
  onClearAll
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
        <div className="flex items-center space-x-4">
          <Logo size={40} color="#3B82F6" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {t('options.header.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{t('options.header.subtitle')}</p>
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
          {t(message.key)}
        </div>
      )}

      {/* 基本设置 */}
      <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('options.sections.basic')}
        </h2>
        
        <div className="space-y-4">
          {/* 默认搜索引擎 */}
          <div>
            <label htmlFor="defaultEngine" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('options.fields.defaultEngine.label')}
            </label>
            <select
              id="defaultEngine"
              value={settings.defaultEngine}
              onChange={(e) =>
                updateSettings((prev) => ({
                  ...prev,
                  defaultEngine: e.target.value as UserSettings['defaultEngine']
                }))
              }
              className="input"
            >
              {(['baidu', 'google', 'bing'] as const).map((engine) => (
                <option key={engine} value={engine}>
                  {t(`common.searchEngines.${engine}`)}
                </option>
              ))}
            </select>
          </div>

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
        
        <div className="space-y-4">
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

      {/* 关于信息 */}
      <footer className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t('options.footer.title')}
        </h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>{t('options.footer.version', { version: '1.0.0' })}</p>
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
    </div>
  )
}
