import { cookies } from 'next/headers'
import { LOCALE_COOKIE, DEFAULT_LOCALE, type Locale } from './i18n'

export function getServerLocale(): Locale {
  const raw = cookies().get(LOCALE_COOKIE)?.value
  return raw === 'en' || raw === 'id' ? raw : DEFAULT_LOCALE
}
