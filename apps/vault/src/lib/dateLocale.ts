import { id, enUS } from 'date-fns/locale'
import type { Locale } from './i18n'

export function getDateLocale(locale: Locale) {
  return locale === 'en' ? enUS : id
}
