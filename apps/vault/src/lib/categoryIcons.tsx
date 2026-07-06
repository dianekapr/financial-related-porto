import type { CSSProperties } from 'react'
import { Utensils, Car, ShoppingBag, Clapperboard, Pill, Receipt, Banknote, Laptop, Tag, Wallet, type LucideIcon } from 'lucide-react'

// Keys match the `icon` column seeded by the signup trigger in
// packages/supabase/schema.sql — keep the two in sync.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Utensils, Car, ShoppingBag, Clapperboard, Pill, Receipt, Banknote, Laptop, Tag,
}

export function CategoryIcon({ icon, className, style }: { icon?: string | null; className?: string; style?: CSSProperties }) {
  const Icon = (icon && CATEGORY_ICONS[icon]) || Wallet
  return <Icon className={className} style={style} />
}
