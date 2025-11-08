import { useState, ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * 可折叠区域组件
 * 用于组织高级语法选项的分组展示
 */
export function CollapsibleSection({
  title,
  icon = '📋',
  defaultOpen = false,
  children
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 标题栏 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 内容区 */}
      {isOpen && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-900 animate-slide-up">
          {children}
        </div>
      )}
    </div>
  )
}
