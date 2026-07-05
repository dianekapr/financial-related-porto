'use client'
import { createClient } from '@portfolio/supabase'
import { useState } from 'react'
import { Smile } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const signIn = async () => {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-dvh bg-slice-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Decorative dots */}
      <div className="fixed inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'radial-gradient(#FF5E1A 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />

      <div className="relative w-full max-w-sm">
        {/* Fake receipt card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slice-border">
          {/* Receipt header */}
          <div className="bg-slice-orange px-6 pt-8 pb-6 text-center">
            <h1 className="font-display text-white text-5xl tracking-wide">SLICE</h1>
            <p className="text-orange-100 text-sm font-receipt mt-1">Split tagihan, gak pusing</p>
          </div>

          {/* Receipt serrated */}
          <div className="receipt-edge-top" style={{ backgroundImage: 'radial-gradient(circle at 50% 0, white 6px, transparent 6px)', backgroundSize: '16px 8px' }} />

          {/* Receipt body */}
          <div className="px-6 py-6 font-receipt space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slice-muted">APP VERSION</span>
              <span className="font-bold">2.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slice-muted">FEATURES</span>
              <span className="font-bold">Scan AI + Split</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slice-muted">PLATFORM</span>
              <span className="font-bold">Web + Mobile</span>
            </div>
            <hr className="receipt-divider" />
            <div className="flex justify-between text-sm font-bold">
              <span>TOTAL SAVED</span>
              <span className="inline-flex items-center gap-1 text-slice-orange">Banyak <Smile size={14} /></span>
            </div>
            <hr className="receipt-divider" />

            {/* Login button */}
            <button
              onClick={signIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-slice-dark text-white rounded-2xl py-3.5 px-4 font-sans font-medium text-sm hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
            </button>

            <p className="text-slice-text-dim text-[11px] text-center font-sans">
              Gratis selamanya. No BS.
            </p>
          </div>

          {/* Barcode decoration */}
          <div className="px-6 pb-6 flex flex-col items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 40 }, (_, i) => (
                <div key={i} className="bg-slice-dark/20 rounded-sm"
                  style={{ width: Math.random() > 0.5 ? 2 : 1, height: 28 + Math.random() * 8 }} />
              ))}
            </div>
            <p className="font-receipt text-slice-text-dim text-[10px] tracking-widest">SLICE-2024-APP</p>
          </div>
        </div>
      </div>
    </main>
  )
}
