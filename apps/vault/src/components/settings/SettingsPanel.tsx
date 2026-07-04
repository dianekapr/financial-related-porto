'use client'
import { useTheme, THEMES } from '../ThemeProvider'
import { useLocale } from '../LocaleProvider'
import { LOCALES, type Locale } from '../../lib/i18n'
import Select from '../ui/Select'

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useLocale()

  return (
    <div className="space-y-4">
      {/* Theme */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <p className="font-display text-vault-gold tracking-widest text-lg mb-4">{t('settingsTheme')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {THEMES.map(th => (
            <button
              key={th.id}
              onClick={() => setTheme(th.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all
                ${theme === th.id ? 'border-vault-gold bg-vault-gold/5' : 'border-vault-border hover:border-vault-muted'}`}
            >
              <span
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: th.accent, boxShadow: theme === th.id ? `0 0 0 3px var(--vault-card), 0 0 0 5px ${th.accent}` : 'none' }}
              />
              <span className="text-xs font-mono text-vault-text-dim">{th.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-vault-card border border-vault-border rounded-2xl p-5">
        <p className="font-display text-vault-gold tracking-widest text-lg mb-4">{t('settingsLanguage')}</p>
        <Select
          value={locale}
          onChange={v => setLocale(v as Locale)}
          options={LOCALES.map(l => ({ value: l.id, label: l.label }))}
        />
      </div>
    </div>
  )
}
