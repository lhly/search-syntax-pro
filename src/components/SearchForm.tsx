import { useState } from 'react'
import type { SearchParams } from '@/types'
import { COMMON_FILE_TYPES } from '@/types'
import { useTranslation } from '@/i18n'

interface SearchFormProps {
  searchParams: SearchParams
  onSearchParamsChange: (params: SearchParams) => void
}

export function SearchForm({ searchParams, onSearchParamsChange }: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { t } = useTranslation()

  // 更新搜索参数
  const updateParam = (key: keyof SearchParams, value: string) => {
    const newParams = { ...searchParams, [key]: value }
    onSearchParamsChange(newParams)
  }

  // 切换高级选项
  const toggleAdvanced = () => {
    setShowAdvanced(!showAdvanced)
  }

  return (
    <div className="space-y-4">
      {/* 关键词输入 */}
      <div>
        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('searchForm.keywordLabel')}
        </label>
        <input
          id="keyword"
          type="text"
          value={searchParams.keyword}
          onChange={(e) => updateParam('keyword', e.target.value)}
          placeholder={t('searchForm.keywordPlaceholder')}
          className="input"
          autoFocus
        />
      </div>

      {/* 搜索引擎选择 */}
      <div>
        <label htmlFor="engine" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('searchForm.engineLabel')}
        </label>
        <select
          id="engine"
          value={searchParams.engine}
          onChange={(e) => updateParam('engine', e.target.value as 'baidu' | 'google' | 'bing')}
          className="input"
        >
          {(['baidu', 'google', 'bing'] as const).map((engine) => (
            <option key={engine} value={engine}>
              {t(`common.searchEngines.${engine}`)}
            </option>
          ))}
        </select>
      </div>

      {/* 高级选项切换按钮 */}
      <button
        type="button"
        onClick={toggleAdvanced}
        className="btn btn-ghost w-full flex items-center justify-between"
      >
        <span>{t('searchForm.advancedToggle')}</span>
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 高级选项 */}
      {showAdvanced && (
        <div className="space-y-4 animate-slide-up">
          {/* 网站内搜索 */}
          <div>
            <label htmlFor="site" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('searchForm.siteLabel')}
            </label>
            <input
              id="site"
              type="text"
              value={searchParams.site || ''}
              onChange={(e) => updateParam('site', e.target.value)}
              placeholder={t('searchForm.sitePlaceholder')}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('searchForm.siteDescription')}
            </p>
          </div>

          {/* 文件类型搜索 */}
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('searchForm.fileTypeLabel')}
            </label>
            <select
              id="fileType"
              value={searchParams.fileType || ''}
              onChange={(e) => updateParam('fileType', e.target.value)}
              className="input"
            >
              <option value="">{t('searchForm.fileTypeAny')}</option>
              {COMMON_FILE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {t(type.labelKey)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('searchForm.fileTypeDescription')}
            </p>
          </div>

          {/* 精确匹配 */}
          <div>
            <label htmlFor="exactMatch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('searchForm.exactLabel')}
            </label>
            <input
              id="exactMatch"
              type="text"
              value={searchParams.exactMatch || ''}
              onChange={(e) => updateParam('exactMatch', e.target.value)}
              placeholder={t('searchForm.exactPlaceholder')}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('searchForm.exactDescription')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
