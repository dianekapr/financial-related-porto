// Single source of truth for every Vault Skin. Add a new skin by adding an
// entry to SKINS (and, for a new family, one to SKIN_FAMILIES) — the CSS
// (ThemeStyleTag) and the Settings gallery both generate from this data.

export type SkinMode = 'night' | 'day'

export interface SkinColors {
  bg: string
  surface: string
  card: string
  border: string
  accent: string
  accentLight: string
  accentHover: string
  accentContrast: string
  text: string
  textDim: string
  muted: string
  success: string
  warning: string
  danger: string
  info: string
  shadow: string
}

export interface SkinFamily {
  id: string
  label: string
  emoji: string
  tagline: string
}

export interface Skin {
  id: string
  familyId: string
  mode: SkinMode
  label: string
  colors: SkinColors
}

export const SKIN_FAMILIES: SkinFamily[] = [
  { id: 'gold', label: 'Gold Reserve', emoji: '🏆', tagline: 'Luxury finance — charcoal with gold highlights' },
  { id: 'sakura', label: 'Sakura Bloom', emoji: '🌸', tagline: 'Soft, elegant pink' },
  { id: 'ocean', label: 'Ocean Deep', emoji: '🌊', tagline: 'Professional blue' },
  { id: 'forest', label: 'Emerald Forest', emoji: '🌿', tagline: 'Calm green' },
  { id: 'lavender', label: 'Lavender Mist', emoji: '💜', tagline: 'Soft purple aesthetic' },
  { id: 'crimson', label: 'Crimson Vault', emoji: '❤️', tagline: 'Premium crimson red' },
  { id: 'arctic', label: 'Arctic Ice', emoji: '🧊', tagline: 'Modern cyan' },
  { id: 'pearl', label: 'Pearl', emoji: '🤍', tagline: 'Minimal monochrome' },
]

const FAMILY_COLORS: Record<string, Record<SkinMode, SkinColors>> = {
  gold: {
    night: {
      bg: '#0A0A0A', surface: '#111111', card: '#1A1A1A', border: '#2A2A2A',
      accent: '#C9A84C', accentLight: '#E8C96A', accentHover: '#B8973E', accentContrast: '#14110A',
      text: '#E8E8E8', textDim: '#888888', muted: '#555555',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#FAF6EC', surface: '#FFFFFF', card: '#FFFDF7', border: '#E8DCC0',
      accent: '#B08A2E', accentLight: '#C9A84C', accentHover: '#96741F', accentContrast: '#241D0A',
      text: '#2A2412', textDim: '#6B5F45', muted: '#A89968',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB',
      shadow: 'rgba(120,100,40,0.15)',
    },
  },
  sakura: {
    night: {
      bg: '#100509', surface: '#180A10', card: '#241019', border: '#351E29',
      accent: '#EC4899', accentLight: '#F472B6', accentHover: '#D6407F', accentContrast: '#2A0E1C',
      text: '#F5E5EC', textDim: '#A87C93', muted: '#6B4A58',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#FDF2F6', surface: '#FFFFFF', card: '#FFF8FA', border: '#F3D9E4',
      accent: '#D6427F', accentLight: '#EC4899', accentHover: '#B93268', accentContrast: '#FFFFFF',
      text: '#3A1626', textDim: '#8C5C74', muted: '#C99CB0',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB',
      shadow: 'rgba(150,60,100,0.12)',
    },
  },
  ocean: {
    night: {
      bg: '#050B14', surface: '#0A1420', card: '#101D2E', border: '#1E3145',
      accent: '#3B82F6', accentLight: '#60A5FA', accentHover: '#2563EB', accentContrast: '#FFFFFF',
      text: '#E5EDF5', textDim: '#7C93A8', muted: '#4A5A6B',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#38BDF8',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#EFF6FC', surface: '#FFFFFF', card: '#F7FBFE', border: '#D3E6F5',
      accent: '#2563EB', accentLight: '#3B82F6', accentHover: '#1D4ED8', accentContrast: '#FFFFFF',
      text: '#0B2438', textDim: '#4E7089', muted: '#9AB8CC',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#0284C7',
      shadow: 'rgba(20,80,140,0.12)',
    },
  },
  forest: {
    night: {
      bg: '#05100A', surface: '#0A1810', card: '#10241A', border: '#1E3527',
      accent: '#22C55E', accentLight: '#4ADE80', accentHover: '#16A34A', accentContrast: '#06170E',
      text: '#E5F5EC', textDim: '#7CA891', muted: '#4A6055',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#EFF9F2', surface: '#FFFFFF', card: '#F6FCF8', border: '#D3ECDC',
      accent: '#15803D', accentLight: '#22C55E', accentHover: '#116430', accentContrast: '#FFFFFF',
      text: '#0B2415', textDim: '#4E7A5E', muted: '#9AC7AC',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB',
      shadow: 'rgba(20,100,60,0.12)',
    },
  },
  lavender: {
    night: {
      bg: '#0A0714', surface: '#120D20', card: '#1C1530', border: '#2D2145',
      accent: '#8B5CF6', accentLight: '#A78BFA', accentHover: '#7C3AED', accentContrast: '#FFFFFF',
      text: '#ECE5F5', textDim: '#937CA8', muted: '#5B4A6B',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#F5F1FC', surface: '#FFFFFF', card: '#FAF8FE', border: '#E1D6F5',
      accent: '#7C3AED', accentLight: '#8B5CF6', accentHover: '#6D28D9', accentContrast: '#FFFFFF',
      text: '#241832', textDim: '#6E5A8C', muted: '#B8A6D6',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB',
      shadow: 'rgba(100,60,160,0.12)',
    },
  },
  crimson: {
    night: {
      bg: '#120505', surface: '#1C0808', card: '#2A0F0F', border: '#3F1A1A',
      accent: '#DC2626', accentLight: '#EF4444', accentHover: '#B91C1C', accentContrast: '#FFFFFF',
      text: '#F5E5E5', textDim: '#A87C7C', muted: '#6B4A4A',
      success: '#22C55E', warning: '#F5A623', danger: '#F0553D', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.5)',
    },
    day: {
      bg: '#FBF1EF', surface: '#FFFFFF', card: '#FFF7F6', border: '#F3D8D3',
      accent: '#B91C1C', accentLight: '#DC2626', accentHover: '#991515', accentContrast: '#FFFFFF',
      text: '#2E0F0D', textDim: '#8C625C', muted: '#D6B3AC',
      success: '#16A34A', warning: '#D97706', danger: '#E11D48', info: '#2563EB',
      shadow: 'rgba(150,40,30,0.12)',
    },
  },
  arctic: {
    night: {
      bg: '#050F12', surface: '#0A1A1E', card: '#10262B', border: '#1E3B42',
      accent: '#22D3EE', accentLight: '#67E8F9', accentHover: '#0891B2', accentContrast: '#04191C',
      text: '#E3F6FA', textDim: '#7EA8B0', muted: '#4A6C73',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#22D3EE',
      shadow: 'rgba(0,0,0,0.45)',
    },
    day: {
      bg: '#EEFBFD', surface: '#FFFFFF', card: '#F5FDFE', border: '#CDEEF3',
      accent: '#0E7490', accentLight: '#22D3EE', accentHover: '#0C5D73', accentContrast: '#FFFFFF',
      text: '#052E33', textDim: '#4E7D85', muted: '#9FD3DC',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#0891B2',
      shadow: 'rgba(10,120,140,0.12)',
    },
  },
  pearl: {
    night: {
      bg: '#0C0C0D', surface: '#131314', card: '#1C1C1E', border: '#2E2E31',
      accent: '#D4D4D8', accentLight: '#F4F4F5', accentHover: '#A1A1AA', accentContrast: '#0C0C0D',
      text: '#ECECEE', textDim: '#8A8A90', muted: '#55555A',
      success: '#22C55E', warning: '#F5A623', danger: '#E03E3E', info: '#3B82F6',
      shadow: 'rgba(0,0,0,0.5)',
    },
    day: {
      bg: '#F7F7F8', surface: '#FFFFFF', card: '#FCFCFD', border: '#E3E3E6',
      accent: '#3F3F46', accentLight: '#52525B', accentHover: '#27272A', accentContrast: '#FFFFFF',
      text: '#1B1B1D', textDim: '#6B6B70', muted: '#B4B4B9',
      success: '#16A34A', warning: '#D97706', danger: '#DC2626', info: '#2563EB',
      shadow: 'rgba(0,0,0,0.08)',
    },
  },
}

export const SKINS: Skin[] = SKIN_FAMILIES.flatMap(family =>
  (['night', 'day'] as const).map(mode => ({
    id: `${family.id}-${mode}`,
    familyId: family.id,
    mode,
    label: `${family.label} (${mode === 'night' ? 'Night' : 'Day'})`,
    colors: FAMILY_COLORS[family.id][mode],
  }))
)

export type SkinId = typeof SKINS[number]['id']

export const DEFAULT_SKIN: SkinId = 'gold-night'

export function getSkin(id: string): Skin | undefined {
  return SKINS.find(s => s.id === id)
}

export function skinIdFor(familyId: string, mode: SkinMode): SkinId {
  return `${familyId}-${mode}` as SkinId
}
