import { useState } from 'react'
import type { SearchHistory } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslation } from '@/i18n'

interface SearchHistoryProps {
  history: SearchHistory[]
  onRestore: (item: SearchHistory) => void
  onClear: () => void
}

export function SearchHistory({ history, onRestore, onClear }: SearchHistoryProps) {
  const { t, language } = useTranslation()
  const locale = language === 'en-US' ? enUS : zhCN
  const [showAll, setShowAll] = useState(false)

  // 获取搜索引擎显示名称
  const getEngineName = (engine: string) => {
    return t(`common.searchEngines.${engine}`, undefined, engine)
  }

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale
      })
    } catch {
      return t('searchHistory.unknownTime')
    }
  }

  // 获取搜索语法的标签
  const getSyntaxBadges = (item: SearchHistory) => {
    const badges = []
    
    if (item.syntax.site) {
      badges.push({
        key: 'site',
        label: `site: ${item.syntax.site}`,
        className: 'badge-primary'
      })
    }
    
    if (item.syntax.fileType) {
      badges.push({
        key: 'filetype',
        label: `filetype: ${item.syntax.fileType}`,
        className: 'badge-secondary'
      })
    }
    
    if (item.syntax.exactMatch) {
      badges.push({
        key: 'exact',
        label: `"${item.syntax.exactMatch}"`,
        className: 'badge-primary'
      })
    }
    
    return badges
  }

  // Popup页面显示上限配置
  const POPUP_MAX_DISPLAY = 50  // popup页面最多显示50条记录

  // 计算要显示的记录数
  const displayCount = showAll
    ? Math.min(history.length, POPUP_MAX_DISPLAY)  // 展开时最多显示50条
    : 10  // 默认显示10条
  const hasMore = history.length > 10
  const reachedLimit = history.length > POPUP_MAX_DISPLAY  // 是否超过popup显示上限

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('searchHistory.title')}
        </h3>
        <button
          onClick={onClear}
          className="btn btn-ghost text-sm"
          title={t('searchHistory.clearTooltip')}
        >
          {t('searchHistory.clearButton')}
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {history.slice(0, displayCount).map((item) => (
          <div
            key={item.id}
            className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
            onClick={() => onRestore(item)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.keyword || t('searchHistory.emptyKeyword')}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getEngineName(item.engine)} • {formatTime(item.timestamp)}
                </p>
              </div>
            </div>

            {/* 搜索语法标签 */}
            {getSyntaxBadges(item).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {getSyntaxBadges(item).map((badge) => (
                  <span
                    key={badge.key}
                    className={`badge ${badge.className} text-xs`}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* 生成的查询 */}
            <div className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
              <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                {item.generatedQuery}
              </code>
            </div>
          </div>
        ))}

        {history.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-sm">{t('searchHistory.emptyState')}</p>
          </div>
        )}
      </div>

      {/* 展开/收起按钮 - 当历史记录超过10条时显示 */}
      {hasMore && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center mb-2">
              {showAll
                ? reachedLimit
                  ? t('searchHistory.showingLimit', { limit: POPUP_MAX_DISPLAY, total: history.length })
                  : t('searchHistory.showingAll', { count: displayCount })
                : t('searchHistory.showingRecent', { showing: 10, total: history.length })
              }
            </p>
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full btn btn-sm btn-primary"
            >
              {showAll
                ? t('searchHistory.collapse')
                : reachedLimit
                  ? t('searchHistory.expandLimit', { limit: POPUP_MAX_DISPLAY })
                  : t('searchHistory.expandAll', { count: history.length })
              }
            </button>
            {!showAll && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {t('searchHistory.viewAllHint')}
              </p>
            )}
            {/* 当已展开且超过上限时，显示引导到设置页面的提示 */}
            {showAll && reachedLimit && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400 text-center mb-2">
                  💡 {t('searchHistory.viewAllInSettings', { total: history.length })}
                </p>
                <button
                  onClick={() => {
                    chrome.runtime.openOptionsPage()
                  }}
                  className="w-full btn btn-sm btn-ghost text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                >
                  {t('searchHistory.goToSettings')} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
