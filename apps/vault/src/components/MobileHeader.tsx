'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@portfolio/supabase'
import type { Profile } from '@portfolio/supabase'
import { useLocale } from './LocaleProvider'
import { Power } from 'lucide-react'

export default function MobileHeader({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLocale()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-vault-surface/90 backdrop-blur-md border-b border-vault-border">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Image src="/logo.png" alt="Vault" width={28} height={28} className="object-contain" priority />
      </Link>

      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="avatar" width={30} height={30} className="rounded-full ring-2 ring-vault-border" />
        ) : (
          <div className="w-[30px] h-[30px] rounded-full bg-vault-accent/20 flex items-center justify-center text-vault-accent text-sm font-mono">
            {profile?.full_name?.[0] ?? '?'}
          </div>
        )}
        <button onClick={signOut} title={t('logout')} className="w-8 h-8 flex items-center justify-center text-vault-muted hover:text-vault-danger transition-colors">
          <Power className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
