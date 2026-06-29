import { createServerSupabaseClient } from '../../../../../../packages/supabase/src/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}/bills`)
    }
  }
  
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}