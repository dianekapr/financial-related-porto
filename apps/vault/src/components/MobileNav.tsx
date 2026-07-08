'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from './LocaleProvider'
import { LayoutDashboard, ArrowLeftRight, WalletCards, PiggyBank, BarChart3, Settings } from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const { t } = useLocale()

  const NAV = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('navHome') },
    { href: '/dashboard/transactions', icon: ArrowLeftRight, label: t('navTransactions') },
    { href: '/dashboard/wallets', icon: WalletCards, label: t('navWallets') },
    { href: '/dashboard/budget', icon: PiggyBank, label: t('navBudget') },
    { href: '/dashboard/analytics', icon: BarChart3, label: t('navAnalytics') },
    { href: '/dashboard/settings', icon: Settings, label: t('navSettings') },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-vault-surface/90 backdrop-blur-md border-t border-vault-border px-2 pb-safe">
      <div className="flex items-center py-2">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 rounded-xl transition-all
                ${active ? 'text-vault-accent' : 'text-vault-muted'}`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9px] font-mono tracking-wide truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
