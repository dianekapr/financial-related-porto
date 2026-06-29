import { createServerSupabaseClient } from '../../../../../packages/supabase/src/server'
import { redirect } from 'next/navigation'
import SliceNav from '../../components/SliceNav'

export default async function BillsLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession() 
  if (!session) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()

  return (
    <div className="min-h-dvh flex flex-col">
      <SliceNav profile={profile} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-8">
        {children}
      </main>
    </div>
  )
}