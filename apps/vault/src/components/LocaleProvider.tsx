'use client'
import { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { t as translate, LOCALE_COOKIE, type Locale, type TranslationKey } from '../lib/i18n'

const LocaleContext = createContext<{
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}>({
  locale: 'id',
  setLocale: () => {},
  t: key => translate('id', key),
})

export function useLocale() {
  return useContext(LocaleContext)
}

export default function LocaleProvider({
  initialLocale, children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const router = useRouter()
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000`
    router.refresh()
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: key => translate(locale, key) }}>
      {children}
    </LocaleContext.Provider>
  )
}
