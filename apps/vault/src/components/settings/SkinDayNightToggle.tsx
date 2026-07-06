'use client'
import type { SkinMode } from '@/lib/theme/skins'
import { Moon, Sun } from 'lucide-react'

export default function SkinDayNightToggle({ mode, onChange }: { mode: SkinMode; onChange: (mode: SkinMode) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-vault-surface border border-vault-border rounded-lg p-0.5">
      {(['night', 'day'] as const).map(m => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`w-7 h-7 flex items-center justify-center rounded-md transition-all
            ${mode === m ? 'bg-vault-accent/15 text-vault-accent' : 'text-vault-muted hover:text-vault-text-dim'}`}
          title={m === 'night' ? 'Night' : 'Day'}
        >
          {m === 'night' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      ))}
    </div>
  )
}
