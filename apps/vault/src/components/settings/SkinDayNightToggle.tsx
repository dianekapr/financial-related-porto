'use client'
import type { SkinMode } from '@/lib/theme/skins'

export default function SkinDayNightToggle({ mode, onChange }: { mode: SkinMode; onChange: (mode: SkinMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-vault-surface border border-vault-border rounded-lg p-0.5">
      {(['night', 'day'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-all
            ${mode === m ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-text-dim'}`}
          title={m === 'night' ? 'Night' : 'Day'}
        >
          {m === 'night' ? '☾' : '☀'}
        </button>
      ))}
    </div>
  )
}
