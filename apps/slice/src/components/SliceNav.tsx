'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Receipt, History } from 'lucide-react'
import type { Profile } from '@portfolio/supabase'

export default function SliceNav({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-slice-border sticky top-0 z-40 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/bills" className="flex items-center">
          <Image src="/logo.png" alt="Slice" width={36} height={36} className="object-contain" priority />
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {[
            { href: '/bills', label: 'Bills', Icon: Receipt },
            { href: '/bills/history', label: 'History', Icon: History },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all
                ${pathname === item.href
                  ? 'bg-slice-orange text-white'
                  : 'text-slice-muted hover:text-slice-dark hover:bg-slice-surface'
                }`}
            >
              <item.Icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profile */}
        <div className="flex items-center gap-2">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="avatar" width={32} height={32} className="rounded-full border-2 border-slice-border" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slice-orange/20 flex items-center justify-center text-slice-orange text-sm font-bold">
              {profile?.full_name?.[0] ?? '?'}
            </div>
          )}
          <button onClick={signOut} className="text-slice-muted hover:text-red-500 text-xs font-medium transition-colors">
            Keluar
          </button>
        </div>
      </div>
    </header>
  )
}
