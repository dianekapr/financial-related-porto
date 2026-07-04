import SettingsPanel from '@/components/settings/SettingsPanel'
import { t } from '@/lib/i18n'
import { getServerLocale } from '@/lib/getServerLocale'

export default function SettingsPage() {
  const locale = getServerLocale()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl md:text-5xl text-vault-text tracking-wider mt-1">{t(locale, 'settingsTitle')}</h1>
      </div>
      <SettingsPanel />
    </div>
  )
}
