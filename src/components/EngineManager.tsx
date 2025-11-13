/**
 * 搜索引擎管理组件
 * 支持拖拽排序、显示/隐藏切换、重置等功能
 */

import { useState, useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EnginePreference, SearchEngine } from '@/types'
import { EnginePreferenceService } from '@/services/engine-preference'
import { useTranslation } from '@/i18n'

interface EngineManagerProps {
  /** 当前的引擎偏好设置 */
  preferences: EnginePreference[]
  /** 偏好设置变化回调 */
  onChange: (preferences: EnginePreference[]) => void
}

/**
 * 可拖拽的单个引擎项组件
 */
interface SortableEngineItemProps {
  preference: EnginePreference
  onToggleVisibility: (engine: SearchEngine, visible: boolean) => void
  isDefault: boolean
}

function SortableEngineItem({ preference, onToggleVisibility, isDefault }: SortableEngineItemProps) {
  const { t } = useTranslation()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: preference.engine })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  const engineName = EnginePreferenceService.getEngineName(preference.engine)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 sm:gap-4 p-3 sm:p-4
        bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700
        rounded-lg
        ${isDragging ? 'shadow-lg z-10' : 'shadow-sm'}
        transition-shadow
      `}
    >
      {/* 拖拽手柄 */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 sm:p-2 -ml-1 sm:-ml-2 flex-shrink-0"
        aria-label={t('options.engineManager.dragHandle', {}, 'Drag to reorder')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none sm:w-5 sm:h-5"
        >
          <circle cx="7" cy="5" r="1.5" />
          <circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" />
          <circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" />
          <circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>

      {/* 可见性开关 */}
      <label className="flex items-center gap-3 flex-1 cursor-pointer min-w-0">
        <input
          type="checkbox"
          checked={preference.visible}
          onChange={(e) => onToggleVisibility(preference.engine, e.target.checked)}
          className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
        />

        {/* 引擎信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium truncate ${preference.visible ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'}`}>
              {engineName}
            </span>
            {/* 默认引擎标签 (第一个可见引擎) */}
            {isDefault && preference.visible && (
              <span className="text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded font-medium whitespace-nowrap flex-shrink-0">
                {t('options.engineManager.default', {}, '默认')}
              </span>
            )}
            {/* 已隐藏标签 */}
            {!preference.visible && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded whitespace-nowrap flex-shrink-0">
                {t('options.engineManager.hidden', {}, 'Hidden')}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
            {preference.engine}
          </span>
        </div>
      </label>

      {/* 排序指示器 */}
      <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-600 font-mono w-6 sm:w-8 text-right flex-shrink-0">
        #{preference.order + 1}
      </span>
    </div>
  )
}

/**
 * 引擎管理器主组件
 */
export function EngineManager({ preferences, onChange }: EngineManagerProps) {
  const { t } = useTranslation()
  const [localPreferences, setLocalPreferences] = useState(preferences)
  const [isExpanded, setIsExpanded] = useState(true) // 折叠状态，默认展开

  // 同步外部 preferences 到本地状态（防止storage异步加载后覆盖用户操作）
  useEffect(() => {
    setLocalPreferences(preferences)
  }, [preferences])

  // 计算默认引擎 (第一个可见引擎)
  const defaultEngine = useMemo(() =>
    EnginePreferenceService.getDefaultEngine(localPreferences),
    [localPreferences]
  )

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // 移动8px后才激活拖拽，避免误触
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    setLocalPreferences((items) => {
      const oldIndex = items.findIndex((item) => item.engine === active.id)
      const newIndex = items.findIndex((item) => item.engine === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex)

      // 更新order值
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index
      }))

      onChange(updatedItems)
      return updatedItems
    })
  }

  // 切换可见性
  const handleToggleVisibility = (engine: SearchEngine, visible: boolean) => {
    const updated = EnginePreferenceService.toggleVisibility(
      localPreferences,
      engine,
      visible
    )

    if (updated !== localPreferences) {
      setLocalPreferences(updated)
      onChange(updated)
    }
  }

  // 重置为默认
  const handleReset = () => {
    if (confirm(t('options.engineManager.confirmReset', {}, 'Reset to default engine order and visibility?'))) {
      const defaults = EnginePreferenceService.resetToDefaults()
      setLocalPreferences(defaults)
      onChange(defaults)
    }
  }

  // 显示所有引擎
  const handleShowAll = () => {
    const updated = localPreferences.map(pref => ({ ...pref, visible: true }))
    setLocalPreferences(updated)
    onChange(updated)
  }

  // 统计信息
  const visibleCount = localPreferences.filter(p => p.visible).length
  const totalCount = localPreferences.length

  return (
    <div className="space-y-4">
      {/* 标题和折叠按钮 - 响应式布局 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate max-w-full sm:max-w-none">
          {t('options.sections.engineManagement', {}, '搜索引擎管理')}
        </h2>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? t('options.engineManager.collapse', {}, 'Collapse') : t('options.engineManager.expand', {}, 'Expand')}
        >
          <span className="text-sm font-medium whitespace-nowrap">
            {isExpanded ? t('options.engineManager.collapse', {}, '收起') : t('options.engineManager.expand', {}, '展开')}
          </span>
          <svg
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 可折叠内容区域 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t('options.engineManager.stats', { visible: visibleCount, total: totalCount }, `Showing ${visibleCount} of ${totalCount} engines`)}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleShowAll}
            disabled={visibleCount === totalCount}
            className="btn btn-ghost text-sm"
          >
            {t('options.engineManager.showAll', {}, 'Show All')}
          </button>

          <button
            onClick={handleReset}
            className="btn btn-ghost text-sm"
          >
            {t('options.engineManager.reset', {}, 'Reset')}
          </button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="text-blue-600 dark:text-blue-400">ℹ️</span>
          <div className="flex-1 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">
              {t('options.engineManager.helpTitle', {}, 'How to use:')}
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
              <li>{t('options.engineManager.helpDrag', {}, 'Drag the handle to reorder engines')}</li>
              <li>{t('options.engineManager.helpToggle', {}, 'Click checkbox to show/hide engines')}</li>
              <li>{t('options.engineManager.helpMinimum', {}, 'At least one engine must remain visible')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 拖拽列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localPreferences.map(p => p.engine)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {localPreferences.map((pref) => (
              <SortableEngineItem
                key={pref.engine}
                preference={pref}
                onToggleVisibility={handleToggleVisibility}
                isDefault={pref.engine === defaultEngine}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
        </div>
      </div>
    </div>
  )
}
