'use client'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Ya, lanjut', cancelLabel = 'Batal', danger, loading,
  onConfirm, onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-xs bg-white rounded-2xl shadow-2xl animate-bounce-in p-5">
        <div className="flex items-start gap-3">
          {danger && (
            <span className="shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle size={18} />
            </span>
          )}
          <div>
            <h3 className="font-display text-lg text-slice-dark">{title}</h3>
            <p className="text-slice-muted text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slice-muted hover:bg-slice-surface transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-60 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-slice-orange hover:bg-slice-orange-light'
            }`}
          >
            {loading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
