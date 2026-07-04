'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import Image from 'next/image'
import type { Profile } from '@portfolio/supabase'
import { useRouter } from 'next/navigation'
import { useLocale } from './LocaleProvider'

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()

  const NAV = [
    { href: '/dashboard', icon: '◈', label: t('nav') },
    { href: '/dashboard/transactions', icon: '↕', label: t('navTransactions') },
    { href: '/dashboard/wallets', icon: '▣', label: t('navWallets') },
    { href: '/dashboard/budget', icon: '◎', label: t('navBudget') },
    { href: '/dashboard/analytics', icon: '▲', label: t('navAnalytics') },
    { href: '/dashboard/settings', icon: '⚙', label: t('navSettings') },
  ]

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col items-center w-20 min-h-dvh bg-vault-surface border-r border-vault-border py-6 gap-6 fixed left-0 top-0 z-40">
      {/* Logo */}
      <Link href="/dashboard" className="font-display text-vault-gold text-2xl tracking-widest">V</Link>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 mt-4">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl transition-all
                ${active
                  ? 'bg-vault-gold/15 text-vault-gold'
                  : 'text-vault-muted hover:text-vault-text hover:bg-vault-card'
                }`}
            >
              {item.icon}
            </Link>
          )
        })}
      </nav>

      {/* Profile & logout */}
      <div className="flex flex-col items-center gap-3">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="avatar" width={36} height={36} className="rounded-full ring-2 ring-vault-border" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-vault-gold/20 flex items-center justify-center text-vault-gold text-sm font-mono">
            {profile?.full_name?.[0] ?? '?'}
          </div>
        )}
        <button onClick={signOut} title={t('logout')} className="w-9 h-9 flex items-center justify-center text-vault-muted hover:text-vault-red transition-colors text-lg">
          ⏻
        </button>
      </div>
    </aside>
  )
}
