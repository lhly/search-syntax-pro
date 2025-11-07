import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Theme } from '@/types'

/**
 * 主题上下文接口
 */
interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/**
 * 主题提供者组件属性
 */
interface ThemeProviderProps {
  children: ReactNode
  storageKey?: string
  defaultTheme?: Theme
}

/**
 * 检测系统是否偏好深色主题
 */
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * 主题提供者组件
 *
 * 功能：
 * 1. 从 chrome.storage 加载用户主题设置
 * 2. 自动跟随系统主题（当设置为 'auto' 时）
 * 3. 应用主题到 DOM (document.documentElement)
 * 4. 监听系统主题变化并实时响应
 */
export function ThemeProvider({
  children,
  storageKey = 'user_settings',
  defaultTheme = 'auto'
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(getSystemTheme())
  const [mounted, setMounted] = useState(false)

  // 计算实际应用的主题
  const effectiveTheme: 'light' | 'dark' = theme === 'auto' ? systemTheme : theme

  /**
   * 从 chrome.storage 加载主题设置
   */
  useEffect(() => {
    chrome.storage.local.get([storageKey], (result) => {
      if (result[storageKey]?.theme) {
        setThemeState(result[storageKey].theme)
      }
      setMounted(true)
    })
  }, [storageKey])

  /**
   * 监听系统主题变化
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    // 现代浏览器使用 addEventListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // 兼容旧版浏览器
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  /**
   * 应用主题到 DOM
   */
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // 移除所有主题类
    root.classList.remove('light', 'dark')

    // 添加当前主题类
    root.classList.add(effectiveTheme)

    // 同时设置 data 属性（可选，方便调试）
    root.setAttribute('data-theme', effectiveTheme)

    // 打印日志（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 Theme applied:', {
        setting: theme,
        system: systemTheme,
        effective: effectiveTheme
      })
    }
  }, [theme, effectiveTheme, systemTheme, mounted])

  /**
   * 监听 storage 变化（跨页面同步）
   */
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      namespace: string
    ) => {
      if (namespace === 'local' && changes[storageKey]?.newValue?.theme) {
        setThemeState(changes[storageKey].newValue.theme)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [storageKey])

  /**
   * 更新主题设置
   * 注意：这里只更新本地状态，实际保存到 storage 由 Options 页面负责
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    effectiveTheme,
    setTheme
  }

  // 避免闪烁：在首次加载前不渲染
  if (!mounted) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * 使用主题的 Hook
 *
 * @returns {ThemeContextType} 主题上下文对象
 * @throws {Error} 如果在 ThemeProvider 外部使用
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, effectiveTheme, setTheme } = useTheme()
 *
 *   return (
 *     <div>
 *       <p>当前主题设置: {theme}</p>
 *       <p>实际应用主题: {effectiveTheme}</p>
 *       <button onClick={() => setTheme('dark')}>切换到深色</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用')
  }

  return context
}

/**
 * 主题切换快捷 Hook
 *
 * @returns {() => void} 切换主题的函数
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const toggleTheme = useThemeToggle()
 *   return <button onClick={toggleTheme}>切换主题</button>
 * }
 * ```
 */
export function useThemeToggle(): () => void {
  const { theme, setTheme } = useTheme()

  return () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('auto')
    } else {
      setTheme('light')
    }
  }
}
