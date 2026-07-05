'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from './LocaleProvider'

export default function MobileNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  const NAV = [
    { href: '/dashboard', icon: '◈', label: t('navHome') },
    { href: '/dashboard/transactions', icon: '↕', label: t('navTransactions') },
    { href: '/dashboard/wallets', icon: '▣', label: t('navWallets') },
    { href: '/dashboard/budget', icon: '◎', label: t('navBudget') },
    { href: '/dashboard/analytics', icon: '▲', label: t('navAnalytics') },
    { href: '/dashboard/settings', icon: '⚙', label: t('navSettings') },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-vault-surface/90 backdrop-blur-md border-t border-vault-border px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all
                ${active ? 'text-vault-accent' : 'text-vault-muted'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-mono tracking-wide">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
