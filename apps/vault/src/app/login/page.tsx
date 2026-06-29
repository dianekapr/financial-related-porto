'use client'
import { createClient } from '@portfolio/supabase'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const signInWithGoogle = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-dvh bg-vault-bg flex flex-col items-center justify-center px-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="font-display text-8xl gold-shimmer tracking-widest">VAULT</h1>
          <p className="text-vault-text-dim text-sm font-mono mt-2 tracking-[0.3em] uppercase">
            Your Money. Your Rules.
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Masuk ke akun</h2>
            <p className="text-vault-text-dim text-sm">Kelola keuanganmu dengan gaya</p>
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 rounded-xl py-3.5 px-4 font-medium text-sm hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
          </button>

          <p className="text-vault-text-dim text-xs text-center">
            Dengan masuk, kamu setuju dengan{' '}
            <span className="text-vault-gold">Syarat & Ketentuan</span>
          </p>
        </div>

        {/* Features hint */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '📊', label: 'Track pengeluaran' },
            { icon: '🎯', label: 'Budget per kategori' },
            { icon: '📈', label: 'Analisis bulanan' },
          ].map((f) => (
            <div key={f.label} className="glass rounded-xl p-3">
              <div className="text-xl mb-1">{f.icon}</div>
              <p className="text-vault-text-dim text-[10px] leading-tight">{f.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
