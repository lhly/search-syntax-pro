import { useState } from 'react'
import type { SearchHistory, UserSettings } from '@/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useTranslation } from '@/i18n'
import { SearchAdapterFactory } from '@/services/adapters'
import { DEFAULT_SETTINGS } from '@/types'

interface HistoryManagerProps {
  history: SearchHistory[]
  onClear: () => void
}

export function HistoryManager({ history, onClear }: HistoryManagerProps) {
  const { t, language } = useTranslation()
  const locale = language === 'en-US' ? enUS : zhCN
  const [searchFilter, setSearchFilter] = useState('')

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

  // 快速搜索功能 - 直接执行搜索
  const handleQuickSearch = async (item: SearchHistory) => {
    try {
      // 1. 构建搜索URL
      const adapter = SearchAdapterFactory.getAdapter(item.engine)
      const searchUrl = adapter.buildQuery({
        keyword: item.keyword,
        engine: item.engine,
        site: item.syntax.site,
        fileType: item.syntax.fileType,
        exactMatch: item.syntax.exactMatch
      })

      // 2. 获取用户设置
      const { user_settings } = await chrome.storage.local.get('user_settings')
      const settings: UserSettings = user_settings || DEFAULT_SETTINGS

      // 3. 打开搜索
      if (settings.autoOpenInNewTab) {
        await chrome.tabs.create({ url: searchUrl })
      } else {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tabs[0]?.id) {
          await chrome.tabs.update(tabs[0].id, { url: searchUrl })
        } else {
          // 回退：如果无法获取当前标签页，创建新标签页
          await chrome.tabs.create({ url: searchUrl })
        }
      }
    } catch (error) {
      console.error('执行搜索失败:', error)
    }
  }

  // 编辑搜索功能 - 保存到临时存储并提示打开popup
  const handleEditSearch = async (item: SearchHistory, event: React.MouseEvent) => {
    event.stopPropagation()

    try {
      // 保存到临时存储
      await chrome.storage.local.set({
        pending_restore_history: item
      })

      // 显示通知（简单的alert，后续可以优化为toast通知）
      alert(t('historyManager.editPrepared'))
    } catch (error) {
      console.error('保存编辑状态失败:', error)
    }
  }

  // 过滤历史记录
  const filteredHistory = searchFilter
    ? history.filter(item =>
        item.keyword.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.engine.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.syntax.site?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.syntax.fileType?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : history

  return (
    <div className="space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('historyManager.searchPlaceholder')}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="input w-full"
          />
        </div>
        <button
          onClick={onClear}
          className="btn btn-danger"
          disabled={history.length === 0}
        >
          {t('searchHistory.clearButton')}
        </button>
      </div>

      {/* 统计信息 */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {searchFilter ? (
          <p>
            {t('historyManager.filterResults', {
              count: filteredHistory.length,
              total: history.length
            })}
          </p>
        ) : (
          <p>{t('historyManager.totalRecords', { count: history.length })}</p>
        )}
      </div>

      {/* 历史记录列表 */}
      {filteredHistory.length > 0 ? (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => handleQuickSearch(item)}
                  title={t('historyManager.quickSearchTooltip')}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-base font-medium text-gray-900 dark:text-gray-100">
                      {item.keyword || t('searchHistory.emptyKeyword')}
                    </p>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {getEngineName(item.engine)}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatTime(item.timestamp)}
                  </p>

                  {/* 搜索语法标签 */}
                  {getSyntaxBadges(item).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
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
                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600">
                    <code className="text-xs text-gray-600 dark:text-gray-400 break-all">
                      {item.generatedQuery}
                    </code>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleQuickSearch(item)}
                    className="btn btn-sm btn-primary whitespace-nowrap"
                    title={t('historyManager.quickSearchTooltip')}
                  >
                    🚀 {t('historyManager.quickSearch')}
                  </button>
                  <button
                    onClick={(e) => handleEditSearch(item, e)}
                    className="btn btn-sm btn-ghost whitespace-nowrap"
                    title={t('historyManager.editSearchTooltip')}
                  >
                    📝 {t('historyManager.editSearch')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-base">
            {searchFilter
              ? t('historyManager.noFilterResults')
              : t('searchHistory.emptyState')
            }
          </p>
        </div>
      )}

      {/* 使用提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
          💡 {t('historyManager.usageTips')}
        </p>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-disc list-inside">
          <li>{t('historyManager.tip1')}</li>
          <li>{t('historyManager.tip2')}</li>
        </ul>
      </div>
    </div>
  )
}
