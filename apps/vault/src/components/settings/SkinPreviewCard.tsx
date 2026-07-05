'use client'
import type { SkinId } from '@/lib/theme/skins'

// A decorative miniature "screenshot" of the real dashboard, rendered with
// sample data only. Wrapping it in data-theme={skinId} scopes that skin's
// CSS variables to just this subtree (see ThemeStyleTag), so it's styled
// with the exact same bg-vault-*/text-vault-* classes as the real app —
// no separate preview-only color logic to keep in sync.
const BARS = [40, 65, 50, 80, 60, 90]

export default function SkinPreviewCard({ skinId, active, onClick }: { skinId: SkinId; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-theme={skinId}
      className={`w-full rounded-xl overflow-hidden border-2 transition-all text-left bg-vault-bg shadow-vault
        ${active ? 'border-vault-accent' : 'border-vault-border hover:border-vault-muted'}`}
    >
      <div className="flex h-40">
        {/* Mini sidebar */}
        <div className="w-8 flex-shrink-0 bg-vault-surface border-r border-vault-border flex flex-col items-center gap-2 py-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-vault-accent" />
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-sm bg-vault-muted" />
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 min-w-0 p-2.5 space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="h-1.5 w-10 rounded-full bg-vault-text-dim/40" />
            <span className="w-3 h-3 rounded-full bg-vault-accent/30 border border-vault-accent" />
          </div>

          {/* Summary widgets */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="bg-vault-card border border-vault-border rounded-lg p-1.5">
              <span className="block h-1 w-6 rounded-full bg-vault-text-dim/40 mb-1.5" />
              <span className="block text-[9px] font-mono font-semibold text-vault-accent">+2.4jt</span>
            </div>
            <div className="bg-vault-card border border-vault-border rounded-lg p-1.5">
              <span className="block h-1 w-6 rounded-full bg-vault-text-dim/40 mb-1.5" />
              <span className="block text-[9px] font-mono font-semibold text-vault-danger">-980rb</span>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-vault-card border border-vault-border rounded-lg p-1.5 flex items-end gap-1 h-9">
            {BARS.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${h}%`, backgroundColor: i === BARS.length - 1 ? 'var(--vault-accent)' : 'var(--vault-accent)', opacity: i === BARS.length - 1 ? 1 : 0.4 }}
              />
            ))}
          </div>

          {/* Transaction rows */}
          <div className="space-y-1">
            {[{ c: 'var(--vault-accent)' }, { c: 'var(--vault-danger)' }].map((row, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-vault-card border border-vault-border rounded-md px-1.5 py-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.c }} />
                <span className="h-1 flex-1 rounded-full bg-vault-text-dim/30" />
                <span className="h-1 w-4 rounded-full bg-vault-text-dim/50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}
