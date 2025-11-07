import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Language } from '@/types'
import { translate } from './translations'

interface TranslationContextValue {
  language: Language
  t: (key: string, variables?: Record<string, string | number>, fallback?: string) => string
}

const defaultLanguage: Language = 'zh-CN'

const TranslationContext = createContext<TranslationContextValue>({
  language: defaultLanguage,
  t: (key, variables, fallback) => translate(defaultLanguage, key, variables, fallback)
})

interface TranslationProviderProps {
  language: Language
  children: ReactNode
}

export function TranslationProvider({ language, children }: TranslationProviderProps) {
  const value = useMemo<TranslationContextValue>(() => ({
    language,
    t: (key, variables, fallback) => translate(language, key, variables, fallback)
  }), [language])

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}

export { translate } from './translations'
