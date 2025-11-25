import { useState, useEffect, useRef } from 'react'
import type { SearchParams, UserSettings } from '@/types'
import { useTranslation } from '@/i18n'
import { CollapsibleSection } from './CollapsibleSection'
import { TagInput } from './TagInput'
import { SearchAdapterFactory } from '@/services/adapters'
import { EnginePreferenceService } from '@/services/engine-preference'
import { useStorage } from '@/hooks/useStorage'
import { SyntaxParser } from '@/utils/syntax-parser'

interface SearchFormProps {
  searchParams: SearchParams
  onSearchParamsChange: (params: SearchParams) => void
  // Round 2: 支持外部控制的高级选项状态
  showAdvanced?: boolean
  onToggleAdvanced?: (show: boolean) => void
  // 悬浮面板模式：隐藏引擎选择器（当前页面已确定搜索引擎）
  hideEngineSelector?: boolean
}

export function SearchForm({
  searchParams,
  onSearchParamsChange,
  showAdvanced: externalShowAdvanced,
  onToggleAdvanced,
  hideEngineSelector = false
}: SearchFormProps) {
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false)
  const { t } = useTranslation()
  const hasAutoInjectedRef = useRef(false) // 防止重复自动注入

  // 使用外部状态或内部状态
  const showAdvanced = externalShowAdvanced !== undefined ? externalShowAdvanced : internalShowAdvanced
  const setShowAdvanced = onToggleAdvanced || setInternalShowAdvanced

  // 🔥 从用户设置中获取引擎偏好
  const { data: settings } = useStorage<UserSettings>('user_settings')

  // 🔥 使用用户偏好的可见引擎列表（已排序）
  const visibleEngines = EnginePreferenceService.getVisibleEngines(settings?.enginePreferences)

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

  // 🔥 自动解析关键词中的高级语法
  useEffect(() => {
    // 只在第一次展开高级选项时自动解析
    if (showAdvanced && !hasAutoInjectedRef.current && searchParams.keyword) {
      const parsedSyntax = SyntaxParser.parse(searchParams.keyword, searchParams.engine)

      // 检查是否解析出了有效的语法
      const hasValidSyntax = SyntaxParser.isValidParsedSyntax(parsedSyntax) && (
        !!parsedSyntax.inTitle ||
        !!parsedSyntax.inUrl ||
        !!parsedSyntax.inText ||
        (parsedSyntax.sites && parsedSyntax.sites.length > 0) ||
        (parsedSyntax.fileTypes && parsedSyntax.fileTypes.length > 0) ||
        (parsedSyntax.exactMatches && parsedSyntax.exactMatches.length > 0) ||
        (parsedSyntax.excludeWords && parsedSyntax.excludeWords.length > 0)
      )

      if (hasValidSyntax) {
        // 合并解析结果到现有参数
        const mergedParams = SyntaxParser.mergeParams(searchParams, parsedSyntax)
        onSearchParamsChange(mergedParams)
        hasAutoInjectedRef.current = true
      }
    }
    // 当折叠高级选项时重置标记,允许下次展开时再次解析(如果关键词已变化)
    if (!showAdvanced) {
      hasAutoInjectedRef.current = false
    }
  }, [showAdvanced, searchParams.keyword]) // 监听高级选项状态和关键词变化

  // 切换高级选项
  const toggleAdvanced = () => {
    if (onToggleAdvanced) {
      onToggleAdvanced(!showAdvanced)
    } else {
      setShowAdvanced(!showAdvanced)
    }
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

      {/* 搜索引擎选择 - 悬浮面板模式下隐藏（当前页面已确定搜索引擎） */}
      {!hideEngineSelector && (
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
            {visibleEngines.map((engine) => (
              <option key={engine} value={engine}>
                {t(`common.searchEngines.${engine}`)}
              </option>
            ))}
          </select>
        </div>
      )}

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
            <CollapsibleSection title={t('searchForm.userFiltering.title')} icon="👤" defaultOpen={true}>
              {isFeatureSupported('from_user') && (
                <div>
                  <label htmlFor="fromUsers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.fromUser.label')} 🔥
                  </label>
                  <TagInput
                    tags={searchParams.fromUsers || []}
                    onChange={(tags) => updateParam('fromUsers', tags)}
                    placeholder={t('searchForm.fromUser.placeholder') + t('searchForm.fromUser.multipleHint')}
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.fromUser.description')} • {t('searchForm.fromUser.hint')}
                  </p>
                </div>
              )}

              {isFeatureSupported('to_user') && (
                <div>
                  <label htmlFor="toUsers" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.toUser.label')} 🔥
                  </label>
                  <TagInput
                    tags={searchParams.toUsers || []}
                    onChange={(tags) => updateParam('toUsers', tags)}
                    placeholder={t('searchForm.toUser.placeholder') + t('searchForm.toUser.multipleHint')}
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.toUser.description')} • {t('searchForm.toUser.hint')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 互动筛选组 */}
          {isFeatureSupported('min_retweets') && (
            <CollapsibleSection title={t('searchForm.interactionFiltering.title')} icon="❤️">
              {isFeatureSupported('min_retweets') && (
                <div>
                  <label htmlFor="minRetweets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.minRetweets.label')}
                  </label>
                  <input
                    id="minRetweets"
                    type="number"
                    value={searchParams.minRetweets ?? ''}
                    onChange={(e) => updateParam('minRetweets', Number(e.target.value))}
                    placeholder={t('searchForm.minRetweets.placeholder')}
                    className="input"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.minRetweets.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('min_faves') && (
                <div>
                  <label htmlFor="minFaves" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.minFaves.label')}
                  </label>
                  <input
                    id="minFaves"
                    type="number"
                    value={searchParams.minFaves ?? ''}
                    onChange={(e) => updateParam('minFaves', Number(e.target.value))}
                    placeholder={t('searchForm.minFaves.placeholder')}
                    className="input"
                    min="0"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.minFaves.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('content_filters') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.contentFilters.label')}
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
                    {t('searchForm.contentFilters.description')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* ====== 传统搜索引擎功能 ====== */}

          {/* 位置限定组 */}
          {isFeatureSupported('site') && (
            <CollapsibleSection title={t('searchForm.locationFiltering.title')} icon="📍" defaultOpen={true}>
              {isFeatureSupported('site') && (
                <div>
                  <label htmlFor="sites" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.site.label')} 🔥
                  </label>
                  <TagInput
                    tags={searchParams.sites || []}
                    onChange={(tags) => updateParam('sites', tags)}
                    placeholder={t('searchForm.site.placeholder') + t('searchForm.site.multipleHint')}
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.site.description')} • {t('searchForm.site.hint')}
                  </p>
                </div>
              )}

              {isFeatureSupported('filetype') && (
                <div>
                  <label htmlFor="fileTypes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.fileType.label')} 🔥
                  </label>
                  <TagInput
                    tags={searchParams.fileTypes || []}
                    onChange={(tags) => updateParam('fileTypes', tags)}
                    placeholder={t('searchForm.fileType.placeholder')}
                    maxTags={5}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.fileType.description')} • {t('searchForm.fileType.hint')}
                  </p>
                </div>
              )}

              {isFeatureSupported('intitle') && (
                <div>
                  <label htmlFor="inTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.inTitle.label')}
                  </label>
                  <input
                    id="inTitle"
                    type="text"
                    value={searchParams.inTitle || ''}
                    onChange={(e) => updateParam('inTitle', e.target.value)}
                    placeholder={t('searchForm.inTitle.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.inTitle.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('inurl') && (
                <div>
                  <label htmlFor="inUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.inUrl.label')}
                  </label>
                  <input
                    id="inUrl"
                    type="text"
                    value={searchParams.inUrl || ''}
                    onChange={(e) => updateParam('inUrl', e.target.value)}
                    placeholder={t('searchForm.inUrl.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.inUrl.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('intext') && (
                <div>
                  <label htmlFor="inText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.inText.label')}
                  </label>
                  <input
                    id="inText"
                    type="text"
                    value={searchParams.inText || ''}
                    onChange={(e) => updateParam('inText', e.target.value)}
                    placeholder={t('searchForm.inText.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.inText.description')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 匹配精度组 */}
          {isFeatureSupported('exact_match') && (
            <CollapsibleSection title={t('searchForm.matchPrecision.title')} icon="🎯">
              {isFeatureSupported('exact_match') && (
                <div>
                  <label htmlFor="exactMatches" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.exactMatch.label')} 🔥
                  </label>
                  <TagInput
                    tags={searchParams.exactMatches || []}
                    onChange={(tags) => updateParam('exactMatches', tags)}
                    placeholder={t('searchForm.exactMatch.placeholder') + t('searchForm.exactMatch.multipleHint')}
                    maxTags={5}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.exactMatch.description')} • {t('searchForm.exactMatch.hint')}
                  </p>
                </div>
              )}

              {isFeatureSupported('wildcard') && (
                <div>
                  <label htmlFor="wildcardQuery" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.wildcardQuery.label')}
                  </label>
                  <input
                    id="wildcardQuery"
                    type="text"
                    value={searchParams.wildcardQuery || ''}
                    onChange={(e) => updateParam('wildcardQuery', e.target.value)}
                    placeholder={t('searchForm.wildcardQuery.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.wildcardQuery.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('allintitle') && (
                <div>
                  <label htmlFor="allInTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.allInTitle.label')}
                  </label>
                  <input
                    id="allInTitle"
                    type="text"
                    value={searchParams.allInTitle || ''}
                    onChange={(e) => updateParam('allInTitle', e.target.value)}
                    placeholder={t('searchForm.allInTitle.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.allInTitle.description')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 逻辑运算组 */}
          {(isFeatureSupported('or_keywords') || isFeatureSupported('exclude')) && (
            <CollapsibleSection title={t('searchForm.logicalOperations.title')} icon="🔀">
              {isFeatureSupported('or_keywords') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.orKeywords.label')}
                  </label>
                  <TagInput
                    tags={searchParams.orKeywords || []}
                    onChange={(tags) => updateParam('orKeywords', tags)}
                    placeholder={t('searchForm.orKeywords.placeholder')}
                    maxTags={5}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.orKeywords.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('exclude') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.excludeWords.label')}
                  </label>
                  <TagInput
                    tags={searchParams.excludeWords || []}
                    onChange={(tags) => updateParam('excludeWords', tags)}
                    placeholder={t('searchForm.excludeWords.placeholder')}
                    maxTags={10}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.excludeWords.description')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 范围过滤组 */}
          {(isFeatureSupported('date_range') || isFeatureSupported('number_range')) && (
            <CollapsibleSection title={t('searchForm.rangeFiltering.title')} icon="📅">
              {isFeatureSupported('date_range') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.dateRange.label')}
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
                        placeholder={t('searchForm.dateRange.from')}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('searchForm.dateRange.from')}</p>
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
                        placeholder={t('searchForm.dateRange.to')}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('searchForm.dateRange.to')}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.dateRange.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('number_range') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.numberRange.label')}
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
                        placeholder={t('searchForm.numberRange.min')}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('searchForm.numberRange.min')}</p>
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
                        placeholder={t('searchForm.numberRange.max')}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('searchForm.numberRange.max')}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.numberRange.description')}
                  </p>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* 🔥 Reddit专属 - 板块筛选 */}
          {searchParams.engine === 'reddit' && (
            <CollapsibleSection title={t('searchForm.reddit.title')} icon="📋">
              <div>
                <label htmlFor="subreddits" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('searchForm.reddit.label')} 🔥
                </label>
                <TagInput
                  tags={searchParams.subreddits || []}
                  onChange={(tags) => updateParam('subreddits', tags)}
                  placeholder={t('searchForm.reddit.placeholder')}
                  maxTags={10}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('searchForm.reddit.description')} • {t('searchForm.reddit.hint')}
                </p>
              </div>
            </CollapsibleSection>
          )}

          {/* 🔥 GitHub专属 - 编程语言筛选 */}
          {searchParams.engine === 'github' && (
            <CollapsibleSection title={t('searchForm.github.title')} icon="💻">
              <div>
                <label htmlFor="languages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('searchForm.github.label')} 🔥
                </label>
                <TagInput
                  tags={searchParams.languages || []}
                  onChange={(tags) => updateParam('languages', tags)}
                  placeholder={t('searchForm.github.placeholder')}
                  maxTags={5}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('searchForm.github.description')} • {t('searchForm.github.hint')}
                </p>
              </div>
            </CollapsibleSection>
          )}

          {/* 🔥 Stack Overflow专属 - 标签筛选 */}
          {searchParams.engine === 'stackoverflow' && (
            <CollapsibleSection title={t('searchForm.stackoverflow.title')} icon="🏷️">
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('searchForm.stackoverflow.label')} 🔥
                </label>
                <TagInput
                  tags={searchParams.tags || []}
                  onChange={(tags) => updateParam('tags', tags)}
                  placeholder={t('searchForm.stackoverflow.placeholder')}
                  maxTags={10}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('searchForm.stackoverflow.description')} • {t('searchForm.stackoverflow.hint')}
                </p>
              </div>
            </CollapsibleSection>
          )}

          {/* 特殊功能组 */}
          {(isFeatureSupported('related') || isFeatureSupported('cache') || adapter.getLanguageOptions?.()) && (
            <CollapsibleSection title={t('searchForm.specialFeatures.title')} icon="🔧">
              {isFeatureSupported('related') && (
                <div>
                  <label htmlFor="relatedSite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.relatedSite.label')}
                  </label>
                  <input
                    id="relatedSite"
                    type="text"
                    value={searchParams.relatedSite || ''}
                    onChange={(e) => updateParam('relatedSite', e.target.value)}
                    placeholder={t('searchForm.relatedSite.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.relatedSite.description')}
                  </p>
                </div>
              )}

              {isFeatureSupported('cache') && (
                <div>
                  <label htmlFor="cacheSite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('searchForm.cacheSite.label')}
                  </label>
                  <input
                    id="cacheSite"
                    type="text"
                    value={searchParams.cacheSite || ''}
                    onChange={(e) => updateParam('cacheSite', e.target.value)}
                    placeholder={t('searchForm.cacheSite.placeholder')}
                    className="input"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('searchForm.cacheSite.description')}
                  </p>
                </div>
              )}

              {/* 🔥 动态语言选择器 - 根据适配器配置自动适配 */}
              {(() => {
                const languageConfig = adapter.getLanguageOptions?.()
                if (!languageConfig) return null

                return (
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t(languageConfig.label as any)}
                    </label>
                    <select
                      id="language"
                      value={searchParams.language || ''}
                      onChange={(e) => updateParam('language', e.target.value)}
                      className="input"
                    >
                      <option value="">{t(languageConfig.placeholder as any)}</option>
                      {languageConfig.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {t(option.label as any)}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {searchParams.engine === 'twitter' && t('searchForm.language.description.twitter')}
                      {searchParams.engine === 'github' && t('searchForm.language.description.github')}
                    </p>
                  </div>
                )
              })()}
            </CollapsibleSection>
          )}
        </div>
      )}
    </div>
  )
}
