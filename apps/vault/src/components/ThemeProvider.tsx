'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'gold', label: 'Gold', accent: '#C9A84C' },
  { id: 'ocean', label: 'Ocean', accent: '#3B82F6' },
  { id: 'emerald', label: 'Emerald', accent: '#22C55E' },
  { id: 'rose', label: 'Rose', accent: '#EC4899' },
  { id: 'violet', label: 'Violet', accent: '#8B5CF6' },
] as const

export type ThemeId = typeof THEMES[number]['id']
const STORAGE_KEY = 'vault-theme'
const DEFAULT_THEME: ThemeId = 'gold'

const ThemeContext = createContext<{ theme: ThemeId; setTheme: (t: ThemeId) => void }>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

// Inline script that runs before hydration so the saved theme applies
// immediately on load instead of flashing the default gold palette first.
export const themeInitScript = `
try {
  var t = localStorage.getItem('${STORAGE_KEY}');
  if (t) document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    if (stored && THEMES.some(t => t.id === stored)) {
      setThemeState(stored)
    }
  }, [])

  const setTheme = (t: ThemeId) => {
    setThemeState(t)
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem(STORAGE_KEY, t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}
