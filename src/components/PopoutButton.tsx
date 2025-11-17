import { useState } from 'react'
import { WindowManager } from '@/services/window-manager'
import { useTranslation } from '@/i18n'

interface PopoutButtonProps {
  className?: string
}

/**
 * Popout Button Component
 *
 * 在 popup 窗口中显示的"弹出到新窗口"按钮
 * 点击后将当前 popup 内容在独立窗口中打开
 */
export function PopoutButton({ className = '' }: PopoutButtonProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)

  // 只在 popup 模式下显示此按钮
  if (WindowManager.isDetachedWindow()) {
    return null
  }

  const handlePopout = async () => {
    try {
      setIsLoading(true)
      await WindowManager.popoutToDetachedWindow()
    } catch (error) {
      console.error('弹出窗口失败:', error)
      setIsLoading(false)
      alert(t('popout.openFailedAlert'))
    }
  }

  return (
    <button
      onClick={handlePopout}
      disabled={isLoading}
      className={`
        popout-button
        flex items-center justify-center
        w-8 h-8
        rounded-md
        text-white hover:bg-white/20
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={t('popup.popoutButtonTooltip')}
      aria-label={t('popup.popoutButtonTitle')}
    >
      {isLoading ? (
        // 加载动画
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        // 弹出窗口图标 (使用 SVG)
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </button>
  )
}
