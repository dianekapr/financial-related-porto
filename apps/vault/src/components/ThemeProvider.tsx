'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { SKINS, DEFAULT_SKIN, type SkinId, type SkinMode } from '@/lib/theme/skins'

const STORAGE_KEY = 'vault-theme'

function isSkinId(value: string | null): value is SkinId {
  return !!value && SKINS.some(s => s.id === value)
}

interface ThemeContextValue {
  skinId: SkinId
  familyId: string
  mode: SkinMode
  setSkin: (id: SkinId) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  skinId: DEFAULT_SKIN,
  familyId: SKINS.find(s => s.id === DEFAULT_SKIN)!.familyId,
  mode: SKINS.find(s => s.id === DEFAULT_SKIN)!.mode,
  setSkin: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// Inline script that runs before hydration so the saved skin applies
// immediately on load instead of flashing the default skin first. Values
// from the old accent-only system (e.g. "gold", "ocean") won't match any
// SkinId and are simply ignored, falling back to the default.
export const themeInitScript = `
try {
  var t = localStorage.getItem('${STORAGE_KEY}');
  var known = ${JSON.stringify(SKINS.map(s => s.id))};
  if (t && known.indexOf(t) !== -1) document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [skinId, setSkinState] = useState<SkinId>(DEFAULT_SKIN)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isSkinId(stored)) setSkinState(stored)
  }, [])

  const setSkin = (id: SkinId) => {
    setSkinState(id)
    document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  const skin = SKINS.find(s => s.id === skinId)!

  return (
    <ThemeContext.Provider value={{ skinId, familyId: skin.familyId, mode: skin.mode, setSkin }}>
      {children}
    </ThemeContext.Provider>
  )
}
