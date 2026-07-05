'use client'
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'
type ToastItem = { id: number; message: string; type: ToastType }

const ToastContext = createContext<{ show: (message: string, type?: ToastType) => void } | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-fade-up pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium max-w-sm w-full md:w-auto ${
              t.type === 'success'
                ? 'bg-slice-dark text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {t.type === 'success' ? <CheckCircle2 size={16} className="shrink-0" /> : <XCircle size={16} className="shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
