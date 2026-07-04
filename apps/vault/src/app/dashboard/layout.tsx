import { createServerSupabaseClient } from '../../../../../packages/supabase/src/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="flex min-h-dvh bg-vault-bg">
      {/* Desktop sidebar */}
      <Sidebar profile={profile} />

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-20 md:pb-0 md:pl-20">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
