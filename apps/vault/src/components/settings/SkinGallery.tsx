'use client'
import { useState } from 'react'
import { Trophy, Flower2, Waves, Trees, Sparkles, Heart, Snowflake, Gem, type LucideIcon } from 'lucide-react'
import { useTheme } from '../ThemeProvider'
import { SKIN_FAMILIES, skinIdFor, type SkinMode } from '@/lib/theme/skins'
import SkinPreviewCard from './SkinPreviewCard'
import SkinDayNightToggle from './SkinDayNightToggle'

const FAMILY_ICONS: Record<string, LucideIcon> = { Trophy, Flower2, Waves, Trees, Sparkles, Heart, Snowflake, Gem }

export default function SkinGallery() {
  const { skinId, familyId: activeFamilyId, mode: activeMode, setSkin } = useTheme()

  // Each family card previews its own mode independently of the applied
  // skin, defaulting to whichever mode is currently live for that family.
  const [previewModes, setPreviewModes] = useState<Record<string, SkinMode>>(() =>
    Object.fromEntries(SKIN_FAMILIES.map(f => [f.id, f.id === activeFamilyId ? activeMode : 'night']))
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {SKIN_FAMILIES.map(family => {
        const mode = previewModes[family.id]
        const previewSkinId = skinIdFor(family.id, mode)
        const isActive = skinId === previewSkinId
        const Icon = FAMILY_ICONS[family.icon]

        return (
          <div key={family.id} className="bg-vault-card border border-vault-border rounded-2xl p-3 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-vault-text flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{family.label}</span>
                </p>
                <p className="text-[11px] text-vault-text-dim font-mono mt-0.5 leading-tight">{family.tagline}</p>
              </div>
              <SkinDayNightToggle
                mode={mode}
                onChange={m => setPreviewModes(prev => ({ ...prev, [family.id]: m }))}
              />
            </div>

            <SkinPreviewCard
              skinId={previewSkinId}
              active={isActive}
              onClick={() => setSkin(previewSkinId)}
            />
          </div>
        )
      })}
    </div>
  )
}
