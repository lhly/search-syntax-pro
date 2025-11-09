import { useState } from 'react'
import type { SearchParams } from '@/types'
import { COMMON_FILE_TYPES } from '@/types'
import { useTranslation } from '@/i18n'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { SearchAdapterFactory } from '@/services/adapters'

interface SearchFormProps {
  searchParams: SearchParams
  onSearchParamsChange: (params: SearchParams) => void
}

export function SearchForm({ searchParams, onSearchParamsChange }: SearchFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const { t } = useTranslation()

  // 🔥 获取当前引擎的适配器和支持的功能
  const adapter = SearchAdapterFactory.getAdapter(searchParams.engine)
  const supportedFeatures = adapter.getSupportedFeatures()

  // 🔥 检查功能是否支持
  const isFeatureSupported = (feature: string) => {
    return supportedFeatures.includes(feature as any)
  }

  // 更新搜索参数
  const updateParam = <K extends keyof SearchParams>(key: K, value: SearchParams[K]) => {
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
          onChange={(e) => updateParam('engine', e.target.value as any)}
          className="input"
        >
          {SearchAdapterFactory.getSupportedEngines().map((engine) => (
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

      {/* 🔥 动态高级选项 */}
      {showAdvanced && (
        <div className="space-y-3 animate-slide-up">

          {/* ====== Twitter 专属功能 ====== */}

          {/* 用户筛选组 */}
          {isFeatureSupported('from_user') && (
            <CollapsibleSection title="用户筛选" icon="👤" defaultOpen={true}>
              {isFeatureSupported('from_user') && (
                <div>
                  <label htmlFor="fromUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    来自用户 (from:@user)
                  </label>
                  <input
                    id="fromUser"
                    type="text"
                    value={searchParams.fromUser || ''}
                    onChange={(e) => updateParam('fromUser', e.target.value)}
                    placeholder="例如: @elonmusk"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索来自特定用户的推文
                  </p>
                </div>
              )}

              {isFeatureSupported('to_user') && (
                <div>
                  <label htmlFor="toUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    发送给 (to:@user)
                  </label>
                  <input
                    id="toUser"
                    type="text"
                    value={searchParams.toUser || ''}
                    onChange={(e) => updateParam('toUser', e.target.value)}
                    placeholder="例如: @openai"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索发送给特定用户的推文
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 互动筛选组 */}
          {isFeatureSupported('min_retweets') && (
            <CollapsibleSection title="互动筛选" icon="❤️">
              {isFeatureSupported('min_retweets') && (
                <div>
                  <label htmlFor="minRetweets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最少转发数 (min_retweets:)
                  </label>
                  <input
                    id="minRetweets"
                    type="number"
                    value={searchParams.minRetweets ?? ''}
                    onChange={(e) => updateParam('minRetweets', Number(e.target.value))}
                    placeholder="例如: 100"
                    className="input"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    筛选至少被转发指定次数的推文
                  </p>
                </div>
              )}

              {isFeatureSupported('min_faves') && (
                <div>
                  <label htmlFor="minFaves" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    最少点赞数 (min_faves:)
                  </label>
                  <input
                    id="minFaves"
                    type="number"
                    value={searchParams.minFaves ?? ''}
                    onChange={(e) => updateParam('minFaves', Number(e.target.value))}
                    placeholder="例如: 500"
                    className="input"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    筛选至少被点赞指定次数的推文
                  </p>
                </div>
              )}

              {isFeatureSupported('content_filters') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    内容过滤器 (filter:)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['images', 'videos', 'links', 'media', 'replies', 'retweets', 'news'] as const).map((filter) => (
                      <label key={filter} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={searchParams.contentFilters?.includes(filter) || false}
                          onChange={(e) => {
                            const currentFilters = searchParams.contentFilters || []
                            const newFilters = e.target.checked
                              ? [...currentFilters, filter]
                              : currentFilters.filter(f => f !== filter)
                            updateParam('contentFilters', newFilters)
                          }}
                          className="form-checkbox"
                        />
                        <span className="text-sm">{filter}</span>
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    筛选包含特定内容类型的推文
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* ====== 传统搜索引擎功能 ====== */}

          {/* 位置限定组 */}
          {isFeatureSupported('site') && (
            <CollapsibleSection title="位置限定" icon="📍" defaultOpen={true}>
              {isFeatureSupported('site') && (
                <div>
                  <label htmlFor="site" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    网站内搜索 (site:)
                  </label>
                  <input
                    id="site"
                    type="text"
                    value={searchParams.site || ''}
                    onChange={(e) => updateParam('site', e.target.value)}
                    placeholder="例如: github.com"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    限制搜索结果仅来自指定网站
                  </p>
                </div>
              )}

              {isFeatureSupported('filetype') && (
                <div>
                  <label htmlFor="fileType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    文件类型 (filetype:)
                  </label>
                  <select
                    id="fileType"
                    value={searchParams.fileType || ''}
                    onChange={(e) => updateParam('fileType', e.target.value)}
                    className="input"
                  >
                    <option value="">不限制</option>
                    {COMMON_FILE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t(type.labelKey)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索特定格式的文档
                  </p>
                </div>
              )}

              {isFeatureSupported('intitle') && (
                <div>
                  <label htmlFor="inTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    标题搜索 (intitle:)
                  </label>
                  <input
                    id="inTitle"
                    type="text"
                    value={searchParams.inTitle || ''}
                    onChange={(e) => updateParam('inTitle', e.target.value)}
                    placeholder="例如: 教程"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索标题中包含指定关键词的网页
                  </p>
                </div>
              )}

              {isFeatureSupported('inurl') && (
                <div>
                  <label htmlFor="inUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL搜索 (inurl:)
                  </label>
                  <input
                    id="inUrl"
                    type="text"
                    value={searchParams.inUrl || ''}
                    onChange={(e) => updateParam('inUrl', e.target.value)}
                    placeholder="例如: blog"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索URL中包含指定关键词的网页
                  </p>
                </div>
              )}

              {isFeatureSupported('intext') && (
                <div>
                  <label htmlFor="inText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    正文搜索 (intext:/inbody:)
                  </label>
                  <input
                    id="inText"
                    type="text"
                    value={searchParams.inText || ''}
                    onChange={(e) => updateParam('inText', e.target.value)}
                    placeholder="例如: 使用方法"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索正文中包含指定关键词 (Bing使用inbody)
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 匹配精度组 */}
          {isFeatureSupported('exact_match') && (
            <CollapsibleSection title="匹配精度" icon="🎯">
              {isFeatureSupported('exact_match') && (
                <div>
                  <label htmlFor="exactMatch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    精确匹配 ("...")
                  </label>
                  <input
                    id="exactMatch"
                    type="text"
                    value={searchParams.exactMatch || ''}
                    onChange={(e) => updateParam('exactMatch', e.target.value)}
                    placeholder="例如: React Hooks 完整指南"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索包含完整短语的结果
                  </p>
                </div>
              )}

              {isFeatureSupported('wildcard') && (
                <div>
                  <label htmlFor="wildcardQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    通配符查询 (*)
                  </label>
                  <input
                    id="wildcardQuery"
                    type="text"
                    value={searchParams.wildcardQuery || ''}
                    onChange={(e) => updateParam('wildcardQuery', e.target.value)}
                    placeholder='例如: "React is * framework"'
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    使用 * 代替未知词汇
                  </p>
                </div>
              )}

              {isFeatureSupported('allintitle') && (
                <div>
                  <label htmlFor="allInTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    所有关键词在标题 (allintitle:)
                  </label>
                  <input
                    id="allInTitle"
                    type="text"
                    value={searchParams.allInTitle || ''}
                    onChange={(e) => updateParam('allInTitle', e.target.value)}
                    placeholder="例如: Python 机器学习 教程"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    标题中包含所有指定关键词 (Bing自动降级)
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 逻辑运算组 */}
          {(isFeatureSupported('or_keywords') || isFeatureSupported('exclude')) && (
            <CollapsibleSection title="逻辑运算" icon="🔀">
              {isFeatureSupported('or_keywords') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    OR逻辑关键词
                  </label>
                  <TagInput
                    tags={searchParams.orKeywords || []}
                    onChange={(tags) => updateParam('orKeywords', tags)}
                    placeholder="输入关键词后按回车"
                    maxTags={5}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索包含任一关键词的结果 (OR)
                  </p>
                </div>
              )}

              {isFeatureSupported('exclude') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    排除关键词 (-)
                  </label>
                  <TagInput
                    tags={searchParams.excludeWords || []}
                    onChange={(tags) => updateParam('excludeWords', tags)}
                    placeholder="输入要排除的词后按回车"
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    从搜索结果中排除包含这些词的页面
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 范围过滤组 */}
          {(isFeatureSupported('date_range') || isFeatureSupported('number_range')) && (
            <CollapsibleSection title="范围过滤" icon="📅">
              {isFeatureSupported('date_range') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    日期范围
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        value={searchParams.dateRange?.from || ''}
                        onChange={(e) =>
                          updateParam('dateRange', {
                            from: e.target.value,
                            to: searchParams.dateRange?.to || ''
                          })
                        }
                        className="input"
                        placeholder="开始日期"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">开始日期</p>
                    </div>
                    <div>
                      <input
                        type="date"
                        value={searchParams.dateRange?.to || ''}
                        onChange={(e) =>
                          updateParam('dateRange', {
                            from: searchParams.dateRange?.from || '',
                            to: e.target.value
                          })
                        }
                        className="input"
                        placeholder="结束日期"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">结束日期</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    限制搜索结果的发布日期范围
                  </p>
                </div>
              )}

              {isFeatureSupported('number_range') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    数字范围 (..)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        value={searchParams.numberRange?.min ?? ''}
                        onChange={(e) =>
                          updateParam('numberRange', {
                            min: e.target.value ? Number(e.target.value) : undefined,
                            max: searchParams.numberRange?.max
                          } as any)
                        }
                        className="input"
                        placeholder="最小值"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">最小值</p>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={searchParams.numberRange?.max ?? ''}
                        onChange={(e) =>
                          updateParam('numberRange', {
                            min: searchParams.numberRange?.min,
                            max: e.target.value ? Number(e.target.value) : undefined
                          } as any)
                        }
                        className="input"
                        placeholder="最大值"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">最大值</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    搜索包含指定数字范围的结果 (如价格、年份)
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 特殊功能组 */}
          {(isFeatureSupported('related') || isFeatureSupported('cache') || isFeatureSupported('language')) && (
            <CollapsibleSection title="特殊功能" icon="🔧">
              {isFeatureSupported('related') && (
                <div>
                  <label htmlFor="relatedSite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    相关网站 (related:)
                  </label>
                  <input
                    id="relatedSite"
                    type="text"
                    value={searchParams.relatedSite || ''}
                    onChange={(e) => updateParam('relatedSite', e.target.value)}
                    placeholder="例如: github.com"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    查找与指定网站相关的其他网站 (Google/Bing)
                  </p>
                </div>
              )}

              {isFeatureSupported('cache') && (
                <div>
                  <label htmlFor="cacheSite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    网页缓存 (cache:)
                  </label>
                  <input
                    id="cacheSite"
                    type="text"
                    value={searchParams.cacheSite || ''}
                    onChange={(e) => updateParam('cacheSite', e.target.value)}
                    placeholder="例如: https://example.com"
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    查看搜索引擎保存的网页快照 (百度/Google)
                  </p>
                </div>
              )}

              {isFeatureSupported('language') && (
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    语言筛选 (lang:)
                  </label>
                  <select
                    id="language"
                    value={searchParams.language || ''}
                    onChange={(e) => updateParam('language', e.target.value)}
                    className="input"
                  >
                    <option value="">不限制</option>
                    <option value="zh">中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                    <option value="it">Italiano</option>
                    <option value="ru">Русский</option>
                    <option value="ar">العربية</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    限制搜索结果的语言
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  )
}
