import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LANGUAGE_OPTIONS, LanguageCode, getLanguageLabel, translate } from '@/app/_utils/localization'

const LANGUAGE_STORAGE_KEY = 'selected_app_language'

type LanguageContextType = {
  language: LanguageCode
  languageLabel: string
  languageOptions: typeof LANGUAGE_OPTIONS
  setLanguage: (language: LanguageCode) => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en')

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (!saved) return
        const matched = LANGUAGE_OPTIONS.find((option) => option.code === saved)
        if (matched) {
          setLanguageState(matched.code)
        }
      })
      .catch(() => undefined)
  }, [])

  const setLanguage = useCallback(async (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage)
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
  }, [])

  const value = useMemo(
    () => ({
      language,
      languageLabel: getLanguageLabel(language),
      languageOptions: LANGUAGE_OPTIONS,
      setLanguage,
      t: (key: string) => translate(language, key),
    }),
    [language, setLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
