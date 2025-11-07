import { CopyButton } from './CopyButton'
import { useTranslation } from '@/i18n'

interface QueryPreviewProps {
  query: string
  onSearch: () => void
  disabled?: boolean
}

export function QueryPreview({ query, onSearch, disabled = false }: QueryPreviewProps) {
  const { t } = useTranslation()

  // 复制查询到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(query)
      // 这里可以添加复制成功的提示
    } catch (err) {
      console.error(`${t('copyButton.copyError')}:`, err)
    }
  }

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('queryPreview.title')}
        </h3>
        <CopyButton text={query} />
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
          {query}
        </code>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onSearch}
          disabled={disabled}
          className={`btn flex-1 flex items-center justify-center space-x-2 ${
            disabled
              ? 'btn-disabled opacity-50 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>{t('queryPreview.executeButton')}</span>
        </button>
        
        <button
          onClick={copyToClipboard}
          className="btn btn-secondary"
          title={t('queryPreview.copyTooltip')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
