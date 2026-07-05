'use client'
import { useLocale } from '../LocaleProvider'
import { LOCALES, type Locale } from '../../lib/i18n'
import Select from '../ui/Select'
import SkinGallery from './SkinGallery'

export default function SettingsPanel() {
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="space-y-4">
      {/* Vault Skins */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <p className="font-display text-vault-accent tracking-widest text-lg mb-1">{t('settingsTheme')}</p>
        <p className="text-vault-text-dim text-xs font-mono mb-4">{t('settingsThemeHint')}</p>
        <SkinGallery />
      </div>

      {/* Language */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <p className="font-display text-vault-accent tracking-widest text-lg mb-4">{t('settingsLanguage')}</p>
        <Select
          value={locale}
          onChange={v => setLocale(v as Locale)}
          options={LOCALES.map(l => ({ value: l.id, label: l.label }))}
        />
      </div>
    </div>
  )
}
