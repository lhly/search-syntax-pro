import { useState, KeyboardEvent } from 'react'
import { useTranslation } from '@/i18n'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

/**
 * 标签输入组件
 * 支持添加、删除多个标签,用于排除关键词和OR逻辑等场景
 */
export function TagInput({ tags, onChange, placeholder, maxTags = 10 }: TagInputProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')

  // 添加标签
  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) return
    if (tags.includes(trimmedValue)) return
    if (tags.length >= maxTags) return

    onChange([...tags, trimmedValue])
    setInputValue('')
  }

  // 删除标签
  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    onChange(newTags)
  }

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // 如果输入框为空且按退格键,删除最后一个标签
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="space-y-2">
      {/* 标签显示区 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                aria-label={`${t('tagInput.removeTagAriaLabel')}: ${tag}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length >= maxTags ? t('tagInput.maxLimitReached', { max: maxTags }) : (placeholder || t('tagInput.defaultPlaceholder'))}
          disabled={tags.length >= maxTags}
          className="input w-full"
        />
        {tags.length < maxTags && inputValue && (
          <button
            type="button"
            onClick={addTag}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            aria-label={t('tagInput.addTagAriaLabel')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {/* 标签计数 */}
      {tags.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('tagInput.statsText', { count: tags.length, max: maxTags })}
        </p>
      )}
    </div>
  )
}
