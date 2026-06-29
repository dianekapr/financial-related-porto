import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function createServerSupabaseClient(
  cookieStore: {
    get: (name: string) => { value: string } | undefined
    set: (name: string, value: string, options: CookieOptions) => void
    delete: (name: string, options: CookieOptions) => void
  }
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { cookieStore.set(name, value, options) },
        remove(name, options) { cookieStore.delete(name, options) },
      },
    }
  )
}